import { useState, useRef, useCallback } from "react";
import { FileText, Plus, Image, Sparkles, FileDown, Type, ListOrdered, Trash2, GripVertical, AlignLeft, AlignCenter, AlignRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type BlockType = "title" | "text" | "question-open" | "question-mc" | "image";
type Alignment = "left" | "center" | "right";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  alignment: Alignment;
  // For questions
  alternatives?: string[];
  correctIndex?: number;
  lines?: number; // answer lines for open questions
  // For images
  imageUrl?: string;
  imagePosition?: "left" | "center" | "right";
}

const genId = () => Math.random().toString(36).slice(2, 10);

const emptyBlock = (type: BlockType): Block => ({
  id: genId(),
  type,
  content: "",
  alignment: type === "title" ? "center" : "left",
  ...(type === "question-mc" ? { alternatives: ["", "", "", ""], correctIndex: 0 } : {}),
  ...(type === "question-open" ? { lines: 4 } : {}),
});

export default function Activities() {
  const [blocks, setBlocks] = useState<Block[]>([emptyBlock("title")]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const addBlock = (type: BlockType) => {
    setBlocks(prev => [...prev, emptyBlock(type)]);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) { toast.error("Digite um tema para gerar o conteúdo"); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-atividade", {
        body: { prompt: aiPrompt },
      });
      if (error) throw error;
      if (data?.blocks) {
        setBlocks(data.blocks.map((b: any) => ({ ...emptyBlock(b.type), ...b, id: genId() })));
        toast.success("Atividade gerada com sucesso!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar atividade");
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageUpload = (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateBlock(blockId, { imageUrl: url });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Editor de Atividades A4
        </h1>
        <p className="text-muted-foreground mt-1">Crie atividades com layout profissional para impressão</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Left - Toolbar */}
        <div className="space-y-4">
          {/* AI Generation */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-sm">✨ Gerar com IA</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder='Descreva o tema (ex: "Revolução Francesa para 8º ano" ou "Frações equivalentes 5º ano")'
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="min-h-[80px] text-sm"
              />
              <Button onClick={handleAiGenerate} disabled={aiLoading} size="sm" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90">
                {aiLoading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-1 h-4 w-4" /> Gerar Atividade</>}
              </Button>
            </CardContent>
          </Card>

          {/* Add Blocks */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-sm">➕ Adicionar Elementos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => addBlock("title")}>
                <Type className="mr-2 h-4 w-4" /> Título
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => addBlock("text")}>
                <AlignLeft className="mr-2 h-4 w-4" /> Bloco de Texto
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => addBlock("question-open")}>
                <ListOrdered className="mr-2 h-4 w-4" /> Questão Aberta
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => addBlock("question-mc")}>
                <ListOrdered className="mr-2 h-4 w-4" /> Questão Múltipla Escolha
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => addBlock("image")}>
                <Image className="mr-2 h-4 w-4" /> Imagem
              </Button>
            </CardContent>
          </Card>

          {/* Block Editor */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-sm">📝 Blocos ({blocks.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {blocks.map((block, i) => (
                <div key={block.id} className="rounded-lg border p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {block.type === "title" ? "Título" : block.type === "text" ? "Texto" : block.type === "question-open" ? "Q. Aberta" : block.type === "question-mc" ? "Q. Múltipla Escolha" : "Imagem"}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateBlock(block.id, { alignment: "left" })}><AlignLeft className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateBlock(block.id, { alignment: "center" })}><AlignCenter className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateBlock(block.id, { alignment: "right" })}><AlignRight className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeBlock(block.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  {block.type !== "image" && (
                    <Textarea
                      value={block.content}
                      onChange={e => updateBlock(block.id, { content: e.target.value })}
                      placeholder={block.type === "title" ? "Título da atividade" : block.type.startsWith("question") ? "Enunciado da questão" : "Texto do bloco"}
                      className="min-h-[60px] text-xs"
                    />
                  )}
                  {block.type === "question-mc" && block.alternatives && (
                    <div className="space-y-1">
                      {block.alternatives.map((alt, ai) => (
                        <div key={ai} className="flex gap-1 items-center">
                          <span className="text-xs font-mono w-4">{String.fromCharCode(65 + ai)})</span>
                          <Input
                            value={alt}
                            onChange={e => {
                              const alts = [...(block.alternatives || [])];
                              alts[ai] = e.target.value;
                              updateBlock(block.id, { alternatives: alts });
                            }}
                            className="h-7 text-xs"
                            placeholder={`Alternativa ${String.fromCharCode(65 + ai)}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {block.type === "question-open" && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Linhas:</Label>
                      <Input type="number" min={1} max={20} value={block.lines || 4} onChange={e => updateBlock(block.id, { lines: parseInt(e.target.value) || 4 })} className="h-7 w-16 text-xs" />
                    </div>
                  )}
                  {block.type === "image" && (
                    <div>
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(block.id, e)} className="text-xs" />
                      {block.imageUrl && <img src={block.imageUrl} alt="" className="mt-2 max-h-20 rounded" />}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Export */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
              <FileDown className="mr-1 h-4 w-4" /> PDF / Imprimir
            </Button>
          </div>
        </div>

        {/* Right - A4 Preview */}
        <div className="print:m-0">
          <Card className="shadow-card print:shadow-none print:border-0">
            <CardHeader className="flex flex-row items-center justify-between print:hidden">
              <CardTitle className="font-display text-lg">Folha A4 - Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex justify-center">
              <div
                className="bg-white text-black border print:border-0"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  padding: "15mm",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12pt",
                  lineHeight: "1.6",
                }}
              >
                {blocks.length === 0 && (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Adicione elementos à atividade usando a barra lateral
                  </div>
                )}
                {blocks.map((block, i) => {
                  const align = block.alignment === "center" ? "center" : block.alignment === "right" ? "right" : "left";
                  
                  if (block.type === "title") {
                    return (
                      <h1 key={block.id} style={{ textAlign: align, fontSize: "18pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginBottom: "8mm", borderBottom: "1px solid #ccc", paddingBottom: "4mm" }}>
                        {block.content || "Título da Atividade"}
                      </h1>
                    );
                  }
                  if (block.type === "text") {
                    return (
                      <p key={block.id} style={{ textAlign: "justify", marginBottom: "5mm", textIndent: align === "left" ? "10mm" : 0 }}>
                        {block.content || "Texto do bloco"}
                      </p>
                    );
                  }
                  if (block.type === "question-open") {
                    const questionNum = blocks.slice(0, i).filter(b => b.type.startsWith("question")).length + 1;
                    return (
                      <div key={block.id} style={{ marginBottom: "8mm" }}>
                        <p style={{ fontWeight: 600, marginBottom: "3mm" }}>{questionNum}) {block.content || "Enunciado da questão"}</p>
                        {Array.from({ length: block.lines || 4 }).map((_, li) => (
                          <div key={li} style={{ borderBottom: "1px solid #ccc", height: "8mm", marginBottom: "1mm" }} />
                        ))}
                      </div>
                    );
                  }
                  if (block.type === "question-mc") {
                    const questionNum = blocks.slice(0, i).filter(b => b.type.startsWith("question")).length + 1;
                    return (
                      <div key={block.id} style={{ marginBottom: "8mm" }}>
                        <p style={{ fontWeight: 600, marginBottom: "3mm" }}>{questionNum}) {block.content || "Enunciado da questão"}</p>
                        {block.alternatives?.map((alt, ai) => (
                          <p key={ai} style={{ marginLeft: "5mm", marginBottom: "1mm" }}>
                            <span style={{ fontWeight: 600 }}>{String.fromCharCode(65 + ai)})</span> {alt || `Alternativa ${String.fromCharCode(65 + ai)}`}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  if (block.type === "image" && block.imageUrl) {
                    return (
                      <div key={block.id} style={{ textAlign: align, marginBottom: "5mm" }}>
                        <img src={block.imageUrl} alt="" style={{ maxWidth: "100%", maxHeight: "80mm" }} />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
