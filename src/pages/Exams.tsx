import { useState, useEffect, useRef } from "react";
import ResponsiveA4Wrapper from "@/components/ResponsiveA4Wrapper";
import CreditsIndicator from "@/components/CreditsIndicator";
import { useLocation } from "react-router-dom";
import { FileCheck, Sparkles, Loader2, Building2, Printer, FileDown, Save, Trash2, MoveUp, MoveDown, Plus, Image, Shuffle, List, ChevronDown, Camera, FileText, Upload, FileUp, BookOpen, GraduationCap, ClipboardCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToPdf, exportExamToDocx } from "@/lib/export-utils";
import { generateVersionMap, getNextVersionLabel, type MapaQuestaoItem } from "@/lib/shuffle-utils";
import OMRAnswerSheet from "@/components/exams/OMRAnswerSheet";
import OMRScanner from "@/components/exams/OMRScanner";
import CameraScanner from "@/components/exams/CameraScanner";
import TimbreSelector from "@/components/TimbreSelector";
import type { TimbreData } from "@/hooks/useTimbre";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useDocumentLimits } from "@/hooks/useDocumentLimits";

const niveis: Record<string, string[]> = {
  "Fundamental - Séries Iniciais": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental - Séries Finais": ["6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
};

interface ExamQuestion {
  id: string;
  type: "mc" | "open";
  content: string;
  alternatives: string[];
  correctIndex: number;
  lines: number;
  pontos: number;
  imageUrl?: string;
  dbId?: string;
}

interface SavedProva {
  id: string;
  titulo: string;
  status: string;
  created_at: string;
  temas: string | null;
}

interface SavedVersao {
  id: string;
  versao_label: string;
  qr_code_id: string;
  mapa_questoes: MapaQuestaoItem[];
  created_at: string;
}

const genId = () => Math.random().toString(36).slice(2, 10);
const emptyMC = (): ExamQuestion => ({ id: genId(), type: "mc", content: "", alternatives: ["", "", "", ""], correctIndex: 0, lines: 0, pontos: 1 });
const emptyOpen = (): ExamQuestion => ({ id: genId(), type: "open", content: "", alternatives: [], correctIndex: -1, lines: 4, pontos: 1 });

