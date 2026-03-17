import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FileText, Sparkles, Loader2, Plus, Save, Printer, FileDown, Trash2, Upload, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToPdf } from "@/lib/export-utils";
import A4Preview from "@/components/activities/A4Preview";
import BlockEditor from "@/components/activities/BlockEditor";
import TimbreSelector from "@/components/TimbreSelector";
import CreditsIndicator from "@/components/CreditsIndicator";
import EditorTopBar from "@/components/EditorTopBar";
import type { Block, BlockType } from "@/components/activities/types";
import type { TimbreData } from "@/hooks/useTimbre";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useDocumentLimits } from "@/hooks/useDocumentLimits";

const niveis: Record<string, string[]> = {
  "Fundamental - Séries Iniciais": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental - Séries Finais": ["6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
};

const genId = () => Math.random().toString(36).slice(2, 10);

const createBlock = (type: BlockType): Block => ({
  id: genId(),
  type,
  content: "",
  alignment: type === "title" || type === "separator" ? "center" : "left",
  alternatives: type === "question-mc" ? ["", "", "", ""] : type === "question-enem" ? ["", "", "", "", ""] : undefined,
  correctIndex: type === "question-mc" || type === "question-enem" ? 0 : undefined,
  lines: type === "question-open" ? 4 : undefined,
});

