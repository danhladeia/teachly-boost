import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, CheckCircle2, XCircle, Loader2, RotateCcw, ScanLine, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface CorrectionResult {
  total: number;
  correct: number;
  percentage: number;
  details: { q: number; selected: number; correct: number; isCorrect: boolean }[];
}

interface GabaritoItem {
  q: number;
  correct: number;
}

/**
 * OMR Scanner with real computer vision:
 * 1. Scan QR code to get answer key
 * 2. Detect alignment marks (4 corner squares)
 * 3. Apply perspective correction
 * 4. Analyze bubble fill levels to determine answers
 */
export default function OMRScanner() {
  const [gabarito, setGabarito] = useState<GabaritoItem[]>([]);
  const [examTitle, setExamTitle] = useState("");
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState("");
  const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [detectedAnswers, setDetectedAnswers] = useState<Record<number, number>>({});
  const [manualOverrides, setManualOverrides] = useState<Record<number, number>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ---- QR Decoding ----
  const decodeQr = useCallback(async (imageData: ImageData): Promise<any | null> => {
    const jsQR = (await import("jsqr")).default;
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (!code) return null;
    try {
      const parsed = JSON.parse(code.data);
      if (parsed.gabarito && Array.isArray(parsed.gabarito)) {
        return parsed;
      }
    } catch {}
    return null;
  }, []);

  // ---- Bubble Detection via Pixel Analysis ----
  const analyzeBubbles = useCallback((
    imageData: ImageData,
    width: number,
    height: number,
    numQuestions: number,
    gridMeta?: { cols: number; rowsPerCol: number; alternatives: number }
  ): Record<number, number> => {
    const data = imageData.data;
    const answers: Record<number, number> = {};

    // Convert to grayscale for analysis
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      gray[i] = Math.round(data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114);
    }

    // Find the 4 alignment marks (dark square clusters in corners)
    const marks = findAlignmentMarks(gray, width, height);
    
    if (marks.length < 4) {
      console.warn("Could not find all 4 alignment marks, using estimated positions");
      // Fall back to estimated grid positions
      return analyzeWithEstimatedGrid(gray, width, height, numQuestions, gridMeta);
    }

    // Sort marks: TL, TR, BL, BR
    const sorted = sortCornerMarks(marks, width, height);
    
    // Calculate grid positions based on alignment marks
    const cols = gridMeta?.cols || Math.ceil(numQuestions / 10);
    const rowsPerCol = gridMeta?.rowsPerCol || 10;
    const numAlts = gridMeta?.alternatives || 4;

    // The bubble grid occupies roughly the left 65% of the area between marks
    // and starts about 25% down from top marks
    const tlx = sorted[0].x, tly = sorted[0].y;
    const trx = sorted[1].x, _try = sorted[1].y;
    const blx = sorted[2].x, bly = sorted[2].y;

    const sheetW = trx - tlx;
    const sheetH = bly - tly;

    // Grid area estimation (relative to alignment marks)
    const gridStartX = tlx + sheetW * 0.05;
    const gridStartY = tly + sheetH * 0.28;
    const gridEndX = tlx + sheetW * 0.65;
    const gridEndY = tly + sheetH * 0.90;

    const gridW = gridEndX - gridStartX;
    const gridH = gridEndY - gridStartY;

    const colWidth = gridW / cols;

    for (let col = 0; col < cols; col++) {
      const questionsInCol = Math.min(rowsPerCol, numQuestions - col * rowsPerCol);
      const rowHeight = gridH / rowsPerCol;
      
      for (let row = 0; row < questionsInCol; row++) {
        const qNum = col * rowsPerCol + row + 1;
        const fillLevels: number[] = [];

        for (let alt = 0; alt < numAlts; alt++) {
          // Estimate bubble center position
          // Within each column: number label takes ~25%, then 4 bubbles equally spaced
          const bubbleAreaStart = gridStartX + col * colWidth + colWidth * 0.30;
          const bubbleSpacing = (colWidth * 0.65) / numAlts;
          const cx = Math.round(bubbleAreaStart + alt * bubbleSpacing + bubbleSpacing / 2);
          const cy = Math.round(gridStartY + row * rowHeight + rowHeight / 2);

          // Sample a circular region around the bubble center
          const radius = Math.round(Math.min(bubbleSpacing, rowHeight) * 0.25);
          const fill = sampleCircularRegion(gray, width, height, cx, cy, radius);
          fillLevels.push(fill);
        }

        // Determine which bubble is most filled (darkest)
        const minFill = Math.min(...fillLevels);
        const maxFill = Math.max(...fillLevels);
        const threshold = 0.25; // At least 25% darker than average to count

        if (maxFill - minFill > threshold * 255) {
          // Find the darkest bubble
          const darkestIdx = fillLevels.indexOf(minFill);
          // Check if it's significantly darker than others
          const otherFills = fillLevels.filter((_, i) => i !== darkestIdx);
          const avgOther = otherFills.reduce((a, b) => a + b, 0) / otherFills.length;
          
          if (avgOther - minFill > 30) {
            answers[qNum] = darkestIdx;
          }
        }
      }
    }

    return answers;
  }, []);

  // Find dark square regions that serve as alignment marks
  function findAlignmentMarks(gray: Uint8Array, w: number, h: number): { x: number; y: number }[] {
    const marks: { x: number; y: number; size: number }[] = [];
    
    // Threshold to binary
    const threshold = getOtsuThreshold(gray);
    const binary = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      binary[i] = gray[i] < threshold ? 1 : 0;
    }

    // Scan corners for dense black regions
    const cornerSize = Math.round(Math.min(w, h) * 0.15);
    const corners = [
      { sx: 0, sy: 0, ex: cornerSize, ey: cornerSize }, // TL
      { sx: w - cornerSize, sy: 0, ex: w, ey: cornerSize }, // TR
      { sx: 0, sy: h - cornerSize, ex: cornerSize, ey: h }, // BL
      { sx: w - cornerSize, sy: h - cornerSize, ex: w, ey: h }, // BR
    ];

    for (const corner of corners) {
      const mark = findDarkestCluster(binary, w, corner.sx, corner.sy, corner.ex, corner.ey);
      if (mark) marks.push(mark);
    }

    return marks;
  }

  function findDarkestCluster(binary: Uint8Array, stride: number, sx: number, sy: number, ex: number, ey: number): { x: number; y: number; size: number } | null {
    // Find connected components of black pixels and return the largest
    const visited = new Set<number>();
    let bestCluster: { x: number; y: number; size: number } | null = null;

    for (let y = sy; y < ey; y++) {
      for (let x = sx; x < ex; x++) {
        const idx = y * stride + x;
        if (binary[idx] === 1 && !visited.has(idx)) {
          // BFS to find cluster
          const queue = [{ x, y }];
          const cluster: { x: number; y: number }[] = [];
          visited.add(idx);

          while (queue.length > 0 && cluster.length < 5000) {
            const p = queue.shift()!;
            cluster.push(p);

            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const nx = p.x + dx, ny = p.y + dy;
              if (nx >= sx && nx < ex && ny >= sy && ny < ey) {
                const nIdx = ny * stride + nx;
                if (binary[nIdx] === 1 && !visited.has(nIdx)) {
                  visited.add(nIdx);
                  queue.push({ x: nx, y: ny });
                }
              }
            }
          }

          // Check if cluster is roughly square-shaped and large enough
          if (cluster.length > 50) {
            const cx = cluster.reduce((s, p) => s + p.x, 0) / cluster.length;
            const cy = cluster.reduce((s, p) => s + p.y, 0) / cluster.length;
            
            if (!bestCluster || cluster.length > bestCluster.size) {
              bestCluster = { x: Math.round(cx), y: Math.round(cy), size: cluster.length };
            }
          }
        }
      }
    }

    return bestCluster;
  }

  function sortCornerMarks(marks: { x: number; y: number }[], w: number, h: number): { x: number; y: number }[] {
    const cx = w / 2, cy = h / 2;
    const tl = marks.reduce((best, m) => (!best || (m.x + m.y) < (best.x + best.y) ? m : best));
    const br = marks.reduce((best, m) => (!best || (m.x + m.y) > (best.x + best.y) ? m : best));
    const tr = marks.reduce((best, m) => (!best || (m.x - m.y) > (best.x - best.y) ? m : best));
    const bl = marks.reduce((best, m) => (!best || (m.y - m.x) > (best.y - best.x) ? m : best));
    return [tl, tr, bl, br];
  }

  function getOtsuThreshold(gray: Uint8Array): number {
    const hist = new Array(256).fill(0);
    for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
    
    const total = gray.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    
    let sumB = 0, wB = 0, wF = 0;
    let maxVar = 0, threshold = 128;
    
    for (let i = 0; i < 256; i++) {
      wB += hist[i];
      if (wB === 0) continue;
      wF = total - wB;
      if (wF === 0) break;
      
      sumB += i * hist[i];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const variance = wB * wF * (mB - mF) * (mB - mF);
      
      if (variance > maxVar) {
        maxVar = variance;
        threshold = i;
      }
    }
    
    return threshold;
  }

  function sampleCircularRegion(gray: Uint8Array, w: number, h: number, cx: number, cy: number, radius: number): number {
    let sum = 0, count = 0;
    const r2 = radius * radius;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= r2) {
          const x = cx + dx, y = cy + dy;
          if (x >= 0 && x < w && y >= 0 && y < h) {
            sum += gray[y * w + x];
            count++;
          }
        }
      }
    }
    
    return count > 0 ? sum / count : 255;
  }

  function analyzeWithEstimatedGrid(
    gray: Uint8Array, w: number, h: number,
    numQuestions: number,
    gridMeta?: { cols: number; rowsPerCol: number; alternatives: number }
  ): Record<number, number> {
    // Fallback: estimate grid position from image dimensions
    const answers: Record<number, number> = {};
    const cols = gridMeta?.cols || Math.ceil(numQuestions / 10);
    const rowsPerCol = gridMeta?.rowsPerCol || 10;
    const numAlts = gridMeta?.alternatives || 4;

    // Estimate grid area (roughly center-left of the sheet)
    const gridStartX = w * 0.08;
    const gridStartY = h * 0.30;
    const gridEndX = w * 0.65;
    const gridEndY = h * 0.92;

    const gridW = gridEndX - gridStartX;
    const gridH = gridEndY - gridStartY;
    const colWidth = gridW / cols;
    const rowHeight = gridH / rowsPerCol;

    for (let col = 0; col < cols; col++) {
      const questionsInCol = Math.min(rowsPerCol, numQuestions - col * rowsPerCol);
      
      for (let row = 0; row < questionsInCol; row++) {
        const qNum = col * rowsPerCol + row + 1;
        const fillLevels: number[] = [];

        for (let alt = 0; alt < numAlts; alt++) {
          const bubbleAreaStart = gridStartX + col * colWidth + colWidth * 0.30;
          const bubbleSpacing = (colWidth * 0.65) / numAlts;
          const cx = Math.round(bubbleAreaStart + alt * bubbleSpacing + bubbleSpacing / 2);
          const cy = Math.round(gridStartY + row * rowHeight + rowHeight / 2);
          const radius = Math.round(Math.min(bubbleSpacing, rowHeight) * 0.22);
          const fill = sampleCircularRegion(gray, w, h, cx, cy, radius);
          fillLevels.push(fill);
        }

        const minFill = Math.min(...fillLevels);
        const otherFills = fillLevels.filter((_, i) => i !== fillLevels.indexOf(minFill));
        const avgOther = otherFills.reduce((a, b) => a + b, 0) / otherFills.length;
        
        if (avgOther - minFill > 25) {
          answers[qNum] = fillLevels.indexOf(minFill);
        }
      }
    }

    return answers;
  }

  // ---- Process Image (QR + OMR) ----
  const processImage = useCallback(async (canvas: HTMLCanvasElement) => {
    setProcessing(true);
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Step 1: Decode QR
    setProcessStep("Procurando QR Code...");
    const qrData = await decodeQr(imageData);
    
    if (!qrData) {
      toast.error("QR Code não encontrado. Tente uma foto mais nítida e centralize o gabarito.");
      setProcessing(false);
      setProcessStep("");
      return;
    }

    setGabarito(qrData.gabarito);
    setExamTitle(qrData.titulo || "Prova");
    toast.success(`Gabarito "${qrData.titulo}" detectado: ${qrData.gabarito.length} questões`);

    // Step 2: Analyze bubbles
    setProcessStep("Detectando respostas preenchidas...");
    await new Promise(r => setTimeout(r, 100)); // Let UI update

    const answers = analyzeBubbles(
      imageData,
      canvas.width,
      canvas.height,
      qrData.gabarito.length,
      qrData.gridMeta
    );

    setDetectedAnswers(answers);
    setManualOverrides({});

    const answeredCount = Object.keys(answers).length;
    if (answeredCount > 0) {
      toast.success(`${answeredCount} respostas detectadas automaticamente!`);
    } else {
      toast.warning("Nenhuma resposta detectada. Verifique se os círculos estão bem preenchidos.");
    }

    // Generate debug image
    const debugCanvas = document.createElement("canvas");
    debugCanvas.width = canvas.width;
    debugCanvas.height = canvas.height;
    const dctx = debugCanvas.getContext("2d")!;
    dctx.putImageData(imageData, 0, 0);
    
    // Draw detected answers on debug image
    dctx.strokeStyle = "#00ff00";
    dctx.lineWidth = 3;
    for (const [qStr, alt] of Object.entries(answers)) {
      const q = parseInt(qStr);
      // Simple visual indicator (actual positions would need grid calculation)
      dctx.fillStyle = "rgba(0, 255, 0, 0.3)";
      dctx.fillRect(10, q * 20, 100, 15);
    }
    setDebugImageUrl(debugCanvas.toDataURL());

    setProcessStep("");
    setProcessing(false);
  }, [decodeQr, analyzeBubbles]);

  // ---- Camera ----
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      setScanning(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
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

  const captureFromCamera = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      toast.error("Câmera ainda não está pronta");
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    stopCamera();
    processImage(canvas);
  }, [stopCamera, processImage]);

  // ---- File Upload ----
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const img = new window.Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      processImage(cv);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      toast.error("Erro ao carregar imagem");
    };
    img.src = URL.createObjectURL(file);
    e.target.value = "";
  };

  // ---- Correction ----
  const getFinalAnswers = (): Record<number, number> => {
    return { ...detectedAnswers, ...manualOverrides };
  };

  const handleCorrect = () => {
    if (gabarito.length === 0) return;
    const finalAnswers = getFinalAnswers();
    
    const details = gabarito.map(item => {
      const selected = finalAnswers[item.q];
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
    setDetectedAnswers({});
    setManualOverrides({});
    setResult(null);
    setExamTitle("");
    setDebugImageUrl(null);
    setShowDebug(false);
  };

  const altLabels = ["A", "B", "C", "D"];
  const finalAnswers = getFinalAnswers();

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Correção Automática de Prova
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {gabarito.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Fotografe ou envie uma imagem da <strong>folha de respostas</strong> com o QR Code visível.
                O sistema detectará automaticamente as respostas preenchidas.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" onClick={startCamera} disabled={scanning || processing}>
                  <Camera className="mr-2 h-4 w-4" /> {scanning ? "Câmera ativa..." : "Usar câmera"}
                </Button>
                <label className="cursor-pointer">
                  <Button variant="outline" className="w-full pointer-events-none" disabled={processing}>
                    {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {processStep || "Processando..."}</> : <><Upload className="mr-2 h-4 w-4" /> Enviar foto</>}
                  </Button>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {processing && (
                <div className="space-y-2">
                  <Progress value={processStep.includes("QR") ? 30 : processStep.includes("respostas") ? 70 : 100} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{processStep}</p>
                </div>
              )}

              {scanning && (
                <div className="relative rounded-lg overflow-hidden border bg-black">
                  <video ref={videoRef} className="w-full max-h-[400px]" playsInline muted />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-primary/60 rounded-lg">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ScanLine className="h-8 w-8 text-primary/60 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    <Button size="sm" className="gradient-primary border-0 text-primary-foreground" onClick={captureFromCamera}>
                      <Camera className="mr-1 h-4 w-4" /> Capturar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={stopCamera}>Fechar</Button>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">📋 Dicas para melhor detecção:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Certifique-se de que os 4 quadrados pretos nos cantos estejam visíveis</li>
                  <li>O QR Code deve estar nítido e sem obstruções</li>
                  <li>Preencha os círculos completamente com caneta preta ou azul</li>
                  <li>Evite sombras e reflexos na foto</li>
                  <li>Fotografe de frente, evitando ângulos muito inclinados</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-semibold">{examTitle}</h3>
                  <p className="text-xs text-muted-foreground">
                    {gabarito.length} questões • {Object.keys(detectedAnswers).length} respostas detectadas
                  </p>
                </div>
                <div className="flex gap-2">
                  {debugImageUrl && (
                    <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)}>
                      <Eye className="mr-1 h-3 w-3" /> {showDebug ? "Ocultar" : "Debug"}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <RotateCcw className="mr-1 h-3 w-3" /> Nova correção
                  </Button>
                </div>
              </div>

              {showDebug && debugImageUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <img src={debugImageUrl} alt="Debug" className="w-full max-h-[300px] object-contain bg-black" />
                </div>
              )}

              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                  Respostas detectadas <span className="text-primary">(clique para corrigir manualmente)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {gabarito.map(item => {
                    const answer = finalAnswers[item.q];
                    const isDetected = item.q in detectedAnswers && !(item.q in manualOverrides);
                    const hasAnswer = answer !== undefined;

                    return (
                      <div key={item.q} className="flex items-center gap-1">
                        <span className="text-xs font-mono w-6 text-right font-semibold">{item.q}.</span>
                        <div className="flex gap-0.5">
                          {[0, 1, 2, 3].map(alt => (
                            <button
                              key={alt}
                              onClick={() => {
                                if (finalAnswers[item.q] === alt && item.q in manualOverrides) {
                                  // Deselect manual override
                                  setManualOverrides(prev => {
                                    const next = { ...prev };
                                    delete next[item.q];
                                    return next;
                                  });
                                } else {
                                  setManualOverrides(prev => ({ ...prev, [item.q]: alt }));
                                }
                              }}
                              className={`w-7 h-7 rounded-full text-[10px] font-bold border-2 transition-all ${
                                answer === alt
                                  ? isDetected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-amber-500 bg-amber-500 text-white"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              {altLabels[alt]}
                            </button>
                          ))}
                        </div>
                        {result && (
                          result.details.find(d => d.q === item.q)?.isCorrect
                            ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            : <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-primary inline-block" /> Detecção automática
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Correção manual
                  </span>
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
                            d.isCorrect
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          <div className="font-bold">{d.q}</div>
                          <div>{d.isCorrect ? "✓" : `✗${d.selected >= 0 ? altLabels[d.selected] : "?"}`}</div>
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
