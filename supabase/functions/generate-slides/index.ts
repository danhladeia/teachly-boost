import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tema, descricao, nivel, serie, template, num_slides, estilo_imagem, densidade, texto_base } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const templateStyles: Record<string, string> = {
      moderno: "Estilo moderno e limpo com cores vibrantes, fundo escuro com destaques em azul/roxo.",
      kids: "Estilo colorido e lúdico para crianças, com cores primárias, formas arredondadas e visual divertido.",
      cientifico: "Estilo acadêmico/científico com fundo claro, gráficos e tipografia séria.",
      tech: "Estilo tecnológico com gradientes escuros, neon, e visual futurista.",
      minimal: "Estilo minimalista com muito espaço em branco, tipografia elegante e poucos elementos.",
    };

    const estiloTemplate = templateStyles[template] || templateStyles.moderno;

    const densidadeInstr = densidade === "visual"
      ? "SLIDES VISUAIS: Use pouco texto (máximo 3-4 bullet points curtos por slide). Foco em imagens e elementos visuais. Cada bullet deve ter no máximo 8 palavras."
      : "SLIDES INFORMATIVOS: Use texto mais detalhado (5-7 bullet points por slide). Inclua dados, definições e explicações mais completas para estudo.";

    const textoBaseInstr = texto_base
      ? `\n\nTEXTO BASE DO PROFESSOR (use como fonte principal de conteúdo, extraia os pontos-chave):\n"""${texto_base}"""\n`
      : "";

    const systemPrompt = `Você é um designer de apresentações educacionais de alta qualidade.
Crie uma apresentação com exatamente ${num_slides || 8} slides sobre o tema: "${tema}".
${descricao ? `Instruções adicionais: ${descricao}` : ""}
${serie ? `Para ${serie}.` : ""}
${nivel ? `Nível de ensino: ${nivel}.` : ""}
${textoBaseInstr}

ESTILO VISUAL: ${estiloTemplate}
${estilo_imagem ? `ESTILO DAS IMAGENS: ${estilo_imagem}` : ""}

${densidadeInstr}

ESTRUTURA PEDAGÓGICA OBRIGATÓRIA:
- Slide 1: CAPA (layout "title") com título impactante e subtítulo
- Slide 2: OBJETIVOS DE APRENDIZAGEM (layout "content") com 3-5 objetivos claros
- Slides 3 a ${(num_slides || 8) - 3}: CONTEÚDO PRINCIPAL com layouts variados
- Slide ${(num_slides || 8) - 2}: EXEMPLO PRÁTICO ou ESTUDO DE CASO (layout "image-left" ou "image-right")
- Slide ${(num_slides || 8) - 1}: RESUMO / PONTOS-CHAVE (layout "two-columns")
- Slide ${num_slides || 8}: QUIZ ou ENCERRAMENTO (layout "title") com 2-3 perguntas de revisão no content

Para cada slide, gere:
- title: título do slide
- content: conteúdo principal em bullet points (use \\n para separar items). Use • para bullets.
- notes: notas detalhadas do apresentador (roteiro de fala com 3-5 frases explicando o que dizer)
- image_prompt: prompt descritivo em INGLÊS para gerar uma imagem ilustrativa. Seja específico e visual.
- layout: "title", "content", "image-left", "image-right", "two-columns", "quote"

Responda APENAS com JSON válido:
{
  "slides": [
    { "title": "...", "content": "...", "notes": "...", "image_prompt": "...", "layout": "title" }
  ]
}
Sem markdown, apenas JSON puro.`;

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
          { role: "user", content: `Crie a apresentação sobre: ${tema}` },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao gerar slides" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      parsed = { slides: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-slides error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
