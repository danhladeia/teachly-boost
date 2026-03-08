import { useState, useEffect } from "react";
import { BookOpen, Sparkles, Loader2, RefreshCw, Pencil, AlertTriangle } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PlanoPreview from "@/components/bncc/PlanoPreview";

const niveis = [
  { value: "fundamental_iniciais", label: "Fundamental - Séries Iniciais (1º ao 5º ano)" },
  { value: "fundamental_finais", label: "Fundamental - Séries Finais (6º ao 9º ano)" },
  { value: "ensino_medio", label: "Ensino Médio" },
];

const seriesPorNivel: Record<string, string[]> = {
  fundamental_iniciais: ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  fundamental_finais: ["6º ano", "7º ano", "8º ano", "9º ano"],
  ensino_medio: ["1ª série", "2ª série", "3ª série"],
};

const disciplinasPorNivel: Record<string, string[]> = {
  fundamental_iniciais: [
    "Língua Portuguesa", "Matemática", "Ciências", "Geografia", "História",
    "Arte", "Educação Física", "Ensino Religioso",
  ],
  fundamental_finais: [
    "Língua Portuguesa", "Matemática", "Ciências", "Geografia", "História",
    "Arte", "Educação Física", "Língua Inglesa", "Ensino Religioso",
  ],
  ensino_medio: [
    "Língua Portuguesa", "Matemática", "Linguagens e suas Tecnologias",
    "Ciências da Natureza e suas Tecnologias", "Ciências Humanas e Sociais Aplicadas",
    "Arte", "Educação Física", "Língua Inglesa", "Novo Ensino Médio",
  ],
};

const modeloDescricoes: Record<string, { titulo: string; desc: string }> = {
  simples: { titulo: "⚡ Simples", desc: "Rápido e objetivo. Ideal para aulas pontuais." },
  tradicional: { titulo: "📋 Tradicional", desc: "Completo e alinhado à BNCC com metodologia detalhada." },
  criativo: { titulo: "🚀 Criativo (PBL)", desc: "Metodologias ativas, Sala Invertida e Gamificação." },
};

