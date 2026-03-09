import React, { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Maximize2, X, Download, FileText, Loader2, ImageIcon,
  Printer, RotateCcw, StickyNote, Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SlideRenderer from "./SlideRenderer";
import type { Slide, SlideTemplate, TemplateColors } from "./types";
import { templateColorMap, estilosImagem } from "./types";

interface Props {
  slides: Slide[];
  setSlides: (s: Slide[]) => void;
  template: SlideTemplate;
  setTemplate: (t: SlideTemplate) => void;
  onReset: () => void;
  generatingImages: boolean;
  imageProgress: number;
  imageTotal: number;
  onPrint?: (printFn: () => void) => void;
  onPptx?: (pptxFn: () => void) => void;
}

export default function SlideEditor({
  slides, setSlides, template, setTemplate, onReset,
  generatingImages, imageProgress, imageTotal, onPrint, onPptx
}: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [regenSlide, setRegenSlide] = useState<number | null>(null);

  const colors = templateColorMap[template];
  const slide = slides[currentSlide];

  // Register functions with parent for top bar usage
  useEffect(() => {
    if (onPrint) onPrint(printHandout);
    if (onPptx) onPptx(exportPPTX);
  }, [onPrint, onPptx]);

  const goTo = (dir: -1 | 1) => setCurrentSlide(prev => Math.max(0, Math.min(slides.length - 1, prev + dir)));

  const updateSlide = (idx: number, patch: Partial<Slide>) => {
    const updated = [...slides];
    updated[idx] = { ...updated[idx], ...patch };
    setSlides(updated);
  };

  const changeLayout = (layout: string) => updateSlide(currentSlide, { layout });

  const regenerateImage = async (idx: number) => {
    const s = slides[idx];
    if (!s.image_prompt) return;
    setRegenSlide(idx);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: s.image_prompt, style: "educational illustration" },
      });
      if (error) throw error;
      if (data?.image_url) updateSlide(idx, { image_url: data.image_url });
      else toast.error("Nenhuma imagem gerada");
    } catch { toast.error("Erro ao gerar imagem"); }
    finally { setRegenSlide(null); }
  };

  const exportPPTX = async () => {
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";

      for (const s of slides) {
        const sl = pptx.addSlide();
        sl.background = { color: colors.bg.replace("#", "") };

        if (s.layout === "title") {
          sl.addText(s.title, { x: 1, y: 2.5, w: 11.33, h: 1.5, fontSize: 36, bold: true, color: colors.accent.replace("#", ""), align: "center" });
          if (s.content) sl.addText(s.content, { x: 2, y: 4.2, w: 9.33, h: 1, fontSize: 18, color: colors.text.replace("#", ""), align: "center" });
        } else {
          sl.addText(s.title, { x: 0.5, y: 0.3, w: 12.33, h: 0.8, fontSize: 28, bold: true, color: colors.accent.replace("#", "") });
          const textW = s.image_url ? 7 : 12.33;
          sl.addText(s.content.replace(/\n/g, "\n"), { x: s.layout === "image-left" ? 5.5 : 0.5, y: 1.3, w: textW, h: 5.5, fontSize: 16, color: colors.text.replace("#", ""), valign: "top", paraSpaceAfter: 6, lineSpacingMultiple: 1.3 });
          if (s.image_url) {
            try {
              sl.addImage({ data: s.image_url, x: s.layout === "image-left" ? 0.5 : 8.5, y: 1.3, w: 4.5, h: 3.5 });
            } catch { /* skip image if data URL fails */ }
          }
        }
        if (s.notes) sl.addNotes(s.notes);
      }

      await pptx.writeFile({ fileName: "apresentacao.pptx" });
      toast.success("PPTX exportado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao exportar PPTX");
    }
  };

  const printHandout = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;

    const html = slides.map((s, i) => `
      <div style="page-break-inside:avoid;display:flex;gap:12px;margin-bottom:18px;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
        <div style="width:55%;background:${colors.bg};color:${colors.text};padding:20px;aspect-ratio:16/9;display:flex;flex-direction:column;justify-content:${s.layout === 'title' ? 'center' : 'flex-start'};align-items:${s.layout === 'title' ? 'center' : 'stretch'};">
          <h3 style="font-size:14px;font-weight:700;color:${colors.accent};margin:0 0 6px;">${s.title}</h3>
          <div style="font-size:10px;line-height:1.5;">${s.content.split('\n').map(l => `<p style="margin:2px 0;">${l}</p>`).join('')}</div>
        </div>
        <div style="width:45%;padding:12px;">
          <p style="font-size:9px;color:#666;margin:0 0 8px;">Slide ${i + 1} — Anotações:</p>
          ${Array.from({ length: 8 }).map(() => '<div style="border-bottom:1px solid #ccc;height:18px;"></div>').join('')}
        </div>
      </div>
    `).join("");

    printWin.document.write(`<!DOCTYPE html><html><head><title>Handout</title><style>@page{margin:10mm;}body{font-family:sans-serif;}</style></head><body>${html}</body></html>`);
    printWin.document.close();
    printWin.print();
  };

  return (
    <>
      <div className="flex gap-4 h-[calc(100vh-140px)]">
        {/* Thumbnails sidebar */}
        <div className="w-44 flex-shrink-0 overflow-y-auto space-y-2 pr-1">
          {slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-full rounded-md overflow-hidden border-2 transition-colors ${idx === currentSlide ? "border-primary shadow-md" : "border-transparent hover:border-muted-foreground/30"}`}
            >
              <SlideRenderer slide={s} index={idx} total={slides.length} colors={colors} isThumb />
              <div className="text-[10px] text-muted-foreground py-0.5 text-center bg-muted/30">{idx + 1}</div>
            </button>
          ))}
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Internal toolbar for templates and layout */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Select value={template} onValueChange={v => setTemplate(v as SlideTemplate)}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderno">Moderno</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                  <SelectItem value="cientifico">Científico</SelectItem>
                  <SelectItem value="tech">Tecnológico</SelectItem>
                  <SelectItem value="minimal">Minimalista</SelectItem>
                </SelectContent>
              </Select>
              <Select value={slide?.layout || "content"} onValueChange={changeLayout}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Capa</SelectItem>
                  <SelectItem value="content">Conteúdo</SelectItem>
                  <SelectItem value="image-left">Imagem Esquerda</SelectItem>
                  <SelectItem value="image-right">Imagem Direita</SelectItem>
                  <SelectItem value="two-columns">Duas Colunas</SelectItem>
                  <SelectItem value="quote">Citação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              {generatingImages && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{imageProgress}/{imageTotal}</span>
                  <Progress value={(imageProgress / Math.max(imageTotal, 1)) * 100} className="w-16 h-1.5" />
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowNotes(!showNotes)} className="text-xs">
                <StickyNote className="mr-1 h-3.5 w-3.5" /> Notas
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFullscreen(true)} className="text-xs">
                <Maximize2 className="mr-1 h-3.5 w-3.5" /> Apresentar
              </Button>
            </div>
          </div>

          {/* Slide canvas */}
          <div className="flex-1 rounded-lg overflow-hidden shadow-lg border relative">
            <SlideRenderer slide={slide} index={currentSlide} total={slides.length} colors={colors} />
            {/* Regen image button */}
            {slide?.image_prompt && slide.layout !== "title" && (
              <Button
                size="sm" variant="secondary"
                className="absolute bottom-3 right-3 text-xs opacity-70 hover:opacity-100"
                onClick={() => regenerateImage(currentSlide)}
                disabled={regenSlide === currentSlide}
              >
                {regenSlide === currentSlide ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ImageIcon className="mr-1 h-3 w-3" />}
                {slide.image_url ? "Regenerar" : "Gerar"} Imagem
              </Button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 py-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(-1)} disabled={currentSlide === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground font-mono">{currentSlide + 1} / {slides.length}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(1)} disabled={currentSlide === slides.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Notes + editing */}
          {showNotes && slide && (
            <div className="grid gap-3 grid-cols-2 mt-1">
              <Card>
                <CardContent className="pt-3 pb-3">
                  <Label className="text-xs text-muted-foreground mb-1 block">Título</Label>
                  <Input value={slide.title} onChange={e => updateSlide(currentSlide, { title: e.target.value })} className="text-sm h-8" />
                  <Label className="text-xs text-muted-foreground mb-1 mt-2 block">Conteúdo</Label>
                  <Textarea value={slide.content} onChange={e => updateSlide(currentSlide, { content: e.target.value })} className="text-xs min-h-[80px]" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3">
                  <Label className="text-xs text-muted-foreground mb-1 block">Notas do apresentador</Label>
                  <Textarea value={slide.notes} onChange={e => updateSlide(currentSlide, { notes: e.target.value })} className="text-xs min-h-[80px]" />
                  <Label className="text-xs text-muted-foreground mb-1 mt-2 block">Prompt da imagem</Label>
                  <Input value={slide.image_prompt} onChange={e => updateSlide(currentSlide, { image_prompt: e.target.value })} className="text-xs h-7" />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setFullscreen(false); }}
          onKeyDown={e => {
            if (e.key === "Escape") setFullscreen(false);
            if (e.key === "ArrowRight" || e.key === " ") goTo(1);
            if (e.key === "ArrowLeft") goTo(-1);
          }}
          tabIndex={0}
          ref={el => el?.focus()}
        >
          <div className="w-full h-full">
            <SlideRenderer slide={slides[currentSlide]} index={currentSlide} total={slides.length} colors={colors} />
          </div>
          <Button size="icon" variant="ghost" className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setFullscreen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}
    </>
  );
}
