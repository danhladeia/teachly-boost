import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, AlignLeft, AlignCenter, AlignRight, MoveUp, MoveDown, ImagePlus, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Block } from "./types";

interface BlockEditorProps {
  block: Block;
  index: number;
  totalBlocks: number;
  onUpdate: (updates: Partial<Block>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

const typeLabels: Record<string, string> = {
  title: "Título",
  text: "Texto",
  separator: "Separador",
  "question-open": "Q. Aberta",
  "question-mc": "Q. Múltipla Escolha",
  "question-enem": "Q. ENEM",
  image: "Imagem",
};

export default function BlockEditor({ block, index, totalBlocks, onUpdate, onRemove, onMove }: BlockEditorProps) {
  const [genImageLoading, setGenImageLoading] = useState(false);
  const [genImagePrompt, setGenImagePrompt] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpdate({ imageUrl: URL.createObjectURL(file) });
  };

  const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpdate({ questionImageUrl: URL.createObjectURL(file) });
  };

  const handleGenerateQuestionImage = async () => {
    if (!genImagePrompt.trim()) { toast.error("Descreva a imagem"); return; }
    setGenImageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: genImagePrompt, style: "educational illustration for exam question" },
      });
      if (error) throw error;
      if (data?.image_url) {
        onUpdate({ questionImageUrl: data.image_url });
        toast.success("Imagem gerada!");
      }
    } catch (err: any) {
      toast.error("Erro ao gerar imagem");
    } finally {
      setGenImageLoading(false);
    }
  };

  const isQuestion = block.type.startsWith("question");

  return (
    <div className="rounded-lg border p-2.5 space-y-2 text-sm bg-card">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase">{typeLabels[block.type]}</span>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-5 w-5" disabled={index === 0} onClick={() => onMove(-1)}><MoveUp className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" disabled={index === totalBlocks - 1} onClick={() => onMove(1)}><MoveDown className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onUpdate({ alignment: "left" })}><AlignLeft className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onUpdate({ alignment: "center" })}><AlignCenter className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onUpdate({ alignment: "right" })}><AlignRight className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={onRemove}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>

      {/* ENEM: Texto Base */}
      {block.type === "question-enem" && (
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold">Texto Base</Label>
          <Textarea
            value={block.textoBase || ""}
            onChange={e => onUpdate({ textoBase: e.target.value })}
            placeholder="Trecho de livro, notícia, tirinha, gráfico, infográfico ou letra de música..."
            className="min-h-[60px] text-xs"
          />
          <Input
            value={block.fonte || ""}
            onChange={e => onUpdate({ fonte: e.target.value })}
            placeholder="Fonte: (autor, obra, ano)"
            className="h-6 text-[10px]"
          />
        </div>
      )}

      {block.type !== "image" && (
        <Textarea
          value={block.content}
          onChange={e => onUpdate({ content: e.target.value })}
          placeholder={
            block.type === "title" ? "Título da atividade" :
            block.type === "separator" ? "Atividades" :
            block.type === "question-enem" ? "Enunciado (comando da questão - frase incompleta que será completada pela alternativa)" :
            block.type.startsWith("question") ? "Enunciado da questão" : "Texto (use $formula$ para KaTeX)"
          }
          className="min-h-[50px] text-xs"
        />
      )}

      {/* MC alternatives (4 options) */}
      {block.type === "question-mc" && block.alternatives && (
        <div className="space-y-1">
          {block.alternatives.map((alt, ai) => (
            <div key={ai} className="flex gap-1 items-center">
              <input
                type="radio"
                name={`correct-${block.id}`}
                checked={block.correctIndex === ai}
                onChange={() => onUpdate({ correctIndex: ai })}
                className="h-3 w-3 accent-primary"
                title="Resposta correta"
              />
              <span className="text-[10px] font-mono w-4">{String.fromCharCode(65 + ai)})</span>
              <Input
                value={alt}
                onChange={e => {
                  const alts = [...(block.alternatives || [])];
                  alts[ai] = e.target.value;
                  onUpdate({ alternatives: alts });
                }}
                className="h-6 text-[11px]"
                placeholder={`Alternativa ${String.fromCharCode(65 + ai)}`}
              />
            </div>
          ))}
          <p className="text-[9px] text-muted-foreground">🔘 Selecione a alternativa correta</p>
        </div>
      )}

      {/* ENEM alternatives (5 options A-E) */}
      {block.type === "question-enem" && block.alternatives && (
        <div className="space-y-1">
          {block.alternatives.map((alt, ai) => (
            <div key={ai} className="flex gap-1 items-center">
              <input
                type="radio"
                name={`correct-${block.id}`}
                checked={block.correctIndex === ai}
                onChange={() => onUpdate({ correctIndex: ai })}
                className="h-3 w-3 accent-primary"
                title="Gabarito"
              />
              <span className="text-[10px] font-mono w-4">{String.fromCharCode(65 + ai)})</span>
              <Input
                value={alt}
                onChange={e => {
                  const alts = [...(block.alternatives || [])];
                  alts[ai] = e.target.value;
                  onUpdate({ alternatives: alts });
                }}
                className="h-6 text-[11px]"
                placeholder={`Alternativa ${String.fromCharCode(65 + ai)}`}
              />
            </div>
          ))}
          <p className="text-[9px] text-muted-foreground">🎯 Gabarito ENEM: 1 correta + 4 distratores</p>
        </div>
      )}

      {block.type === "question-open" && (
        <div className="flex items-center gap-2">
          <Label className="text-[10px]">Linhas:</Label>
          <Input type="number" min={1} max={20} value={block.lines || 4} onChange={e => onUpdate({ lines: e.target.value === "" ? 0 : parseInt(e.target.value) })} className="h-6 w-14 text-[11px]" />
        </div>
      )}

      {/* Question image (upload or AI) for any question type */}
      {isQuestion && (
        <div className="space-y-1 rounded border border-dashed border-muted-foreground/30 p-1.5">
          <Label className="text-[9px] font-semibold flex items-center gap-1"><ImagePlus className="h-3 w-3" /> Imagem da questão</Label>
          {block.questionImageUrl && (
            <div className="flex items-center gap-2">
              <img src={block.questionImageUrl} alt="" className="max-h-14 rounded border" />
              <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => onUpdate({ questionImageUrl: undefined })}><Trash2 className="h-3 w-3" /></Button>
            </div>
          )}
          <div className="flex gap-1">
            <label className="flex-1 flex items-center gap-1 cursor-pointer rounded border border-dashed px-2 py-1 hover:bg-muted/50 text-[9px] text-muted-foreground">
              📁 Upload
              <input type="file" accept="image/*" className="hidden" onChange={handleQuestionImageUpload} />
            </label>
          </div>
          <div className="flex gap-1">
            <Input
              value={genImagePrompt}
              onChange={e => setGenImagePrompt(e.target.value)}
              placeholder="Descreva a imagem para IA..."
              className="h-6 text-[9px] flex-1"
            />
            <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={handleGenerateQuestionImage} disabled={genImageLoading}>
              {genImageLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-primary" />}
            </Button>
          </div>
        </div>
      )}

      {block.type === "image" && (
        <div className="space-y-2">
          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-[10px]" />
          {block.imageUrl && (
            <>
              <img src={block.imageUrl} alt="" className="max-h-16 rounded" />
              <Select value={block.imageSize || "medium"} onValueChange={v => onUpdate({ imageSize: v as any })}>
                <SelectTrigger className="h-6 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequena</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
              <Select value={block.imageFloat || "none"} onValueChange={v => onUpdate({ imageFloat: v as any })}>
                <SelectTrigger className="h-6 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Centralizada</SelectItem>
                  <SelectItem value="left">À Esquerda do Texto</SelectItem>
                  <SelectItem value="right">À Direita do Texto</SelectItem>
                  <SelectItem value="alternating">Intercalada (esq/dir)</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      )}
    </div>
  );
}
