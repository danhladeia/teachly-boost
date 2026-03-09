import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { FileText, Sparkles, Type, ListOrdered, AlignLeft, Loader2, Image, Building2, BookOpen, Settings2, Hash, Upload, SeparatorHorizontal, FileUp, GraduationCap, AlertTriangle } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToPdf, exportAtividadeToDocx } from "@/lib/export-utils";
import A4Preview from "@/components/activities/A4Preview";
import BlockEditor from "@/components/activities/BlockEditor";
import EditorTopBar from "@/components/EditorTopBar";
import TimbreSelector from "@/components/TimbreSelector";
import type { TimbreData } from "@/hooks/useTimbre";
import type { Block, BlockType, ImageFloat } from "@/components/activities/types";

const genId = () => Math.random().toString(36).slice(2, 10);

const niveis: Record<string, string[]> = {
  "Fundamental - Séries Iniciais": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental - Séries Finais": ["6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
};

export const emptyBlock = (type: BlockType): Block => ({
  id: genId(),
  type,
  content: type === "separator" ? "Atividades" : "",
  alignment: type === "title" || type === "separator" ? "center" : "left",
  ...(type === "question-mc" ? { alternatives: ["", "", "", ""], correctIndex: 0 } : {}),
  ...(type === "question-enem" ? { alternatives: ["", "", "", "", ""], correctIndex: 0, textoBase: "", fonte: "" } : {}),
  ...(type === "question-open" ? { lines: 4 } : {}),
});

