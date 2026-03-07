import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { temas, nivel, serie, tipo, num_abertas, num_fechadas, titulo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const numAbertas = num_abertas || 0;
    const numFechadas = num_fechadas || 0;
    const totalQ = numAbertas + numFechadas;

    let linguagem = "";
    if (nivel?.includes("Iniciais")) {
      linguagem = "Linguagem simples, frases curtas, vocabulário acessível para crianças.";
    } else if (nivel?.includes("Finais")) {
      linguagem = "Linguagem intermediária e contextualizada, vocabulário progressivamente técnico.";
    } else if (nivel?.includes("Médio")) {
      linguagem = "Linguagem crítica, analítica, vocabulário técnico, questões que exijam argumentação.";
    }

    let tipoInstrucao = "";
    if (numAbertas > 0 && numFechadas > 0) {
      tipoInstrucao = `Gere ${numFechadas} questão(ões) de múltipla escolha com 4 alternativas (indique correctIndex 0-3) e ${numAbertas} questão(ões) aberta(s) com linhas para resposta.`;
    } else if (numAbertas > 0) {
      tipoInstrucao = `Gere ${numAbertas} questão(ões) aberta(s) com linhas para resposta.`;
    } else {
      tipoInstrucao = `Gere ${numFechadas} questão(ões) de múltipla escolha com 4 alternativas cada (indique correctIndex 0-3 para a resposta correta).`;
    }

    const systemPrompt = `Você é um especialista em criar provas pedagógicas.
Dado temas/conteúdos, gere questões para uma prova.
${serie ? `A prova é para ${serie}.` : ""}
${linguagem}
${tipoInstrucao}

Os temas/conteúdos da prova são: ${temas}

Responda APENAS com JSON:
{
  "questoes": [
    { "type": "question-mc", "content": "Enunciado?", "alternatives": ["A", "B", "C", "D"], "correctIndex": 0 },
    { "type": "question-open", "content": "Pergunta aberta?", "lines": 4 }
  ]
}
Gere exatamente ${totalQ} questões no total. Sem markdown, apenas JSON puro.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Crie questões de prova sobre: ${temas}` },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar prova" }), {
        status: response.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { questoes: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prova error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