export default function Activities() {
  const { user } = useAuth();
  const { plan, canUseAI, deductCredit } = useCredits();
  const docLimits = useDocumentLimits();
  const location = useLocation();

  const [prompt, setPrompt] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [nivel, setNivel] = useState("");
  const [serie, setSerie] = useState("");
  const [tamanhoTexto, setTamanhoTexto] = useState("medio");
  const [tipoQuestoes, setTipoQuestoes] = useState("mista");
  const [numAbertas, setNumAbertas] = useState(3);
  const [numFechadas, setNumFechadas] = useState(2);
  const [modoEnem, setModoEnem] = useState(false);
  const [separatorTitle, setSeparatorTitle] = useState("Atividades");

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  // Header / Timbre
  const [showHeader, setShowHeader] = useState(true);
  const [escola, setEscola] = useState("");
  const [professor, setProfessor] = useState("");
  const [turma, setTurma] = useState("");
  const [autoNumber, setAutoNumber] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [showAluno, setShowAluno] = useState(false);
  const [showData, setShowData] = useState(false);
  const [selectedTimbreId, setSelectedTimbreId] = useState<string | undefined>();
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [bannerUrl, setBannerUrl] = useState<string | undefined>();

  // Import text
  const [textoImportado, setTextoImportado] = useState("");

  // Load from library state
  useEffect(() => {
    const state = location.state as any;
    if (state?.conteudo && state?.tipo === "atividade") {
      const conteudo = state.conteudo;
      if (conteudo.blocks && Array.isArray(conteudo.blocks)) {
        setBlocks(conteudo.blocks.map((b: any) => ({ ...b, id: b.id || genId() })));
      }
      if (state.id) setCurrentDocId(state.id);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleTimbreSelect = (timbre: TimbreData | null) => {
    if (timbre) {
      setSelectedTimbreId(timbre.id);
      setEscola(timbre.escola || "");
      setLogoUrl(timbre.logoUrl || undefined);
      setBannerUrl(timbre.bannerUrl || undefined);
      setShowAluno(timbre.showAluno);
      setShowData(timbre.showData);
      if (timbre.showProfessor && !professor) setProfessor("");
    } else {
      setSelectedTimbreId(undefined);
      setEscola("");
      setLogoUrl(undefined);
      setBannerUrl(undefined);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Digite o tema da atividade"); return; }
    if (!canUseAI) { toast.error("Créditos insuficientes"); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-atividade", {
        body: {
          prompt: prompt.trim(),
          serie,
          nivel,
          disciplina,
          tipo: tipoQuestoes,
          num_abertas: numAbertas,
          num_fechadas: numFechadas,
          tamanho_texto: tamanhoTexto,
          separator_title: separatorTitle,
          modo_enem: modoEnem,
          texto_importado: textoImportado || undefined,
        },
      });
      if (error) throw error;
      if (data?.blocks && Array.isArray(data.blocks)) {
        const newBlocks = data.blocks.map((b: any) => ({
          ...b,
          id: genId(),
          alignment: b.alignment || "left",
          alternatives: b.alternatives || (b.type === "question-mc" ? ["", "", "", ""] : b.type === "question-enem" ? ["", "", "", "", ""] : undefined),
        }));
        setBlocks(newBlocks);
        await useCredit("general");
        toast.success("Atividade gerada com sucesso!");
      } else {
        toast.error("Resposta inesperada da IA");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar atividade");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || blocks.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        tipo: "atividade",
        titulo: blocks.find(b => b.type === "title")?.content || prompt || "Atividade sem título",
        disciplina: disciplina || null,
        nivel: nivel || null,
        conteudo: { blocks },
      };

      if (currentDocId) {
        const { error } = await supabase.from("documentos_salvos").update(payload).eq("id", currentDocId);
        if (error) throw error;
        toast.success("Atividade atualizada!");
      } else {
        const { data, error } = await supabase.from("documentos_salvos").insert(payload).select("id").single();
        if (error) throw error;
        setCurrentDocId(data.id);
        toast.success("Atividade salva!");
      }
    } catch (err: any) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();
  const handlePdf = () => exportToPdf("atividade-print-area", blocks.find(b => b.type === "title")?.content || "atividade");

  const addBlock = (type: BlockType) => {
    setBlocks(prev => [...prev, createBlock(type)]);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setTextoImportado(text.substring(0, 8000));
    toast.success(`Texto importado: ${file.name}`);
  };

  const seriesOptions = nivel ? niveis[nivel] || [] : [];

  return (
    <div className="space-y-4">
      <EditorTopBar
        title="Atividades A4"
        onSave={blocks.length > 0 ? handleSave : undefined}
        onPrint={blocks.length > 0 ? handlePrint : undefined}
        onPdf={blocks.length > 0 ? handlePdf : undefined}
        saving={saving}
        leading={<CreditsIndicator />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* Left Panel */}
        <ScrollArea className="max-h-[calc(100vh-140px)]">
          <div className="space-y-4 pr-2">
            {/* Generation form */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Gerar com IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-[10px]">Tema / Assunto *</Label>
                  <Textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Ex: Revolução Industrial e suas consequências sociais"
                    className="min-h-[60px] text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Disciplina</Label>
                    <Input value={disciplina} onChange={e => setDisciplina(e.target.value)} placeholder="Matemática" className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Nível</Label>
                    <Select value={nivel} onValueChange={v => { setNivel(v); setSerie(""); }}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(niveis).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {seriesOptions.length > 0 && (
                  <div>
                    <Label className="text-[10px]">Série</Label>
                    <Select value={serie} onValueChange={setSerie}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {seriesOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Tamanho do texto</Label>
                    <Select value={tamanhoTexto} onValueChange={setTamanhoTexto}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="curto">Curto</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="longo">Longo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px]">Separador</Label>
                    <Input value={separatorTitle} onChange={e => setSeparatorTitle(e.target.value)} className="h-7 text-xs" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={modoEnem} onCheckedChange={setModoEnem} />
                  <Label className="text-[10px]">Modo ENEM</Label>
                </div>

                {!modoEnem && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Questões abertas</Label>
                      <Input type="number" min={0} max={10} value={numAbertas} onChange={e => setNumAbertas(+e.target.value)} className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Múltipla escolha</Label>
                      <Input type="number" min={0} max={10} value={numFechadas} onChange={e => setNumFechadas(+e.target.value)} className="h-7 text-xs" />
                    </div>
                  </div>
                )}

                {modoEnem && (
                  <div>
                    <Label className="text-[10px]">Nº questões ENEM</Label>
                    <Input type="number" min={1} max={10} value={numFechadas} onChange={e => setNumFechadas(+e.target.value)} className="h-7 text-xs" />
                  </div>
                )}

                {/* Import text */}
                <div className="space-y-1">
                  <Label className="text-[10px] flex items-center gap-1"><Upload className="h-3 w-3" /> Importar texto base</Label>
                  <input type="file" accept=".txt,.md" onChange={handleFileImport} className="text-[10px]" />
                  {textoImportado && (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground truncate flex-1">Texto importado ({textoImportado.length} chars)</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setTextoImportado("")}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  )}
                </div>

                <Button onClick={handleGenerate} disabled={loading} className="w-full" size="sm">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {loading ? "Gerando..." : "Gerar Atividade"}
                </Button>
              </CardContent>
            </Card>

            {/* Timbre */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <TimbreSelector onSelect={handleTimbreSelect} selectedId={selectedTimbreId} />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={showHeader} onCheckedChange={setShowHeader} />
                    <Label className="text-[10px]">Exibir cabeçalho</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={autoNumber} onCheckedChange={setAutoNumber} />
                    <Label className="text-[10px]">Numerar questões</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={showLines} onCheckedChange={setShowLines} />
                    <Label className="text-[10px]">Linhas para resposta</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={showAluno} onCheckedChange={setShowAluno} />
                    <Label className="text-[10px]">Campo Aluno</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={showData} onCheckedChange={setShowData} />
                    <Label className="text-[10px]">Campo Data</Label>
                  </div>
                </div>
                {showHeader && (
                  <div className="space-y-2">
                    <Input value={professor} onChange={e => setProfessor(e.target.value)} placeholder="Professor(a)" className="h-7 text-xs" />
                    <Input value={turma} onChange={e => setTurma(e.target.value)} placeholder="Turma" className="h-7 text-xs" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add blocks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Adicionar blocos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {(["title", "text", "separator", "question-open", "question-mc", "question-enem", "image", "page-break"] as BlockType[]).map(type => (
                    <Button key={type} variant="outline" size="sm" className="text-[10px] h-6" onClick={() => addBlock(type)}>
                      {type === "title" ? "Título" : type === "text" ? "Texto" : type === "separator" ? "Separador" : type === "question-open" ? "Q. Aberta" : type === "question-mc" ? "Q. M.E." : type === "question-enem" ? "Q. ENEM" : type === "image" ? "Imagem" : "Quebra de Página"}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Block editors */}
            {blocks.length > 0 && (
              <div className="space-y-2">
                {blocks.map((block, idx) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    index={idx}
                    totalBlocks={blocks.length}
                    onUpdate={updates => updateBlock(block.id, updates)}
                    onRemove={() => removeBlock(block.id)}
                    onMove={dir => moveBlock(block.id, dir)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Right Panel - Preview */}
        <div className="min-w-0">
          <A4Preview
            blocks={blocks}
            showHeader={showHeader}
            escola={escola}
            autoNumber={autoNumber}
            showLines={showLines}
            showAluno={showAluno}
            showData={showData}
            professor={professor}
            turma={turma}
            logoUrl={logoUrl}
            bannerUrl={bannerUrl}
          />
        </div>
      </div>
    </div>
  );
}
