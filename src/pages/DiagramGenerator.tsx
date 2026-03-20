import { useState, useEffect, useRef, useCallback } from "react";
import ResponsiveA4Wrapper from "@/components/ResponsiveA4Wrapper";
import { Sparkles, Loader2, Download, RefreshCw, Image, Code, FileText, Presentation, Monitor, Smartphone } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
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

const A4_PORTRAIT = { width: 595 - 76, height: 842 - 76 };
const A4_LANDSCAPE = { width: 842 - 76, height: 595 - 76 };

async function svgToPngBlob(
  svgEl: SVGSVGElement,
  scale = 2,
  fitToA4?: { isLandscape: boolean }
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const bbox = svgEl.getBoundingClientRect();
    let targetW = bbox.width;
    let targetH = bbox.height;
    if (fitToA4) {
      const maxDims = fitToA4.isLandscape ? A4_LANDSCAPE : A4_PORTRAIT;
      const scaleX = maxDims.width / bbox.width;
      const scaleY = maxDims.height / bbox.height;
      const fitScale = Math.min(scaleX, scaleY, 1);
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
  const isMobile = useIsMobile();
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
  const [diagramTitle, setDiagramTitle] = useState("");
  const [diagramDescription, setDiagramDescription] = useState("");
  const [previewMode, setPreviewMode] = useState<"print" | "mobile">(isMobile ? "mobile" : "print");
  const diagramRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) setPreviewMode("mobile");
  }, [isMobile]);

  const renderMermaid = useCallback(async (code: string) => {
    if (!code.trim()) { setSvgOutput(""); return; }
    try {
      const cleanCode = code
        .replace(/^```(?:mermaid)?\s*/im, "")
        .replace(/\s*```\s*$/im, "")
        .replace(/^mermaid\s*/i, "")
        .trim();
      const id = "mermaid-" + Date.now();
      const { svg } = await mermaid.render(id, cleanCode);
      const scaledSvg = svg
        .replace(/width="[^"]*"/, 'width="100%"')
        .replace(/style="[^"]*max-width:[^;"]*;?/g, (m) => m.replace(/max-width:[^;"]*/g, "max-width:100%"));
      setSvgOutput(scaledSvg);
    } catch (err) {
      console.error("Mermaid render error:", err);
      toast.error("Erro de sintaxe no diagrama.");
      setSvgOutput(`<div style="color:hsl(var(--destructive));padding:16px;background:hsl(var(--destructive)/0.1);border-radius:8px;font-size:13px;">
        <strong>Erro de sintaxe Mermaid.</strong><br/>Use "Pedir Ajuste à IA" e escreva: <em>"corrija a sintaxe"</em>
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

  const handleDownloadPng = async () => {
    const svgEl = diagramRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) return;
    const isLandscape = orientation === "landscape";
    const blob = await svgToPngBlob(svgEl, 2, { isLandscape });
    if (!blob) { toast.error("Erro ao exportar PNG"); return; }
    saveAs(blob, "diagrama.png");
  };

  const handleExportPdf = async () => {
    const svgEl = diagramRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) { toast.error("Gere um diagrama primeiro"); return; }
    const isLandscape = orientation === "landscape";
    const pngBlob = await svgToPngBlob(svgEl, 3, { isLandscape });
    if (!pngBlob) { toast.error("Erro ao gerar imagem"); return; }
    const tempDiv = document.createElement("div");
    tempDiv.style.width = isLandscape ? "267mm" : "180mm";
    tempDiv.style.padding = "0";
    tempDiv.style.background = "#fff";
    tempDiv.style.fontFamily = "'Inter', 'Arial', sans-serif";
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

  const handleExportDocx = async () => {
    const svgEl = diagramRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) { toast.error("Gere um diagrama primeiro"); return; }
    const isLandscape = orientation === "landscape";
    const blob = await svgToPngBlob(svgEl, 3, { isLandscape });
    if (!blob) { toast.error("Erro ao gerar imagem"); return; }
    const buffer = await blob.arrayBuffer();
    const maxW = isLandscape ? 680 : 480;
    const maxH = isLandscape ? 420 : 680;
    const imgBitmap = await createImageBitmap(blob);
    let w = imgBitmap.width / 3;
    let h = imgBitmap.height / 3;
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
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
            size: isLandscape ? { orientation: "landscape" } : undefined,
          },
        },
        children,
      }],
    });
    const docBlob = await Packer.toBlob(doc);
    saveAs(docBlob, "diagrama.docx");
  };

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
    if (isLandscape) pres.defineLayout({ name: "A4H", width: 11.69, height: 8.27 });
    else pres.defineLayout({ name: "A4V", width: 8.27, height: 11.69 });
    const slide = pres.addSlide();
    if (escolaFinal) {
      slide.addText(escolaFinal, { x: 0.5, y: 0.3, w: isLandscape ? 10.69 : 7.27, h: 0.5, fontSize: 14, bold: true, align: "center" });
    }
    const imgBitmap = await createImageBitmap(pngBlob);
    const imgAspect = imgBitmap.width / imgBitmap.height;
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

  const a4Preview = (
    <div
      ref={printRef}
      id="diagram-print-area"
      className="a4-page-scaled bg-card text-card-foreground border rounded-lg shadow-sm shrink-0"
      style={{
        ...previewStyle,
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {(bannerUrl || logoUrl || escolaFinal) && (
        <div className="mb-4 pb-3 border-b border-border" style={{ textAlign: "center" }}>
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" style={{ maxWidth: "100%", maxHeight: "96px", objectFit: "contain", margin: "0 auto", display: "block" }} crossOrigin="anonymous" />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: "40px", width: "40px", objectFit: "contain" }} crossOrigin="anonymous" />}
              {escolaFinal && <span style={{ fontWeight: 600, fontSize: "14px" }}>{escolaFinal}</span>}
            </div>
          )}
        </div>
      )}
      {diagramTitle && (
        <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: "16pt", fontFamily: "'Montserrat', sans-serif", marginBottom: "4mm" }}>
          {diagramTitle}
        </h2>
      )}
      {diagramDescription && (
        <p style={{ textAlign: "justify", fontSize: "10pt", color: "hsl(var(--muted-foreground))", marginBottom: "6mm", lineHeight: 1.6 }}>
          {diagramDescription}
        </p>
      )}
      {svgOutput ? (
        <div ref={diagramRef} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }} dangerouslySetInnerHTML={{ __html: svgOutput }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "256px", color: "hsl(var(--muted-foreground))" }}>
          <Image style={{ width: "48px", height: "48px", marginBottom: "12px", opacity: 0.3 }} />
          <p style={{ fontSize: "14px" }}>Seu diagrama aparecerá aqui em formato A4</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 overflow-x-hidden">
      <EditorTopBar
        title="Gerador de Diagramas"
        onPdf={mermaidCode ? handleExportPdf : undefined}
        onDocx={mermaidCode ? handleExportDocx : undefined}
        onPptx={mermaidCode ? handleExportPptx : undefined}
        actions={[
          mermaidCode ? (
            <Button key="code" variant="ghost" size="sm" onClick={() => setShowCode(!showCode)} className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3">
              <Code className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {showCode ? "Ocultar Código" : "Ver Código"}
            </Button>
          ) : null,
          mermaidCode ? (
            <Button key="png" variant="outline" size="sm" onClick={handleDownloadPng} className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              PNG
            </Button>
          ) : null,
        ].filter(Boolean) as React.ReactNode[]}
      />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr] overflow-hidden">
        {/* LEFT PANEL — scrollable config, no page-level scrollbar */}
        <div className="space-y-4 pr-1 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:overflow-x-hidden">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-dashed border-primary/30 p-3 space-y-3 bg-primary/5">
                <Label className="text-xs font-semibold">🏫 Cabeçalho Institucional</Label>
                <TimbreSelector onSelect={setSelectedTimbre} selectedId={selectedTimbre?.id || undefined} label="Selecionar escola/timbre" />
              </div>

              <div>
                <Label className="text-xs">Descreva o diagrama</Label>
                <Textarea placeholder="Ex: Crie um ciclo da água simples..." value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="text-sm mt-1" />
              </div>

              <div>
                <Label className="text-xs">Título do diagrama (opcional)</Label>
                <Input placeholder="Ex: Ciclo da Água" value={diagramTitle} onChange={e => setDiagramTitle(e.target.value)} className="h-8 text-xs mt-1" />
              </div>

              <div>
                <Label className="text-xs">Descrição contextual (opcional)</Label>
                <Textarea placeholder="Texto informativo para incluir acima ou abaixo do diagrama..." value={diagramDescription} onChange={e => setDiagramDescription(e.target.value)} rows={2} className="text-xs mt-1" />
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

              <Button className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90" onClick={handleGenerate} disabled={loading || !prompt.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Gerar Diagrama via IA
              </Button>
            </CardContent>
          </Card>

          {mermaidCode && (
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Pedir Ajuste à IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input placeholder="Ex: Mude a cor do nó 'Evaporação' para azul" value={ajuste} onChange={e => setAjuste(e.target.value)} className="text-sm" onKeyDown={e => e.key === "Enter" && handleAjuste()} />
                <Button size="sm" className="w-full" onClick={handleAjuste} disabled={ajusteLoading || !ajuste.trim()}>
                  {ajusteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Aplicar Ajuste
                </Button>
              </CardContent>
            </Card>
          )}

          {showCode && mermaidCode && (
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Código Mermaid</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea className="font-mono text-xs min-h-[150px]" value={mermaidCode} onChange={e => setMermaidCode(e.target.value)} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT PANEL — A4 Preview */}
        <div className="overflow-x-hidden min-w-0">
          <div data-a4-container data-preview-mode={previewMode} className="bg-muted/30 rounded-lg p-2 sm:p-4 flex flex-col items-center gap-4 w-full overflow-x-hidden max-w-full">
            <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5 self-end">
              <button onClick={() => setPreviewMode("print")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all ${previewMode === "print" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <Monitor className="h-3 w-3" /> Impressão
              </button>
              <button onClick={() => setPreviewMode("mobile")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all ${previewMode === "mobile" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <Smartphone className="h-3 w-3" /> Leitura
              </button>
            </div>

            <style>{`
              [data-preview-mode="mobile"] .a4-page-scaled {
                width: 100% !important;
                max-width: 100% !important;
                min-height: unset !important;
                max-height: none !important;
                height: auto !important;
                padding: 4mm !important;
                box-shadow: none !important;
              }
              [data-preview-mode="mobile"] .responsive-a4-inner {
                width: 100% !important;
                transform: none !important;
                margin: 0 auto !important;
              }
              [data-preview-mode="mobile"] #diagram-print-area {
                width: 100% !important;
                max-width: 100% !important;
              }
            `}</style>

            {previewMode === "print" ? (
              <ResponsiveA4Wrapper>{a4Preview}</ResponsiveA4Wrapper>
            ) : (
              <div className="w-full max-w-full">{a4Preview}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
