import { useState, useCallback, useEffect } from "react";
import { Upload, CheckCircle2, XCircle, Loader2, RotateCcw, ImagePlus, Trash2, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import OMRResultView from "./OMRResultView";

interface DetectedAnswer {
  questao: number;
  alternativa: number | null;
  confianca: "high" | "low" | "none";
}

interface ProcessedSheet {
  file: File;
  previewUrl: string;
  respostas: DetectedAnswer[];
  nome_aluno: string | null;
  qr_detected: boolean;
  gabarito: { q: number; correct: number }[] | null;
  prova_info: { titulo: string; prova_id: string; versao_id: string | null; versao_label: string } | null;
  imagem_url: string | null;
  manualOverrides: Record<number, number>;
  correctionResult: CorrectionResult | null;
  status: "pending" | "processing" | "done" | "error";
  errorMsg?: string;
}

interface CorrectionResult {
  total: number;
  correct: number;
  percentage: number;
  totalPoints: number;
  earnedPoints: number;
  details: { q: number; selected: number; correct: number; isCorrect: boolean; pontos: number }[];
}

interface SavedProva {
  id: string;
  titulo: string;
}

interface SavedVersao {
  id: string;
  versao_label: string;
}

const altLabels = ["A", "B", "C", "D"];

export default function OMRScanner() {
  const { user } = useAuth();
  const { canCorrectExam, deductExamCredits } = useCredits();
  const [step, setStep] = useState<"select-gabarito" | "upload" | "results">("select-gabarito");
  const [sheets, setSheets] = useState<ProcessedSheet[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preloaded gabarito (loaded before upload)
  const [preloadedGabarito, setPreloadedGabarito] = useState<{ q: number; correct: number }[] | null>(null);
  const [preloadedProvaInfo, setPreloadedProvaInfo] = useState<{ titulo: string; prova_id: string; versao_id: string | null; versao_label: string } | null>(null);

  // Manual prova/versao selector state
  const [provasList, setProvasList] = useState<SavedProva[]>([]);
  const [versoesList, setVersoesList] = useState<SavedVersao[]>([]);
  const [selectedProvaId, setSelectedProvaId] = useState<string>("");
  const [selectedVersaoId, setSelectedVersaoId] = useState<string>("");
  const [loadingGabarito, setLoadingGabarito] = useState(false);

  // Safety guard: never allow upload/results without a preloaded gabarito
  useEffect(() => {
    if (step !== "select-gabarito" && (!preloadedGabarito || preloadedGabarito.length === 0)) {
      setStep("select-gabarito");
    }
  }, [step, preloadedGabarito]);

  // Load user's provas on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("provas")
        .select("id, titulo")
        .order("created_at", { ascending: false })
        .limit(100);
      setProvasList((data as SavedProva[]) || []);
    })();
  }, [user]);

  // Load versions when prova selected
  useEffect(() => {
    if (!selectedProvaId) { setVersoesList([]); setSelectedVersaoId(""); return; }
    (async () => {
      const { data } = await supabase
        .from("versoes_prova")
        .select("id, versao_label")
        .eq("prova_id", selectedProvaId)
        .order("created_at");
      setVersoesList((data as SavedVersao[]) || []);
      setSelectedVersaoId("");
    })();
  }, [selectedProvaId]);

  const fetchGabaritoAndAdvance = async () => {
    if (!selectedProvaId) { toast.error("Selecione uma prova"); return; }
    setLoadingGabarito(true);
    try {
      // Busca gabarito diretamente do banco (sem passar pela edge function de OCR)
      const { data: prova, error: provaErr } = await supabase
        .from("provas")
        .select("id, titulo")
        .eq("id", selectedProvaId)
        .single();

      if (provaErr || !prova) throw new Error("Prova não encontrada");

      let gabarito: { q: number; correct: number; pontos: number }[] = [];
      let provaInfo: { titulo: string; prova_id: string; versao_id: string | null; versao_label: string };

      if (selectedVersaoId && selectedVersaoId !== "original") {
        // Busca gabarito da versão embaralhada
        const [{ data: versao }, { data: questoes }] = await Promise.all([
          supabase.from("versoes_prova").select("*").eq("id", selectedVersaoId).eq("prova_id", selectedProvaId).single(),
          supabase.from("questoes").select("id, pontos").eq("prova_id", selectedProvaId).order("ordem"),
        ]);

        if (!versao) throw new Error("Versão não encontrada");

        const pontosMap: Record<string, number> = {};
        (questoes || []).forEach((q: any) => { pontosMap[q.id] = q.pontos ?? 1; });

        const mapa = versao.mapa_questoes as any[];
        const mcItems = mapa
          .filter((item: any) => item.resposta_correta_nova !== null && item.resposta_correta_nova !== undefined)
          .sort((a: any, b: any) => a.nova_ordem - b.nova_ordem);

        gabarito = mcItems.map((item: any, idx: number) => ({
          q: idx + 1,
          correct: item.resposta_correta_nova,
          pontos: pontosMap[item.questao_id] ?? 1,
        }));

        provaInfo = {
          titulo: `${prova.titulo} — Versão ${versao.versao_label}`,
          prova_id: prova.id,
          versao_id: versao.id,
          versao_label: versao.versao_label,
        };
      } else {
        // Busca gabarito original (questões na ordem original)
        const { data: questoes, error: qErr } = await supabase
          .from("questoes")
          .select("ordem, tipo, resposta_correta, pontos")
          .eq("prova_id", selectedProvaId)
          .order("ordem");

        if (qErr) throw new Error("Erro ao buscar questões");

        const mcQuestoes = (questoes || []).filter((q: any) => q.tipo === "mc" && q.resposta_correta !== null);
        gabarito = mcQuestoes.map((q: any, idx: number) => ({
          q: idx + 1,
          correct: q.resposta_correta,
          pontos: q.pontos ?? 1,
        }));

        provaInfo = {
          titulo: prova.titulo,
          prova_id: prova.id,
          versao_id: null,
          versao_label: "Original",
        };
      }

      if (gabarito.length === 0) {
        toast.error("Nenhuma questão de múltipla escolha encontrada nesta prova");
        return;
      }

      setPreloadedGabarito(gabarito);
      setPreloadedProvaInfo(provaInfo);
      toast.success(`Gabarito carregado: ${gabarito.length} questões`);
      setStep("upload");
    } catch (err: any) {
      toast.error(err.message || "Erro ao buscar gabarito");
    } finally {
      setLoadingGabarito(false);
    }
  };

  // Legacy: apply preloaded gabarito to a sheet that didn't get one from QR
  const applyPreloadedGabarito = (sheet: ProcessedSheet): ProcessedSheet => {
    if (sheet.gabarito && sheet.gabarito.length > 0) return sheet; // QR detected its own
    if (!preloadedGabarito) return sheet;
    return { ...sheet, gabarito: preloadedGabarito, prova_info: preloadedProvaInfo };
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    if (!preloadedGabarito || preloadedGabarito.length === 0) {
      toast.error("Carregue o gabarito antes de enviar as fotos");
      setStep("select-gabarito");
      return;
    }

    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) { toast.error("Selecione imagens JPG ou PNG"); return; }

    const newSheets: ProcessedSheet[] = imageFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      respostas: [],
      nome_aluno: null,
      qr_detected: false,
      gabarito: null,
      prova_info: null,
      imagem_url: null,
      manualOverrides: {},
      correctionResult: null,
      status: "pending",
    }));

    setSheets(prev => [...prev, ...newSheets]);
    toast.success(`${imageFiles.length} imagem(ns) adicionada(s)`);
  }, [preloadedGabarito]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
    e.target.value = "";
  }, [addFiles]);

  const removeSheet = (idx: number) => {
    setSheets(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
    if (currentIdx >= sheets.length - 1 && currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const processAllSheets = async () => {
    if (!preloadedGabarito || preloadedGabarito.length === 0) {
      toast.error("Carregue o gabarito antes de processar as fotos");
      setStep("select-gabarito");
      return;
    }
    if (sheets.length === 0) return;
    setProcessing(true);
    setProgress(0);

    for (let i = 0; i < sheets.length; i++) {
      if (sheets[i].status === "done") { setProgress(((i + 1) / sheets.length) * 100); continue; }

      setCurrentIdx(i);
      setSheets(prev => prev.map((s, idx) => idx === i ? { ...s, status: "processing" } : s));

      try {
        const formData = new FormData();
        formData.append("image", sheets[i].file);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Faça login primeiro");

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const resp = await fetch(
          `https://${projectId}.supabase.co/functions/v1/process-omr`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: formData,
          }
        );

        const result = await resp.json();
        if (!result.success) throw new Error(result.error || "Erro no processamento");

        const processed: ProcessedSheet = {
          ...sheets[i],
          status: "done" as const,
          respostas: result.respostas || [],
          nome_aluno: result.nome_aluno,
          qr_detected: result.qr_detected,
          gabarito: result.gabarito,
          prova_info: result.prova_info,
          imagem_url: result.imagem_url,
        };
        // Apply preloaded gabarito if QR didn't detect one
        const withGabarito = applyPreloadedGabarito(processed);
        setSheets(prev => prev.map((s, idx) => idx === i ? withGabarito : s));
      } catch (err: any) {
        setSheets(prev => prev.map((s, idx) => idx === i ? { ...s, status: "error", errorMsg: err.message } : s));
      }

      setProgress(((i + 1) / sheets.length) * 100);
    }

    setProcessing(false);
    setStep("results");
    toast.success("Processamento concluído!");
  };

  const updateManualOverride = (sheetIdx: number, questao: number, alt: number) => {
    setSheets(prev => prev.map((s, idx) => {
      if (idx !== sheetIdx) return s;
      const currentAnswer = { ...s.manualOverrides };
      if (currentAnswer[questao] === alt) {
        delete currentAnswer[questao];
      } else {
        currentAnswer[questao] = alt;
      }
      return { ...s, manualOverrides: currentAnswer, correctionResult: null };
    }));
  };

  const getFinalAnswers = (sheet: ProcessedSheet): Record<number, number> => {
    const answers: Record<number, number> = {};
    for (const r of sheet.respostas) {
      if (r.alternativa !== null) answers[r.questao] = r.alternativa;
    }
    return { ...answers, ...sheet.manualOverrides };
  };

  const correctSheet = (sheetIdx: number) => {
    const sheet = sheets[sheetIdx];
    if (!sheet.gabarito || sheet.gabarito.length === 0) {
      toast.error("Gabarito não encontrado. Selecione uma prova manualmente abaixo.");
      return;
    }

    const finalAnswers = getFinalAnswers(sheet);
    const details = sheet.gabarito.map(item => ({
      q: item.q,
      selected: finalAnswers[item.q] ?? -1,
      correct: item.correct,
      isCorrect: (finalAnswers[item.q] ?? -1) === item.correct,
      pontos: (item as any).pontos ?? 1,
    }));
    const correctCount = details.filter(d => d.isCorrect).length;
    const totalPoints = details.reduce((s, d) => s + d.pontos, 0);
    const earnedPoints = details.filter(d => d.isCorrect).reduce((s, d) => s + d.pontos, 0);
    const result: CorrectionResult = {
      total: sheet.gabarito.length,
      correct: correctCount,
      percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
      totalPoints,
      earnedPoints,
      details,
    };

    setSheets(prev => prev.map((s, idx) => idx === sheetIdx ? { ...s, correctionResult: result } : s));
    toast.success(`Correção: ${result.earnedPoints}/${result.totalPoints} pontos (${result.percentage}%)`);
  };

  const saveResult = async (sheetIdx: number) => {
    const sheet = sheets[sheetIdx];
    if (!sheet.correctionResult || !sheet.prova_info || !user) {
      toast.error("Corrija a prova antes de salvar");
      return;
    }

    setSaving(true);
    try {
      const finalAnswers = getFinalAnswers(sheet);
      const { error } = await supabase.from("respostas_alunos").insert({
        prova_id: sheet.prova_info.prova_id,
        versao_id: sheet.prova_info.versao_id || null,
        nome_aluno: sheet.nome_aluno || "Aluno não identificado",
        nota: parseFloat(((sheet.correctionResult.earnedPoints / sheet.correctionResult.totalPoints) * 10).toFixed(1)),
        respostas_json: Object.entries(finalAnswers).map(([q, a]) => ({ q: parseInt(q), a })),
        imagem_gabarito_url: sheet.imagem_url,
      });

      if (error) throw error;
      toast.success("Resultado salvo com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    sheets.forEach(s => URL.revokeObjectURL(s.previewUrl));
    setSheets([]);
    setCurrentIdx(0);
    setProgress(0);
    setPreloadedGabarito(null);
    setPreloadedProvaInfo(null);
    setSelectedProvaId("");
    setSelectedVersaoId("");
    setStep("select-gabarito");
  };

  const current = sheets[currentIdx];
  const hasLowConfidence = current?.respostas.some(r => r.confianca === "low") ?? false;

  return (
    <div className="max-w-5xl mx-auto space-y-4 overflow-x-hidden">
      {/* Step indicator */}
      <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-medium">
        {[
          { key: "select-gabarito", label: "Gabarito" },
          { key: "upload", label: "Fotos" },
          { key: "results", label: "Resultados" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-0.5 sm:gap-1 flex-1 justify-center">
            {i > 0 && <div className="w-3 sm:w-6 h-px bg-border shrink-0" />}
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${step === s.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i + 1}. {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: Select Gabarito */}
      {step === "select-gabarito" && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Selecione a Prova
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Carregue o gabarito antes de enviar as fotos dos alunos.
            </p>
            <div className="space-y-2">
              <Select value={selectedProvaId} onValueChange={setSelectedProvaId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione a prova..." />
                </SelectTrigger>
                <SelectContent>
                  {provasList.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {versoesList.length > 0 && (
                <Select value={selectedVersaoId} onValueChange={setSelectedVersaoId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Original (sem embaralhamento)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original</SelectItem>
                    {versoesList.map(v => (
                      <SelectItem key={v.id} value={v.id}>Versão {v.versao_label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={fetchGabaritoAndAdvance}
                disabled={!selectedProvaId || loadingGabarito}
                className="w-full gradient-primary border-0 text-primary-foreground"
              >
                {loadingGabarito ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Carregar Gabarito
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Upload Photos */}
      {step === "upload" && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm sm:text-base flex items-center gap-2">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Enviar Fotos
              {preloadedProvaInfo && (
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] ml-auto font-normal truncate max-w-[180px]">
                  {preloadedProvaInfo.titulo}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Gabarito carregado com <strong>{preloadedGabarito?.length || 0} questões</strong>. Agora envie as fotos das folhas de respostas.
            </p>

            {/* Upload area */}
            {sheets.every(s => s.status === "pending" || sheets.length === 0) && !processing && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <ImagePlus className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Arraste fotos aqui ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG ou PNG • Múltiplas imagens permitidas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Thumbnails & Process Button */}
            {sheets.length > 0 && !processing && sheets.some(s => s.status === "pending") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{sheets.length} gabarito(s) para processar</h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { sheets.forEach(s => URL.revokeObjectURL(s.previewUrl)); setSheets([]); }}><Trash2 className="mr-1 h-3 w-3" /> Limpar</Button>
                    <Button size="sm" onClick={processAllSheets} className="gradient-primary border-0 text-primary-foreground">
                      <Upload className="mr-1 h-4 w-4" /> Processar Todos
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {sheets.map((s, i) => (
                    <div key={i} className="relative group">
                      <img src={s.previewUrl} alt={`Gabarito ${i + 1}`} className="h-20 w-16 object-cover rounded-lg border" />
                      <button
                        onClick={() => removeSheet(i)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Processing Progress */}
          {processing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Processando gabarito {currentIdx + 1} de {sheets.length}...</p>
                  <p className="text-xs text-muted-foreground">Analisando com IA de visão computacional</p>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex gap-2 flex-wrap">
                {sheets.map((s, i) => (
                  <div key={i} className="relative">
                    <img src={s.previewUrl} alt="" className={`h-16 w-12 object-cover rounded border-2 transition-all ${
                      s.status === "processing" ? "border-primary animate-pulse" :
                      s.status === "done" ? "border-green-500" :
                      s.status === "error" ? "border-destructive" : "border-border opacity-50"
                    }`} />
                    {s.status === "done" && <CheckCircle2 className="absolute -bottom-1 -right-1 h-4 w-4 text-green-500 bg-background rounded-full" />}
                    {s.status === "error" && <XCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-destructive bg-background rounded-full" />}
                  </div>
                ))}
              </div>
            </div>
          )}

            {/* Tips */}
            {sheets.length === 0 && !processing && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">📋 Dicas para melhor detecção:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Fotografe a folha inteira com boa iluminação</li>
                  <li>Preencha os círculos completamente com caneta preta ou azul</li>
                  <li>Evite sombras, dobras e reflexos na foto</li>
                  <li>Você pode enviar múltiplas fotos de uma vez</li>
                </ul>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={reset} className="w-full">
              ← Voltar para seleção de prova
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Results */}
      {step === "results" && !processing && sheets.some(s => s.status === "done" || s.status === "error") && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Resultados
              {preloadedProvaInfo && (
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] ml-auto font-normal truncate max-w-[180px]">
                  {preloadedProvaInfo.titulo}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="mr-1 h-3 w-3" /> Nova Correção</Button>
              </div>
            </div>

            {/* Sheet selector */}
            {sheets.length > 1 && (
              <div className="flex gap-1 flex-wrap">
                {sheets.map((s, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={currentIdx === i ? "default" : "outline"}
                    onClick={() => setCurrentIdx(i)}
                    className="text-xs h-7"
                  >
                    Gabarito {i + 1}
                    {s.status === "done" && s.correctionResult && (
                      <Badge variant="secondary" className="ml-1 text-[9px]">{s.correctionResult.percentage}%</Badge>
                    )}
                    {s.status === "error" && <XCircle className="ml-1 h-3 w-3 text-destructive" />}
                  </Button>
                ))}
              </div>
            )}

            {/* Current sheet detail */}
            {current && current.status === "error" && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
                <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm font-medium">Erro ao processar</p>
                <p className="text-xs text-muted-foreground">{current.errorMsg}</p>
              </div>
            )}

            {current && current.status === "done" && (
              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                {/* Left: Original image */}
                <div className="space-y-3 min-w-0">
                  <div className="rounded-lg overflow-hidden border">
                    <img src={current.previewUrl} alt="Gabarito original" className="w-full object-contain max-h-[300px] sm:max-h-[500px] bg-muted" />
                  </div>
                  <div className="space-y-1 text-xs">
                    {current.prova_info && (
                      <p className="font-semibold text-primary">{current.prova_info.titulo}</p>
                    )}
                    {current.nome_aluno && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Nome do aluno (detectado)</Label>
                        <Input
                          value={current.nome_aluno}
                          onChange={e => setSheets(prev => prev.map((s, i) => i === currentIdx ? { ...s, nome_aluno: e.target.value } : s))}
                          className="h-7 text-xs"
                        />
                      </div>
                    )}
                    {!current.nome_aluno && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Nome do aluno</Label>
                        <Input
                          placeholder="Digite o nome do aluno"
                          onChange={e => setSheets(prev => prev.map((s, i) => i === currentIdx ? { ...s, nome_aluno: e.target.value || null } : s))}
                          className="h-7 text-xs"
                        />
                      </div>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant={current.qr_detected ? "default" : "destructive"} className="text-[9px]">
                        {current.qr_detected ? "✓ QR Detectado" : "✗ QR não encontrado"}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px]">
                        {current.respostas.filter(r => r.alternativa !== null).length} respostas
                      </Badge>
                      {hasLowConfidence && (
                        <Badge variant="outline" className="text-[9px] border-amber-500 text-amber-600">
                          ⚠ Requer validação
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: OMR Results in column format */}
                <div className="space-y-4 min-w-0">
                  <OMRResultView
                    gabarito={current.gabarito || []}
                    respostas={current.respostas}
                    manualOverrides={current.manualOverrides}
                    correctionDetails={current.correctionResult?.details}
                    onOverrideUpdate={(questao, alt) => updateManualOverride(currentIdx, questao, alt)}
                    showCorrection={!!current.correctionResult}
                  />

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      onClick={() => correctSheet(currentIdx)}
                      size="lg"
                      className="flex-1 gradient-primary border-0 text-primary-foreground hover:opacity-90"
                      disabled={!current.gabarito}
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Corrigir Prova
                    </Button>
                  </div>

                  {/* Correction Result */}
                  {current.correctionResult && (
                    <Card className="bg-muted/50 border-primary/20">
                      <CardContent className="pt-4 space-y-3">
                        <div className="text-center space-y-1">
                          <p className="text-4xl font-bold text-primary">{current.correctionResult.percentage}%</p>
                          <p className="text-sm text-muted-foreground">
                            {current.correctionResult.earnedPoints} de {current.correctionResult.totalPoints} pontos
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ({current.correctionResult.correct} de {current.correctionResult.total} questões corretas)
                          </p>
                          <p className="text-xl font-semibold">
                            Nota: {current.correctionResult.totalPoints > 0 ? ((current.correctionResult.earnedPoints / current.correctionResult.totalPoints) * 10).toFixed(1) : "0.0"}
                          </p>
                        </div>
                        <div className="border-t pt-3 grid grid-cols-5 sm:grid-cols-10 gap-1">
                          {current.correctionResult.details.map(d => (
                            <div key={d.q} className={`text-center rounded p-1 text-[10px] font-mono ${
                              d.isCorrect
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}>
                              <div className="font-bold">{d.q}</div>
                              <div>{d.isCorrect ? "✓" : `✗${d.selected >= 0 ? altLabels[d.selected] : "?"}`}</div>
                              {d.pontos !== 1 && <div className="text-[8px]">{d.pontos}pt</div>}
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => saveResult(currentIdx)}
                          disabled={saving}
                          className="w-full"
                          variant="outline"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Salvando..." : "Salvar Resultado no Banco"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
