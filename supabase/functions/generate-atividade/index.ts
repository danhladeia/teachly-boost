import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, serie, nivel, disciplina, tipo, num_abertas, num_fechadas, tamanho_texto, num_imagens } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const numAbertas = num_abertas ?? (tipo === "multipla_escolha" ? 0 : 3);
    const numFechadas = num_fechadas ?? (tipo === "aberta" ? 0 : 2);
    const totalQ = numAbertas + numFechadas;

    const tamanhoMap: Record<string, string> = {
      curto: "Gere um texto explicativo CURTO com aproximadamente 500 caracteres (cerca de 1-2 parágrafos).",
      medio: "Gere um texto explicativo MÉDIO com aproximadamente 1500 caracteres (cerca de 3-4 parágrafos).",
      longo: "Gere um texto explicativo LONGO e detalhado com aproximadamente 3000 caracteres ou mais (5+ parágrafos).",
    };
    const tamanhoInstrucao = tamanhoMap[tamanho_texto || "medio"];

    // Language complexity rules based on education level
    let linguagemInstrucao = "";
    if (nivel) {
      if (nivel.includes("Infantil")) {
        linguagemInstrucao = `
REGRAS DE LINGUAGEM (Ensino Infantil):
- Use linguagem lúdica, visual e com frases curtas
- Questões simples com apoio visual
- Vocabulário básico e cotidiano
- Instruções claras e diretas com comandos simples ("Pinte", "Circule", "Ligue")`;
      } else if (nivel.includes("Iniciais") || nivel.includes("Fundamental - Séries Iniciais")) {
        linguagemInstrucao = `
REGRAS DE LINGUAGEM (Fundamental I - Séries Iniciais):
- Linguagem simples e ilustrativa com instruções claras
- Frases curtas e vocabulário acessível
- Contextualize com exemplos do dia a dia da criança
- Questões diretas e objetivas`;
      } else if (nivel.includes("Finais") || nivel.includes("Fundamental - Séries Finais")) {
        linguagemInstrucao = `
REGRAS DE LINGUAGEM (Fundamental II - Séries Finais):
- Linguagem intermediária e contextualizada
- Introduza conceitos com explicações acessíveis
- Questões que estimulem interpretação e análise
- Vocabulário progressivamente mais técnico`;
      } else if (nivel.includes("Médio")) {
        linguagemInstrucao = `
REGRAS DE LINGUAGEM (Ensino Médio):
- Linguagem crítica, analítica e dissertativa
- Vocabulário técnico adequado à disciplina
- Questões que exijam argumentação, análise e síntese
- Textos com profundidade conceitual e referências contextuais`;
      }
    }

    let tipoInstrucao = "";
    if (numAbertas > 0 && numFechadas > 0) {
      tipoInstrucao = `Gere exatamente ${numAbertas} questão(ões) aberta(s) (dissertativas com linhas) e ${numFechadas} questão(ões) de múltipla escolha com 4 alternativas.`;
    } else if (numAbertas > 0) {
      tipoInstrucao = `Gere exatamente ${numAbertas} questão(ões) aberta(s) (dissertativas com linhas para resposta).`;
    } else {
      tipoInstrucao = `Gere exatamente ${numFechadas} questão(ões) de múltipla escolha com 4 alternativas cada.`;
    }

    // Image placement instruction
    const imgCount = num_imagens || 0;
    let imagemInstrucao = "";
    if (imgCount > 0) {
      imagemInstrucao = `
O professor carregou ${imgCount} imagem(ns) que serão inseridas automaticamente entre os blocos de texto.
Para acomodar as imagens, divida o texto explicativo em pelo menos ${imgCount + 1} parágrafos separados, cada um como um bloco "text" individual.
Isso permitirá que as imagens sejam intercaladas entre os parágrafos.`;
    }

    const systemPrompt = `Você é um especialista em criar atividades pedagógicas para impressão A4.
Dado um tema, gere uma atividade completa com título, texto explicativo e questões.
${serie ? `A atividade é para ${serie}.` : ""}
${disciplina ? `Disciplina: ${disciplina}.` : ""}
${linguagemInstrucao}
${tamanhoInstrucao}
${tipoInstrucao}
${imagemInstrucao}
Responda APENAS com JSON no formato:
{
  "blocks": [
    { "type": "title", "content": "Título da atividade", "alignment": "center" },
    { "type": "text", "content": "Primeiro parágrafo do texto explicativo...", "alignment": "left" },
    { "type": "text", "content": "Segundo parágrafo do texto explicativo...", "alignment": "left" },
    { "type": "question-open", "content": "Pergunta aberta?", "alignment": "left", "lines": 4 },
    { "type": "question-mc", "content": "Pergunta múltipla escolha?", "alignment": "left", "alternatives": ["A", "B", "C", "D"], "correctIndex": 0 }
  ]
}
Gere 1 título, o texto explicativo dividido em parágrafos separados (cada um como um bloco "text") conforme o tamanho solicitado e ${totalQ} questões.
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
