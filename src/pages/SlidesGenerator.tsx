import { useState } from "react";
import { Presentation, Sparkles, Upload, Loader2, ChevronLeft, ChevronRight, Maximize2, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const niveis: Record<string, string[]> = {
  "Fundamental - Séries Iniciais": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental - Séries Finais": ["6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
};

interface Slide {
  title: string;
  content: string;
  notes: string;
  image_prompt: string;
  image_url?: string;
  layout: string;
}

const estilosImagem = [
  { value: "realistic", label: "Realista / Fotográfica", desc: "Fotos reais e detalhadas" },
  { value: "cartoon", label: "Cartoon / Desenho", desc: "Ilustrações coloridas e divertidas" },
  { value: "watercolor", label: "Aquarela", desc: "Estilo artístico com pinceladas suaves" },
  { value: "flat", label: "Flat / Vetorial", desc: "Ícones e formas simples e limpas" },
  { value: "3d", label: "3D Render", desc: "Objetos tridimensionais renderizados" },
  { value: "scientific", label: "Científico / Diagrama", desc: "Diagramas e ilustrações técnicas" },
];

export default function SlidesGenerator() {
  const [tema, setTema] = useState("");
  const [descricao, setDescricao] = useState("");
  const [nivel, setNivel] = useState("");
  const [serie, setSerie] = useState("");
  const [template, setTemplate] = useState("moderno");
  const [numSlides, setNumSlides] = useState(8);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showStyleDialog, setShowStyleDialog] = useState(false);
  const [estiloImagem, setEstiloImagem] = useState("realistic");
  const [generatingImages, setGeneratingImages] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setArquivo(file);
  };

  const handleGenerate = async () => {
    if (!tema.trim()) { toast.error("Insira o tema da aula"); return; }
    setShowStyleDialog(true);
  };

  const handleConfirmGenerate = async () => {
    setShowStyleDialog(false);
    setLoading(true);
    try {
      const estiloLabel = estilosImagem.find(e => e.value === estiloImagem)?.label || "Realista";
      const { data, error } = await supabase.functions.invoke("generate-slides", {
        body: { tema, descricao, nivel, serie: serie ? `${nivel} - ${serie}` : nivel, template, num_slides: numSlides, estilo_imagem: estiloLabel },
      });
      if (error) throw error;
      if (data?.slides?.length) {
        setSlides(data.slides);
        setCurrentSlide(0);
        toast.success(`${data.slides.length} slides gerados!`);
      } else {
        toast.error("Nenhum slide gerado");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar slides");
    } finally {
      setLoading(false);
    }
  };

  const templateColors: Record<string, { bg: string; text: string; accent: string }> = {
    moderno: { bg: "#0f172a", text: "#f1f5f9", accent: "#3b82f6" },
    kids: { bg: "#fef3c7", text: "#1e293b", accent: "#f59e0b" },
    cientifico: { bg: "#f8fafc", text: "#0f172a", accent: "#0ea5e9" },
  };

  const colors = templateColors[template] || templateColors.moderno;

  const renderSlide = (slide: Slide, idx: number, isThumb = false) => {
    const fontSize = isThumb ? 0.3 : 1;
    const pad = isThumb ? "8px" : "60px";

    return (
      <div
        key={idx}
        style={{
          width: "100%", aspectRatio: "16/9", background: colors.bg, color: colors.text,
          display: "flex", flexDirection: "column", justifyContent: slide.layout === "title" ? "center" : "flex-start",
          alignItems: slide.layout === "title" ? "center" : "stretch",
          padding: pad, position: "relative", overflow: "hidden", borderRadius: isThumb ? "6px" : 0,
        }}
      >
        {slide.layout === "title" ? (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: `${2.4 * fontSize}em`, fontWeight: 800, marginBottom: `${0.5 * fontSize}em`, color: colors.accent }}>
              {slide.title}
            </h1>
            {slide.content && <p style={{ fontSize: `${1.1 * fontSize}em`, opacity: 0.8 }}>{slide.content}</p>}
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: `${1.6 * fontSize}em`, fontWeight: 700, marginBottom: `${0.5 * fontSize}em`, color: colors.accent, borderBottom: `2px solid ${colors.accent}40`, paddingBottom: `${0.3 * fontSize}em` }}>
              {slide.title}
            </h2>
            <div style={{ display: "flex", gap: `${1 * fontSize}em`, flex: 1, alignItems: "flex-start" }}>
              {(slide.layout === "image-left") && slide.image_url && (
                <img src={slide.image_url} alt="" style={{ width: "40%", borderRadius: "8px", objectFit: "cover", maxHeight: "70%" }} />
              )}
              <div style={{ flex: 1 }}>
                {slide.content.split("\n").map((line, li) => (
                  <p key={li} style={{ fontSize: `${0.95 * fontSize}em`, marginBottom: `${0.3 * fontSize}em`, paddingLeft: line.startsWith("•") || line.startsWith("-") ? `${1 * fontSize}em` : 0 }}>
                    {line}
                  </p>
                ))}
              </div>
              {(slide.layout === "image-right" || (!["image-left", "two-columns", "quote", "title"].includes(slide.layout))) && slide.image_url && (
                <img src={slide.image_url} alt="" style={{ width: "40%", borderRadius: "8px", objectFit: "cover", maxHeight: "70%" }} />
              )}
            </div>
          </>
        )}
        {!isThumb && (
          <div style={{ position: "absolute", bottom: "12px", right: "20px", fontSize: "0.7em", opacity: 0.4 }}>
            {idx + 1} / {slides.length}
          </div>
        )}
      </div>
    );
  };

  const goToSlide = (dir: -1 | 1) => setCurrentSlide(prev => Math.max(0, Math.min(slides.length - 1, prev + dir)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Presentation className="h-6 w-6 text-primary" /> Gerador de Slides
        </h1>
        <p className="text-muted-foreground mt-1">Crie apresentações prontas para projetar na sala de aula</p>
      </div>

      {slides.length === 0 ? (
        <Card className="shadow-card max-w-3xl">
          <CardHeader><CardTitle className="font-display text-lg">Nova apresentação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tema da aula</Label>
              <Input placeholder="Ex: Sistema Solar, Revolução Industrial" value={tema} onChange={e => setTema(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Descreva o que deseja nos slides</Label>
              <Textarea
                placeholder="Ex: Quero slides com imagens do sistema solar, explicando cada planeta com dados curiosos para crianças..."
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Nível de ensino</Label>
                <Select value={nivel} onValueChange={v => { setNivel(v); setSerie(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(niveis).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Série / Ano</Label>
                <Select value={serie} onValueChange={setSerie} disabled={!nivel}>
                  <SelectTrigger><SelectValue placeholder="Série" /></SelectTrigger>
                  <SelectContent>
                    {(niveis[nivel] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger><SelectValue placeholder="Estilo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderno">Moderno</SelectItem>
                    <SelectItem value="kids">Kids</SelectItem>
                    <SelectItem value="cientifico">Científico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Quantidade de slides</Label>
                <Input type="number" min={3} max={30} value={numSlides} onChange={e => setNumSlides(Math.max(3, Math.min(30, parseInt(e.target.value) || 8)))} />
              </div>
              <div className="space-y-2">
                <Label>Arquivo base <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border px-3 py-2.5 hover:bg-muted/50 transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">{arquivo ? arquivo.name : "PDF, DOCX ou TXT"}</span>
                  <input type="file" accept=".pdf,.docx,.txt,.doc" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            <Button size="lg" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90" disabled={loading || !tema.trim()} onClick={handleGenerate}>
              {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-5 w-5" /> Gerar {numSlides} Slides</>}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* SLIDE VIEWER */
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setSlides([])}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Nova Apresentação
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setFullscreen(true)}>
                <Maximize2 className="mr-1 h-4 w-4" /> Apresentar
              </Button>
            </div>
          </div>

          {/* Main slide */}
          <div className="rounded-lg overflow-hidden shadow-lg border">
            {renderSlide(slides[currentSlide], currentSlide)}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={() => goToSlide(-1)} disabled={currentSlide === 0}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm text-muted-foreground font-mono">{currentSlide + 1} / {slides.length}</span>
            <Button variant="outline" size="icon" onClick={() => goToSlide(1)} disabled={currentSlide === slides.length - 1}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`flex-shrink-0 w-32 rounded-md overflow-hidden border-2 transition-colors ${idx === currentSlide ? "border-primary" : "border-transparent hover:border-muted-foreground/30"}`}
              >
                {renderSlide(slide, idx, true)}
              </button>
            ))}
          </div>

          {/* Notes */}
          {slides[currentSlide]?.notes && (
            <Card>
              <CardContent className="pt-4">
                <Label className="text-xs text-muted-foreground">Notas do apresentador</Label>
                <p className="text-sm mt-1">{slides[currentSlide].notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Image Style Dialog */}
      <Dialog open={showStyleDialog} onOpenChange={setShowStyleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Estilo das Imagens</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Escolha o estilo visual das imagens que serão geradas para os slides:</p>
          <div className="grid grid-cols-2 gap-2 py-2">
            {estilosImagem.map(e => (
              <button
                key={e.value}
                onClick={() => setEstiloImagem(e.value)}
                className={`rounded-lg border-2 p-3 text-left transition-colors ${estiloImagem === e.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
              >
                <span className="text-sm font-medium">{e.label}</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">{e.desc}</p>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStyleDialog(false)}>Cancelar</Button>
            <Button onClick={handleConfirmGenerate} disabled={loading} className="gradient-primary border-0 text-primary-foreground">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Gerar Slides
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Presentation */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setFullscreen(false); }}
          onKeyDown={e => {
            if (e.key === "Escape") setFullscreen(false);
            if (e.key === "ArrowRight" || e.key === " ") goToSlide(1);
            if (e.key === "ArrowLeft") goToSlide(-1);
          }}
          tabIndex={0}
          ref={el => el?.focus()}
        >
          <div className="w-full h-full">
            {renderSlide(slides[currentSlide], currentSlide)}
          </div>
          <Button size="icon" variant="ghost" className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setFullscreen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
