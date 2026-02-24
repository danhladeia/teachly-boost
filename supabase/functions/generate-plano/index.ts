import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { nivel, disciplina, conteudo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um especialista em pedagogia brasileira e planejamento de aulas alinhadas à BNCC.
Gere um plano de aula COMPLETO e DETALHADO no formato JSON com os seguintes campos:

{
  "identificacao": { "disciplina": "", "nivel": "", "duracao": "", "tema": "" },
  "habilidades_bncc": [{ "codigo": "", "descricao": "" }],
  "objetivos": ["objetivo 1 com verbo de ação (Taxonomia de Bloom)", "..."],
  "recursos": ["recurso 1", "..."],
  "cronograma": { "introducao": "10 min - ...", "desenvolvimento": "25 min - ...", "fechamento": "10 min - ..." },
  "gancho_inicial": "Pergunta instigante ou atividade para captar atenção nos primeiros 5 minutos",
  "desenvolvimento": "Passo a passo detalhado da explicação e mediação do professor, com metodologias ativas (Sala de Aula Invertida, Gamificação, PBL). Mínimo 3 parágrafos.",
  "avaliacao": "Critérios claros para verificar se os objetivos foram atingidos (quiz, mapa mental, debate, etc.)",
  "diferenciacao": "Adaptações para alunos com dificuldades e para alunos avançados",
  "metodologias_ativas": ["Metodologia 1 - explicação de como aplicar", "..."]
}

IMPORTANTE:
- Use verbos de ação da Taxonomia de Bloom nos objetivos
- Cite códigos reais da BNCC quando possível
- Adapte linguagem e exemplos à faixa etária do nível informado
- Inclua sugestões de Sala de Aula Invertida, Gamificação ou PBL
- O plano deve ser PRÁTICO e APLICÁVEL na sala de aula brasileira
- Responda APENAS com o JSON, sem markdown ou texto adicional`;

    const userPrompt = `Crie um plano de aula para:
- Nível: ${nivel}
- Disciplina: ${disciplina}
- Conteúdo/Tema: ${conteudo}`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar plano" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response (strip markdown code blocks if present)
    let plano;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      plano = JSON.parse(jsonStr);
    } catch {
      plano = { raw: content };
    }

    return new Response(JSON.stringify({ plano }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-plano error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
