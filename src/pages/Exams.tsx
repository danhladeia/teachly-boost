import { useState, useEffect } from "react";
import { FileCheck, Sparkles, Upload, Loader2, QrCode, Building2, Printer, FileDown, Save } from "lucide-react";
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

const niveis: Record<string, string[]> = {
  "Fundamental - Séries Iniciais": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental - Séries Finais": ["6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
};

export default function Exams() {
  const [titulo, setTitulo] = useState("");
  const [tema, setTema] = useState("");
  const [nivel, setNivel] = useState("");
  const [serie, setSerie] = useState("");
  const [numQuestoes, setNumQuestoes] = useState(10);
  const [tipoQuestoes, setTipoQuestoes] = useState("mista");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [escola, setEscola] = useState("");
  const [professor, setProfessor] = useState("");
  const [loading, setLoading] = useState(false);
  const [gerarQr, setGerarQr] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("escola, nome").eq("user_id", user.id).single();
      if (data?.escola) setEscola(data.escola);
      if (data?.nome) setProfessor(data.nome);
    } catch {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setArquivo(file); toast.success(`Arquivo "${file.name}" carregado`); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileCheck className="h-6 w-6 text-primary" /> Provas e Correção
        </h1>
        <p className="text-muted-foreground mt-1">Crie provas por IA ou arquivo e corrija automaticamente com QR Code</p>
      </div>

      <Tabs defaultValue="criar">
        <TabsList>
          <TabsTrigger value="criar">Criar Prova</TabsTrigger>
          <TabsTrigger value="corrigir">Corrigir por QR Code</TabsTrigger>
        </TabsList>

        <TabsContent value="criar">
          <Card className="shadow-card mt-4">
            <CardHeader><CardTitle className="font-display text-lg">Nova Prova</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Título da prova</Label>
                  <Input placeholder="Prova de Ciências - 4º ano" value={titulo} onChange={e => setTitulo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tema / Conteúdo</Label>
                  <Input placeholder="Ex: Sistema Solar, Frações" value={tema} onChange={e => setTema(e.target.value)} />
                </div>
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
                  <Label>Nº de questões</Label>
                  <Input type="number" min={1} max={50} value={numQuestoes} onChange={e => setNumQuestoes(parseInt(e.target.value) || 10)} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de questões</Label>
                  <Select value={tipoQuestoes} onValueChange={setTipoQuestoes}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mista">Mista (abertas + fechadas)</SelectItem>
                      <SelectItem value="aberta">Só Abertas</SelectItem>
                      <SelectItem value="multipla_escolha">Só Múltipla Escolha</SelectItem>
                    </SelectContent>
                  </Select>
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

              {/* Branding & header */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-semibold">Cabeçalho da Prova</h4>
                <div className="flex items-center gap-2">
                  <Switch checked={showHeader} onCheckedChange={setShowHeader} id="exam-header" />
                  <Label htmlFor="exam-header" className="text-sm flex items-center gap-1"><Building2 className="h-4 w-4" /> Timbre da escola</Label>
                </div>
                {showHeader && <Input placeholder="Nome da escola" value={escola} onChange={e => setEscola(e.target.value)} />}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input placeholder="Professor(a)" value={professor} onChange={e => setProfessor(e.target.value)} />
                  <Input placeholder="Turma (opcional)" />
                </div>
                <p className="text-xs text-muted-foreground">Campos impressos: Nome do aluno _______ | Data ___/___/___ | Nota _____</p>
              </div>

              <div className="flex items-center gap-2 border-t pt-4">
                <Switch checked={gerarQr} onCheckedChange={setGerarQr} id="qr-switch" />
                <Label htmlFor="qr-switch" className="text-sm flex items-center gap-1"><QrCode className="h-4 w-4" /> Gerar QR Code para correção automática</Label>
              </div>
              {gerarQr && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  Um QR Code será inserido na prova com o gabarito codificado. Na aba "Corrigir por QR Code", escaneie o código para corrigir automaticamente.
                </p>
              )}

              <Button size="lg" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90" disabled={loading || !tema.trim()}>
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando prova...</> : <><Sparkles className="mr-2 h-5 w-5" /> Gerar Prova com IA</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="corrigir">
          <Card className="shadow-card mt-4">
            <CardHeader><CardTitle className="font-display text-lg">Correção por QR Code</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <p className="text-muted-foreground text-center max-w-sm">
                Escaneie o QR Code da prova para carregar o gabarito automaticamente. Em seguida, insira as respostas do aluno para correção instantânea.
              </p>
              <Button className="gradient-primary border-0 text-primary-foreground hover:opacity-90">
                <QrCode className="mr-2 h-4 w-4" /> Escanear QR Code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
