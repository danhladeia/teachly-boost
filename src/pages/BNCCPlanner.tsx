import { useState } from "react";
import { BookOpen, Search, Sparkles, FileDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const series = ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano", "6º ano", "7º ano", "8º ano", "9º ano"];
const disciplinas = ["Matemática", "Português", "Ciências", "História", "Geografia"];

const mockHabilidades = [
  { codigo: "EF04CI08", titulo: "Sistema Solar", descricao: "Identificar os movimentos da Terra (rotação e translação) e seus efeitos." },
  { codigo: "EF04CI09", titulo: "Fases da Lua", descricao: "Identificar as fases da Lua e associar ao seu movimento em torno da Terra." },
  { codigo: "EF04CI10", titulo: "Estrelas e constelações", descricao: "Comparar as indicações dos pontos cardeais a partir da observação de estrelas." },
];

export default function BNCCPlanner() {
  const [serie, setSerie] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [habilidades, setHabilidades] = useState(mockHabilidades);
  const [selected, setSelected] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);
  const [plano, setPlano] = useState<null | { objetivos: string; metodologia: string; recursos: string; avaliacao: string }>(null);

  const handleSearch = () => {
    setSearched(true);
    // In real app, filter from bncc.json based on serie + disciplina + conteudo
  };

  const handleGenerate = () => {
    setPlano({
      objetivos: "• Compreender a estrutura do Sistema Solar e a posição dos planetas.\n• Identificar os movimentos de rotação e translação da Terra.\n• Relacionar os movimentos da Terra com dia/noite e estações do ano.",
      metodologia: "1. Roda de conversa inicial: o que os alunos sabem sobre o Sistema Solar?\n2. Apresentação de slides com imagens reais dos planetas (15 min)\n3. Atividade prática: construção de maquete do Sistema Solar com bolas de isopor\n4. Jogo de caça-palavras com termos astronômicos\n5. Registro no caderno com desenho dos planetas em ordem",
      recursos: "• Projetor multimídia\n• Bolas de isopor de tamanhos variados\n• Tintas guache\n• Caça-palavras impresso\n• Vídeo educativo (5 min)",
      avaliacao: "• Participação na roda de conversa (observação)\n• Maquete do Sistema Solar (avaliação prática)\n• Atividade escrita: nomear os planetas em ordem de distância do Sol",
    });
  };

  const toggleHabilidade = (codigo: string) => {
    setSelected((prev) => prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Planejador BNCC
        </h1>
        <p className="text-muted-foreground mt-1">Crie planos de aula alinhados à BNCC com inteligência artificial</p>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg">Buscar habilidades</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Série</Label>
              <Select value={serie} onValueChange={setSerie}>
                <SelectTrigger><SelectValue placeholder="Selecione a série" /></SelectTrigger>
                <SelectContent>{series.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select value={disciplina} onValueChange={setDisciplina}>
                <SelectTrigger><SelectValue placeholder="Selecione a disciplina" /></SelectTrigger>
                <SelectContent>{disciplinas.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Conteúdo da aula</Label>
            <Input placeholder='Ex: "Sistema Solar", "Frações", "Guerra do Paraguai"' value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
          </div>
          <Button onClick={handleSearch} className="gradient-primary border-0 text-primary-foreground hover:opacity-90">
            <Search className="mr-2 h-4 w-4" /> Buscar Habilidades BNCC
          </Button>
        </CardContent>
      </Card>

      {searched && (
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-lg">Habilidades encontradas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {habilidades.map((h) => (
              <label key={h.codigo} className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                <Checkbox checked={selected.includes(h.codigo)} onCheckedChange={() => toggleHabilidade(h.codigo)} className="mt-1" />
                <div>
                  <p className="font-mono text-xs text-primary font-semibold">{h.codigo}</p>
                  <p className="font-medium text-sm">{h.titulo}</p>
                  <p className="text-sm text-muted-foreground">{h.descricao}</p>
                </div>
              </label>
            ))}
            <Button onClick={handleGenerate} disabled={selected.length === 0} size="lg" className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90">
              <Sparkles className="mr-2 h-5 w-5" /> Gerar Plano Completo com IA
            </Button>
          </CardContent>
        </Card>
      )}

      {plano && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Plano de Aula Gerado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { title: "Objetivos", content: plano.objetivos },
              { title: "Metodologia", content: plano.metodologia },
              { title: "Recursos Necessários", content: plano.recursos },
              { title: "Avaliação", content: plano.avaliacao },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-display font-bold text-sm text-primary mb-2">{section.title}</h4>
                <Textarea value={section.content} readOnly className="min-h-[100px] text-sm resize-none" />
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Exportar PDF</Button>
              <Button variant="outline"><Copy className="mr-2 h-4 w-4" /> Duplicar</Button>
              <Button className="gradient-primary border-0 text-primary-foreground hover:opacity-90">Usar para Atividade</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
