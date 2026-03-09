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

/** Convert SVG element to PNG blob at given scale */
async function svgToPngBlob(svgEl: SVGSVGElement, scale = 2): Promise<Blob | null> {
  return new Promise((resolve) => {
    const bbox = svgEl.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = bbox.width * scale;
    canvas.height = bbox.height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, bbox.width, bbox.height);
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, bbox.width, bbox.height);
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
      const id = "mermaid-" + Date.now();
      const { svg } = await mermaid.render(id, code);
      setSvgOutput(svg);
    } catch (err) {
      console.error("Mermaid render error:", err);
      setSvgOutput(`<p style="color:red;padding:16px;">Erro na sintaxe Mermaid. Ajuste o código e tente novamente.</p>`);
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

  // ── Export: PNG ──
  const handleDownloadPng = async () => {
    const svgEl = diagramRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) return;
    const blob = await svgToPngBlob(svgEl);
    if (!blob) { toast.error("Erro ao exportar PNG"); return; }
    saveAs(blob, "diagrama.png");
  };

  // ── Export: PDF (A4 portrait or landscape) ──
  const handleExportPdf = async () => {
    const el = printRef.current;
    if (!el) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const origW = el.style.width;
    const origMinH = el.style.minHeight;
    const origShadow = el.style.boxShadow;
    const isLandscape = orientation === "landscape";
    el.style.width = isLandscape ? "267mm" : "180mm";
    el.style.minHeight = "auto";
    el.style.boxShadow = "none";
    await html2pdf().set({
      margin: [15, 15, 15, 15],
      filename: "diagrama.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, width: el.scrollWidth },
      jsPDF: { unit: "mm", format: "a4", orientation: isLandscape ? "landscape" : "portrait" },
    }).from(el).save();
    el.style.width = origW;
    el.style.minHeight = origMinH;
    el.style.boxShadow = origShadow;
  };

  // ── Export: DOCX ──
  const handleExportDocx = async () => {
    const svgEl = diagramRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) { toast.error("Gere um diagrama primeiro"); return; }
    const blob = await svgToPngBlob(svgEl, 3);
    if (!blob) { toast.error("Erro ao gerar imagem"); return; }
    const buffer = await blob.arrayBuffer();
    const bbox = svgEl.getBoundingClientRect();
    const isLandscape = orientation === "landscape";
    const maxW = isLandscape ? 800 : 550;
    const maxH = isLandscape ? 500 : 700;
    let w = bbox.width, h = bbox.height;
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
            margin: { top: 850, bottom: 850, left: 850, right: 850 },
            size: isLandscape ? { orientation: "landscape" } : undefined,
          },
        },
        children,
      }],
    });
    const docBlob = await Packer.toBlob(doc);
    saveAs(docBlob, "diagrama.docx");
  };

  // ── Export: PPTX ──
  const handleExportPptx = async () => {
    const svgEl = diagramRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) { toast.error("Gere um diagrama primeiro"); return; }
    const pngBlob = await svgToPngBlob(svgEl, 3);
    if (!pngBlob) { toast.error("Erro ao gerar imagem"); return; }
    const base64 = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res((reader.result as string).split(",")[1]);
      reader.readAsDataURL(pngBlob);
    });
    const pptxgenjs = (await import("pptxgenjs")).default;
    const pres = new pptxgenjs();
    const isLandscape = orientation === "landscape";
    if (!isLandscape) pres.defineLayout({ name: "A4V", width: 7.5, height: 10 });
    const slide = pres.addSlide();
    if (escolaFinal) {
      slide.addText(escolaFinal, { x: 0.5, y: 0.3, w: isLandscape ? 9 : 6.5, h: 0.5, fontSize: 14, bold: true, align: "center" });
    }
    const bbox = svgEl.getBoundingClientRect();
    const aspect = bbox.width / bbox.height;
    const slideW = isLandscape ? 8 : 6;
    const slideH = isLandscape ? 5 : 7;
    let imgW = slideW, imgH = slideW / aspect;
    if (imgH > slideH) { imgH = slideH; imgW = slideH * aspect; }
    const xOff = isLandscape ? (10 - imgW) / 2 : (7.5 - imgW) / 2;
    const yOff = escolaFinal ? 1 : (isLandscape ? (7.5 - imgH) / 2 : (10 - imgH) / 2);
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
