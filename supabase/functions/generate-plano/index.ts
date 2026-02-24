import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPTS: Record<string, string> = {
  simples: `Você é um especialista em pedagogia brasileira. Gere um plano de aula SIMPLES e OBJETIVO no formato JSON:
{
  "modelo": "simples",
  "identificacao": { "disciplina": "", "nivel": "", "duracao": "", "tema": "" },
  "habilidades_bncc": [{ "codigo": "", "descricao": "" }],
  "objetivos": ["objetivo curto com verbo de ação"],
  "resumo_atividade": "Descrição objetiva da atividade principal em 2-3 parágrafos",
  "recursos": ["recurso 1"],
  "avaliacao": "Critério de avaliação curto e direto",
  "referencias": ["Referência 1 em formato ABNT"]
}
IMPORTANTE: Seja conciso. Foque no essencial. Verbos de ação (Bloom). Cite códigos BNCC reais.`,

  tradicional: `Você é um especialista em pedagogia brasileira e planejamento de aulas alinhadas à BNCC.
Gere um plano de aula TRADICIONAL ESTRUTURADO COMPLETO no formato JSON:
{
  "modelo": "tradicional",
  "identificacao": { "disciplina": "", "nivel": "", "duracao": "", "tema": "" },
  "habilidades_bncc": [{ "codigo": "", "descricao": "" }],
  "objetivos": ["objetivo detalhado com verbo de ação (Taxonomia de Bloom)"],
  "conteudo_programatico": "Listagem detalhada dos conteúdos a serem abordados",
  "recursos": ["recurso 1"],
  "cronograma": { "introducao": "10 min - ...", "desenvolvimento": "25 min - ...", "fechamento": "10 min - ..." },
  "gancho_inicial": "Pergunta instigante ou atividade para captar atenção nos primeiros 5 minutos",
  "desenvolvimento": "Passo a passo DETALHADO da explicação e mediação do professor. Mínimo 4 parágrafos com metodologia clara.",
  "diferenciacao": "Adaptações para alunos com dificuldades e para alunos avançados",
  "avaliacao": "Critérios FORMAIS e instrumentos para verificar se os objetivos foram atingidos (quiz, mapa mental, debate, rubrica etc.)",
  "referencias": ["Referência 1 em formato ABNT", "Referência 2"]
}
IMPORTANTE:
- Use verbos de ação da Taxonomia de Bloom nos objetivos
- Cite códigos reais da BNCC
- Inclua conteúdo programático detalhado
- O desenvolvimento deve ser EXTENSO e PRÁTICO
- Avaliação com critérios formais e rubricas
- Referências em formato ABNT`,

  criativo: `Você é um especialista em pedagogia brasileira com foco em metodologias ativas (PBL, Sala de Aula Invertida, Gamificação).
Gere um plano de aula CRIATIVO no formato JSON:
{
  "modelo": "criativo",
  "identificacao": { "disciplina": "", "nivel": "", "duracao": "", "tema": "" },
  "habilidades_bncc": [{ "codigo": "", "descricao": "" }],
  "pergunta_norteadora": "Pergunta essencial que guia todo o projeto/aula (modelo PBL)",
  "problema_desafio": "Descrição do problema real que os alunos devem resolver",
  "pesquisa_exploracao": "Como os alunos vão investigar e explorar o tema (fontes, experimentos, entrevistas)",
  "criacao_prototipagem": "O que os alunos vão criar como produto final (maquete, vídeo, apresentação, protótipo)",
  "roteiro_sala_invertida": {
    "atividade_previa": "O que o aluno deve fazer ANTES da aula (vídeo, leitura, quiz online)",
    "atividade_em_sala": "O que será feito EM SALA com base na preparação prévia"
  },
  "gamificacao": "Elementos de gamificação aplicados (pontuação, desafios, ranking, badges)",
  "recursos": ["recurso 1"],
  "diferenciacao": "Adaptações para inclusão e alunos avançados",
  "avaliacao": "Avaliação processual e formativa com rubricas",
  "referencias": ["Referência 1 em formato ABNT"]
}
IMPORTANTE:
- A Pergunta Norteadora é OBRIGATÓRIA e deve ser instigante
- Inclua elementos de PBL, Sala Invertida e Gamificação
- Foque no protagonismo do aluno
- Cite códigos reais da BNCC
- Referências em formato ABNT`
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { nivel, disciplina, conteudo, modelo = "tradicional", quantidade_aulas = 1, refinamento, plano_anterior } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // If refinement request, use a simpler prompt
    if (refinamento && plano_anterior) {
      const refinePrompt = `Você recebeu um plano de aula gerado anteriormente. O professor pediu o seguinte ajuste:
"${refinamento}"

Plano anterior:
${JSON.stringify(plano_anterior)}

Aplique o ajuste solicitado e retorne o plano COMPLETO atualizado no MESMO formato JSON. Responda APENAS com o JSON.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: refinePrompt }],
        }),
      });

      if (!response.ok) {
        return handleAIError(response);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const plano = parseJSON(content);
      return new Response(JSON.stringify({ plano }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch relevant BNCC skills from database
    let habilidadesContext = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Map nivel to DB nivel
      let dbNivel = "";
      if (nivel.includes("Iniciais") || nivel.includes("iniciais")) dbNivel = "fundamental_iniciais";
      else if (nivel.includes("Finais") || nivel.includes("finais")) dbNivel = "fundamental_finais";
      else if (nivel.includes("Médio") || nivel.includes("medio")) dbNivel = "ensino_medio";

      if (dbNivel) {
        const { data: habilidades } = await supabase
          .from("habilidades_bncc")
          .select("codigo, descricao, unidade_tematica, objeto_conhecimento")
          .eq("nivel", dbNivel)
          .eq("disciplina", disciplina)
          .limit(50);

        if (habilidades && habilidades.length > 0) {
          habilidadesContext = `\n\nHABILIDADES BNCC DISPONÍVEIS PARA ESTA DISCIPLINA E NÍVEL (use os códigos reais abaixo):\n${
            habilidades.map(h => `- ${h.codigo}: ${h.descricao}`).join("\n")
          }`;
        }
      }
    } catch (e) {
      console.error("Error fetching BNCC skills:", e);
    }

    const systemPrompt = PROMPTS[modelo] || PROMPTS.tradicional;

    // Add class count instructions
    let cargaHorariaInstrucao = "";
    if (quantidade_aulas > 1) {
      cargaHorariaInstrucao = `\n\nIMPORTANTE - CARGA HORÁRIA: Este plano é para ${quantidade_aulas} aulas. Organize o conteúdo como um CRONOGRAMA AULA A AULA:
- Adicione ao JSON um campo "cronograma_aulas": [{"aula": 1, "titulo": "...", "objetivos": ["..."], "atividades": "...", "duracao": "50 min"}, ...]
- Cada aula deve ter progressão lógica
- A primeira aula deve ser introdutória
- A última aula deve incluir avaliação e síntese`;
    }

    const userPrompt = `Crie um plano de aula para:
- Nível: ${nivel}
- Disciplina: ${disciplina}
- Conteúdo/Tema: ${conteudo}
- Quantidade de aulas: ${quantidade_aulas}${habilidadesContext}${cargaHorariaInstrucao}

Responda APENAS com o JSON, sem markdown ou texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      return handleAIError(response);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const plano = parseJSON(content);

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

function parseJSON(content: string) {
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return { raw: content };
  }
}

async function handleAIError(response: Response) {
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