export default function BNCCPlanner() {
  const [nivel, setNivel] = useState("");
  const [serie, setSerie] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [disciplinaCustom, setDisciplinaCustom] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [modelo, setModelo] = useState("tradicional");
  const [quantidadeAulas, setQuantidadeAulas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plano, setPlano] = useState<any>(null);
  const [refinamentoTexto, setRefinamentoTexto] = useState("");
  const [refinando, setRefinando] = useState(false);
  const [showRefinamento, setShowRefinamento] = useState(false);
  const [professor, setProfessor] = useState("");
  const [turma, setTurma] = useState("");

  const disciplinaFinal = disciplina === "Novo Ensino Médio" ? disciplinaCustom : disciplina;
  const nivelLabel = niveis.find(n => n.value === nivel)?.label || nivel;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("nome").eq("user_id", user.id).single();
      if (data?.nome) setProfessor(data.nome);
    } catch {}
  };

  const handleGenerate = async () => {
    if (!nivel || !disciplinaFinal || !conteudo.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    setPlano(null);
    setShowRefinamento(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-plano", {
        body: { nivel: nivelLabel, serie, disciplina: disciplinaFinal, conteudo, modelo, quantidade_aulas: quantidadeAulas },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlano(data.plano);
      toast.success("Plano de aula gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar plano");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refinamentoTexto.trim() || !plano) return;
    setRefinando(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-plano", {
        body: { refinamento: refinamentoTexto, plano_anterior: plano },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlano(data.plano);
      setRefinamentoTexto("");
      setShowRefinamento(false);
      toast.success("Plano ajustado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao refinar plano");
    } finally {
      setRefinando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Planejador BNCC
        </h1>
        <p className="text-muted-foreground mt-1">Crie planos de aula completos e alinhados à BNCC com inteligência artificial</p>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg">Configurar Plano de Aula</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {/* Modelo selector */}
          <div className="space-y-2">
            <Label className="font-semibold">Modelo do Plano</Label>
            <Tabs value={modelo} onValueChange={setModelo} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {Object.entries(modeloDescricoes).map(([key, val]) => (
                  <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">{val.titulo}</TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(modeloDescricoes).map(([key, val]) => (
                <TabsContent key={key} value={key}>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{val.desc}</p>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Nível */}
            <div className="space-y-2">
              <Label>Nível de Ensino</Label>
              <Select value={nivel} onValueChange={(v) => { setNivel(v); setSerie(""); setDisciplina(""); setDisciplinaCustom(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o nível" /></SelectTrigger>
                <SelectContent>
                  {niveis.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Série */}
            {nivel && (
              <div className="space-y-2">
                <Label>Série / Ano</Label>
                <Select value={serie} onValueChange={setSerie}>
                  <SelectTrigger><SelectValue placeholder="Selecione a série" /></SelectTrigger>
                  <SelectContent>
                    {seriesPorNivel[nivel]?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Disciplina */}
            {nivel && (
              <div className="space-y-2">
                <Label>Disciplina</Label>
                <Select value={disciplina} onValueChange={setDisciplina}>
                  <SelectTrigger><SelectValue placeholder="Selecione a disciplina" /></SelectTrigger>
                  <SelectContent>
                    {disciplinasPorNivel[nivel]?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {disciplina === "Novo Ensino Médio" && (
            <div className="space-y-2">
              <Label>Nome da Disciplina / Itinerário Formativo</Label>
              <Input
                placeholder="Ex: Projeto de Vida, Cultura Digital, etc."
                value={disciplinaCustom}
                onChange={(e) => setDisciplinaCustom(e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Conteúdo / Tema da Aula</Label>
              <Input
                placeholder='Ex: "Sistema Solar", "Frações", "Revolução Francesa"'
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantidade de Aulas</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={quantidadeAulas}
                onChange={(e) => setQuantidadeAulas(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                placeholder="1"
              />
              {quantidadeAulas > 1 && (
                <p className="text-xs text-muted-foreground">A IA gerará um cronograma aula a aula ({quantidadeAulas} aulas)</p>
              )}
            </div>
          </div>

          {/* Professor e Turma opcionais */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Professor(a) <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input placeholder="Nome do professor" value={professor} onChange={e => setProfessor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Turma <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input placeholder="Ex: 5ºA, Turma 301" value={turma} onChange={e => setTurma(e.target.value)} />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !nivel || !disciplinaFinal || !conteudo.trim()}
            size="lg"
            className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando plano {modeloDescricoes[modelo]?.titulo}...</>
            ) : (
              <><Sparkles className="mr-2 h-5 w-5" /> Gerar Plano {modeloDescricoes[modelo]?.titulo}</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Plano gerado */}
      {plano && !plano.raw && (
        <>
          <PlanoPreview plano={plano} modelo={modelo} professor={professor} turma={turma} serie={serie} />

          {/* Refinamento */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              {!showRefinamento ? (
                <Button variant="outline" onClick={() => setShowRefinamento(true)} className="w-full">
                  <Pencil className="mr-2 h-4 w-4" /> Pedir Ajuste ao Plano
                </Button>
              ) : (
                <div className="space-y-3">
                  <Label className="font-semibold">Descreva o ajuste desejado</Label>
                  <Textarea
                    placeholder='Ex: "Simplifique para alunos de inclusão", "Adicione mais atividades práticas", "Foque em gamificação"'
                    value={refinamentoTexto}
                    onChange={(e) => setRefinamentoTexto(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleRefine} disabled={refinando || !refinamentoTexto.trim()}>
                      {refinando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ajustando...</> : <><RefreshCw className="mr-2 h-4 w-4" /> Aplicar Ajuste</>}
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowRefinamento(false); setRefinamentoTexto(""); }}>Cancelar</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {plano?.raw && (
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-lg">Plano de Aula Gerado</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={plano.raw} readOnly className="min-h-[400px] text-sm" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
