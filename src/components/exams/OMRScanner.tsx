import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, CheckCircle2, XCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CorrectionResult {
  total: number;
  correct: number;
  percentage: number;
  details: { q: number; selected: number; correct: number; isCorrect: boolean }[];
}

export default function OMRScanner() {
  const [gabarito, setGabarito] = useState<{ q: number; correct: number }[]>([]);
  const [examTitle, setExamTitle] = useState("");
  const [studentAnswers, setStudentAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ---- QR Decoding ----
  const decodeQr = useCallback(async (imageData: ImageData): Promise<boolean> => {
    const jsQR = (await import("jsqr")).default;
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (!code) return false;
    try {
      const parsed = JSON.parse(code.data);
      if (parsed.gabarito && Array.isArray(parsed.gabarito)) {
        setGabarito(parsed.gabarito);
        setExamTitle(parsed.titulo || "Prova");
        setStudentAnswers({});
        setResult(null);
        toast.success(`Gabarito "${parsed.titulo}" carregado: ${parsed.gabarito.length} questões`);
        return true;
      }
    } catch {}
    return false;
  }, []);

  // ---- Camera ----
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setScanning(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          scanLoop();
        }
      }, 300);
    } catch {
      toast.error("Não foi possível acessar a câmera");
    }
  };

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const scanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    decodeQr(imageData).then(found => {
      if (found) {
        stopCamera();
      } else if (streamRef.current) {
        animRef.current = requestAnimationFrame(scanLoop);
      }
    });
  }, [decodeQr, stopCamera]);

  // ---- File Upload ----
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    const img = new window.Image();
    img.onload = async () => {
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, cv.width, cv.height);
      const found = await decodeQr(imageData);
      if (!found) toast.error("QR Code não encontrado na imagem. Tente uma foto mais nítida.");
      setProcessing(false);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      toast.error("Erro ao carregar imagem");
      setProcessing(false);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = "";
  };

  // ---- Correction ----
  const handleCorrect = () => {
    if (gabarito.length === 0) return;
    const details = gabarito.map(item => {
      const selected = studentAnswers[item.q];
      return {
        q: item.q,
        selected: selected ?? -1,
        correct: item.correct,
        isCorrect: selected === item.correct,
      };
    });
    const correctCount = details.filter(d => d.isCorrect).length;
    setResult({
      total: gabarito.length,
      correct: correctCount,
      percentage: Math.round((correctCount / gabarito.length) * 100),
      details,
    });
    toast.success("Correção concluída!");
  };

  const reset = () => {
    setGabarito([]);
    setStudentAnswers({});
    setResult(null);
    setExamTitle("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Correção de Prova via QR Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {gabarito.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Escaneie o QR Code impresso na folha de respostas usando a câmera ou envie uma foto.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" onClick={startCamera} disabled={scanning || processing}>
                  <Camera className="mr-2 h-4 w-4" /> {scanning ? "Câmera ativa..." : "Escanear com câmera"}
                </Button>
                <label className="cursor-pointer">
                  <Button variant="outline" className="w-full pointer-events-none" disabled={processing}>
                    {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : <><Upload className="mr-2 h-4 w-4" /> Enviar foto</>}
                  </Button>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {scanning && (
                <div className="relative rounded-lg overflow-hidden border bg-black">
                  <video ref={videoRef} className="w-full max-h-[300px]" playsInline muted />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-primary/60 rounded-lg animate-pulse" />
                  </div>
                  <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={stopCamera}>Fechar</Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{examTitle}</h3>
                  <p className="text-xs text-muted-foreground">{gabarito.length} questões de múltipla escolha</p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="mr-1 h-3 w-3" /> Nova correção
                </Button>
              </div>

              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Marque as respostas do aluno:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {gabarito.map(item => (
                    <div key={item.q} className="flex items-center gap-1.5">
                      <span className="text-xs font-mono w-6 text-right font-semibold">{item.q}.</span>
                      <Select
                        value={studentAnswers[item.q]?.toString() ?? ""}
                        onValueChange={v => setStudentAnswers(prev => ({ ...prev, [item.q]: parseInt(v) }))}
                      >
                        <SelectTrigger className="h-7 text-xs w-16"><SelectValue placeholder="?" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">A</SelectItem>
                          <SelectItem value="1">B</SelectItem>
                          <SelectItem value="2">C</SelectItem>
                          <SelectItem value="3">D</SelectItem>
                        </SelectContent>
                      </Select>
                      {result && (
                        result.details.find(d => d.q === item.q)?.isCorrect
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          : <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                <Button onClick={handleCorrect} size="lg" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90">
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Corrigir Prova
                </Button>
              </div>

              {result && (
                <Card className="bg-muted/50 border-primary/20">
                  <CardContent className="pt-4 space-y-3">
                    <div className="text-center space-y-1">
                      <p className="text-4xl font-bold text-primary">{result.percentage}%</p>
                      <p className="text-sm text-muted-foreground">
                        {result.correct} de {result.total} questões corretas
                      </p>
                      <p className="text-xl font-semibold">
                        Nota: {((result.correct / result.total) * 10).toFixed(1)}
                      </p>
                    </div>
                    <div className="border-t pt-3 grid grid-cols-5 sm:grid-cols-10 gap-1">
                      {result.details.map(d => (
                        <div
                          key={d.q}
                          className={`text-center rounded p-1 text-[10px] font-mono ${
                            d.isCorrect ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          <div className="font-bold">{d.q}</div>
                          <div>{d.isCorrect ? "✓" : "✗"}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
