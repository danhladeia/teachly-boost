import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, AlignLeft, AlignCenter, AlignRight, MoveUp, MoveDown } from "lucide-react";
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
  image: "Imagem",
};

export default function BlockEditor({ block, index, totalBlocks, onUpdate, onRemove, onMove }: BlockEditorProps) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpdate({ imageUrl: URL.createObjectURL(file) });
  };

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

      {block.type !== "image" && (
        <Textarea
          value={block.content}
          onChange={e => onUpdate({ content: e.target.value })}
          placeholder={
            block.type === "title" ? "Título da atividade" :
            block.type === "separator" ? "Atividades" :
            block.type.startsWith("question") ? "Enunciado da questão" : "Texto (use $formula$ para KaTeX)"
          }
          className="min-h-[50px] text-xs"
        />
      )}

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

      {block.type === "question-open" && (
        <div className="flex items-center gap-2">
          <Label className="text-[10px]">Linhas:</Label>
          <Input type="number" min={1} max={20} value={block.lines || 4} onChange={e => onUpdate({ lines: parseInt(e.target.value) || 4 })} className="h-6 w-14 text-[11px]" />
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
