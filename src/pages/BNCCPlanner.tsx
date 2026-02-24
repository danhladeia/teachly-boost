import { useState } from "react";
import { BookOpen, Sparkles, FileDown, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const niveis = [
  { value: "fundamental_iniciais", label: "Fundamental - Séries Iniciais (1º ao 5º ano)" },
  { value: "fundamental_finais", label: "Fundamental - Séries Finais (6º ao 9º ano)" },
  { value: "ensino_medio", label: "Ensino Médio" },
];

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
    "Língua Portuguesa", "Matemática", "Física", "Química", "Biologia",
    "Geografia", "História", "Filosofia", "Sociologia", "Arte",
    "Educação Física", "Língua Inglesa", "Língua Espanhola", "Novo Ensino Médio",
  ],
};

interface PlanoGerado {
  identificacao?: { disciplina?: string; nivel?: string; duracao?: string; tema?: string };
  habilidades_bncc?: { codigo: string; descricao: string }[];
  objetivos?: string[];
  recursos?: string[];
  cronograma?: { introducao?: string; desenvolvimento?: string; fechamento?: string };
  gancho_inicial?: string;
  desenvolvimento?: string;
  avaliacao?: string;
  diferenciacao?: string;
  metodologias_ativas?: string[];
  raw?: string;
}

export default function BNCCPlanner() {
  const [nivel, setNivel] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [disciplinaCustom, setDisciplinaCustom] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [loading, setLoading] = useState(false);
  const [plano, setPlano] = useState<PlanoGerado | null>(null);

  const disciplinaFinal = disciplina === "Novo Ensino Médio" ? disciplinaCustom : disciplina;
  const nivelLabel = niveis.find(n => n.value === nivel)?.label || nivel;

  const handleGenerate = async () => {
    if (!nivel || !disciplinaFinal || !conteudo.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    setPlano(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-plano", {
        body: { nivel: nivelLabel, disciplina: disciplinaFinal, conteudo },
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Planejador BNCC
        </h1>
        <p className="text-muted-foreground mt-1">Crie planos de aula completos e alinhados à BNCC com inteligência artificial</p>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg">Configurar Plano de Aula</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nível de Ensino</Label>
            <Select value={nivel} onValueChange={(v) => { setNivel(v); setDisciplina(""); setDisciplinaCustom(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione o nível" /></SelectTrigger>
              <SelectContent>
                {niveis.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

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

          <div className="space-y-2">
            <Label>Conteúdo / Tema da Aula</Label>
            <Input
              placeholder='Ex: "Sistema Solar", "Frações", "Guerra do Paraguai", "Figuras de Linguagem"'
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !nivel || !disciplinaFinal || !conteudo.trim()}
            size="lg"
            className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90"
          >
            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando plano...</> : <><Sparkles className="mr-2 h-5 w-5" /> Gerar Plano Completo com IA</>}
          </Button>
        </CardContent>
      </Card>

      {plano && !plano.raw && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Plano de Aula Gerado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Identificação */}
            {plano.identificacao && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <h4 className="font-display font-bold text-sm text-primary mb-2">📋 Identificação</h4>
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  <p><strong>Disciplina:</strong> {plano.identificacao.disciplina}</p>
                  <p><strong>Nível:</strong> {plano.identificacao.nivel}</p>
                  <p><strong>Duração:</strong> {plano.identificacao.duracao}</p>
                  <p><strong>Tema:</strong> {plano.identificacao.tema}</p>
                </div>
              </div>
            )}

            {/* Habilidades BNCC */}
            {plano.habilidades_bncc && plano.habilidades_bncc.length > 0 && (
              <div>
                <h4 className="font-display font-bold text-sm text-primary mb-2">📚 Habilidades BNCC</h4>
                <div className="space-y-2">
                  {plano.habilidades_bncc.map((h, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <span className="font-mono text-xs text-primary font-semibold">{h.codigo}</span>
                      <p className="text-muted-foreground mt-1">{h.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Objetivos */}
            {plano.objetivos && (
              <div>
                <h4 className="font-display font-bold text-sm text-primary mb-2">🎯 Objetivos de Aprendizagem</h4>
                <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
                  {plano.objetivos.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}

            {/* Gancho Inicial */}
            {plano.gancho_inicial && (
              <div>
                <h4 className="font-display font-bold text-sm text-primary mb-2">🪝 Gancho Inicial (Hook)</h4>
                <p className="text-sm text-muted-foreground bg-accent/50 rounded-lg p-3">{plano.gancho_inicial}</p>
              </div>
            )}

            {/* Cronograma */}
            {plano.cronograma && (
              <div>
                <h4 className="font-display font-bold text-sm text-primary mb-2">⏱️ Cronograma</h4>
                <div className="space-y-2 text-sm">
                  {plano.cronograma.introducao && <p><strong>Introdução:</strong> {plano.cronograma.introducao}</p>}
                  {plano.cronograma.desenvolvimento && <p><strong>Desenvolvimento:</strong> {plano.cronograma.desenvolvimento}</p>}
                  {plano.cronograma.fechamento && <p><strong>Fechamento:</strong> {plano.cronograma.fechamento}</p>}
                </div>
              </div>
            )}

            {/* Desenvolvimento */}
            {plano.desenvolvimento && (
              <div>
                <h4 className="font-display font-bold text-sm text-primary mb-2">📖 Desenvolvimento</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-line bg-secondary/50 rounded-lg p-4">{plano.desenvolvimento}</div>
              </div>
            )}

            {/* Metodologias Ativas */}
            {plano.metodologias_ativas && plano.metodologias_ativas.length > 0 && (
              <div>
                <h4 className="font-display font-bold text-sm text-primary mb-2">🚀 Metodologias Ativas</h4>
                <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
                  {plano.metodologias_ativas.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}

            {/* Recursos */}
            {plano.recursos && (
              <div>
                <h4 className="font-display font-bold text-sm text-primary mb-2">🧰 Recursos Necessários</h4>
                <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
                  {plano.recursos.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {/* Avaliação */}
            {plano.avaliacao && (
              <div>
                <h4 className="font-display font-bold text-sm text-primary mb-2">✅ Avaliação</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{plano.avaliacao}</p>
              </div>
            )}

            {/* Diferenciação */}
            {plano.diferenciacao && (
              <div>
                <h4 className="font-display font-bold text-sm text-primary mb-2">♿ Diferenciação</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{plano.diferenciacao}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Exportar PDF</Button>
              <Button variant="outline"><Copy className="mr-2 h-4 w-4" /> Duplicar</Button>
            </div>
          </CardContent>
        </Card>
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