export default function Exams() {
  const { user } = useAuth();
  const location = useLocation();
  const docLimits = useDocumentLimits();
  const [titulo, setTitulo] = useState("");
  const [temas, setTemas] = useState("");
  const [nivel, setNivel] = useState("");
  const [serie, setSerie] = useState("");
  const [tipoQuestoes, setTipoQuestoes] = useState("mista");
  const [numAbertas, setNumAbertas] = useState(3);
  const [numFechadas, setNumFechadas] = useState(5);
  const [showHeader, setShowHeader] = useState(true);
  const [escola, setEscola] = useState("");
  const [professor, setProfessor] = useState("");
  const [turma, setTurma] = useState("");
  const [loading, setLoading] = useState(false);
  const [gerarQr, setGerarQr] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questoes, setQuestoes] = useState<ExamQuestion[]>([]);
  const [mainTab, setMainTab] = useState("criar");
  const [modoEnem, setModoEnem] = useState(false);

  // DB persistence state
  const [currentProvaId, setCurrentProvaId] = useState<string | null>(null);
  const [savedProvas, setSavedProvas] = useState<SavedProva[]>([]);
  const [versoes, setVersoes] = useState<SavedVersao[]>([]);
  const [selectedVersaoId, setSelectedVersaoId] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [loadingProvas, setLoadingProvas] = useState(false);

  // Import activities state
  const [savedActivities, setSavedActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);

  // Import plans state
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  // File import state  
  const [textoImportadoProva, setTextoImportadoProva] = useState("");
  const [importFileNameProva, setImportFileNameProva] = useState("");
  const [selectedTimbre, setSelectedTimbre] = useState<TimbreData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [respostasAlunos, setRespostasAlunos] = useState<any[]>([]);
  const [loadingRespostas, setLoadingRespostas] = useState(false);
  const [expandedProvaId, setExpandedProvaId] = useState<string | null>(null);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("escola, nome").eq("user_id", user.id).single();
      if (data?.escola) setEscola(data.escola);
      if (data?.nome) setProfessor(data.nome);
    })();
    loadSavedProvas();
    loadSavedActivities();
    loadSavedPlans();
    loadRespostasAlunos();
  }, [user]);

  // Auto-enable ENEM mode when Ensino Médio is selected
  useEffect(() => {
    if (nivel === "Ensino Médio") {
      setModoEnem(true);
    } else {
      setModoEnem(false);
    }
  }, [nivel]);

  // Load exam from Library navigation
  useEffect(() => {
    const state = location.state as { loadDocId?: string; source?: string } | null;
    if (state?.loadDocId && state?.source === "provas") {
      loadProvaById(state.loadDocId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadProvaById = async (provaId: string) => {
    try {
      const { data: prova, error } = await supabase
        .from("provas")
        .select("*")
        .eq("id", provaId)
        .single();
      if (error) throw error;

      setCurrentProvaId(provaId);
      setTitulo(prova.titulo || "");
      setTemas(prova.temas || "");
      setNivel(prova.nivel || "");
      setSerie(prova.serie || "");
      setEscola(prova.escola || "");
      setProfessor(prova.professor || "");
      setTurma(prova.turma || "");
      setTipoQuestoes(prova.tipo_questoes || "mista");

      // Load questions
      const { data: questoesData } = await supabase
        .from("questoes")
        .select("*")
        .eq("prova_id", provaId)
        .order("ordem");

      if (questoesData) {
        setQuestoes(questoesData.map((q: any) => ({
          id: genId(),
          dbId: q.id,
          type: q.tipo as "mc" | "open",
          content: q.conteudo,
          alternatives: (q.alternativas as string[]) || [],
          correctIndex: q.resposta_correta || 0,
          lines: q.linhas || 4,
          pontos: q.pontos || 1,
          imageUrl: q.imagem_url,
        })));
      }

      setMainTab("criar");
      toast.success(`Prova "${prova.titulo}" carregada!`);
    } catch (err) {
      console.error("Error loading prova:", err);
      toast.error("Erro ao carregar prova");
    }
  };

  const loadSavedPlans = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("documentos_salvos")
        .select("id, titulo, disciplina, nivel, created_at, conteudo")
        .eq("tipo", "plano")
        .order("created_at", { ascending: false })
        .limit(30);
      setSavedPlans(data || []);
    } catch {}
  };

  const loadRespostasAlunos = async () => {
    if (!user) return;
    setLoadingRespostas(true);
    try {
      const { data } = await supabase
        .from("respostas_alunos")
        .select("id, nome_aluno, nota, tempo_gasto, created_at, prova_id, respostas_json")
        .order("created_at", { ascending: false })
        .limit(100);
      setRespostasAlunos(data || []);
    } catch {} finally { setLoadingRespostas(false); }
  };

  const computeGradeStats = (respostas: any[]) => {
    const grades = respostas
      .map(r => (typeof r.nota === "number" ? r.nota : null))
      .filter((n): n is number => n !== null && !isNaN(n));

    const total = grades.length;
    if (total === 0) {
      return { total: 0, avg: 0, min: 0, max: 0, median: 0, passRate: 0, distribution: [] as Array<{ range: string; count: number }> };
    }

    const sorted = [...grades].sort((a, b) => a - b);
    const sum = grades.reduce((acc, v) => acc + v, 0);
    const avg = sum / total;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted.length % 2 === 1 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    const passCount = grades.filter(g => g >= 7).length;
    const passRate = total ? passCount / total : 0;

    const distribution = Array.from({ length: 10 }, (_, i) => ({ range: `${i}-${i + 1}`, count: 0 }));
    grades.forEach(g => {
      const idx = Math.min(9, Math.floor(g));
      distribution[idx].count += 1;
    });

    return { total, avg, min, max, median, passRate, distribution };
  };

  const handleFileImportProva = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    setImportFileNameProva(file.name);
    if (name.endsWith(".txt") || name.endsWith(".md")) {
      const text = await file.text();
      setTextoImportadoProva(text);
      toast.success(`Arquivo "${file.name}" importado!`);
    } else if (name.endsWith(".pdf")) {
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const decoder = new TextDecoder("latin1");
        const raw = decoder.decode(bytes);
        let text = "";
        const btMatches = raw.matchAll(/BT\s([\s\S]*?)ET/g);
        for (const match of btMatches) {
          const inner = match[1];
          const tjMatches = inner.matchAll(/\(([^)]*)\)\s*Tj/g);
          for (const tj of tjMatches) text += tj[1];
          const tdMatches = inner.matchAll(/\[([^\]]*)\]\s*TJ/g);
          for (const td of tdMatches) {
            const parts = td[1].matchAll(/\(([^)]*)\)/g);
            for (const p of parts) text += p[1];
          }
          text += "\n";
        }
        if (text.trim().length < 20) text = "⚠️ Não foi possível extrair texto deste PDF. Cole o texto manualmente.";
        setTextoImportadoProva(text.trim());
        toast.success(`PDF "${file.name}" importado! Revise o texto.`);
      } catch { toast.error("Erro ao processar PDF"); }
    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
      try {
        const text = await file.text();
        const cleanText = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        setTextoImportadoProva(cleanText.length > 50 ? cleanText.substring(0, 10000) : "⚠️ Cole o conteúdo manualmente.");
        toast.success(`Arquivo "${file.name}" importado!`);
      } catch { toast.error("Erro ao processar arquivo"); }
    } else {
      toast.error("Formato não suportado. Use PDF, DOCX ou TXT.");
    }
    e.target.value = "";
  };

  const handleImportPlanAsContext = (plan: any) => {
    const p = plan.conteudo || plan;
    let contextText = "";
    if (p.identificacao?.tema) contextText += `Tema: ${p.identificacao.tema}\n`;
    if (p.identificacao?.disciplina) contextText += `Disciplina: ${p.identificacao.disciplina}\n`;
    if (p.objetivos?.length) contextText += `\nObjetivos:\n${p.objetivos.join('\n')}\n`;
    if (p.desenvolvimento) contextText += `\nDesenvolvimento:\n${p.desenvolvimento}\n`;
    if (p.conteudo) contextText += `\nConteúdo:\n${p.conteudo}\n`;
    setTextoImportadoProva(contextText || JSON.stringify(p, null, 2).slice(0, 5000));
    setImportFileNameProva(plan.titulo || "Plano de aula");
    if (p.identificacao?.tema) setTemas(p.identificacao.tema);
    setShowPlanPicker(false);
    toast.success("Plano importado! Clique em 'Gerar Questões' para criar as questões da prova.");
  };

  const handleImportActivityViaAI = (activity: any) => {
    const conteudo = activity.conteudo as any;
    const blocks = conteudo?.blocks || [];
    let textContent = "";
    blocks.forEach((block: any) => {
      if (block.type === "title") textContent += `# ${block.content}\n\n`;
      if (block.type === "text") textContent += block.content + "\n\n";
      if (block.type === "question-open") textContent += `Questão: ${block.content}\n\n`;
      if (block.type === "question-mc" || block.type === "question-enem") {
        textContent += `Questão: ${block.content}\n`;
        if (block.alternatives) block.alternatives.forEach((alt: string, i: number) => {
          textContent += `  ${String.fromCharCode(65 + i)}) ${alt}\n`;
        });
        textContent += "\n";
      }
    });
    setTextoImportadoProva(textContent);
    setImportFileNameProva(activity.titulo || "Atividade importada");
    setShowActivityPicker(false);
    toast.success("Atividade importada! Clique em 'Gerar Questões' para criar questões de prova com base no conteúdo.");
  };

  const loadSavedActivities = async () => {
    if (!user) return;
    setLoadingActivities(true);
    try {
      const { data } = await supabase
        .from("documentos_salvos")
        .select("id, titulo, disciplina, nivel, created_at, conteudo")
        .eq("tipo", "atividade")
        .order("created_at", { ascending: false })
        .limit(50);
      setSavedActivities(data || []);
    } catch {} finally { setLoadingActivities(false); }
  };

  const importActivityAsQuestions = (activity: any) => {
    const conteudo = activity.conteudo as any;
    const blocks = conteudo?.blocks || [];
    
    const newQuestions: ExamQuestion[] = [];
    
    blocks.forEach((block: any) => {
      if (block.type === "question-open") {
        newQuestions.push({
          id: genId(),
          type: "open",
          content: block.content || "",
          alternatives: [],
          correctIndex: -1,
          lines: block.lines || 4,
          pontos: 1,
          imageUrl: block.imageUrl,
        });
      } else if (block.type === "question-mc") {
        newQuestions.push({
          id: genId(),
          type: "mc",
          content: block.content || "",
          alternatives: block.alternatives || ["", "", "", ""],
          correctIndex: block.correctIndex ?? 0,
          lines: 0,
          pontos: 1,
          imageUrl: block.imageUrl,
        });
      }
    });

    if (newQuestions.length === 0) {
      toast.error("Nenhuma questão encontrada nesta atividade");
      return;
    }

    setQuestoes(prev => [...prev, ...newQuestions]);
    setShowActivityPicker(false);
    toast.success(`${newQuestions.length} questões importadas da atividade`);
  };

  const loadSavedProvas = async () => {
    if (!user) return;
    setLoadingProvas(true);
    try {
      const { data } = await supabase
        .from("provas")
        .select("id, titulo, status, created_at, temas")
        .order("created_at", { ascending: false })
        .limit(50);
      setSavedProvas((data as SavedProva[]) || []);
    } catch {} finally { setLoadingProvas(false); }
  };

  const loadProva = async (provaId: string) => {
    try {
      const [{ data: prova }, { data: questoesData }, { data: versoesData }] = await Promise.all([
        supabase.from("provas").select("*").eq("id", provaId).single(),
        supabase.from("questoes").select("*").eq("prova_id", provaId).order("ordem"),
        supabase.from("versoes_prova").select("*").eq("prova_id", provaId).order("created_at"),
      ]);

      if (!prova) { toast.error("Prova não encontrada"); return; }

      setCurrentProvaId(provaId);
      setTitulo(prova.titulo || "");
      setTemas(prova.temas || "");
      setNivel(prova.nivel || "");
      setSerie(prova.serie || "");
      setTipoQuestoes(prova.tipo_questoes || "mista");
      setEscola(prova.escola || "");
      setProfessor(prova.professor || "");
      setTurma(prova.turma || "");

      if (questoesData) {
        setQuestoes(questoesData.map((q: any) => ({
          id: genId(),
          dbId: q.id,
          type: q.tipo === "open" ? "open" : "mc",
          content: q.conteudo || "",
          alternatives: (q.alternativas as string[]) || ["", "", "", ""],
          correctIndex: q.resposta_correta ?? 0,
          lines: q.linhas || 4,
          pontos: q.pontos ?? 1,
          imageUrl: q.imagem_url || undefined,
        })));
      }

      setVersoes((versoesData as any[] || []).map((v: any) => ({
        id: v.id,
        versao_label: v.versao_label,
        qr_code_id: v.qr_code_id,
        mapa_questoes: v.mapa_questoes as unknown as MapaQuestaoItem[],
        created_at: v.created_at,
      })));
      setSelectedVersaoId(null);
      toast.success(`Prova "${prova.titulo}" carregada`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar prova");
    }
  };

  const updateQuestion = (id: string, updates: Partial<ExamQuestion>) =>
    setQuestoes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  const removeQuestion = (id: string) => setQuestoes(prev => prev.filter(q => q.id !== id));
  const moveQuestion = (idx: number, dir: -1 | 1) => {
    setQuestoes(prev => {
      const arr = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= arr.length) return prev;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      return arr;
    });
  };

  const handleImageUploadForQuestion = (qId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateQuestion(qId, { imageUrl: url });
    toast.success("Imagem inserida na questão!");
    e.target.value = "";
  };

  const [generatingImageFor, setGeneratingImageFor] = useState<string | null>(null);

  const handleAiImageForQuestion = async (qId: string) => {
    const q = questoes.find(x => x.id === qId);
    if (!q || !q.content.trim()) { toast.error("Escreva o enunciado antes de gerar uma imagem"); return; }
    setGeneratingImageFor(qId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: `Ilustração educativa para a seguinte questão de prova: ${q.content}`, style: "educational, clean, black and white line art suitable for printing" },
      });
      if (error) throw error;
      if (data?.image_url) {
        updateQuestion(qId, { imageUrl: data.image_url });
        toast.success("Imagem gerada com IA!");
      } else {
        throw new Error("Nenhuma imagem retornada");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar imagem");
    } finally { setGeneratingImageFor(null); }
  };

  const { canUseAI, deductCredit } = useCredits();

  const handleAiGenerate = async () => {
    if (!temas.trim() && !textoImportadoProva.trim()) { toast.error("Insira os temas ou importe um texto"); return; }
    if (!canUseAI) { toast.error("Limite atingido. Faça o upgrade para continuar criando."); return; }
    setLoading(true);
    try {
      const ok = await deductCredit();
      if (!ok) { toast.error("Sem créditos disponíveis."); setLoading(false); return; }
      const nA = tipoQuestoes === "multipla_escolha" ? 0 : numAbertas;
      const nF = tipoQuestoes === "aberta" ? 0 : numFechadas;
      const temasComContexto = textoImportadoProva
        ? `${temas}\n\nTexto base para gerar as questões:\n${textoImportadoProva.slice(0, 4000)}`
        : temas;
      const { data, error } = await supabase.functions.invoke("generate-prova", {
        body: { temas: temasComContexto, nivel, serie: serie ? `${nivel} - ${serie}` : nivel, tipo: modoEnem ? "enem" : tipoQuestoes, num_abertas: modoEnem ? 0 : nA, num_fechadas: nF, titulo, modo_enem: modoEnem },
      });
      if (error) throw error;
      if (data?.questoes) {
        const mapped: ExamQuestion[] = data.questoes.map((q: any) => ({
          id: genId(),
          type: q.type === "question-open" ? "open" : "mc",
          content: q.content || "",
          alternatives: q.alternatives || (modoEnem ? ["", "", "", "", ""] : ["", "", "", ""]),
          correctIndex: q.correctIndex ?? 0,
          lines: q.lines || 4,
          pontos: 1,
        }));
        setQuestoes(mapped);
        setCurrentProvaId(null); // new unsaved exam
        setVersoes([]);
        setSelectedVersaoId(null);
        toast.success(`${mapped.length} questões geradas!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar");
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!user) { toast.error("Faça login"); return; }
    if (!currentProvaId && !docLimits.checkAndWarnLimit()) return;
    setSaving(true);
    try {
      const provaData = {
        user_id: user.id,
        titulo: titulo || "Prova sem título",
        temas: temas || null,
        nivel: nivel || null,
        serie: serie || null,
        tipo_questoes: tipoQuestoes,
        escola: escola || null,
        professor: professor || null,
        turma: turma || null,
      };

      let provaId = currentProvaId;

      if (provaId) {
        // Update existing
        await supabase.from("provas").update(provaData).eq("id", provaId);
        // Delete old questions and re-insert
        await supabase.from("questoes").delete().eq("prova_id", provaId);
      } else {
        // Insert new
        const { data: newProva, error } = await supabase.from("provas").insert(provaData).select("id").single();
        if (error) throw error;
        provaId = newProva.id;
        setCurrentProvaId(provaId);
      }

      // Insert questions
      if (questoes.length > 0) {
        const questoesInsert = questoes.map((q, idx) => ({
          prova_id: provaId!,
          ordem: idx,
          tipo: q.type,
          conteudo: q.content,
          alternativas: q.type === "mc" ? q.alternatives : null,
          resposta_correta: q.type === "mc" ? q.correctIndex : null,
          linhas: q.type === "open" ? q.lines : null,
          imagem_url: q.imageUrl || null,
          pontos: q.pontos,
        }));
        const { error: qErr } = await supabase.from("questoes").insert(questoesInsert);
        if (qErr) throw qErr;
      }

      await loadSavedProvas();
      toast.success("Prova salva no banco de dados!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally { setSaving(false); }
  };

  const handleShuffle = async () => {
    if (!currentProvaId) {
      toast.error("Salve a prova primeiro antes de embaralhar");
      return;
    }
    if (questoes.filter(q => q.type === "mc").length === 0) {
      toast.error("Adicione questões de múltipla escolha para embaralhar");
      return;
    }

    setShuffling(true);
    try {
      // Re-fetch questoes from DB to get their UUIDs
      const { data: dbQuestoes } = await supabase
        .from("questoes")
        .select("id, tipo, alternativas, resposta_correta")
        .eq("prova_id", currentProvaId)
        .order("ordem");

      if (!dbQuestoes || dbQuestoes.length === 0) {
        toast.error("Salve a prova primeiro");
        setShuffling(false);
        return;
      }

      const mappedQ = dbQuestoes.map(q => ({
        id: q.id,
        tipo: q.tipo,
        alternativas: q.alternativas as string[] | null,
        resposta_correta: q.resposta_correta,
      }));

      const mapa = generateVersionMap(mappedQ);
      const existingLabels = versoes.map(v => v.versao_label);
      const nextLabel = getNextVersionLabel(existingLabels);

      const { data: newVersao, error } = await supabase
        .from("versoes_prova")
        .insert({
          prova_id: currentProvaId,
          versao_label: nextLabel,
          mapa_questoes: mapa as any,
        })
        .select("*")
        .single();

      if (error) throw error;

      const v: SavedVersao = {
        id: newVersao.id,
        versao_label: newVersao.versao_label,
        qr_code_id: newVersao.qr_code_id,
        mapa_questoes: (newVersao.mapa_questoes as unknown) as MapaQuestaoItem[],
        created_at: newVersao.created_at,
      };
      setVersoes(prev => [...prev, v]);
      setSelectedVersaoId(v.id);
      toast.success(`Versão ${nextLabel} gerada com embaralhamento!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao embaralhar");
    } finally { setShuffling(false); }
  };

  const handlePrint = () => {
    const el = document.getElementById("prova-print-area");
    if (!el) return;
    const pw = window.open("", "_blank");
    if (!pw) return;
      pw.document.write(`<html><head><title>Prova</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', 'Arial', sans-serif; }
      .question { page-break-inside: avoid; }
      .omr-sheet { page-break-before: always; }
      @page { size: A4; margin: 15mm; }
    </style></head><body>`);
    pw.document.write(el.innerHTML);
    pw.document.write("</body></html>");
    pw.document.close();
    pw.focus();
    pw.print();
    pw.close();
  };

  const handleNewExam = () => {
    setCurrentProvaId(null);
    setTitulo("");
    setTemas("");
    setQuestoes([]);
    setVersoes([]);
    setSelectedVersaoId(null);
  };

  // Get the currently selected version for preview
  const selectedVersao = versoes.find(v => v.id === selectedVersaoId);

  // Reorder questions based on selected version's mapa
  const getPreviewQuestions = (): ExamQuestion[] => {
    if (!selectedVersao) return questoes;

    const mapa = selectedVersao.mapa_questoes;
    if (!mapa || mapa.length === 0) return questoes;

    // Build reordered list
    const sorted = [...mapa].sort((a, b) => a.nova_ordem - b.nova_ordem);
    return sorted.map(item => {
      // Find original question by dbId or by original order
      const origQ = questoes[item.ordem_original];
      if (!origQ) return questoes[0]; // fallback

      if (origQ.type === "mc" && item.mapa_alternativas) {
        // Reorder alternatives according to the map
        const newAlts = item.mapa_alternativas.map(origIdx => origQ.alternatives[origIdx] || "");
        return {
          ...origQ,
          alternatives: newAlts,
          correctIndex: item.resposta_correta_nova ?? 0,
        };
      }
      return origQ;
    });
  };

  const previewQuestions = getPreviewQuestions();
  const mcQuestoes = previewQuestions.filter(q => q.type === "mc");
  const gabarito = mcQuestoes.map((q, i) => ({ q: i + 1, correct: q.correctIndex }));

  return (
    <div className="space-y-4 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" /> Provas e Correção
          </h1>
          <p className="text-muted-foreground text-[10px] sm:text-sm">Crie provas, embaralhe versões e corrija por foto com IA</p>
        </div>
        <CreditsIndicator />
      </div>

      {/* Action buttons below title on mobile */}
      {questoes.length > 0 && (
        <div className="flex gap-1 sm:gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handlePrint} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3"><Printer className="mr-1 h-3.5 w-3.5" /> <span className="hidden sm:inline">Imprimir</span><span className="sm:hidden">Imp.</span></Button>
          <Button size="sm" variant="outline" onClick={() => exportToPdf("prova-print-area", "prova")} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3"><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Button>
          <Button size="sm" variant="outline" onClick={() => exportExamToDocx(previewQuestions, { titulo, escola: showHeader ? escola : undefined, professor, turma, bannerUrl: showHeader ? selectedTimbre?.bannerUrl : undefined, logoUrl: showHeader ? selectedTimbre?.logoUrl : undefined })} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3"><FileDown className="mr-1 h-3.5 w-3.5" /> DOCX</Button>
          <Button size="sm" variant="outline" onClick={handleShuffle} disabled={shuffling || !currentProvaId} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3">
            <Shuffle className="mr-1 h-3.5 w-3.5" /> {shuffling ? "..." : <span className="hidden sm:inline">Embaralhar</span>}{!shuffling && <span className="sm:hidden">Emb.</span>}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3"><Save className="mr-1 h-3.5 w-3.5" /> {saving ? "..." : "Salvar"}</Button>
          <Button size="sm" variant="ghost" onClick={handleNewExam} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3"><Plus className="mr-1 h-3.5 w-3.5" /> Nova</Button>
        </div>
      )}
      {questoes.length === 0 && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={handleNewExam} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3"><Plus className="mr-1 h-3.5 w-3.5" /> Nova</Button>
        </div>
      )}

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="criar" className="text-[10px] sm:text-xs px-1 sm:px-3">Criar</TabsTrigger>
          <TabsTrigger value="minhas" className="text-[10px] sm:text-xs px-1 sm:px-3">Minhas</TabsTrigger>
          <TabsTrigger value="resultados" className="text-[10px] sm:text-xs px-1 sm:px-3"><ClipboardCheck className="mr-0.5 sm:mr-1 h-3 w-3" /> Resultados</TabsTrigger>
          <TabsTrigger value="corrigir" className="text-[10px] sm:text-xs px-1 sm:px-3">Corrigir</TabsTrigger>
          <TabsTrigger value="camera" className="text-[10px] sm:text-xs px-1 sm:px-3"><Camera className="mr-0.5 sm:mr-1 h-3 w-3" /> Câmera</TabsTrigger>
        </TabsList>

        <TabsContent value="criar">
          <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
            {/* LEFT - Config */}
            <div className="space-y-4 overflow-x-hidden">
              {/* TIMBRE - Cabeçalho Institucional (padrão BNCC) */}
              <Card className="shadow-card">
                <CardContent className="pt-4 space-y-3">
                  <div className="rounded-lg border border-dashed border-primary/30 p-3 space-y-3 bg-primary/5">
                    <Label className="text-xs font-semibold">🏫 Cabeçalho Institucional</Label>
                    <TimbreSelector
                      selectedId={selectedTimbre?.id}
                      onSelect={t => { setSelectedTimbre(t); }}
                      label="Selecionar escola/timbre"
                    />
                    {!selectedTimbre && (
                      <Input placeholder="Ou digite o nome da escola" value={escola} onChange={e => setEscola(e.target.value)} className="h-8 text-xs" />
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Professor(a)</Label>
                        <Input placeholder="Nome do professor" value={professor} onChange={e => setProfessor(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Turma</Label>
                        <Input placeholder="Ex: 5ºA, Turma 301" value={turma} onChange={e => setTurma(e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={gerarQr} onCheckedChange={setGerarQr} id="qr-sw" />
                    <Label htmlFor="qr-sw" className="text-xs">Folha de respostas com QR Code</Label>
                  </div>
                </CardContent>
              </Card>

              {/* AI Generation */}
              <Card className="shadow-card">
                <CardHeader className="py-3"><CardTitle className="text-sm font-semibold flex items-center gap-1"><Sparkles className="h-4 w-4" /> Gerar com IA</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Título da prova</Label>
                    <Input placeholder="Prova de Ciências" value={titulo} onChange={e => setTitulo(e.target.value)} className="h-8 text-xs" />
                  </div>

                  {/* Import options */}
                  <div className="space-y-1.5 rounded-lg border border-dashed border-muted-foreground/30 p-2">
                    <Label className="text-[10px] font-semibold">📥 Importar conteúdo</Label>
                    
                    {/* File import */}
                    <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-primary/30 px-2 py-1.5 hover:bg-primary/5 transition-colors text-xs">
                      <Upload className="h-3.5 w-3.5 text-primary" />
                      <span>Importar PDF, DOCX ou TXT</span>
                      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden" onChange={handleFileImportProva} />
                    </label>

                    {/* Activity import */}
                    <div className="relative">
                      <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => { setShowActivityPicker(!showActivityPicker); setShowPlanPicker(false); }}>
                        <FileText className="mr-1 h-3.5 w-3.5" /> Importar Atividade Salva
                      </Button>
                      {showActivityPicker && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {savedActivities.length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted-foreground">Nenhuma atividade salva</div>
                          ) : (
                            savedActivities.map((a) => (
                              <button key={a.id} onClick={() => handleImportActivityViaAI(a)} className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-xs border-b last:border-0">
                                <p className="font-medium truncate">{a.titulo}</p>
                                <p className="text-muted-foreground text-[10px]">{a.disciplina || "Sem disciplina"} • {new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Plan import */}
                    <div className="relative">
                      <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => { setShowPlanPicker(!showPlanPicker); setShowActivityPicker(false); }}>
                        <BookOpen className="mr-1 h-3.5 w-3.5" /> Importar Plano de Aula
                      </Button>
                      {showPlanPicker && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {savedPlans.length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted-foreground">Nenhum plano salvo</div>
                          ) : (
                            savedPlans.map((p) => (
                              <button key={p.id} onClick={() => handleImportPlanAsContext(p)} className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-xs border-b last:border-0">
                                <p className="font-medium truncate">{p.titulo}</p>
                                <p className="text-muted-foreground text-[10px]">{p.disciplina || "Sem disciplina"} • {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px]">Tema e instruções</Label>
                    <Textarea placeholder="Ex: Sistema Solar - Gere questões sobre planetas, órbitas e gravidade..." value={temas} onChange={e => setTemas(e.target.value)} className="min-h-[60px] text-xs" />
                  </div>

                  {/* Imported text preview */}
                  {textoImportadoProva && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-semibold flex items-center gap-1"><FileUp className="h-3 w-3" /> Texto importado{importFileNameProva ? `: ${importFileNameProva}` : ""}</Label>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setTextoImportadoProva(""); setImportFileNameProva(""); }}>✕</Button>
                      </div>
                      <Textarea value={textoImportadoProva} onChange={e => setTextoImportadoProva(e.target.value)} className="min-h-[60px] text-[10px] bg-background" />
                      <p className="text-[9px] text-muted-foreground">A IA usará este texto como base para gerar as questões.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Nível</Label>
                      <Select value={nivel} onValueChange={v => { setNivel(v); setSerie(""); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Nível" /></SelectTrigger>
                        <SelectContent>{Object.keys(niveis).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Série</Label>
                      <Select value={serie} onValueChange={setSerie} disabled={!nivel}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Série" /></SelectTrigger>
                        <SelectContent>{(niveis[nivel] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ENEM Mode Toggle */}
                  {nivel === "Ensino Médio" && (
                    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={modoEnem} onCheckedChange={setModoEnem} id="enem-mode-prova" />
                        <Label htmlFor="enem-mode-prova" className="text-xs font-semibold flex items-center gap-1">
                          <GraduationCap className="h-4 w-4 text-primary" /> Modo ENEM
                        </Label>
                      </div>
                      {modoEnem && (
                        <div className="text-[9px] text-muted-foreground space-y-0.5">
                          <p>🎯 Questões no padrão ENEM com:</p>
                          <p>• Texto-base contextualizado</p>
                          <p>• Enunciado como frase incompleta</p>
                          <p>• 5 alternativas (A-E) com distratores</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question type - hidden in ENEM mode */}
                  {!modoEnem && (
                    <div className="space-y-1">
                      <Label className="text-[10px]">Tipo de questões</Label>
                      <Select value={tipoQuestoes} onValueChange={setTipoQuestoes}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mista">Mista (abertas + fechadas)</SelectItem>
                          <SelectItem value="aberta">Só Abertas</SelectItem>
                          <SelectItem value="multipla_escolha">Só Múltipla Escolha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {!modoEnem && tipoQuestoes !== "multipla_escolha" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Q. Abertas</Label>
                        <Input type="number" min={0} max={30} value={numAbertas} onChange={e => setNumAbertas(e.target.value === "" ? 0 : parseInt(e.target.value))} className="h-8 text-xs" />
                      </div>
                    )}
                    {(modoEnem || tipoQuestoes !== "aberta") && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">{modoEnem ? "Questões ENEM" : "Q. Múltipla Escolha"}</Label>
                        <Input type="number" min={0} max={30} value={numFechadas} onChange={e => setNumFechadas(e.target.value === "" ? 0 : parseInt(e.target.value))} className="h-8 text-xs" />
                      </div>
                    )}
                  </div>
                  <Button onClick={handleAiGenerate} disabled={loading} size="sm" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90">
                    {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-1 h-4 w-4" /> Gerar Questões</>}
                  </Button>
                </CardContent>
              </Card>

              {/* Versions */}
              {versoes.length > 0 && (
                <Card className="shadow-card">
                  <CardContent className="pt-4 space-y-2">
                    <h3 className="text-xs font-semibold flex items-center gap-1"><Shuffle className="h-3 w-3" /> Versões Embaralhadas</h3>
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant={!selectedVersaoId ? "default" : "outline"}
                        className="cursor-pointer text-[10px]"
                        onClick={() => setSelectedVersaoId(null)}
                      >
                        Original
                      </Badge>
                      {versoes.map(v => (
                        <Badge
                          key={v.id}
                          variant={selectedVersaoId === v.id ? "default" : "outline"}
                          className="cursor-pointer text-[10px]"
                          onClick={() => setSelectedVersaoId(v.id)}
                        >
                          Versão {v.versao_label}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[9px] text-muted-foreground">
                      {selectedVersao ? `Visualizando versão ${selectedVersao.versao_label} (QR: ${selectedVersao.qr_code_id.slice(0, 8)}...)` : "Visualizando versão original"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Manual questions */}
              <Card className="shadow-card">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold">📝 Questões ({questoes.length}) — <span className="text-primary">{questoes.reduce((s, q) => s + (q.pontos || 0), 0).toFixed(1).replace(/\.0$/, '')} pontos</span></CardTitle>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => setQuestoes(prev => [...prev, emptyMC()])}>
                        <Plus className="h-3 w-3 mr-0.5" /> M.E.
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => setQuestoes(prev => [...prev, emptyOpen()])}>
                        <Plus className="h-3 w-3 mr-0.5" /> Aberta
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {questoes.map((q, idx) => (
                    <div key={q.id} className="rounded-lg border p-2.5 space-y-2 bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">
                          {idx + 1}. {q.type === "mc" ? "Múltipla Escolha" : "Aberta"}
                        </span>
                        <div className="flex items-center gap-1">
                          <Label className="text-[9px] text-muted-foreground">Pts:</Label>
                          <Input type="number" min={0.1} step={0.5} value={q.pontos} onChange={e => updateQuestion(q.id, { pontos: e.target.value === "" ? 0 : parseFloat(e.target.value) })} className="h-5 w-12 text-[10px] text-center p-0" />
                          <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0} onClick={() => moveQuestion(idx, -1)}><MoveUp className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === questoes.length - 1} onClick={() => moveQuestion(idx, 1)}><MoveDown className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeQuestion(q.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <Textarea value={q.content} onChange={e => updateQuestion(q.id, { content: e.target.value })} placeholder="Enunciado da questão" className="min-h-[40px] text-xs" />
                      {q.type === "mc" && (
                        <div className="space-y-1">
                          {q.alternatives.map((alt, ai) => (
                            <div key={ai} className="flex gap-1 items-center">
                              <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === ai} onChange={() => updateQuestion(q.id, { correctIndex: ai })} className="h-3 w-3 accent-primary" />
                              <span className="text-[10px] font-mono w-4">{String.fromCharCode(65 + ai)})</span>
                              <Input value={alt} onChange={e => { const alts = [...q.alternatives]; alts[ai] = e.target.value; updateQuestion(q.id, { alternatives: alts }); }} className="h-6 text-[11px]" placeholder={`Alternativa ${String.fromCharCode(65 + ai)}`} />
                            </div>
                          ))}
                          <p className="text-[9px] text-muted-foreground">🔘 Selecione a alternativa correta</p>
                        </div>
                      )}
                      {q.type === "open" && (
                        <div className="flex items-center gap-2">
                          <Label className="text-[10px]">Linhas:</Label>
                          <Input type="number" min={1} max={20} value={q.lines} onChange={e => updateQuestion(q.id, { lines: e.target.value === "" ? 0 : parseInt(e.target.value) })} className="h-6 w-14 text-[11px]" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="flex items-center gap-1 cursor-pointer text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                          <Image className="h-3 w-3" /> {q.imageUrl ? "Trocar imagem" : "Upload imagem"}
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUploadForQuestion(q.id, e)} />
                        </label>
                        <button
                          onClick={() => handleAiImageForQuestion(q.id)}
                          disabled={generatingImageFor === q.id}
                          className="flex items-center gap-1 text-[10px] text-primary hover:underline disabled:opacity-50"
                        >
                          <Sparkles className="h-3 w-3" /> {generatingImageFor === q.id ? "Gerando..." : "Gerar com IA"}
                        </button>
                        {q.imageUrl && (
                          <button onClick={() => updateQuestion(q.id, { imageUrl: undefined })} className="text-[10px] text-destructive hover:underline">Remover</button>
                        )}
                      </div>
                      {q.imageUrl && <img src={q.imageUrl} alt="" className="h-12 rounded border object-contain" />}
                    </div>
                  ))}
                  {questoes.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Gere questões com IA ou adicione manualmente</p>}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT - Preview */}
            <div className="overflow-x-hidden min-w-0">
              <ResponsiveA4Wrapper>
              <div className="bg-muted/30 rounded-lg p-1 sm:p-4 flex justify-center min-w-0">
                <div
                  id="prova-print-area"
                  className="bg-white text-black shadow-lg"
                  style={{ width: "210mm", maxWidth: "100%", minHeight: "297mm", padding: "15mm 10mm", fontFamily: "'Inter', 'Arial', sans-serif", fontSize: "11pt", lineHeight: 1.6 }}
                >
                  {showHeader && selectedTimbre?.bannerUrl && (
                    <div style={{ textAlign: "center", marginBottom: "4mm" }}>
                      <img src={selectedTimbre.bannerUrl} alt="Timbre da escola" style={{ display: "block", margin: "0 auto", maxWidth: "100%", maxHeight: "25mm", objectFit: "contain" }} crossOrigin="anonymous" />
                    </div>
                  )}
                  {/* Logo + school name */}
                  {showHeader && (escola || selectedTimbre?.logoUrl) && (
                    <div style={{ textAlign: "center", fontWeight: 700, fontSize: "14pt", marginBottom: "4mm", fontFamily: "'Montserrat', sans-serif", borderBottom: "2px solid #2563eb", paddingBottom: "3mm", display: "flex", alignItems: "center", justifyContent: "center", gap: "3mm" }}>
                      {selectedTimbre?.logoUrl && !selectedTimbre?.bannerUrl && (
                        <img src={selectedTimbre.logoUrl} alt="" style={{ display: "block", margin: "0 auto", maxHeight: "12mm", objectFit: "contain" }} crossOrigin="anonymous" />
                      )}
                      {escola && <span>{escola}</span>}
                    </div>
                  )}
                  <h1 style={{ textAlign: "center", fontSize: "14pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginBottom: "4mm" }}>
                    {titulo || "Prova"}{selectedVersao ? ` — Versão ${selectedVersao.versao_label}` : ""}
                  </h1>
                  <div style={{ display: "flex", justifyContent: "center", gap: "8mm", fontSize: "9pt", marginBottom: "2mm", color: "#475569" }}>
                    {professor && <span><strong>Professor(a):</strong> {professor}</span>}
                    {turma && <span><strong>Turma:</strong> {turma}</span>}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "3mm 10mm", fontSize: "10pt", marginBottom: "6mm", borderBottom: "1px solid #e2e8f0", paddingBottom: "4mm", justifyContent: "center" }}>
                    <span>Nome: ______________________________</span>
                    <span>Data: ___/___/___</span>
                    <span>Nota: _____</span>
                  </div>

                  {/* Questions */}
                  {previewQuestions.map((q, idx) => (
                    <div key={`${q.id}-${idx}`} className="question" style={{ marginBottom: "6mm", pageBreakInside: "avoid" }}>
                      <p style={{ fontWeight: 600, marginBottom: "2mm", textAlign: "justify" }}>
                        {idx + 1}) {q.content || "Enunciado da questão"}
                        {q.pontos !== 1 && <span style={{ fontWeight: 400, fontSize: "9pt", color: "#6b7280" }}> ({q.pontos} {q.pontos === 1 ? "ponto" : "pontos"})</span>}
                      </p>
                      {q.imageUrl && (
                        <div style={{ textAlign: "center", margin: "3mm 0", pageBreakInside: "avoid" }}>
                          <img src={q.imageUrl} alt="" style={{ maxWidth: "60%", maxHeight: "60mm", objectFit: "contain", borderRadius: "2mm" }} />
                        </div>
                      )}
                      {q.type === "mc" && q.alternatives.map((alt, ai) => (
                        <p key={ai} style={{ marginLeft: "5mm", marginBottom: "1mm" }}>
                          <span style={{ fontWeight: 600 }}>{String.fromCharCode(65 + ai)})</span>{" "}
                          {alt || `Alternativa ${String.fromCharCode(65 + ai)}`}
                        </p>
                      ))}
                      {q.type === "open" && Array.from({ length: q.lines }).map((_, li) => (
                        <div key={li} style={{ borderBottom: "1px solid #d1d5db", height: "8mm", marginBottom: "1mm" }} />
                      ))}
                    </div>
                  ))}

                  {/* OMR Answer Sheet */}
                  {mcQuestoes.length > 0 && gerarQr && (
                    <div className="omr-sheet" style={{ pageBreakBefore: "always" }}>
                      <OMRAnswerSheet
                        titulo={titulo}
                        escola={escola}
                        professor={professor}
                        turma={turma}
                        numMcQuestions={mcQuestoes.length}
                        versaoId={selectedVersao?.qr_code_id}
                        gabarito={!selectedVersao ? gabarito : undefined}
                      />
                    </div>
                  )}

                  {questoes.length === 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#94a3b8", fontSize: "10pt" }}>
                      Gere questões com IA ou adicione manualmente
                    </div>
                  )}
                </div>
              </div>
              </ResponsiveA4Wrapper>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="minhas">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2"><List className="h-5 w-5" /> Provas Salvas</h2>
              <Button size="sm" variant="outline" onClick={loadSavedProvas} disabled={loadingProvas}>
                {loadingProvas ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
              </Button>
            </div>
            {savedProvas.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhuma prova salva ainda</CardContent></Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {savedProvas.map(p => {
                  const hasCorrecoes = respostasAlunos.some(r => r.prova_id === p.id);

                  return (
                    <Card key={p.id} className="shadow-card hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors flex-1 min-w-0 truncate"
                            onClick={() => {
                              loadProva(p.id);
                              if (hasCorrecoes) {
                                setMainTab("resultados");
                                setExpandedProvaId(p.id);
                              } else {
                                setMainTab("criar");
                              }
                            }}
                          >
                            {p.titulo}
                          </h3>
                          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Excluir prova" onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm("Excluir esta prova e todas as suas versões?")) return;
                            try {
                              await supabase.from("respostas_alunos").delete().eq("prova_id", p.id);
                              await supabase.from("versoes_prova").delete().eq("prova_id", p.id);
                              await supabase.from("questoes").delete().eq("prova_id", p.id);
                              const { error } = await supabase.from("provas").delete().eq("id", p.id);
                              if (error) throw error;
                              setSavedProvas(prev => prev.filter(x => x.id !== p.id));
                              if (currentProvaId === p.id) handleNewExam();
                              toast.success("Prova excluída");
                            } catch { toast.error("Erro ao excluir"); }
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {p.temas && <p className="text-xs text-muted-foreground line-clamp-1">{p.temas}</p>}
                        <div className="flex items-center justify-between">
                          <Badge variant={p.status === "rascunho" ? "secondary" : "default"} className="text-[10px]">
                            {p.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resultados">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Provas Corrigidas</h2>
              <Button size="sm" variant="outline" onClick={loadRespostasAlunos} disabled={loadingRespostas}>
                {loadingRespostas ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
              </Button>
            </div>
            {respostasAlunos.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhuma prova corrigida ainda. Use as abas "Corrigir" ou "Câmera" para corrigir provas.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {/* Group by prova */}
                {(() => {
                  const grouped: Record<string, any[]> = {};
                  respostasAlunos.forEach(r => {
                    const key = r.prova_id;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(r);
                  });
                  const provaNames: Record<string, string> = {};
                  savedProvas.forEach(p => { provaNames[p.id] = p.titulo; });
                  
                  return Object.entries(grouped).map(([provaId, respostas]) => {
                    const stats = computeGradeStats(respostas);
                    const isExpanded = expandedProvaId === provaId;

                    return (
                      <Card key={provaId} className="shadow-card">
                        <CardHeader className="py-3 cursor-pointer" onClick={() => setExpandedProvaId(prev => (prev === provaId ? null : provaId))}>
                          <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2">
                              📝 {provaNames[provaId] || "Prova"}
                              <Badge variant="secondary" className="text-[10px]">{respostas.length} aluno(s)</Badge>
                            </span>
                            <span className="text-[10px] text-muted-foreground">{isExpanded ? "Ocultar" : "Ver"}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                          {isExpanded ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="rounded-lg border p-3">
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Média</div>
                                  <div className="text-2xl font-semibold">{stats.avg.toFixed(1)}</div>
                                  <div className="text-[10px] text-muted-foreground">(mín {stats.min.toFixed(1)} / máx {stats.max.toFixed(1)})</div>
                                </div>
                                <div className="rounded-lg border p-3">
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Mediana</div>
                                  <div className="text-2xl font-semibold">{stats.median.toFixed(1)}</div>
                                  <div className="text-[10px] text-muted-foreground">{stats.total} notas</div>
                                </div>
                                <div className="rounded-lg border p-3">
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Aprovados</div>
                                  <div className="text-2xl font-semibold">{(stats.passRate * 100).toFixed(0)}%</div>
                                  <div className="text-[10px] text-muted-foreground">{Math.round(stats.passRate * stats.total)}/{stats.total}</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="rounded-lg border p-3">
                                  <div className="text-xs font-semibold mb-2">Distribuição de notas</div>
                                  <ChartContainer config={{ scores: { label: "Notas", color: "#2563eb" } }}>
                                    <ResponsiveContainer width="100%" height={180}>
                                      <BarChart data={stats.distribution} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#2563eb" />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </ChartContainer>
                                </div>
                                <div className="rounded-lg border p-3">
                                  <div className="text-xs font-semibold mb-2">Aprovados vs Reprovados</div>
                                  <ChartContainer config={{ pass: { label: "Aprovados", color: "#16a34a" }, fail: { label: "Reprovados", color: "#dc2626" } }}>
                                    <ResponsiveContainer width="100%" height={180}>
                                      <PieChart>
                                        <Pie
                                          data={[
                                            { name: "Aprovados", value: Math.round(stats.passRate * stats.total) },
                                            { name: "Reprovados", value: stats.total - Math.round(stats.passRate * stats.total) },
                                          ]}
                                          dataKey="value"
                                          nameKey="name"
                                          innerRadius={40}
                                          outerRadius={60}
                                          paddingAngle={2}
                                        >
                                          <Cell fill="#16a34a" />
                                          <Cell fill="#dc2626" />
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={20} />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </ChartContainer>
                                </div>
                              </div>

                              <div className="rounded border overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-muted/50">
                                      <th className="text-left px-3 py-1.5 font-medium">Aluno</th>
                                      <th className="text-center px-3 py-1.5 font-medium">Nota</th>
                                      <th className="text-center px-3 py-1.5 font-medium">Tempo</th>
                                      <th className="text-right px-3 py-1.5 font-medium">Data</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {respostas.map(r => (
                                      <tr key={r.id} className="border-t hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-1.5 font-medium">{r.nome_aluno}</td>
                                        <td className="text-center px-3 py-1.5">
                                          {r.nota !== null ? (
                                            <Badge variant={r.nota >= 7 ? "default" : r.nota >= 5 ? "secondary" : "destructive"} className="text-[10px]">
                                              {r.nota.toFixed(1)}
                                            </Badge>
                                          ) : "—"}
                                        </td>
                                        <td className="text-center px-3 py-1.5 text-muted-foreground">
                                          {r.tempo_gasto ? `${Math.floor(r.tempo_gasto / 60)}min` : "—"}
                                        </td>
                                        <td className="text-right px-3 py-1.5 text-muted-foreground">
                                          {new Date(r.created_at).toLocaleDateString("pt-BR")}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          ) : (
                            <div className="rounded border p-3 text-xs text-muted-foreground">
                              Clique no cabeçalho para ver detalhes, gráficos e notas dos alunos.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="corrigir">
          <OMRScanner />
        </TabsContent>

        <TabsContent value="camera">
          <CameraScanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
