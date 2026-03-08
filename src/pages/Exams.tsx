import { useState, useEffect } from "react";
import { FileCheck, Sparkles, Loader2, Building2, Printer, FileDown, Save, Trash2, MoveUp, MoveDown, Plus, Image, Shuffle, List, ChevronDown, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToPdf } from "@/lib/export-utils";
import { generateVersionMap, getNextVersionLabel, type MapaQuestaoItem } from "@/lib/shuffle-utils";
import OMRAnswerSheet from "@/components/exams/OMRAnswerSheet";
import OMRScanner from "@/components/exams/OMRScanner";
import CameraScanner from "@/components/exams/CameraScanner";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";

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

  // DB persistence state
  const [currentProvaId, setCurrentProvaId] = useState<string | null>(null);
  const [savedProvas, setSavedProvas] = useState<SavedProva[]>([]);
  const [versoes, setVersoes] = useState<SavedVersao[]>([]);
  const [selectedVersaoId, setSelectedVersaoId] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [loadingProvas, setLoadingProvas] = useState(false);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("escola, nome").eq("user_id", user.id).single();
      if (data?.escola) setEscola(data.escola);
      if (data?.nome) setProfessor(data.nome);
    })();
    loadSavedProvas();
  }, [user]);

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
    if (!temas.trim()) { toast.error("Insira os temas da prova"); return; }
    if (!canUseAI) { toast.error("Limite atingido. Faça o upgrade para continuar criando."); return; }
    setLoading(true);
    try {
      const ok = await deductCredit();
      if (!ok) { toast.error("Sem créditos disponíveis."); setLoading(false); return; }
      const nA = tipoQuestoes === "multipla_escolha" ? 0 : numAbertas;
      const nF = tipoQuestoes === "aberta" ? 0 : numFechadas;
      const { data, error } = await supabase.functions.invoke("generate-prova", {
        body: { temas, nivel, serie: serie ? `${nivel} - ${serie}` : nivel, tipo: tipoQuestoes, num_abertas: nA, num_fechadas: nF, titulo },
      });
      if (error) throw error;
      if (data?.questoes) {
        const mapped: ExamQuestion[] = data.questoes.map((q: any) => ({
          id: genId(),
          type: q.type === "question-open" ? "open" : "mc",
          content: q.content || "",
          alternatives: q.alternatives || ["", "", "", ""],
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
      @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
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
          <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Provas e Correção
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Crie provas, embaralhe versões e corrija por foto com IA</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {questoes.length > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={handlePrint} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3"><Printer className="mr-1 h-3.5 w-3.5" /> <span className="hidden sm:inline">Imprimir</span><span className="sm:hidden">Imp.</span></Button>
              <Button size="sm" variant="outline" onClick={() => exportToPdf("prova-print-area", "prova")} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3"><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Button>
              <Button size="sm" variant="outline" onClick={handleShuffle} disabled={shuffling || !currentProvaId} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3">
                <Shuffle className="mr-1 h-3.5 w-3.5" /> {shuffling ? "..." : <span className="hidden sm:inline">Embaralhar</span>}{!shuffling && <span className="sm:hidden">Emb.</span>}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3"><Save className="mr-1 h-3.5 w-3.5" /> {saving ? "..." : "Salvar"}</Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={handleNewExam} className="h-7 text-[10px] sm:h-8 sm:text-xs px-2 sm:px-3"><Plus className="mr-1 h-3.5 w-3.5" /> Nova</Button>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="criar" className="text-xs flex-1 min-w-0">Criar</TabsTrigger>
          <TabsTrigger value="minhas" className="text-xs flex-1 min-w-0">Minhas</TabsTrigger>
          <TabsTrigger value="corrigir" className="text-xs flex-1 min-w-0">Corrigir</TabsTrigger>
          <TabsTrigger value="camera" className="text-xs flex-1 min-w-0"><Camera className="mr-1 h-3 w-3" /> Câmera</TabsTrigger>
        </TabsList>

        <TabsContent value="criar">
          <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
            {/* LEFT - Config */}
            <div className="space-y-4 pr-1">
              {/* AI Generation */}
              <Card className="shadow-card">
                <CardHeader className="py-3"><CardTitle className="text-sm font-semibold flex items-center gap-1"><Sparkles className="h-4 w-4" /> Gerar com IA</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Título da prova</Label>
                    <Input placeholder="Prova de Ciências" value={titulo} onChange={e => setTitulo(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Temas / Conteúdos</Label>
                    <Textarea placeholder="Ex: Sistema Solar, Frações..." value={temas} onChange={e => setTemas(e.target.value)} className="min-h-[60px] text-xs" />
                  </div>
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
                  <div className="grid grid-cols-2 gap-2">
                    {tipoQuestoes !== "multipla_escolha" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Q. Abertas</Label>
                        <Input type="number" min={0} max={30} value={numAbertas} onChange={e => setNumAbertas(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
                      </div>
                    )}
                    {tipoQuestoes !== "aberta" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Q. Múltipla Escolha</Label>
                        <Input type="number" min={0} max={30} value={numFechadas} onChange={e => setNumFechadas(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
                      </div>
                    )}
                  </div>
                  <Button onClick={handleAiGenerate} disabled={loading} size="sm" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90">
                    {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-1 h-4 w-4" /> Gerar Questões</>}
                  </Button>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card className="shadow-card">
                <CardContent className="pt-4 space-y-3">
                  <h3 className="text-xs font-semibold">Cabeçalho da Prova</h3>
                  <div className="flex items-center gap-2">
                    <Switch checked={showHeader} onCheckedChange={setShowHeader} id="exam-hdr" />
                    <Label htmlFor="exam-hdr" className="text-xs flex items-center gap-1"><Building2 className="h-3 w-3" /> Timbre da escola</Label>
                  </div>
                  {showHeader && <Input placeholder="Nome da escola" value={escola} onChange={e => setEscola(e.target.value)} className="h-8 text-xs" />}
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Professor(a)" value={professor} onChange={e => setProfessor(e.target.value)} className="h-8 text-xs" />
                    <Input placeholder="Turma" value={turma} onChange={e => setTurma(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={gerarQr} onCheckedChange={setGerarQr} id="qr-sw" />
                    <Label htmlFor="qr-sw" className="text-xs">Folha de respostas com QR Code</Label>
                  </div>
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
                    <CardTitle className="text-xs font-semibold">📝 Questões ({questoes.length})</CardTitle>
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
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                  {questoes.map((q, idx) => (
                    <div key={q.id} className="rounded-lg border p-2.5 space-y-2 bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">
                          {idx + 1}. {q.type === "mc" ? "Múltipla Escolha" : "Aberta"}
                        </span>
                        <div className="flex items-center gap-1">
                          <Label className="text-[9px] text-muted-foreground">Pts:</Label>
                          <Input type="number" min={0.1} step={0.5} value={q.pontos} onChange={e => updateQuestion(q.id, { pontos: parseFloat(e.target.value) || 1 })} className="h-5 w-12 text-[10px] text-center p-0" />
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
                          <Input type="number" min={1} max={20} value={q.lines} onChange={e => updateQuestion(q.id, { lines: parseInt(e.target.value) || 4 })} className="h-6 w-14 text-[11px]" />
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
            <div>
              <div className="bg-muted/30 rounded-lg p-2 sm:p-4 flex justify-center">
                <div
                  id="prova-print-area"
                  className="bg-white text-black shadow-lg w-full max-w-[210mm]"
                  style={{ minHeight: "297mm", padding: "15mm", fontFamily: "'Inter', 'Arial', sans-serif", fontSize: "11pt", lineHeight: 1.6 }}
                >
                  {/* School header */}
                  {showHeader && escola && (
                    <div style={{ textAlign: "center", fontWeight: 700, fontSize: "14pt", marginBottom: "4mm", fontFamily: "'Montserrat', sans-serif", borderBottom: "2px solid #2563eb", paddingBottom: "3mm" }}>
                      {escola}
                    </div>
                  )}
                  <h1 style={{ textAlign: "center", fontSize: "14pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginBottom: "4mm" }}>
                    {titulo || "Prova"}{selectedVersao ? ` — Versão ${selectedVersao.versao_label}` : ""}
                  </h1>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", marginBottom: "2mm", color: "#475569" }}>
                    {professor && <span><strong>Professor(a):</strong> {professor}</span>}
                    {turma && <span><strong>Turma:</strong> {turma}</span>}
                  </div>
                  <div style={{ display: "flex", gap: "10mm", fontSize: "10pt", marginBottom: "6mm", borderBottom: "1px solid #e2e8f0", paddingBottom: "4mm" }}>
                    <span>Nome: ________________________________________</span>
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
                {savedProvas.map(p => (
                  <Card key={p.id} className="shadow-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => { loadProva(p.id); setMainTab("criar"); }}>
                    <CardContent className="pt-4 space-y-1">
                      <h3 className="font-semibold text-sm">{p.titulo}</h3>
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
                ))}
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
