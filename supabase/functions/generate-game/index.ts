import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GAME_PROMPTS: Record<string, (tema: string, difficulty: string, count: number) => string> = {
  "caca-palavras": (tema, diff, count) => `Gere dados para um CAÇA-PALAVRAS pedagógico sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "palavras": ["PALAVRA1","PALAVRA2",...]
}
Gere ${count} palavras MAIÚSCULAS (sem acentos) relacionadas ao tema. Palavras entre 3 e 12 letras.`,

  "cruzadinha": (tema, diff, count) => `Gere dados para PALAVRAS CRUZADAS pedagógicas sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "palavras": ["PALAVRA1","PALAVRA2",...],
  "dicas": [
    {"palavra":"PALAVRA1","dica":"Dica contextualizada"},
    ...
  ]
}
Gere ${count} palavras MAIÚSCULAS (sem acentos) relacionadas ao tema. As dicas devem ser pedagógicas e adequadas ao nível.`,

  "criptograma": (tema, diff) => `Gere dados para um CRIPTOGRAMA pedagógico sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "mensagem": "FRASE EDUCATIVA SOBRE O TEMA EM MAIUSCULAS SEM ACENTOS"
}
A frase deve ser educativa, relacionada ao tema e adequada ao nível. Máximo 60 caracteres. Sem acentos, apenas letras A-Z e espaços.`,


  "sudoku": () => `Retorne JSON: {"generated": true}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { gameType, tema, difficulty, count } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const promptFn = GAME_PROMPTS[gameType];
    if (!promptFn) {
      return new Response(JSON.stringify({ error: "Tipo de jogo não suportado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const diffLabel = difficulty === "facil" ? "Fácil (1º-5º ano)" : difficulty === "medio" ? "Médio (6º-9º ano)" : "Difícil (Ensino Médio)";
    const prompt = promptFn(tema || "geral", diffLabel, count || 10);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista em criar atividades pedagógicas. Responda APENAS com JSON puro, sem markdown, sem ```." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao gerar com IA" }), {
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
      parsed = { error: "Falha ao interpretar resposta da IA" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-game error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
