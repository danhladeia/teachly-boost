import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, CameraOff, Loader2, RotateCcw, CheckCircle2, XCircle, Save, Search, SwitchCamera, AlertTriangle, Eye } from "lucide-react";
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

interface SavedProva { id: string; titulo: string; }
interface SavedVersao { id: string; versao_label: string; }

const altLabels = ["A", "B", "C", "D"];

type Step = "select-gabarito" | "camera" | "validate" | "result";

export default function CameraScanner() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>("select-gabarito");
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

  // Gabarito selector
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
    } catch {
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
    if (cameraActive) { stopCamera(); startCamera(); }
  }, [facingMode]);

  useEffect(() => () => { stopCamera(); }, []);

  const fetchGabarito = async () => {
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
      // Advance to camera step
      setStep("camera");
    } catch (err: any) {
      toast.error(err.message || "Erro ao buscar gabarito");
    } finally { setLoadingGabarito(false); }
  };

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
      setImagemUrl(result.imagem_url);
      setManualOverrides({});
      setCorrectionResult(null);

      // If QR detected a different gabarito, use it
      if (result.gabarito && result.prova_info) {
        setGabarito(result.gabarito);
        setProvaInfo(result.prova_info);
      }

      toast.success(`${(result.respostas || []).length} respostas detectadas!`);
      setStep("validate");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar");
    } finally {
      setProcessing(false);
    }
  }, [stopCamera]);

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
    setStep("result");
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
    stopCamera();
    setCapturedImage(null);
    setRespostas([]);
    setNomeAluno(null);
    setQrDetected(false);
    setGabarito(null);
    setProvaInfo(null);
    setImagemUrl(null);
    setManualOverrides({});
    setCorrectionResult(null);
    setStep("select-gabarito");
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setRespostas([]);
    setManualOverrides({});
    setCorrectionResult(null);
    setStep("camera");
  };

  const hasLowConfidence = respostas.some(r => r.confianca === "low");

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Step indicator */}
      <div className="flex items-center gap-1 text-[10px] font-medium px-1">
        {[
          { key: "select-gabarito", label: "1. Gabarito" },
          { key: "camera", label: "2. Foto" },
          { key: "validate", label: "3. Validar" },
          { key: "result", label: "4. Resultado" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            {i > 0 && <div className="w-4 h-px bg-border" />}
            <span className={`px-2 py-0.5 rounded-full ${step === s.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: Select Gabarito */}
      {step === "select-gabarito" && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Selecione a Prova
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Carregue o gabarito antes de fotografar a folha de respostas.
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
                onClick={fetchGabarito}
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

      {/* STEP 2: Camera */}
      {step === "camera" && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Fotografar Gabarito
              {provaInfo && <Badge variant="secondary" className="text-[10px] ml-auto font-normal">{provaInfo.titulo}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!processing ? (
              <>
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4] max-h-[60vh]">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/80">
                      <Camera className="h-10 w-10 text-primary" />
                      <p className="text-sm font-medium">Toque para ligar a câmera</p>
                    </div>
                  )}
                  {cameraActive && (
                    <div className="absolute inset-3 border-2 border-white/30 rounded-lg pointer-events-none">
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl" />
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br" />
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />

                <div className="flex gap-2 justify-center">
                  {!cameraActive ? (
                    <Button onClick={startCamera} size="lg" className="w-full gradient-primary border-0 text-primary-foreground">
                      <Camera className="mr-2 h-5 w-5" /> Ligar Câmera
                    </Button>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <Button onClick={captureAndProcess} size="lg" className="flex-1 gradient-primary border-0 text-primary-foreground">
                        <Camera className="mr-2 h-5 w-5" /> Capturar
                      </Button>
                      <Button variant="outline" size="icon" className="h-11 w-11" onClick={switchCamera}>
                        <SwitchCamera className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11" onClick={stopCamera}>
                        <CameraOff className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-semibold text-sm">Analisando gabarito...</p>
                  <p className="text-xs text-muted-foreground">Lendo respostas com IA</p>
                </div>
                {capturedImage && <img src={capturedImage} alt="Captura" className="max-h-40 rounded-lg border opacity-50" />}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Validate answers */}
      {step === "validate" && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Validar Leitura
              {hasLowConfidence && (
                <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600 ml-auto">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Requer atenção
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Info row */}
            <div className="flex items-start gap-3">
              {capturedImage && (
                <img src={capturedImage} alt="Captura" className="w-20 h-28 object-cover rounded-lg border shrink-0" />
              )}
              <div className="space-y-1.5 flex-1 min-w-0">
                {provaInfo && <p className="text-xs font-semibold text-primary truncate">{provaInfo.titulo}</p>}
                <div className="space-y-1">
                  <Label className="text-[10px]">Nome do aluno</Label>
                  <Input
                    value={nomeAluno || ""}
                    placeholder="Digite o nome"
                    onChange={e => setNomeAluno(e.target.value || null)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Badge variant={qrDetected ? "default" : "secondary"} className="text-[9px]">
                    {qrDetected ? "✓ QR" : "✗ QR"}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px]">
                    {respostas.filter(r => r.alternativa !== null).length}/{gabarito?.length || "?"} respostas
                  </Badge>
                </div>
              </div>
            </div>

            {/* Instruction */}
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-2">
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                <strong>Revise as respostas abaixo.</strong> Itens em <span className="text-amber-500 font-bold">amarelo</span> tiveram leitura duvidosa. Clique para corrigir antes de prosseguir.
              </p>
            </div>

            {/* Answer grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {(gabarito || respostas).map((item) => {
                const qNum = "q" in item ? item.q : item.questao;
                const detected = respostas.find(r => r.questao === qNum);
                const finalAlt = manualOverrides[qNum] ?? detected?.alternativa;
                const isManual = qNum in manualOverrides;
                const isLow = detected?.confianca === "low";
                const isNone = detected?.confianca === "none" || detected?.alternativa === null;

                return (
                  <div key={qNum} className={`flex items-center gap-1 rounded p-1 ${
                    isLow && !isManual ? "bg-amber-50 dark:bg-amber-900/10 ring-1 ring-amber-300" :
                    isNone && !isManual ? "bg-red-50 dark:bg-red-900/10 ring-1 ring-red-300" : ""
                  }`}>
                    <span className="text-xs font-mono w-5 text-right font-bold">{qNum}.</span>
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3].map(alt => (
                        <button
                          key={alt}
                          onClick={() => updateOverride(qNum, alt)}
                          className={`w-8 h-8 rounded-full text-[11px] font-bold border-2 transition-all ${
                            finalAlt === alt
                              ? isManual
                                ? "border-amber-500 bg-amber-500 text-white"
                                : isLow
                                  ? "border-amber-400 bg-amber-400 text-white"
                                  : "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          {altLabels[alt]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-[9px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Leitura OK</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Duvidosa</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Manual</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={retakePhoto} className="flex-1">
                <RotateCcw className="mr-1 h-4 w-4" /> Nova Foto
              </Button>
              <Button onClick={correctExam} className="flex-1 gradient-primary border-0 text-primary-foreground">
                <CheckCircle2 className="mr-1 h-4 w-4" /> Corrigir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Result */}
      {step === "result" && correctionResult && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center space-y-1 py-2">
              <p className="text-5xl font-bold text-primary">{correctionResult.percentage}%</p>
              <p className="text-sm text-muted-foreground">
                {correctionResult.earnedPoints} de {correctionResult.totalPoints} pontos
              </p>
              <p className="text-xs text-muted-foreground">
                ({correctionResult.correct} de {correctionResult.total} questões corretas)
              </p>
              <p className="text-2xl font-semibold">
                Nota: {correctionResult.totalPoints > 0 ? ((correctionResult.earnedPoints / correctionResult.totalPoints) * 10).toFixed(1) : "0.0"}
              </p>
              {provaInfo && <p className="text-xs text-muted-foreground">{provaInfo.titulo}</p>}
              {nomeAluno && <p className="text-sm font-medium">{nomeAluno}</p>}
            </div>

            <div className="grid grid-cols-5 gap-1">
              {correctionResult.details.map(d => (
                <div key={d.q} className={`text-center rounded p-1.5 text-[10px] font-mono ${
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

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("validate")} className="flex-1">
                <Eye className="mr-1 h-4 w-4" /> Revisar
              </Button>
              <Button onClick={saveResult} disabled={saving} className="flex-1">
                <Save className="mr-1 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
            <Button variant="ghost" onClick={resetAll} className="w-full">
              <RotateCcw className="mr-1 h-4 w-4" /> Nova Correção
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
