import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GAME_PROMPTS: Record<string, (tema: string, difficulty: string, count: number) => string> = {
  "cruzadinha": (tema, diff, count) => `Gere dados para uma CRUZADINHA pedagógica sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "palavras": ["PALAVRA1","PALAVRA2",...],
  "dicas": [
    {"palavra":"PALAVRA1","dica":"Dica contextualizada para a palavra"},
    ...
  ]
}
Gere ${count} palavras MAIÚSCULAS (sem acentos) relacionadas ao tema. As dicas devem ser pedagógicas e adequadas ao nível.`,

  "caca-palavras": (tema, diff, count) => `Gere dados para um CAÇA-PALAVRAS pedagógico sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "palavras": ["PALAVRA1","PALAVRA2",...]
}
Gere ${count} palavras MAIÚSCULAS (sem acentos) relacionadas ao tema. Palavras entre 3 e 12 letras.`,

  "forca": (tema, diff, count) => `Gere dados para JOGO DA FORCA pedagógico sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "items": [
    {"word":"PALAVRA","hint":"Dica contextualizada"},
    ...
  ]
}
Gere ${count} palavras com dicas pedagógicas adequadas ao nível.`,

  "ligue-pares": (tema, diff, count) => `Gere dados para LIGUE OS PARES pedagógico sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "pairs": [
    {"left":"Conceito A","right":"Correspondência A"},
    ...
  ]
}
Gere ${count} pares de associação (conceito-definição, causa-efeito, pergunta-resposta, etc). Adeque ao nível.`,

  "complete-palavra": (tema, diff, count) => `Gere dados para COMPLETE A PALAVRA pedagógico sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "palavras": ["PALAVRA1","PALAVRA2",...]
}
Gere ${count} palavras MAIÚSCULAS relacionadas ao tema. Adeque complexidade ao nível.`,

  "anagrama": (tema, diff, count) => `Gere dados para ANAGRAMAS pedagógicos sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "palavras": ["PALAVRA1","PALAVRA2",...]
}
Gere ${count} palavras MAIÚSCULAS (sem acentos) relacionadas ao tema. Palavras entre 4 e 10 letras.`,

  "velha-pedagogica": (tema, diff, count) => `Gere dados para JOGO DA VELHA PEDAGÓGICO sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "perguntas": ["Pergunta curta 1?","Pergunta curta 2?",...]
}
Gere ${count} perguntas CURTAS (máximo 6 palavras cada) sobre o tema. Adeque ao nível.`,

  "criptograma": (tema, diff) => `Gere dados para um CRIPTOGRAMA pedagógico sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "mensagem": "FRASE EDUCATIVA SOBRE O TEMA EM MAIUSCULAS SEM ACENTOS"
}
A frase deve ser educativa, relacionada ao tema e adequada ao nível. Máximo 60 caracteres. Sem acentos, apenas letras A-Z e espaços.`,

  "lacunas": (tema, diff) => `Gere dados para PREENCHA AS LACUNAS (cloze test) pedagógico sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "texto": "Texto educativo com as palavras-chave incluídas normalmente",
  "palavras_chave": ["palavra1","palavra2","palavra3","palavra4","palavra5"]
}
O texto deve conter as palavras_chave naturalmente. Quando o aluno resolver, as palavras_chave serão substituídas por lacunas. Texto de 3-5 frases. Adeque ao nível.`,

  "tabela-classificacao": (tema, diff) => `Gere dados para TABELA DE CLASSIFICAÇÃO pedagógica sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "headers": ["Categoria A","Categoria B","Categoria C"],
  "items": ["item1","item2","item3","item4","item5","item6","item7","item8","item9"]
}
Gere 3 categorias e 9-12 itens que o aluno deve classificar. Adeque ao nível.`,

  "verdadeiro-falso": (tema, diff, count) => `Gere dados para VERDADEIRO OU FALSO pedagógico sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "items": [
    {"statement":"Afirmação sobre o tema.","answer":true,"justification":"Explicação do gabarito"},
    ...
  ]
}
Gere ${count} afirmações (misture verdadeiras e falsas ~50/50). Inclua justificativa para o gabarito do professor. Adeque ao nível.`,

  "sequencia": (tema, diff, count) => `Gere dados para SEQUÊNCIAS LÓGICAS pedagógicas (nível: ${diff}).
Retorne JSON:
{
  "items": [
    {"sequence":["2","4","6","8","10","?"],"answer":"12","type":"number"},
    {"sequence":["A","C","E","G","I","?"],"answer":"K","type":"letter"},
    ...
  ]
}
Gere ${count} sequências lógicas variadas (numéricas, alfabéticas e de padrões). O último elemento deve ser "?". Adeque complexidade ao nível.`,

  "cruzadinha-simples": (tema, diff, count) => `Gere dados para CRUZADINHA SIMPLIFICADA sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "palavras": ["PALAVRA1","PALAVRA2",...]
}
Gere ${count} palavras MAIÚSCULAS (sem acentos) para revisão de vocabulário do tema.`,

  "pixel-art": (tema, diff) => `Gere dados para PIXEL ART/DESENHO GUIADO sobre "${tema}" (nível: ${diff}).
Retorne JSON:
{
  "titulo": "Nome do desenho",
  "instrucoes": "Pinte as coordenadas indicadas para revelar o desenho"
}
Apenas retorne título e instruções curtas.`,

  "sudoku": () => `Retorne JSON: {"generated": true}`,
  "labirinto": () => `Retorne JSON: {"generated": true}`,
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
