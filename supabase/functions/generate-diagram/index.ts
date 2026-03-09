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
      systemPrompt = `Você é um especialista em sintaxe Mermaid.js versão 10+.
Receba o código Mermaid existente e aplique o ajuste solicitado.

REGRAS CRÍTICAS:
- Retorne APENAS o código Mermaid puro, sem nenhuma formatação markdown, sem \`\`\`, sem a palavra "mermaid"
- O código deve ser 100% válido para Mermaid.js v10
- Nunca use caracteres especiais como (), [], {} dentro de textos de nós sem escapar
- Use aspas duplas para textos com espaços: A["Texto aqui"]
- IDs de nós devem ser simples: letras e números apenas, sem espaços
- Nunca deixe linhas em branco dentro de classDef ou linkStyle`;
      userPrompt = `Código atual:\n${codigoAtual}\n\nAjuste solicitado: ${ajuste}`;
    } else {
      const tipoInstrucao = tipoMap[tipo] || "um fluxograma (graph TD)";
      const estiloInstrucao = estiloMap[estilo] || estiloMap.clean;

      systemPrompt = `Você é um especialista em sintaxe Mermaid.js versão 10+ para uso educacional.

REGRAS CRÍTICAS DE SINTAXE (siga à risca ou o diagrama falhará):
1. Retorne APENAS o código Mermaid puro — sem \`\`\`, sem "mermaid", sem explicações
2. Primeira linha DEVE ser o tipo: "graph TD", "graph LR", "mindmap", etc.
3. IDs de nós: use apenas letras/números simples (A, B, C1, etc.) — NUNCA espaços ou acentos no ID
4. Textos: sempre entre aspas duplas quando tiver espaços: A["Texto com espaço"]
5. NUNCA use parênteses em textos sem aspas. Use: A["(texto)"] se necessário
6. Para mindmap: use indentação com 4 espaços, root deve ser primeiro nó
7. Máximo 8 palavras por nó — mantenha textos curtos
8. Máximo 15 nós no total para não sobrecarregar
9. Não inclua comentários (%%)
10. Português para os textos dos nós`;

      userPrompt = `Crie ${tipoInstrucao} sobre: "${prompt}"\nEstilo: ${estiloInstrucao}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
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

    // Robust cleanup: remove all markdown fences and leading/trailing whitespace
    mermaidCode = mermaidCode
      .replace(/^```(?:mermaid)?\s*/im, "")
      .replace(/\s*```\s*$/im, "")
      .replace(/^mermaid\s*/i, "")
      .trim();

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
