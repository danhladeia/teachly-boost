import { useState, useEffect } from "react";
import { FileText, Sparkles, FileDown, Type, ListOrdered, AlignLeft, Loader2, Image, Save, Printer, Building2, BookOpen, Settings2, Hash, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToPdf, exportAtividadeToDocx } from "@/lib/export-utils";
import A4Preview from "@/components/activities/A4Preview";
import BlockEditor from "@/components/activities/BlockEditor";
import type { Block, BlockType } from "@/components/activities/types";

const genId = () => Math.random().toString(36).slice(2, 10);

const niveis: Record<string, string[]> = {
  "Fundamental - Séries Iniciais": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental - Séries Finais": ["6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
};

export const emptyBlock = (type: BlockType): Block => ({
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
  const [aiNivel, setAiNivel] = useState("");
  const [aiSerie, setAiSerie] = useState("");
  const [aiTipo, setAiTipo] = useState("mista");
  const [aiNumAbertas, setAiNumAbertas] = useState(3);
  const [aiNumFechadas, setAiNumFechadas] = useState(2);
  const [aiTamanhoTexto, setAiTamanhoTexto] = useState<"curto" | "medio" | "longo">("medio");
  const [aiLoading, setAiLoading] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [escola, setEscola] = useState("");
  const [professor, setProfessor] = useState("");
  const [turma, setTurma] = useState("");
  const [autoNumber, setAutoNumber] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedPlanos, setSavedPlanos] = useState<any[]>([]);
  const [tab, setTab] = useState("ia");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    loadSavedPlanos();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("escola, nome").eq("user_id", user.id).single();
      if (data?.escola) { setEscola(data.escola); setShowHeader(true); }
      if (data?.nome) setProfessor(data.nome);
    } catch {}
  };

  const loadSavedPlanos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("documentos_salvos").select("id, titulo, created_at, conteudo").eq("user_id", user.id).eq("tipo", "plano").order("created_at", { ascending: false }).limit(20);
      if (data) setSavedPlanos(data);
    } catch {}
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };
  const removeBlock = (id: string) => setBlocks(prev => prev.filter(b => b.id !== id));
  const addBlock = (type: BlockType) => setBlocks(prev => [...prev, emptyBlock(type)]);

  const moveBlock = (index: number, dir: -1 | 1) => {
    setBlocks(prev => {
      const arr = [...prev];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newUrls: string[] = [];
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      newUrls.push(url);
    });
    setUploadedImages(prev => [...prev, ...newUrls]);
    toast.success(`${newUrls.length} imagem(ns) carregada(s). Serão inseridas ao gerar a atividade.`);
    e.target.value = "";
  };

  const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      setBlocks(prev => [...prev, { ...emptyBlock("image"), imageUrl: url, imageSize: "medium", imageFloat: "none" }]);
    });
    toast.success("Imagem inserida na atividade!");
    e.target.value = "";
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) { toast.error("Digite um tema"); return; }
    setAiLoading(true);
    try {
      const numAbertas = aiTipo === "multipla_escolha" ? 0 : aiNumAbertas;
      const numFechadas = aiTipo === "aberta" ? 0 : aiNumFechadas;
      const { data, error } = await supabase.functions.invoke("generate-atividade", {
        body: {
          prompt: aiPrompt,
          serie: aiSerie ? `${aiNivel} - ${aiSerie}` : aiNivel,
          tipo: aiTipo,
          num_abertas: numAbertas,
          num_fechadas: numFechadas,
          tamanho_texto: aiTamanhoTexto,
        },
      });
      if (error) throw error;
      if (data?.blocks) {
        const generatedBlocks: Block[] = data.blocks.map((b: any) => ({ ...emptyBlock(b.type), ...b, id: genId() }));
        // Insert uploaded images between text and question blocks
        if (uploadedImages.length > 0) {
          const finalBlocks: Block[] = [];
          let imgIdx = 0;
          for (const block of generatedBlocks) {
            finalBlocks.push(block);
            if (block.type === "text" && imgIdx < uploadedImages.length) {
              finalBlocks.push({ ...emptyBlock("image"), imageUrl: uploadedImages[imgIdx], imageSize: "medium", imageFloat: "left" });
              imgIdx++;
            }
          }
          // Add remaining images at end
          while (imgIdx < uploadedImages.length) {
            finalBlocks.push({ ...emptyBlock("image"), imageUrl: uploadedImages[imgIdx], imageSize: "medium", imageFloat: "left" });
            imgIdx++;
          }
          setBlocks(finalBlocks);
          setUploadedImages([]);
        } else {
          setBlocks(generatedBlocks);
        }
        toast.success("Atividade gerada!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar");
    } finally {
      setAiLoading(false);
    }
  };

  const handleImportPlano = (plano: any) => {
    const newBlocks: Block[] = [];
    const p = plano.conteudo || plano;
    if (p.identificacao?.tema) newBlocks.push({ ...emptyBlock("title"), content: p.identificacao.tema });
    if (p.desenvolvimento) newBlocks.push({ ...emptyBlock("text"), content: p.desenvolvimento });
    if (p.objetivos?.length) newBlocks.push({ ...emptyBlock("text"), content: p.objetivos.join("\n") });
    if (newBlocks.length === 0) newBlocks.push(emptyBlock("title"));
    setBlocks(newBlocks);
    toast.success("Plano importado para o editor!");
  };

  const handlePrint = () => {
    const el = document.getElementById("atividade-print-area");
    if (!el) return;
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<html><head><title>Atividade</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css"><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', 'Arial', sans-serif; }
      @page { size: A4; margin: 0; }
    </style></head><body>`);
    pw.document.write(el.innerHTML);
    pw.document.write("</body></html>");
    pw.document.close();
    pw.focus();
    pw.print();
    pw.close();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login"); return; }
      const titulo = blocks.find(b => b.type === "title")?.content || "Atividade sem título";
      const { error } = await supabase.from("documentos_salvos").insert({
        user_id: user.id, tipo: "atividade", titulo,
        conteudo: { blocks, settings: { autoNumber, showHeader, escola, professor, turma } } as any,
      });
      if (error) throw error;
      toast.success("Atividade salva na biblioteca!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleExportDocx = () => {
    exportAtividadeToDocx(blocks, { escola: showHeader ? escola : undefined, professor, turma, autoNumber });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Editor de Atividades A4
          </h1>
          <p className="text-muted-foreground text-sm">Diagramador automático para impressão</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="mr-1 h-4 w-4" /> Imprimir</Button>
          <Button size="sm" variant="outline" onClick={() => exportToPdf("atividade-print-area", "atividade")}><FileDown className="mr-1 h-4 w-4" /> PDF</Button>
          <Button size="sm" variant="outline" onClick={handleExportDocx}><FileDown className="mr-1 h-4 w-4" /> DOCX</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}><Save className="mr-1 h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* LEFT PANEL */}
        <div className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ia" className="text-xs">✨ IA</TabsTrigger>
                  <TabsTrigger value="manual" className="text-xs">📝 Manual</TabsTrigger>
                  <TabsTrigger value="importar" className="text-xs">📥 Importar</TabsTrigger>
                </TabsList>

                <TabsContent value="ia" className="space-y-3 mt-3">
                  <Input placeholder="Tema (ex: Revolução Francesa)" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="text-sm" />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Nível de ensino</Label>
                      <Select value={aiNivel} onValueChange={v => { setAiNivel(v); setAiSerie(""); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Nível" /></SelectTrigger>
                        <SelectContent>
                          {Object.keys(niveis).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Série / Ano</Label>
                      <Select value={aiSerie} onValueChange={setAiSerie} disabled={!aiNivel}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Série" /></SelectTrigger>
                        <SelectContent>
                          {(niveis[aiNivel] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Tipo de questões</Label>
                    <Select value={aiTipo} onValueChange={setAiTipo}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mista">Mista (abertas + fechadas)</SelectItem>
                        <SelectItem value="aberta">Só Abertas</SelectItem>
                        <SelectItem value="multipla_escolha">Só Múltipla Escolha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {aiTipo !== "multipla_escolha" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Questões abertas</Label>
                        <Input type="number" min={0} max={20} value={aiNumAbertas} onChange={e => setAiNumAbertas(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
                      </div>
                    )}
                    {aiTipo !== "aberta" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Questões fechadas</Label>
                        <Input type="number" min={0} max={20} value={aiNumFechadas} onChange={e => setAiNumFechadas(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
                      </div>
                    )}
                  </div>

                  {/* Text size by characters */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Extensão do texto</Label>
                    <Select value={aiTamanhoTexto} onValueChange={v => setAiTamanhoTexto(v as any)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="curto">Curto (~500 caracteres)</SelectItem>
                        <SelectItem value="medio">Médio (~1500 caracteres)</SelectItem>
                        <SelectItem value="longo">Longo (~3000+ caracteres)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Image upload before generation */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold flex items-center gap-1"><Image className="h-3 w-3" /> Imagens (inseridas junto ao texto)</Label>
                    <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Carregar imagens antes de gerar</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                    {uploadedImages.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {uploadedImages.map((url, i) => (
                          <img key={i} src={url} alt="" className="h-10 w-10 rounded object-cover border" />
                        ))}
                        <span className="text-[10px] text-muted-foreground self-center ml-1">{uploadedImages.length} imagem(ns)</span>
                      </div>
                    )}
                  </div>

                  <Button onClick={handleAiGenerate} disabled={aiLoading} size="sm" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90">
                    {aiLoading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-1 h-4 w-4" /> Gerar Atividade</>}
                  </Button>
                </TabsContent>

                <TabsContent value="manual" className="mt-3 space-y-3">
                  <p className="text-xs text-muted-foreground mb-2">Adicione blocos manualmente:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => addBlock("title")}><Type className="mr-1 h-3 w-3" /> Título</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock("text")}><AlignLeft className="mr-1 h-3 w-3" /> Texto</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock("question-open")}><ListOrdered className="mr-1 h-3 w-3" /> Q. Aberta</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock("question-mc")}><ListOrdered className="mr-1 h-3 w-3" /> Q. Múltipla</Button>
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Inserir imagem</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleManualImageUpload} />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">Dica: Use <code className="bg-muted px-1 rounded">$E=mc^2$</code> para fórmulas.</p>
                </TabsContent>

                <TabsContent value="importar" className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Importe conteúdo dos seus planos de aula salvos:</p>
                  {savedPlanos.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhum plano salvo ainda.</p>
                  ) : (
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {savedPlanos.map(p => (
                        <Button key={p.id} variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => handleImportPlano(p)}>
                          <BookOpen className="mr-1 h-3 w-3" /> {p.titulo}
                        </Button>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Global Settings */}
          <Card className="shadow-card">
            <CardContent className="pt-4 space-y-3">
              <h3 className="text-xs font-semibold flex items-center gap-1"><Settings2 className="h-3 w-3" /> Configurações</h3>
              <div className="flex items-center gap-2">
                <Switch checked={showHeader} onCheckedChange={setShowHeader} id="act-header" />
                <Label htmlFor="act-header" className="text-xs flex items-center gap-1"><Building2 className="h-3 w-3" /> Cabeçalho da Escola</Label>
              </div>
              {showHeader && (
                <Input placeholder="Nome da escola" value={escola} onChange={e => setEscola(e.target.value)} className="h-8 text-xs" />
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Professor(a)</Label>
                  <Input placeholder="Nome" value={professor} onChange={e => setProfessor(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Turma</Label>
                  <Input placeholder="Ex: 5ºA" value={turma} onChange={e => setTurma(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={autoNumber} onCheckedChange={setAutoNumber} id="auto-num" />
                <Label htmlFor="auto-num" className="text-xs flex items-center gap-1"><Hash className="h-3 w-3" /> Numeração automática</Label>
              </div>
            </CardContent>
          </Card>

          {/* Block list */}
          <Card className="shadow-card">
            <CardHeader className="py-3"><CardTitle className="text-xs font-semibold">📝 Blocos ({blocks.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[350px] overflow-y-auto">
              {blocks.map((block, i) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  index={i}
                  totalBlocks={blocks.length}
                  onUpdate={(updates) => updateBlock(block.id, updates)}
                  onRemove={() => removeBlock(block.id)}
                  onMove={(dir) => moveBlock(i, dir)}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL - A4 Preview */}
        <div className="overflow-auto max-h-[calc(100vh-160px)]">
          <A4Preview blocks={blocks} showHeader={showHeader} escola={escola} autoNumber={autoNumber} professor={professor} turma={turma} />
        </div>
      </div>
    </div>
  );
}
