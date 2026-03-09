import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, tipo, estilo, codigoAtual, ajuste } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const tipoMap: Record<string, string> = {
      ciclo: "um diagrama de ciclo (graph com setas formando um loop)",
      fluxograma: "um fluxograma (graph TD)",
      organograma: "um organograma hierárquico (graph TD)",
      "mapa-mental": "um mapa mental (mindmap)",
      venn: "um diagrama (graph LR) simulando um diagrama de Venn com agrupamentos",
    };

    const estiloMap: Record<string, string> = {
      clean: "estilo limpo e profissional com nós retangulares arredondados",
      academico: "estilo acadêmico formal com nós retangulares",
      colorido: "use classDef para colorir nós com cores vibrantes diferentes (fill:#color). Adicione pelo menos 3 classes de cor.",
      pb: "estilo preto e branco minimalista, ideal para impressão e colorir à mão",
    };

    let systemPrompt: string;
    let userPrompt: string;

    if (codigoAtual && ajuste) {
      systemPrompt = `Você é um especialista em educação e sintaxe Mermaid.js. Receba o código Mermaid existente e aplique o ajuste solicitado pelo professor. Retorne APENAS o código Mermaid puro atualizado, sem formatação markdown (\`\`\`) ou explicações. Não inclua a palavra "mermaid" no início do código.`;
      userPrompt = `Código atual:\n${codigoAtual}\n\nAjuste solicitado: ${ajuste}`;
    } else {
      systemPrompt = `Você é um especialista em educação e sintaxe Mermaid.js. Seu objetivo é transformar descrições pedagógicas em códigos de diagrama Mermaid válidos. Retorne APENAS o código Mermaid puro, sem formatação markdown (\`\`\`) ou explicações. Não inclua a palavra "mermaid" no início do código. Use texto em português. Mantenha os textos dos nós curtos e objetivos (máximo 6 palavras por nó). Use IDs simples como A, B, C, etc.`;
      userPrompt = `Crie ${tipoMap[tipo] || "um fluxograma (graph TD)"} sobre: "${prompt}"\n\nEstilo: ${estiloMap[estilo] || estiloMap.clean}`;
    }

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
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
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
      throw new Error("Erro no gateway de IA");
    }

    const data = await response.json();
    let mermaidCode = data.choices?.[0]?.message?.content || "";

    // Clean markdown fences if present
    mermaidCode = mermaidCode.replace(/^```(?:mermaid)?\s*/i, "").replace(/\s*```$/i, "").trim();

    return new Response(JSON.stringify({ mermaidCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diagram error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
