import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Loader2, Download, RefreshCw, Image, Code, FileText, Presentation } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, ImageRun, AlignmentType } from "docx";
import EditorTopBar from "@/components/EditorTopBar";
import TimbreSelector from "@/components/TimbreSelector";
import type { TimbreData } from "@/hooks/useTimbre";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "'Inter', 'Arial', sans-serif",
});

const tipos = [
  { value: "fluxograma", label: "Fluxograma" },
  { value: "ciclo", label: "Ciclo" },
  { value: "organograma", label: "Organograma" },
  { value: "mapa-mental", label: "Mapa Mental" },
  { value: "venn", label: "Diagrama de Venn" },
];

const estilos = [
  { value: "clean", label: "Clean (Padrão)" },
  { value: "academico", label: "Acadêmico" },
  { value: "colorido", label: "Colorido" },
  { value: "pb", label: "P&B (para colorir)" },
];

type Orientation = "portrait" | "landscape";

// A4 dimensions in pixels at 96 DPI (minus 10mm margins = ~38px each side)
const A4_PORTRAIT = { width: 595 - 76, height: 842 - 76 }; // ~519 x 766
const A4_LANDSCAPE = { width: 842 - 76, height: 595 - 76 }; // ~766 x 519

/** Convert SVG element to PNG blob, scaled to fit A4 */
async function svgToPngBlob(
  svgEl: SVGSVGElement,
  scale = 2,
  fitToA4?: { isLandscape: boolean }
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const bbox = svgEl.getBoundingClientRect();
    let targetW = bbox.width;
    let targetH = bbox.height;

    // Scale down to fit A4 if requested
    if (fitToA4) {
      const maxDims = fitToA4.isLandscape ? A4_LANDSCAPE : A4_PORTRAIT;
      const scaleX = maxDims.width / bbox.width;
      const scaleY = maxDims.height / bbox.height;
      const fitScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      targetW = bbox.width * fitScale;
      targetH = bbox.height * fitScale;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetW * scale;
    canvas.height = targetH * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, targetW, targetH);
    
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, targetW, targetH);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => resolve(b), "image/png");
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export default function DiagramGenerator() {
  const { canUseAI, deductCredit } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [tipo, setTipo] = useState("fluxograma");
  const [estilo, setEstilo] = useState("clean");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [mermaidCode, setMermaidCode] = useState("");
  const [svgOutput, setSvgOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ajuste, setAjuste] = useState("");
  const [ajusteLoading, setAjusteLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [selectedTimbre, setSelectedTimbre] = useState<TimbreData | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const renderMermaid = useCallback(async (code: string) => {
    if (!code.trim()) { setSvgOutput(""); return; }
    try {
      // Remove any stray markdown fences that might have slipped through
      const cleanCode = code
        .replace(/^```(?:mermaid)?\s*/im, "")
        .replace(/\s*```\s*$/im, "")
        .replace(/^mermaid\s*/i, "")
        .trim();
      const id = "mermaid-" + Date.now();
      const { svg } = await mermaid.render(id, cleanCode);
      // Force SVG to fill available width
      const scaledSvg = svg
        .replace(/width="[^"]*"/, 'width="100%"')
        .replace(/style="[^"]*max-width:[^;"]*;?/g, (m) => m.replace(/max-width:[^;"]*/g, "max-width:100%"));
      setSvgOutput(scaledSvg);
    } catch (err) {
      console.error("Mermaid render error:", err);
      toast.error("Erro de sintaxe no diagrama. Tente gerar novamente ou ajuste o código.");
      setSvgOutput(`<div style="color:#b91c1c;padding:16px;background:#fef2f2;border-radius:8px;font-size:13px;">
        <strong>Erro de sintaxe Mermaid.</strong><br/>
        Use o campo "Pedir Ajuste à IA" abaixo e escreva: <em>"corrija a sintaxe do diagrama"</em>
      </div>`);
    }
  }, []);

  useEffect(() => {
    if (mermaidCode) renderMermaid(mermaidCode);
  }, [mermaidCode, renderMermaid]);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Descreva o diagrama"); return; }
    if (!canUseAI) { toast.error("Sem créditos disponíveis"); return; }
    setLoading(true);
    try {
      const ok = await deductCredit();
      if (!ok) { toast.error("Erro ao deduzir crédito"); return; }
      const { data, error } = await supabase.functions.invoke("generate-diagram", {
        body: { prompt, tipo, estilo },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMermaidCode(data.mermaidCode || "");
      toast.success("Diagrama gerado!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao gerar diagrama");
    } finally {
      setLoading(false);
    }
  };

  const handleAjuste = async () => {
    if (!ajuste.trim()) { toast.error("Descreva o ajuste"); return; }
    if (!canUseAI) { toast.error("Sem créditos disponíveis"); return; }
    setAjusteLoading(true);
    try {
      const ok = await deductCredit();
      if (!ok) { toast.error("Erro ao deduzir crédito"); return; }
      const { data, error } = await supabase.functions.invoke("generate-diagram", {
        body: { codigoAtual: mermaidCode, ajuste },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMermaidCode(data.mermaidCode || "");
      setAjuste("");
      toast.success("Ajuste aplicado!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao ajustar diagrama");
    } finally {
      setAjusteLoading(false);
    }
  };

  // ── Export: PNG (fit to A4) ──
  const handleDownloadPng = async () => {
    const svgEl = diagramRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) return;
    const isLandscape = orientation === "landscape";
    const blob = await svgToPngBlob(svgEl, 2, { isLandscape });
    if (!blob) { toast.error("Erro ao exportar PNG"); return; }
    saveAs(blob, "diagrama.png");
  };

  // ── Export: PDF (A4 portrait or landscape, diagram scaled to fit) ──
  const handleExportPdf = async () => {
    const svgEl = diagramRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) { toast.error("Gere um diagrama primeiro"); return; }
    
    const isLandscape = orientation === "landscape";
    // Get PNG blob scaled to fit A4
    const pngBlob = await svgToPngBlob(svgEl, 3, { isLandscape });
    if (!pngBlob) { toast.error("Erro ao gerar imagem"); return; }
    
    // Create a temporary container with proper A4 layout
    const tempDiv = document.createElement("div");
    tempDiv.style.width = isLandscape ? "267mm" : "180mm";
    tempDiv.style.padding = "0";
    tempDiv.style.background = "#fff";
    tempDiv.style.fontFamily = "'Inter', 'Arial', sans-serif";
    
    // Add branding if present
    if (bannerUrl || logoUrl || escolaFinal) {
      const headerDiv = document.createElement("div");
      headerDiv.style.marginBottom = "12px";
      headerDiv.style.paddingBottom = "8px";
      headerDiv.style.borderBottom = "1px solid #e5e7eb";
      
      if (bannerUrl) {
        const bannerImg = document.createElement("img");
        bannerImg.src = bannerUrl;
        bannerImg.style.width = "100%";
        bannerImg.style.maxHeight = "80px";
        bannerImg.style.objectFit = "contain";
        bannerImg.crossOrigin = "anonymous";
        headerDiv.appendChild(bannerImg);
      } else {
        headerDiv.style.display = "flex";
        headerDiv.style.alignItems = "center";
        headerDiv.style.gap = "12px";
        if (logoUrl) {
          const logoImg = document.createElement("img");
          logoImg.src = logoUrl;
          logoImg.style.height = "36px";
          logoImg.style.width = "36px";
          logoImg.style.objectFit = "contain";
          logoImg.crossOrigin = "anonymous";
          headerDiv.appendChild(logoImg);
        }
        if (escolaFinal) {
          const escolaSpan = document.createElement("span");
          escolaSpan.textContent = escolaFinal;
          escolaSpan.style.fontWeight = "600";
          escolaSpan.style.fontSize = "13px";
          headerDiv.appendChild(escolaSpan);
        }
      }
      tempDiv.appendChild(headerDiv);
    }
    
    // Add diagram image centered and scaled
    const imgContainer = document.createElement("div");
    imgContainer.style.display = "flex";
    imgContainer.style.justifyContent = "center";
    imgContainer.style.alignItems = "center";
    
    const diagramImg = document.createElement("img");
    diagramImg.src = URL.createObjectURL(pngBlob);
    diagramImg.style.maxWidth = "100%";
    diagramImg.style.maxHeight = isLandscape ? "160mm" : "230mm";
    diagramImg.style.objectFit = "contain";
    imgContainer.appendChild(diagramImg);
    tempDiv.appendChild(imgContainer);
    
    document.body.appendChild(tempDiv);
    
    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: "diagrama.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: isLandscape ? "landscape" : "portrait" },
    }).from(tempDiv).save();
    
    document.body.removeChild(tempDiv);
    URL.revokeObjectURL(diagramImg.src);
  };

  // ── Export: DOCX (scaled to fit A4) ──
  const handleExportDocx = async () => {
    const svgEl = diagramRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) { toast.error("Gere um diagrama primeiro"); return; }
    const isLandscape = orientation === "landscape";
    const blob = await svgToPngBlob(svgEl, 3, { isLandscape });
    if (!blob) { toast.error("Erro ao gerar imagem"); return; }
    const buffer = await blob.arrayBuffer();
    
    // DOCX dimensions: A4 is 595x842 points, margins ~50pt each side
    // Max content area: ~495x742 (portrait) or ~742x495 (landscape)
    const maxW = isLandscape ? 680 : 480;
    const maxH = isLandscape ? 420 : 680;
    
    // Get the scaled image dimensions from the blob
    const imgBitmap = await createImageBitmap(blob);
    let w = imgBitmap.width / 3; // Divide by scale factor used in svgToPngBlob
    let h = imgBitmap.height / 3;
    
    // Further constrain to DOCX max dimensions
    if (w > maxW) { h = h * (maxW / w); w = maxW; }
    if (h > maxH) { w = w * (maxH / h); h = maxH; }
    
    const children: Paragraph[] = [];
    if (escolaFinal) {
      const { TextRun } = await import("docx");
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: escolaFinal, bold: true, size: 28, font: "Arial" })], spacing: { after: 200 } }));
    }
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: buffer, transformation: { width: Math.round(w), height: Math.round(h) }, type: "png" })],
    }));
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 }, // ~1cm margins
            size: isLandscape ? { orientation: "landscape" } : undefined,
          },
        },
        children,
      }],
    });
    const docBlob = await Packer.toBlob(doc);
    saveAs(docBlob, "diagrama.docx");
  };

  // ── Export: PPTX (scaled to fit slide) ──
  const handleExportPptx = async () => {
    const svgEl = diagramRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) { toast.error("Gere um diagrama primeiro"); return; }
    const isLandscape = orientation === "landscape";
    const pngBlob = await svgToPngBlob(svgEl, 3, { isLandscape });
    if (!pngBlob) { toast.error("Erro ao gerar imagem"); return; }
    
    const base64 = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res((reader.result as string).split(",")[1]);
      reader.readAsDataURL(pngBlob);
    });
    
    const pptxgenjs = (await import("pptxgenjs")).default;
    const pres = new pptxgenjs();
    
    // Define A4 layout
    if (isLandscape) {
      pres.defineLayout({ name: "A4H", width: 11.69, height: 8.27 }); // A4 landscape in inches
    } else {
      pres.defineLayout({ name: "A4V", width: 8.27, height: 11.69 }); // A4 portrait in inches
    }
    
    const slide = pres.addSlide();
    if (escolaFinal) {
      slide.addText(escolaFinal, { x: 0.5, y: 0.3, w: isLandscape ? 10.69 : 7.27, h: 0.5, fontSize: 14, bold: true, align: "center" });
    }
    
    // Get actual image dimensions from blob
    const imgBitmap = await createImageBitmap(pngBlob);
    const imgAspect = imgBitmap.width / imgBitmap.height;
    
    // Max content area (leaving margins)
    const maxW = isLandscape ? 10 : 7;
    const maxH = isLandscape ? 6.5 : 9.5;
    
    let imgW = maxW;
    let imgH = maxW / imgAspect;
    if (imgH > maxH) { imgH = maxH; imgW = maxH * imgAspect; }
    
    const xOff = isLandscape ? (11.69 - imgW) / 2 : (8.27 - imgW) / 2;
    const yOff = escolaFinal ? 1 : (isLandscape ? (8.27 - imgH) / 2 : (11.69 - imgH) / 2);
    
    slide.addImage({ data: `image/png;base64,${base64}`, x: xOff, y: yOff, w: imgW, h: imgH });
    const buf = await pres.write({ outputType: "arraybuffer" });
    saveAs(new Blob([buf as ArrayBuffer]), "diagrama.pptx");
  };

  const logoUrl = selectedTimbre?.logoUrl;
  const bannerUrl = selectedTimbre?.bannerUrl;
  const escolaFinal = selectedTimbre
    ? (selectedTimbre.showNomeEscola ? selectedTimbre.escola : "")
    : "";

  const isLandscape = orientation === "landscape";
  const previewStyle: React.CSSProperties = {
    width: isLandscape ? "297mm" : "210mm",
    minHeight: isLandscape ? "210mm" : "297mm",
    padding: "15mm",
    fontFamily: "'Inter', 'Arial', sans-serif",
    fontSize: "11pt",
    lineHeight: 1.6,
  };

  return (
    <div className="flex flex-col h-full">
      <EditorTopBar
        title="Gerador de Diagramas"
        onPdf={mermaidCode ? handleExportPdf : undefined}
        onDocx={mermaidCode ? handleExportDocx : undefined}
        onPptx={mermaidCode ? handleExportPptx : undefined}
        actions={[
          mermaidCode ? (
            <Button key="code" variant="ghost" size="sm" onClick={() => setShowCode(!showCode)}>
              <Code className="h-4 w-4 mr-1" />
              {showCode ? "Ocultar Código" : "Ver Código"}
            </Button>
          ) : null,
          mermaidCode ? (
            <Button key="png" variant="outline" size="sm" onClick={handleDownloadPng}>
              <Download className="h-4 w-4 mr-1" />
              PNG
            </Button>
          ) : null,
        ].filter(Boolean) as React.ReactNode[]}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-auto">
        {/* Left Panel */}
        <div className="w-full lg:w-[340px] shrink-0 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TimbreSelector
                onSelect={setSelectedTimbre}
                selectedId={selectedTimbre?.id || undefined}
              />

              <div>
                <Label className="text-xs">Descreva o diagrama</Label>
                <Textarea
                  placeholder="Ex: Crie um ciclo da água simples..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={4}
                  className="text-sm mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tipos.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Estilo</Label>
                  <Select value={estilo} onValueChange={setEstilo}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {estilos.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Orientação da folha</Label>
                <Select value={orientation} onValueChange={(v) => setOrientation(v as Orientation)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Vertical (Retrato)</SelectItem>
                    <SelectItem value="landscape">Horizontal (Paisagem)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleGenerate} disabled={loading || !prompt.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Gerar Diagrama via IA
              </Button>
            </CardContent>
          </Card>

          {mermaidCode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Pedir Ajuste à IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  placeholder="Ex: Mude a cor do nó 'Evaporação' para azul"
                  value={ajuste}
                  onChange={e => setAjuste(e.target.value)}
                  className="text-sm"
                  onKeyDown={e => e.key === "Enter" && handleAjuste()}
                />
                <Button size="sm" className="w-full" onClick={handleAjuste} disabled={ajusteLoading || !ajuste.trim()}>
                  {ajusteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Aplicar Ajuste
                </Button>
              </CardContent>
            </Card>
          )}

          {showCode && mermaidCode && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Código Mermaid</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="font-mono text-xs min-h-[150px]"
                  value={mermaidCode}
                  onChange={e => setMermaidCode(e.target.value)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel — Diagram Preview A4 */}
        <div className="flex-1 flex items-start justify-center overflow-auto pb-4">
          <div
            ref={printRef}
            className="bg-white border rounded-lg shadow-sm shrink-0"
            style={{
              ...previewStyle,
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Header / Branding */}
            {(bannerUrl || logoUrl || escolaFinal) && (
              <div className="mb-4 pb-3 border-b" style={{ borderColor: "#e5e7eb" }}>
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner" style={{ width: "100%", maxHeight: "96px", objectFit: "contain" }} crossOrigin="anonymous" />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: "40px", width: "40px", objectFit: "contain" }} crossOrigin="anonymous" />}
                    {escolaFinal && <span style={{ fontWeight: 600, fontSize: "14px" }}>{escolaFinal}</span>}
                  </div>
                )}
              </div>
            )}

            {svgOutput ? (
              <div
                ref={diagramRef}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                dangerouslySetInnerHTML={{ __html: svgOutput }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "256px", color: "#9ca3af" }}>
                <Image style={{ width: "48px", height: "48px", marginBottom: "12px", opacity: 0.3 }} />
                <p style={{ fontSize: "14px" }}>Seu diagrama aparecerá aqui em formato A4</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