export default function Activities() {
  const location = useLocation();
  const [blocks, setBlocks] = useState<Block[]>([emptyBlock("title")]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiNivel, setAiNivel] = useState("");
  const [aiSerie, setAiSerie] = useState("");
  const [aiTipo, setAiTipo] = useState("mista");
  const [aiNumAbertas, setAiNumAbertas] = useState(3);
  const [aiNumFechadas, setAiNumFechadas] = useState(2);
  const [aiTamanhoTexto, setAiTamanhoTexto] = useState<"curto" | "medio" | "longo">("medio");
  const [aiDisciplina, setAiDisciplina] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [escola, setEscola] = useState("");
  const [professor, setProfessor] = useState("");
  const [turma, setTurma] = useState("");
  const [autoNumber, setAutoNumber] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedDocs, setSavedDocs] = useState<any[]>([]);
  const [tab, setTab] = useState("ia");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imagePosition, setImagePosition] = useState<ImageFloat>("left");
  const [separatorTitle, setSeparatorTitle] = useState("Atividades");
  const [aiImageDescriptions, setAiImageDescriptions] = useState<string[]>([]);
  const [numAiImages, setNumAiImages] = useState(0);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [modoEnem, setModoEnem] = useState(false);
  const [textoImportado, setTextoImportado] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [selectedTimbreId, setSelectedTimbreId] = useState<string | undefined>();
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSavedDocs();
    loadProfile();
  }, []);

  // Load document from Library navigation
  useEffect(() => {
    const state = location.state as { loadDocId?: string; source?: string } | null;
    if (state?.loadDocId && state?.source === "documentos") {
      loadDocumentById(state.loadDocId);
      // Clear state to avoid reloading on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadDocumentById = async (docId: string) => {
    try {
      const { data, error } = await supabase
        .from("documentos_salvos")
        .select("*")
        .eq("id", docId)
        .single();
      if (error) throw error;
      if (data?.conteudo) {
        const content = data.conteudo as any;
        if (content.blocks) setBlocks(content.blocks);
        if (content.settings) {
          setShowHeader(content.settings.showHeader ?? true);
          setEscola(content.settings.escola || "");
          setProfessor(content.settings.professor || "");
          setTurma(content.settings.turma || "");
          setAutoNumber(content.settings.autoNumber ?? true);
        }
        setCurrentDocId(docId);
        setTab("manual");
        toast.success(`Documento "${data.titulo}" carregado!`);
      }
    } catch (err) {
      console.error("Error loading document:", err);
      toast.error("Erro ao carregar documento");
    }
  };

  // Auto-enable ENEM mode when Ensino Médio is selected
  useEffect(() => {
    if (aiNivel === "Ensino Médio") {
      setModoEnem(true);
    }
  }, [aiNivel]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("escola, nome").eq("user_id", user.id).single();
      if (data?.escola) { setEscola(data.escola); setShowHeader(true); }
      if (data?.nome) setProfessor(data.nome);
    } catch {}
  };

  const loadSavedDocs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("documentos_salvos").select("id, titulo, created_at, conteudo, tipo").eq("user_id", user.id).in("tipo", ["plano", "atividade"]).order("created_at", { ascending: false }).limit(30);
      if (data) setSavedDocs(data);
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
      newUrls.push(URL.createObjectURL(file));
    });
    setUploadedImages(prev => [...prev, ...newUrls]);
    toast.success(`${newUrls.length} imagem(ns) carregada(s).`);
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

  const generateAiImage = async (description: string): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: description, style: "educational illustration" },
      });
      if (error) throw error;
      return data?.image_url || undefined;
    } catch (err) {
      console.error("AI image error:", err);
      return undefined;
    }
  };

  // File import handler (PDF/DOCX → text extraction)
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    setImportFileName(file.name);

    if (name.endsWith(".txt") || name.endsWith(".md")) {
      const text = await file.text();
      setTextoImportado(text);
      toast.success(`Arquivo "${file.name}" importado!`);
    } else if (name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".doc")) {
      // For PDF/DOCX, read as text (basic extraction)
      try {
        if (name.endsWith(".pdf")) {
          // Read PDF as ArrayBuffer and extract text lines
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let text = "";
          // Simple text extraction from PDF binary
          const decoder = new TextDecoder("latin1");
          const raw = decoder.decode(bytes);
          // Extract text between BT and ET markers
          const btMatches = raw.matchAll(/BT\s([\s\S]*?)ET/g);
          for (const match of btMatches) {
            const inner = match[1];
            const tjMatches = inner.matchAll(/\(([^)]*)\)\s*Tj/g);
            for (const tj of tjMatches) {
              text += tj[1];
            }
            const tdMatches = inner.matchAll(/\[([^\]]*)\]\s*TJ/g);
            for (const td of tdMatches) {
              const parts = td[1].matchAll(/\(([^)]*)\)/g);
              for (const p of parts) {
                text += p[1];
              }
            }
            text += "\n";
          }
          if (text.trim().length < 20) {
            text = "⚠️ Não foi possível extrair texto deste PDF. Tente copiar e colar o conteúdo diretamente no campo de texto abaixo.";
          }
          setTextoImportado(text.trim());
          toast.success(`PDF "${file.name}" importado! Revise o texto extraído.`);
        } else {
          // DOCX: extract text from word/document.xml
          const JSZip = (await import("file-saver")).default;
          // Simple approach: read as text
          const text = await file.text();
          // Extract readable content
          const cleanText = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          if (cleanText.length > 50) {
            setTextoImportado(cleanText.substring(0, 10000));
          } else {
            setTextoImportado("⚠️ Não foi possível extrair texto deste arquivo. Cole o conteúdo manualmente.");
          }
          toast.success(`Arquivo "${file.name}" importado!`);
        }
      } catch {
        toast.error("Erro ao processar arquivo. Tente colar o texto manualmente.");
      }
    } else {
      toast.error("Formato não suportado. Use PDF, DOCX ou TXT.");
    }
    e.target.value = "";
  };

  const { canUseAI, deductCredit } = useCredits();

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() && !textoImportado.trim()) { toast.error("Digite um tema ou importe um texto"); return; }
    if (!canUseAI) { toast.error("Limite atingido. Faça o upgrade para continuar criando."); return; }
    setAiLoading(true);
    try {
      const ok = await deductCredit();
      if (!ok) { toast.error("Sem créditos disponíveis."); setAiLoading(false); return; }
      const numAbertas = modoEnem ? 0 : (aiTipo === "multipla_escolha" ? 0 : aiNumAbertas);
      const numFechadas = modoEnem ? aiNumFechadas : (aiTipo === "aberta" ? 0 : aiNumFechadas);
      const { data, error } = await supabase.functions.invoke("generate-atividade", {
        body: {
          prompt: aiPrompt || `Atividade baseada no texto importado`,
          serie: aiSerie ? `${aiNivel} - ${aiSerie}` : aiNivel,
          nivel: aiNivel,
          disciplina: aiDisciplina,
          tipo: modoEnem ? "enem" : aiTipo,
          num_abertas: numAbertas,
          num_fechadas: numFechadas,
          tamanho_texto: aiTamanhoTexto,
          num_imagens: uploadedImages.length + numAiImages,
          separator_title: separatorTitle,
          modo_enem: modoEnem,
          texto_importado: textoImportado || undefined,
        },
      });
      if (error) throw error;
      if (data?.blocks) {
        const generatedBlocks: Block[] = data.blocks.map((b: any) => ({
          ...emptyBlock(b.type),
          ...b,
          id: genId(),
          // Ensure ENEM questions have 5 alternatives
          ...(b.type === "question-enem" && b.alternatives?.length !== 5 ? {
            alternatives: [...(b.alternatives || []), ...Array(5 - (b.alternatives?.length || 0)).fill("")].slice(0, 5)
          } : {}),
        }));

        // Insert uploaded images between text blocks
        const allImages: string[] = [...uploadedImages];
        
        if (numAiImages > 0 && aiImageDescriptions.length > 0) {
          setGeneratingImages(true);
          for (let i = 0; i < Math.min(numAiImages, aiImageDescriptions.length); i++) {
            if (aiImageDescriptions[i]?.trim()) {
              toast.info(`Gerando imagem ${i + 1} de ${numAiImages}...`);
              const imgUrl = await generateAiImage(aiImageDescriptions[i]);
              if (imgUrl) allImages.push(imgUrl);
            }
          }
          setGeneratingImages(false);
        }

        if (allImages.length > 0) {
          const finalBlocks: Block[] = [];
          let imgIdx = 0;
          for (const block of generatedBlocks) {
            finalBlocks.push(block);
            if (block.type === "text" && imgIdx < allImages.length) {
              finalBlocks.push({
                ...emptyBlock("image"),
                imageUrl: allImages[imgIdx],
                imageSize: "medium",
                imageFloat: imagePosition,
              });
              imgIdx++;
            }
          }
          while (imgIdx < allImages.length) {
            finalBlocks.push({
              ...emptyBlock("image"),
              imageUrl: allImages[imgIdx],
              imageSize: "medium",
              imageFloat: imagePosition,
            });
            imgIdx++;
          }
          setBlocks(finalBlocks);
          setUploadedImages([]);
        } else {
          setBlocks(generatedBlocks);
        }
        toast.success(modoEnem ? "Atividade ENEM gerada!" : "Atividade gerada!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar");
    } finally {
      setAiLoading(false);
      setGeneratingImages(false);
    }
  };

  const handleImportPlano = (doc: any) => {
    const p = doc.conteudo || doc;

    // If it's a saved activity, restore blocks directly
    if (p.blocks && Array.isArray(p.blocks)) {
      setBlocks(p.blocks.map((b: any) => ({ ...b, id: genId() })));
      if (p.settings) {
        if (p.settings.autoNumber !== undefined) setAutoNumber(p.settings.autoNumber);
        if (p.settings.showHeader !== undefined) setShowHeader(p.settings.showHeader);
        if (p.settings.escola) setEscola(p.settings.escola);
        if (p.settings.professor) setProfessor(p.settings.professor);
        if (p.settings.turma) setTurma(p.settings.turma);
      }
      toast.success("Atividade restaurada!");
      return;
    }

    // Lesson plan import → use as context for AI to generate student-facing activity
    let contextText = "";
    if (p.identificacao?.tema) contextText += `Tema: ${p.identificacao.tema}\n`;
    if (p.identificacao?.disciplina) contextText += `Disciplina: ${p.identificacao.disciplina}\n`;
    if (p.identificacao?.serie) contextText += `Série: ${p.identificacao.serie}\n`;
    if (p.objetivos?.length) contextText += `\nObjetivos de Aprendizagem:\n${p.objetivos.join('\n')}\n`;
    if (p.desenvolvimento) contextText += `\nDesenvolvimento da Aula:\n${p.desenvolvimento}\n`;
    if (p.conteudo) contextText += `\nConteúdo:\n${p.conteudo}\n`;
    if (p.recursos) contextText += `\nRecursos: ${p.recursos}\n`;
    
    // Set as AI context
    setTextoImportado(contextText || JSON.stringify(p, null, 2).slice(0, 5000));
    setImportFileName(doc.titulo || "Plano de aula");
    if (p.identificacao?.tema) setAiPrompt(`Crie uma atividade para os alunos sobre: ${p.identificacao.tema}`);
    if (p.identificacao?.disciplina) setAiDisciplina(p.identificacao.disciplina);
    setTab("ia");
    toast.success("Plano importado! Configure e clique em 'Gerar Atividade' para criar material para os alunos.");
  };

  const handlePrint = () => {
    const el = document.getElementById("atividade-print-area");
    if (!el) return;
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<html><head><title>Atividade</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css"><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', 'Arial', sans-serif; }
      @page { size: A4; margin: 20mm 15mm; }
      .question { page-break-inside: avoid; }
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
      loadSavedDocs();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleExportDocx = () => {
    exportAtividadeToDocx(blocks, { escola: showHeader ? escola : undefined, professor, turma, autoNumber });
  };

  const handleNumAiImagesChange = (n: number) => {
    setNumAiImages(n);
    setAiImageDescriptions(prev => {
      const newDescs = [...prev];
      while (newDescs.length < n) newDescs.push("");
      return newDescs.slice(0, n);
    });
  };

  return (
    <div className="space-y-4 overflow-x-hidden">
      <EditorTopBar
        title="Criador de Atividades A4"
        onPrint={handlePrint}
        onPdf={() => exportToPdf("atividade-print-area", "atividade")}
        onDocx={handleExportDocx}
        onSave={handleSave}
        saving={saving}
      />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* LEFT PANEL */}
        <div className="space-y-4 pr-1">
          {/* TIMBRE - Primeiro */}
          <Card className="shadow-card">
            <CardContent className="pt-4 space-y-3">
              <h3 className="text-xs font-semibold flex items-center gap-1"><Building2 className="h-3 w-3" /> Cabeçalho da Atividade</h3>
              <div className="flex items-center gap-2">
                <Switch checked={showHeader} onCheckedChange={setShowHeader} id="act-header" />
                <Label htmlFor="act-header" className="text-xs">Mostrar timbre da escola</Label>
              </div>
              {showHeader && (
                <>
                  <TimbreSelector
                    selectedId={selectedTimbreId}
                    onSelect={t => {
                      if (t) {
                        setSelectedTimbreId(t.id);
                        setEscola(t.escola);
                      } else {
                        setSelectedTimbreId(undefined);
                      }
                    }}
                  />
                  <Input placeholder="Nome da escola (ou selecione um timbre)" value={escola} onChange={e => setEscola(e.target.value)} className="h-8 text-xs" />
                </>
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

          {/* Geração de conteúdo */}
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ia" className="text-xs">✨ IA</TabsTrigger>
                  <TabsTrigger value="manual" className="text-xs">📝 Manual</TabsTrigger>
                  <TabsTrigger value="importar" className="text-xs">📥 Importar</TabsTrigger>
                </TabsList>

                <TabsContent value="ia" className="space-y-3 mt-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tema e Instruções</Label>
                    <Textarea
                      placeholder="Descreva o tema e como quer que o texto seja gerado. Ex: Revolução Francesa - Quero um texto que explique as causas, o desenrolar e as consequências."
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      className="min-h-[80px] text-xs"
                    />
                  </div>

                  {/* Imported text preview */}
                  {textoImportado && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-semibold flex items-center gap-1"><FileUp className="h-3 w-3" /> Texto importado{importFileName ? `: ${importFileName}` : ""}</Label>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setTextoImportado(""); setImportFileName(""); }}>✕</Button>
                      </div>
                      <Textarea
                        value={textoImportado}
                        onChange={e => setTextoImportado(e.target.value)}
                        className="min-h-[60px] text-[10px] bg-background"
                        placeholder="Texto importado (edite se necessário)..."
                      />
                      <p className="text-[9px] text-muted-foreground">A IA usará este texto como base para gerar a atividade.</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-[10px]">Disciplina</Label>
                    <Input placeholder="Ex: Matemática, História, Ciências..." value={aiDisciplina} onChange={e => setAiDisciplina(e.target.value)} className="h-8 text-xs" />
                  </div>

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

                  {/* ENEM Mode Toggle */}
                  {aiNivel === "Ensino Médio" && (
                    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={modoEnem} onCheckedChange={setModoEnem} id="enem-mode" />
                        <Label htmlFor="enem-mode" className="text-xs font-semibold flex items-center gap-1">
                          <GraduationCap className="h-4 w-4 text-primary" /> Modo ENEM
                        </Label>
                      </div>
                      {modoEnem && (
                        <div className="text-[9px] text-muted-foreground space-y-0.5">
                          <p>🎯 Questões no padrão ENEM com:</p>
                          <p>• Texto-base (notícia, tirinha, gráfico, etc.)</p>
                          <p>• Enunciado como frase incompleta</p>
                          <p>• 5 alternativas (A-E) com distratores</p>
                          <p>• Avaliação por competências e habilidades</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question type - hidden in ENEM mode */}
                  {!modoEnem && (
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
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {!modoEnem && aiTipo !== "multipla_escolha" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Questões abertas</Label>
                        <Input type="number" min={0} max={20} value={aiNumAbertas === 0 ? "" : aiNumAbertas} onChange={e => setAiNumAbertas(e.target.value === "" ? 0 : parseInt(e.target.value))} className="h-8 text-xs" />
                      </div>
                    )}
                    {(modoEnem || aiTipo !== "aberta") && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">{modoEnem ? "Questões ENEM" : "Questões fechadas"}</Label>
                        <Input type="number" min={0} max={20} value={aiNumFechadas === 0 ? "" : aiNumFechadas} onChange={e => setAiNumFechadas(e.target.value === "" ? 0 : parseInt(e.target.value))} className="h-8 text-xs" />
                      </div>
                    )}
                  </div>

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

                  {/* Separator title */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Título separador (antes das questões)</Label>
                    <Input value={separatorTitle} onChange={e => setSeparatorTitle(e.target.value)} placeholder="Atividades" className="h-8 text-xs" />
                  </div>

                  {/* AI Image Generation */}
                  <div className="space-y-2 rounded-lg border border-dashed border-primary/30 p-2">
                    <Label className="text-xs font-semibold flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> Imagens geradas por IA</Label>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Quantidade de imagens IA</Label>
                      <Input type="number" min={0} max={5} value={numAiImages === 0 ? "" : numAiImages} onChange={e => handleNumAiImagesChange(e.target.value === "" ? 0 : Math.max(0, Math.min(5, parseInt(e.target.value))))} className="h-8 text-xs" />
                    </div>
                    {Array.from({ length: numAiImages }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <Label className="text-[10px]">Descrição da imagem {i + 1}</Label>
                        <Input
                          placeholder={`Ex: Mapa da Europa durante a Revolução Francesa`}
                          value={aiImageDescriptions[i] || ""}
                          onChange={e => {
                            const newDescs = [...aiImageDescriptions];
                            newDescs[i] = e.target.value;
                            setAiImageDescriptions(newDescs);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Manual Image upload */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold flex items-center gap-1"><Image className="h-3 w-3" /> Upload de imagens</Label>
                    <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Carregar imagens do computador</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                    {uploadedImages.length > 0 && (
                      <>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {uploadedImages.map((url, i) => (
                            <img key={i} src={url} alt="" className="h-10 w-10 rounded object-cover border" />
                          ))}
                          <span className="text-[10px] text-muted-foreground self-center ml-1">{uploadedImages.length} imagem(ns)</span>
                        </div>
                      </>
                    )}
                    {(uploadedImages.length > 0 || numAiImages > 0) && (
                      <div className="space-y-1 mt-1">
                        <Label className="text-[10px]">Posição das imagens</Label>
                        <Select value={imagePosition} onValueChange={v => setImagePosition(v as ImageFloat)}>
                          <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">À Esquerda do Texto</SelectItem>
                            <SelectItem value="right">À Direita do Texto</SelectItem>
                            <SelectItem value="none">Centralizada</SelectItem>
                            <SelectItem value="alternating">Intercalada (esq/dir)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Button onClick={handleAiGenerate} disabled={aiLoading || generatingImages} size="sm" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90">
                    {aiLoading || generatingImages ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> {generatingImages ? "Gerando imagens..." : "Gerando..."}</> : <><Sparkles className="mr-1 h-4 w-4" /> {modoEnem ? "Gerar Atividade ENEM" : "Gerar Atividade"}</>}
                  </Button>
                </TabsContent>

                <TabsContent value="manual" className="mt-3 space-y-3">
                  <p className="text-xs text-muted-foreground mb-2">Adicione blocos manualmente:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => addBlock("title")}><Type className="mr-1 h-3 w-3" /> Título</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock("text")}><AlignLeft className="mr-1 h-3 w-3" /> Texto</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock("separator")}><SeparatorHorizontal className="mr-1 h-3 w-3" /> Separador</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock("question-open")}><ListOrdered className="mr-1 h-3 w-3" /> Q. Aberta</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock("question-mc")}><ListOrdered className="mr-1 h-3 w-3" /> Q. Múltipla</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock("question-enem")} className="border-primary/30 text-primary"><GraduationCap className="mr-1 h-3 w-3" /> Q. ENEM</Button>
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

                <TabsContent value="importar" className="mt-3 space-y-3">
                  {/* File upload */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1"><FileUp className="h-3 w-3" /> Importar arquivo</Label>
                    <label className="flex items-center gap-2 cursor-pointer rounded-md border-2 border-dashed border-primary/30 px-3 py-3 hover:bg-primary/5 transition-colors">
                      <Upload className="h-5 w-5 text-primary" />
                      <div>
                        <span className="text-xs font-medium">Carregar PDF, DOCX ou TXT</span>
                        <p className="text-[9px] text-muted-foreground">O texto será extraído e usado como base para a IA</p>
                      </div>
                      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden" onChange={handleFileImport} />
                    </label>
                  </div>

                  {/* Saved documents */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1"><BookOpen className="h-3 w-3" /> Documentos salvos</Label>
                    {savedDocs.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Nenhum documento salvo ainda.</p>
                    ) : (
                      <div className="space-y-1 max-h-[250px] overflow-y-auto">
                        {savedDocs.map(doc => (
                          <Button key={doc.id} variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => handleImportPlano(doc)}>
                            {doc.tipo === "atividade" ? <FileText className="mr-1 h-3 w-3 text-primary" /> : <BookOpen className="mr-1 h-3 w-3 text-green-600" />}
                            <span className="truncate">{doc.titulo}</span>
                            <span className="ml-auto text-[9px] text-muted-foreground">{doc.tipo === "atividade" ? "Atividade" : "Plano"}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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
        <div>
          <A4Preview blocks={blocks} showHeader={showHeader} escola={escola} autoNumber={autoNumber} professor={professor} turma={turma} />
        </div>
      </div>
    </div>
  );
}
