import { useState, useEffect } from "react";
import { FileCheck, Sparkles, Loader2, Building2, Printer, FileDown, Save, Trash2, MoveUp, MoveDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToPdf } from "@/lib/export-utils";
import OMRAnswerSheet from "@/components/exams/OMRAnswerSheet";
import OMRScanner from "@/components/exams/OMRScanner";

const niveis: Record<string, string[]> = {
  "Fundamental - Séries Iniciais": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental - Séries Finais": ["6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
};

interface ExamQuestion {
  id: string;
  type: "mc" | "open";
  content: string;
  alternatives: string[];
  correctIndex: number;
  lines: number;
}

const genId = () => Math.random().toString(36).slice(2, 10);
const emptyMC = (): ExamQuestion => ({ id: genId(), type: "mc", content: "", alternatives: ["", "", "", ""], correctIndex: 0, lines: 0 });
const emptyOpen = (): ExamQuestion => ({ id: genId(), type: "open", content: "", alternatives: [], correctIndex: -1, lines: 4 });

export default function Exams() {
  const [titulo, setTitulo] = useState("");
  const [temas, setTemas] = useState("");
  const [nivel, setNivel] = useState("");
  const [serie, setSerie] = useState("");
  const [tipoQuestoes, setTipoQuestoes] = useState("mista");
  const [numAbertas, setNumAbertas] = useState(3);
  const [numFechadas, setNumFechadas] = useState(5);
  const [showHeader, setShowHeader] = useState(true);
  const [escola, setEscola] = useState("");
  const [professor, setProfessor] = useState("");
  const [turma, setTurma] = useState("");
  const [loading, setLoading] = useState(false);
  const [gerarQr, setGerarQr] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questoes, setQuestoes] = useState<ExamQuestion[]>([]);
  const [mainTab, setMainTab] = useState("criar");

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("profiles").select("escola, nome").eq("user_id", user.id).single();
        if (data?.escola) setEscola(data.escola);
        if (data?.nome) setProfessor(data.nome);
      } catch {}
    })();
  }, []);

  const updateQuestion = (id: string, updates: Partial<ExamQuestion>) =>
    setQuestoes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  const removeQuestion = (id: string) => setQuestoes(prev => prev.filter(q => q.id !== id));
  const moveQuestion = (idx: number, dir: -1 | 1) => {
    setQuestoes(prev => {
      const arr = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= arr.length) return prev;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      return arr;
    });
  };

  const handleAiGenerate = async () => {
    if (!temas.trim()) { toast.error("Insira os temas da prova"); return; }
    setLoading(true);
    try {
      const nA = tipoQuestoes === "multipla_escolha" ? 0 : numAbertas;
      const nF = tipoQuestoes === "aberta" ? 0 : numFechadas;
      const { data, error } = await supabase.functions.invoke("generate-prova", {
        body: { temas, nivel, serie: serie ? `${nivel} - ${serie}` : nivel, tipo: tipoQuestoes, num_abertas: nA, num_fechadas: nF, titulo },
      });
      if (error) throw error;
      if (data?.questoes) {
        const mapped: ExamQuestion[] = data.questoes.map((q: any) => ({
          id: genId(),
          type: q.type === "question-open" ? "open" : "mc",
          content: q.content || "",
          alternatives: q.alternatives || ["", "", "", ""],
          correctIndex: q.correctIndex ?? 0,
          lines: q.lines || 4,
        }));
        setQuestoes(mapped);
        toast.success(`${mapped.length} questões geradas!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar");
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login"); return; }
      await supabase.from("documentos_salvos").insert({
        user_id: user.id, tipo: "prova", titulo: titulo || "Prova sem título",
        nivel: nivel || null,
        conteudo: { questoes, settings: { showHeader, escola, professor, turma, gerarQr } } as any,
      });
      toast.success("Prova salva!");
    } catch (err: any) {
      toast.error(err.message || "Erro");
    } finally { setSaving(false); }
  };

  const handlePrint = () => {
    const el = document.getElementById("prova-print-area");
    if (!el) return;
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<html><head><title>Prova</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Inter', 'Arial', sans-serif; } @page { size: A4; margin: 0; }</style></head><body>`);
    pw.document.write(el.innerHTML);
    pw.document.write("</body></html>");
    pw.document.close();
    pw.focus();
    pw.print();
    pw.close();
  };

  const mcQuestoes = questoes.filter(q => q.type === "mc");
  const gabarito = mcQuestoes.map((q, i) => ({ q: i + 1, correct: q.correctIndex }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-primary" /> Provas e Correção
          </h1>
          <p className="text-muted-foreground text-sm">Crie provas com gabarito OMR e corrija via QR Code</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {questoes.length > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="mr-1 h-4 w-4" /> Imprimir</Button>
              <Button size="sm" variant="outline" onClick={() => exportToPdf("prova-print-area", "prova")}><FileDown className="mr-1 h-4 w-4" /> PDF</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}><Save className="mr-1 h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}</Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="criar">Criar Prova</TabsTrigger>
          <TabsTrigger value="corrigir">Corrigir Prova</TabsTrigger>
        </TabsList>

        <TabsContent value="criar">
          <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
            {/* LEFT - Config */}
            <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {/* AI Generation */}
              <Card className="shadow-card">
                <CardHeader className="py-3"><CardTitle className="text-sm font-semibold flex items-center gap-1"><Sparkles className="h-4 w-4" /> Gerar com IA</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Título da prova</Label>
                    <Input placeholder="Prova de Ciências" value={titulo} onChange={e => setTitulo(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Temas / Conteúdos</Label>
                    <Textarea placeholder="Ex: Sistema Solar, Frações..." value={temas} onChange={e => setTemas(e.target.value)} className="min-h-[60px] text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Nível</Label>
                      <Select value={nivel} onValueChange={v => { setNivel(v); setSerie(""); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Nível" /></SelectTrigger>
                        <SelectContent>{Object.keys(niveis).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Série</Label>
                      <Select value={serie} onValueChange={setSerie} disabled={!nivel}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Série" /></SelectTrigger>
                        <SelectContent>{(niveis[nivel] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Tipo de questões</Label>
                    <Select value={tipoQuestoes} onValueChange={setTipoQuestoes}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mista">Mista (abertas + fechadas)</SelectItem>
                        <SelectItem value="aberta">Só Abertas</SelectItem>
                        <SelectItem value="multipla_escolha">Só Múltipla Escolha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {tipoQuestoes !== "multipla_escolha" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Q. Abertas</Label>
                        <Input type="number" min={0} max={30} value={numAbertas} onChange={e => setNumAbertas(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
                      </div>
                    )}
                    {tipoQuestoes !== "aberta" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Q. Múltipla Escolha</Label>
                        <Input type="number" min={0} max={30} value={numFechadas} onChange={e => setNumFechadas(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
                      </div>
                    )}
                  </div>
                  <Button onClick={handleAiGenerate} disabled={loading} size="sm" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90">
                    {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-1 h-4 w-4" /> Gerar Questões</>}
                  </Button>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card className="shadow-card">
                <CardContent className="pt-4 space-y-3">
                  <h3 className="text-xs font-semibold">Cabeçalho da Prova</h3>
                  <div className="flex items-center gap-2">
                    <Switch checked={showHeader} onCheckedChange={setShowHeader} id="exam-hdr" />
                    <Label htmlFor="exam-hdr" className="text-xs flex items-center gap-1"><Building2 className="h-3 w-3" /> Timbre da escola</Label>
                  </div>
                  {showHeader && <Input placeholder="Nome da escola" value={escola} onChange={e => setEscola(e.target.value)} className="h-8 text-xs" />}
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Professor(a)" value={professor} onChange={e => setProfessor(e.target.value)} className="h-8 text-xs" />
                    <Input placeholder="Turma" value={turma} onChange={e => setTurma(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={gerarQr} onCheckedChange={setGerarQr} id="qr-sw" />
                    <Label htmlFor="qr-sw" className="text-xs">Gabarito OMR com QR Code</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Manual questions */}
              <Card className="shadow-card">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold">📝 Questões ({questoes.length})</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => setQuestoes(prev => [...prev, emptyMC()])}>
                        <Plus className="h-3 w-3 mr-0.5" /> M.E.
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => setQuestoes(prev => [...prev, emptyOpen()])}>
                        <Plus className="h-3 w-3 mr-0.5" /> Aberta
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                  {questoes.map((q, idx) => (
                    <div key={q.id} className="rounded-lg border p-2.5 space-y-2 bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">
                          {idx + 1}. {q.type === "mc" ? "Múltipla Escolha" : "Aberta"}
                        </span>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0} onClick={() => moveQuestion(idx, -1)}><MoveUp className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === questoes.length - 1} onClick={() => moveQuestion(idx, 1)}><MoveDown className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeQuestion(q.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <Textarea value={q.content} onChange={e => updateQuestion(q.id, { content: e.target.value })} placeholder="Enunciado da questão" className="min-h-[40px] text-xs" />
                      {q.type === "mc" && (
                        <div className="space-y-1">
                          {q.alternatives.map((alt, ai) => (
                            <div key={ai} className="flex gap-1 items-center">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctIndex === ai}
                                onChange={() => updateQuestion(q.id, { correctIndex: ai })}
                                className="h-3 w-3 accent-primary"
                              />
                              <span className="text-[10px] font-mono w-4">{String.fromCharCode(65 + ai)})</span>
                              <Input
                                value={alt}
                                onChange={e => {
                                  const alts = [...q.alternatives];
                                  alts[ai] = e.target.value;
                                  updateQuestion(q.id, { alternatives: alts });
                                }}
                                className="h-6 text-[11px]"
                                placeholder={`Alternativa ${String.fromCharCode(65 + ai)}`}
                              />
                            </div>
                          ))}
                          <p className="text-[9px] text-muted-foreground">🔘 Selecione a alternativa correta</p>
                        </div>
                      )}
                      {q.type === "open" && (
                        <div className="flex items-center gap-2">
                          <Label className="text-[10px]">Linhas:</Label>
                          <Input type="number" min={1} max={20} value={q.lines} onChange={e => updateQuestion(q.id, { lines: parseInt(e.target.value) || 4 })} className="h-6 w-14 text-[11px]" />
                        </div>
                      )}
                    </div>
                  ))}
                  {questoes.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Gere questões com IA ou adicione manualmente</p>}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT - Preview */}
            <div className="overflow-auto max-h-[calc(100vh-200px)]">
              <div className="bg-muted/30 rounded-lg p-4 flex justify-center">
                <div
                  id="prova-print-area"
                  className="bg-white text-black shadow-lg"
                  style={{ width: "210mm", minHeight: "297mm", padding: "15mm", fontFamily: "'Inter', 'Arial', sans-serif", fontSize: "11pt", lineHeight: 1.6 }}
                >
                  {/* School header */}
                  {showHeader && escola && (
                    <div style={{ textAlign: "center", fontWeight: 700, fontSize: "14pt", marginBottom: "4mm", fontFamily: "'Montserrat', sans-serif", borderBottom: "2px solid #2563eb", paddingBottom: "3mm" }}>
                      {escola}
                    </div>
                  )}
                  <h1 style={{ textAlign: "center", fontSize: "14pt", fontWeight: 700, fontFamily: "'Montserrat', sans-serif", marginBottom: "4mm" }}>
                    {titulo || "Prova"}
                  </h1>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", marginBottom: "2mm", color: "#475569" }}>
                    {professor && <span><strong>Professor(a):</strong> {professor}</span>}
                    {turma && <span><strong>Turma:</strong> {turma}</span>}
                  </div>
                  <div style={{ display: "flex", gap: "10mm", fontSize: "10pt", marginBottom: "6mm", borderBottom: "1px solid #e2e8f0", paddingBottom: "4mm" }}>
                    <span>Nome: ________________________________________</span>
                    <span>Data: ___/___/___</span>
                    <span>Nota: _____</span>
                  </div>

                  {/* Questions */}
                  {questoes.map((q, idx) => (
                    <div key={q.id} style={{ marginBottom: "6mm" }}>
                      <p style={{ fontWeight: 600, marginBottom: "2mm", textAlign: "justify" }}>
                        {idx + 1}) {q.content || "Enunciado da questão"}
                      </p>
                      {q.type === "mc" && q.alternatives.map((alt, ai) => (
                        <p key={ai} style={{ marginLeft: "5mm", marginBottom: "1mm" }}>
                          <span style={{ fontWeight: 600 }}>{String.fromCharCode(65 + ai)})</span>{" "}
                          {alt || `Alternativa ${String.fromCharCode(65 + ai)}`}
                        </p>
                      ))}
                      {q.type === "open" && Array.from({ length: q.lines }).map((_, li) => (
                        <div key={li} style={{ borderBottom: "1px solid #d1d5db", height: "8mm", marginBottom: "1mm" }} />
                      ))}
                    </div>
                  ))}

                  {/* OMR Answer Sheet */}
                  {mcQuestoes.length > 0 && gerarQr && (
                    <OMRAnswerSheet
                      titulo={titulo}
                      escola={escola}
                      professor={professor}
                      turma={turma}
                      numMcQuestions={mcQuestoes.length}
                      gabarito={gabarito}
                    />
                  )}

                  {questoes.length === 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#94a3b8", fontSize: "10pt" }}>
                      Gere questões com IA ou adicione manualmente
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="corrigir">
          <OMRScanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
