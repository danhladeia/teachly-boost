import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, CameraOff, Loader2, RotateCcw, CheckCircle2, XCircle, Save, Search, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DetectedAnswer {
  questao: number;
  alternativa: number | null;
  confianca: "high" | "low" | "none";
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

export default function CameraScanner() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [processing, setProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Results
  const [respostas, setRespostas] = useState<DetectedAnswer[]>([]);
  const [nomeAluno, setNomeAluno] = useState<string | null>(null);
  const [qrDetected, setQrDetected] = useState(false);
  const [gabarito, setGabarito] = useState<{ q: number; correct: number; pontos?: number }[] | null>(null);
  const [provaInfo, setProvaInfo] = useState<{ titulo: string; prova_id: string; versao_id: string | null; versao_label: string } | null>(null);
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [manualOverrides, setManualOverrides] = useState<Record<number, number>>({});
  const [correctionResult, setCorrectionResult] = useState<CorrectionResult | null>(null);

  // Manual selector
  const [provasList, setProvasList] = useState<SavedProva[]>([]);
  const [versoesList, setVersoesList] = useState<SavedVersao[]>([]);
  const [selectedProvaId, setSelectedProvaId] = useState("");
  const [selectedVersaoId, setSelectedVersaoId] = useState("");
  const [loadingGabarito, setLoadingGabarito] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("provas").select("id, titulo").order("created_at", { ascending: false }).limit(100);
      setProvasList((data as SavedProva[]) || []);
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedProvaId) { setVersoesList([]); setSelectedVersaoId(""); return; }
    (async () => {
      const { data } = await supabase.from("versoes_prova").select("id, versao_label").eq("prova_id", selectedProvaId).order("created_at");
      setVersoesList((data as SavedVersao[]) || []);
      setSelectedVersaoId("");
    })();
  }, [selectedProvaId]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  }, [stopCamera]);

  useEffect(() => {
    if (cameraActive) {
      stopCamera();
      startCamera();
    }
  }, [facingMode]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    setProcessing(true);

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("image", file);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Faça login primeiro");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/process-omr`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      const result = await resp.json();
      if (!result.success) throw new Error(result.error || "Erro no processamento");

      setRespostas(result.respostas || []);
      setNomeAluno(result.nome_aluno);
      setQrDetected(result.qr_detected);
      setGabarito(result.gabarito);
      setProvaInfo(result.prova_info);
      setImagemUrl(result.imagem_url);
      setManualOverrides({});
      setCorrectionResult(null);

      toast.success(`${(result.respostas || []).length} respostas detectadas!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar");
    } finally {
      setProcessing(false);
    }
  }, [stopCamera]);

  const fetchManualGabarito = async () => {
    if (!selectedProvaId) { toast.error("Selecione uma prova"); return; }
    setLoadingGabarito(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Faça login primeiro");
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/process-omr`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prova_id: selectedProvaId, versao_id: selectedVersaoId === "original" ? null : selectedVersaoId || null }),
      });
      const result = await resp.json();
      if (!result.success) throw new Error(result.error);
      if (!result.gabarito?.length) { toast.error("Nenhuma questão de múltipla escolha encontrada"); return; }
      setGabarito(result.gabarito);
      setProvaInfo(result.prova_info);
      setCorrectionResult(null);
      toast.success(`Gabarito carregado: ${result.gabarito.length} questões`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao buscar gabarito");
    } finally { setLoadingGabarito(false); }
  };

  const updateOverride = (questao: number, alt: number) => {
    setManualOverrides(prev => {
      const next = { ...prev };
      if (next[questao] === alt) delete next[questao];
      else next[questao] = alt;
      return next;
    });
    setCorrectionResult(null);
  };

  const getFinalAnswers = (): Record<number, number> => {
    const answers: Record<number, number> = {};
    for (const r of respostas) { if (r.alternativa !== null) answers[r.questao] = r.alternativa; }
    return { ...answers, ...manualOverrides };
  };

  const correctExam = () => {
    if (!gabarito?.length) { toast.error("Gabarito não encontrado"); return; }
    const finalAnswers = getFinalAnswers();
    const details = gabarito.map(item => ({
      q: item.q,
      selected: finalAnswers[item.q] ?? -1,
      correct: item.correct,
      isCorrect: (finalAnswers[item.q] ?? -1) === item.correct,
      pontos: item.pontos ?? 1,
    }));
    const totalPoints = details.reduce((s, d) => s + d.pontos, 0);
    const earnedPoints = details.filter(d => d.isCorrect).reduce((s, d) => s + d.pontos, 0);
    const result: CorrectionResult = {
      total: gabarito.length,
      correct: details.filter(d => d.isCorrect).length,
      percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
      totalPoints,
      earnedPoints,
      details,
    };
    setCorrectionResult(result);
    toast.success(`Correção: ${result.earnedPoints}/${result.totalPoints} pontos (${result.percentage}%)`);
  };

  const saveResult = async () => {
    if (!correctionResult || !provaInfo || !user) { toast.error("Corrija a prova antes de salvar"); return; }
    setSaving(true);
    try {
      const finalAnswers = getFinalAnswers();
      const nota = correctionResult.totalPoints > 0
        ? parseFloat(((correctionResult.earnedPoints / correctionResult.totalPoints) * 10).toFixed(1))
        : 0;
      const { error } = await supabase.from("respostas_alunos").insert({
        prova_id: provaInfo.prova_id,
        versao_id: provaInfo.versao_id || null,
        nome_aluno: nomeAluno || "Aluno não identificado",
        nota,
        respostas_json: Object.entries(finalAnswers).map(([q, a]) => ({ q: parseInt(q), a })),
        imagem_gabarito_url: imagemUrl,
      });
      if (error) throw error;
      toast.success("Resultado salvo!");
    } catch (err: any) { toast.error(err.message || "Erro ao salvar"); } finally { setSaving(false); }
  };

  const resetAll = () => {
    setCapturedImage(null);
    setRespostas([]);
    setNomeAluno(null);
    setQrDetected(false);
    setGabarito(null);
    setProvaInfo(null);
    setImagemUrl(null);
    setManualOverrides({});
    setCorrectionResult(null);
  };

  const hasResults = respostas.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Leitura Instantânea por Câmera
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera View */}
          {!hasResults && !processing && (
            <>
              <p className="text-sm text-muted-foreground">
                Aponte a câmera para a folha de respostas do aluno. A IA detecta o QR Code, lê as respostas e corrige instantaneamente.
              </p>

              <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] max-h-[400px]">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {!cameraActive && !capturedImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/80">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Câmera desligada</p>
                  </div>
                )}
                {cameraActive && (
                  <div className="absolute inset-4 border-2 border-white/30 rounded-lg pointer-events-none">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-2 justify-center">
                {!cameraActive ? (
                  <Button onClick={startCamera} className="gradient-primary border-0 text-primary-foreground">
                    <Camera className="mr-2 h-4 w-4" /> Ligar Câmera
                  </Button>
                ) : (
                  <>
                    <Button onClick={captureAndProcess} size="lg" className="gradient-primary border-0 text-primary-foreground">
                      <Camera className="mr-2 h-5 w-5" /> Capturar e Corrigir
                    </Button>
                    <Button variant="outline" size="icon" onClick={switchCamera}>
                      <SwitchCamera className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={stopCamera}>
                      <CameraOff className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Processing */}
          {processing && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-semibold">Analisando gabarito...</p>
                <p className="text-sm text-muted-foreground">Detectando QR Code e lendo respostas com IA</p>
              </div>
              {capturedImage && <img src={capturedImage} alt="Captura" className="max-h-48 rounded-lg border opacity-50" />}
            </div>
          )}

          {/* Results */}
          {hasResults && !processing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Resultado da Leitura</h3>
                <Button variant="ghost" size="sm" onClick={resetAll}><RotateCcw className="mr-1 h-3 w-3" /> Nova Leitura</Button>
              </div>

              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                {/* Left */}
                <div className="space-y-3">
                  {capturedImage && (
                    <div className="rounded-lg overflow-hidden border">
                      <img src={capturedImage} alt="Captura" className="w-full object-contain max-h-[300px] bg-muted" />
                    </div>
                  )}
                  <div className="space-y-1 text-xs">
                    {provaInfo && <p className="font-semibold text-primary">{provaInfo.titulo}</p>}
                    <div className="space-y-1">
                      <Label className="text-[10px]">Nome do aluno</Label>
                      <Input
                        value={nomeAluno || ""}
                        placeholder="Digite o nome do aluno"
                        onChange={e => setNomeAluno(e.target.value || null)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={qrDetected ? "default" : "destructive"} className="text-[9px]">
                        {qrDetected ? "✓ QR Detectado" : "✗ QR não encontrado"}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px]">
                        {respostas.filter(r => r.alternativa !== null).length} respostas
                      </Badge>
                    </div>

                    {!gabarito && (
                      <div className="mt-3 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/10 space-y-2">
                        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">⚠ Selecione a prova</p>
                        <div className="space-y-1.5">
                          <Select value={selectedProvaId} onValueChange={setSelectedProvaId}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione a prova" /></SelectTrigger>
                            <SelectContent>
                              {provasList.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.titulo}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {versoesList.length > 0 && (
                            <Select value={selectedVersaoId} onValueChange={setSelectedVersaoId}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Original" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="original" className="text-xs">Original</SelectItem>
                                {versoesList.map(v => <SelectItem key={v.id} value={v.id} className="text-xs">Versão {v.versao_label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                          <Button size="sm" className="w-full h-7 text-xs" onClick={fetchManualGabarito} disabled={!selectedProvaId || loadingGabarito}>
                            {loadingGabarito ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Search className="mr-1 h-3 w-3" />}
                            Carregar Gabarito
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Answers */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                    Respostas <span className="text-primary">(clique para corrigir)</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {(gabarito || respostas).map((item) => {
                      const qNum = "q" in item ? item.q : item.questao;
                      const detected = respostas.find(r => r.questao === qNum);
                      const finalAlt = manualOverrides[qNum] ?? detected?.alternativa;
                      const isManual = qNum in manualOverrides;
                      const isLow = detected?.confianca === "low";
                      const corrDetail = correctionResult?.details.find(d => d.q === qNum);

                      return (
                        <div key={qNum} className={`flex items-center gap-1 ${isLow && !isManual ? "bg-amber-50 dark:bg-amber-900/10 rounded p-0.5" : ""}`}>
                          <span className="text-xs font-mono w-6 text-right font-semibold">{qNum}.</span>
                          <div className="flex gap-0.5">
                            {[0, 1, 2, 3].map(alt => (
                              <button
                                key={alt}
                                onClick={() => updateOverride(qNum, alt)}
                                className={`w-7 h-7 rounded-full text-[10px] font-bold border-2 transition-all ${
                                  finalAlt === alt
                                    ? isManual ? "border-amber-500 bg-amber-500 text-white"
                                      : isLow ? "border-amber-400 bg-amber-400 text-white animate-pulse"
                                      : "border-primary bg-primary text-primary-foreground"
                                    : "border-border hover:border-muted-foreground"
                                }`}
                              >{altLabels[alt]}</button>
                            ))}
                          </div>
                          {corrDetail && (
                            corrDetail.isCorrect
                              ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                              : <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Button onClick={correctExam} size="lg" className="w-full gradient-primary border-0 text-primary-foreground" disabled={!gabarito}>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    {gabarito ? "Corrigir Prova" : "Selecione a prova para corrigir"}
                  </Button>

                  {correctionResult && (
                    <Card className="bg-muted/50 border-primary/20">
                      <CardContent className="pt-4 space-y-3">
                        <div className="text-center space-y-1">
                          <p className="text-4xl font-bold text-primary">{correctionResult.percentage}%</p>
                          <p className="text-sm text-muted-foreground">
                            {correctionResult.earnedPoints} de {correctionResult.totalPoints} pontos
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ({correctionResult.correct} de {correctionResult.total} questões corretas)
                          </p>
                          <p className="text-xl font-semibold">
                            Nota: {correctionResult.totalPoints > 0 ? ((correctionResult.earnedPoints / correctionResult.totalPoints) * 10).toFixed(1) : "0.0"}
                          </p>
                        </div>
                        <div className="border-t pt-3 grid grid-cols-5 sm:grid-cols-10 gap-1">
                          {correctionResult.details.map(d => (
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
                        <Button onClick={saveResult} disabled={saving} className="w-full" variant="outline">
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Salvando..." : "Salvar Resultado"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
