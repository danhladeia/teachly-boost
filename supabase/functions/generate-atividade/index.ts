import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, serie, tipo, num_questoes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tipoInstrucao = tipo === "aberta" 
      ? "Gere APENAS questões abertas (dissertativas) com linhas para resposta."
      : tipo === "multipla_escolha"
      ? "Gere APENAS questões de múltipla escolha com 4 alternativas cada."
      : "Misture questões abertas e de múltipla escolha.";

    const systemPrompt = `Você é um especialista em criar atividades pedagógicas para impressão A4.
Dado um tema, gere uma atividade completa com título, texto explicativo e questões.
${serie ? `A atividade é para ${serie}.` : ""}
${tipoInstrucao}
Gere exatamente ${num_questoes || 5} questões.
Responda APENAS com JSON no formato:
{
  "blocks": [
    { "type": "title", "content": "Título da atividade", "alignment": "center" },
    { "type": "text", "content": "Texto explicativo sobre o tema...", "alignment": "left" },
    { "type": "question-open", "content": "Pergunta aberta?", "alignment": "left", "lines": 4 },
    { "type": "question-mc", "content": "Pergunta múltipla escolha?", "alignment": "left", "alternatives": ["A", "B", "C", "D"], "correctIndex": 0 }
  ]
}
Gere 1 título, 1-2 textos explicativos e ${num_questoes || 5} questões.
Use linguagem adequada ao nível de ensino. Sem markdown, apenas JSON.`;

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
          { role: "user", content: `Crie uma atividade sobre: ${prompt}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar atividade" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { blocks: [{ type: "text", content, alignment: "left" }] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-atividade error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
