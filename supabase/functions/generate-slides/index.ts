import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tema, descricao, nivel, serie, template, num_slides, estilo_imagem } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const templateStyles: Record<string, string> = {
      moderno: "Estilo moderno e limpo com cores vibrantes, fundo escuro com destaques em azul/roxo.",
      kids: "Estilo colorido e lúdico para crianças, com cores primárias, formas arredondadas e visual divertido.",
      cientifico: "Estilo acadêmico/científico com fundo claro, gráficos e tipografia séria.",
    };

    const estiloTemplate = templateStyles[template] || templateStyles.moderno;

    const systemPrompt = `Você é um designer de apresentações educacionais.
Crie uma apresentação com exatamente ${num_slides || 8} slides sobre o tema: "${tema}".
${descricao ? `Instruções adicionais: ${descricao}` : ""}
${serie ? `Para ${serie}.` : ""}
${nivel ? `Nível de ensino: ${nivel}.` : ""}

ESTILO VISUAL: ${estiloTemplate}
${estilo_imagem ? `ESTILO DAS IMAGENS: ${estilo_imagem}` : ""}

Para cada slide, gere:
- title: título do slide
- content: conteúdo principal em bullet points (use \\n para separar items)
- notes: notas do apresentador
- image_prompt: prompt descritivo em INGLÊS para gerar uma imagem ilustrativa para este slide. Seja específico e visual.
- layout: "title" (slide de capa), "content" (conteúdo padrão), "image-left" (imagem à esquerda), "image-right" (imagem à direita), "two-columns" (duas colunas), "quote" (citação em destaque)

O primeiro slide deve ter layout "title" (slide de abertura).
O último slide pode ser "title" com título "Obrigado!" ou "Dúvidas?".

Responda APENAS com JSON:
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
      return new Response(JSON.stringify({ error: "Erro ao gerar slides" }), {
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
