import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
    if (authErr || !user) throw new Error("Não autorizado");

    const formData = await req.formData();
    const file = formData.get("image") as File;
    if (!file) throw new Error("Nenhuma imagem enviada");

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file.type || "image/jpeg";

    // Upload original to storage for audit
    const fileName = `${user.id}/${crypto.randomUUID()}.${mimeType.includes("png") ? "png" : "jpg"}`;
    const { error: uploadErr } = await supabase.storage
      .from("gabaritos")
      .upload(fileName, new Uint8Array(arrayBuffer), { contentType: mimeType });

    const storageUrl = uploadErr ? null : `${supabaseUrl}/storage/v1/object/authenticated/gabaritos/${fileName}`;

    // Use Gemini Vision to analyze the answer sheet
    if (!lovableKey) throw new Error("API key não configurada");

    const prompt = `Você é um sistema de correção automática de provas (OMR - Optical Mark Recognition).

Analise esta imagem de uma folha de respostas de prova e extraia as seguintes informações:

1. **QR Code**: Se houver um QR Code visível, leia seu conteúdo. O formato esperado é um JSON como {"v":"uuid-aqui"}.

2. **Respostas marcadas**: Para cada questão numerada (01, 02, 03...), identifique qual alternativa (A=0, B=1, C=2, D=3) foi preenchida/marcada pelo aluno. O aluno preenche círculos com caneta.

3. **Confiança**: Para cada resposta, indique o nível de confiança:
   - "high": marcação clara e única
   - "low": marcação dupla, rasura, ou difícil de determinar
   - "none": questão não respondida

4. **Nome do aluno**: Se houver um campo "Nome" preenchido à mão, tente ler.

Responda APENAS com um JSON válido no formato:
{
  "qr_content": "conteúdo do QR ou null",
  "nome_aluno": "nome lido ou null",
  "respostas": [
    {"questao": 1, "alternativa": 0, "confianca": "high"},
    {"questao": 2, "alternativa": 2, "confianca": "low"},
    {"questao": 3, "alternativa": null, "confianca": "none"}
  ]
}

IMPORTANTE: 
- alternativa é um número: A=0, B=1, C=2, D=3
- Se não conseguir determinar, use alternativa: null e confianca: "none"
- Numere as questões sequencialmente começando em 1
- Analise TODOS os círculos visíveis na folha`;

    const geminiResp = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      console.error("Gemini error:", errText);
      throw new Error("Erro ao processar imagem com IA");
    }

    const geminiData = await geminiResp.json();
    const content = geminiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON não encontrado na resposta");
      }
    } catch {
      console.error("Failed to parse:", content);
      throw new Error("Erro ao interpretar resposta da IA");
    }

    // If QR code detected, fetch gabarito from DB
    let gabarito = null;
    let provaInfo = null;
    if (parsed.qr_content) {
      try {
        const qrData = JSON.parse(parsed.qr_content);
        if (qrData.v) {
          const { data: versao } = await supabase
            .from("versoes_prova")
            .select("*, provas(titulo, id)")
            .eq("qr_code_id", qrData.v)
            .single();

          if (versao) {
            const mapa = versao.mapa_questoes as any[];
            const mcItems = mapa
              .filter((item: any) => item.resposta_correta_nova !== null)
              .sort((a: any, b: any) => a.nova_ordem - b.nova_ordem);

            gabarito = mcItems.map((item: any, idx: number) => ({
              q: idx + 1,
              correct: item.resposta_correta_nova,
            }));

            provaInfo = {
              titulo: `${(versao as any).provas?.titulo || "Prova"} — Versão ${versao.versao_label}`,
              prova_id: (versao as any).provas?.id || versao.prova_id,
              versao_id: versao.id,
              versao_label: versao.versao_label,
            };
          }
        }
      } catch (e) {
        console.error("QR parse error:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        respostas: parsed.respostas || [],
        nome_aluno: parsed.nome_aluno || null,
        qr_detected: !!parsed.qr_content,
        gabarito,
        prova_info: provaInfo,
        imagem_url: storageUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("OMR Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
