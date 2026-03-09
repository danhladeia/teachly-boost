import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Loader2, Download, RefreshCw, Image, Code } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

export default function DiagramGenerator() {
  const { canUseAI, deductCredit } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [tipo, setTipo] = useState("fluxograma");
  const [estilo, setEstilo] = useState("clean");
  const [mermaidCode, setMermaidCode] = useState("");
  const [svgOutput, setSvgOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ajuste, setAjuste] = useState("");
  const [ajusteLoading, setAjusteLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [selectedTimbre, setSelectedTimbre] = useState<TimbreData | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadPng = async () => {
    if (!svgOutput) return;
    try {
      const svgEl = diagramRef.current?.querySelector("svg");
      if (!svgEl) return;
      const canvas = document.createElement("canvas");
      const bbox = svgEl.getBoundingClientRect();
      const scale = 2;
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
        canvas.toBlob((b) => {
          if (!b) return;
          const a = document.createElement("a");
          a.href = URL.createObjectURL(b);
          a.download = "diagrama.png";
          a.click();
        });
      };
      img.src = url;
    } catch {
      toast.error("Erro ao exportar imagem");
    }
  };

  const logoUrl = selectedTimbre?.logoUrl;
  const bannerUrl = selectedTimbre?.bannerUrl;
  const escolaFinal = selectedTimbre
    ? (selectedTimbre.showNomeEscola ? selectedTimbre.escola : "")
    : "";

  return (
    <div className="flex flex-col h-full">
      <EditorTopBar
        title="Gerador de Diagramas"
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

              <TimbreSelector
                onSelect={setSelectedTimbre}
                selectedId={selectedTimbre?.id || undefined}
              />

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

        {/* Right Panel — Diagram Preview */}
        <div className="flex-1 flex items-start justify-center">
          <div className="bg-background border rounded-lg shadow-sm w-full max-w-[800px] min-h-[400px] p-6">
            {/* Header / Branding */}
            {(bannerUrl || logoUrl || escolaFinal) && (
              <div className="mb-4 pb-3 border-b border-border">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner" className="w-full max-h-24 object-contain" crossOrigin="anonymous" />
                ) : (
                  <div className="flex items-center gap-3">
                    {logoUrl && <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain" crossOrigin="anonymous" />}
                    {escolaFinal && <span className="font-semibold text-sm">{escolaFinal}</span>}
                  </div>
                )}
              </div>
            )}

            {svgOutput ? (
              <div ref={diagramRef} className="w-full overflow-auto" dangerouslySetInnerHTML={{ __html: svgOutput }} />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Image className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Seu diagrama aparecerá aqui</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
