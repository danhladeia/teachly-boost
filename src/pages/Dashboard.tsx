import { useEffect, useState } from "react";
import { BookOpen, FileText, Gamepad2, Presentation, FileCheck, Trash2, Eye, GitBranch, StickyNote, Stamp, Sun, Moon, Sunset, FolderOpen, ArrowRight } from "lucide-react";
import CreditsIndicator from "@/components/CreditsIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";


const tipoConfig: Record<string, { label: string; icon: any; color: string; route: string }> = {
  plano: { label: "Plano de Aula", icon: BookOpen, color: "text-primary", route: "/app/bncc" },
  atividade: { label: "Atividade", icon: FileText, color: "text-accent-foreground", route: "/app/atividades" },
  jogo: { label: "Jogo", icon: Gamepad2, color: "text-plan-pratico", route: "/app/jogos" },
  slide: { label: "Slides", icon: Presentation, color: "text-plan-mestre", route: "/app/slides" },
  prova: { label: "Prova", icon: FileCheck, color: "text-destructive", route: "/app/provas" },
};

const tools = [
  { title: "Planejador BNCC", icon: BookOpen, route: "/app/bncc", color: "text-primary", bg: "bg-primary/10" },
  { title: "Atividades A4", icon: FileText, route: "/app/atividades", color: "text-accent-foreground", bg: "bg-accent" },
  { title: "Slides", icon: Presentation, route: "/app/slides", color: "text-plan-mestre", bg: "bg-plan-mestre/10" },
  { title: "Jogos", icon: Gamepad2, route: "/app/jogos", color: "text-plan-pratico", bg: "bg-plan-pratico/10" },
  { title: "Diagramas", icon: GitBranch, route: "/app/diagramas", color: "text-primary", bg: "bg-primary/10" },
  { title: "Provas", icon: FileCheck, route: "/app/provas", color: "text-destructive", bg: "bg-destructive/10" },
  { title: "Notas", icon: StickyNote, route: "/app/notas", color: "text-plan-mestre", bg: "bg-plan-mestre/10" },
  { title: "Timbres", icon: Stamp, route: "/app/timbres", color: "text-accent-foreground", bg: "bg-accent" },
];

const frasesEducacionais = [
  { frase: "Educação não transforma o mundo. Educação muda as pessoas. Pessoas transformam o mundo.", autor: "Paulo Freire" },
  { frase: "A educação é a arma mais poderosa que você pode usar para mudar o mundo.", autor: "Nelson Mandela" },
  { frase: "O objetivo da educação é a virtude e o desejo de se tornar um bom cidadão.", autor: "Platão" },
  { frase: "Educar é semear com sabedoria e colher com paciência.", autor: "Augusto Cury" },
  { frase: "A tarefa essencial do professor é despertar a alegria de trabalhar e de conhecer.", autor: "Albert Einstein" },
  { frase: "Uma criança, um professor, um livro e uma caneta podem mudar o mundo.", autor: "Malala Yousafzai" },
  { frase: "O conhecimento é a única coisa que ninguém pode tirar de você.", autor: "B. B. King" },
  { frase: "Se você acha que a educação é cara, experimente a ignorância.", autor: "Derek Bok" },
  { frase: "Ensinar não é transferir conhecimento, mas criar as possibilidades para a sua própria produção ou a sua construção.", autor: "Paulo Freire" },
  { frase: "O que sabemos é uma gota; o que ignoramos é um oceano.", autor: "Isaac Newton" },
  { frase: "A raiz do estudo é amarga, mas seus frutos são doces.", autor: "Aristóteles" },
  { frase: "A educação não é preparação para a vida; a educação é a própria vida.", autor: "John Dewey" },
  { frase: "O importante na educação não é apenas ensinar a somar, mas sim ensinar a dividir.", autor: "Millôr Fernandes" },
  { frase: "A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original.", autor: "Albert Einstein" },
  { frase: "A educação é o passaporte para o futuro, pois o amanhã pertence àqueles que se preparam hoje.", autor: "Malcolm X" },
  { frase: "Feliz aquele que transfere o que sabe e aprende o que ensina.", autor: "Cora Coralina" },
  { frase: "A verdadeira educação consiste em pôr a descoberto ou fazer atualizar o melhor de uma pessoa.", autor: "Mahatma Gandhi" },
  { frase: "Para viajar para longe, não há melhor nave do que um livro.", autor: "Emily Dickinson" },
  { frase: "O analfabeto do futuro não será aquele que não sabe ler, mas aquele que não sabe como aprender.", autor: "Alvin Toffler" },
  { frase: "A maior descoberta de todos os tempos é que uma pessoa pode mudar seu futuro basta mudar sua atitude.", autor: "Oprah Winfrey" },
  { frase: "O conhecimento torna a alma jovem e diminui a amargura da velhice.", autor: "Leonardo da Vinci" },
  { frase: "A única coisa que interfere com minha aprendizagem é a minha educação.", autor: "Albert Einstein" },
  { frase: "Não se pode falar de educação sem amor.", autor: "Paulo Freire" },
  { frase: "Educação gera confiança. Confiança gera esperança. Esperança gera paz.", autor: "Confúcio" },
  { frase: "O propósito da educação é substituir uma mente vazia por uma mente aberta.", autor: "Malcolm Forbes" },
  { frase: "Aprender é a única coisa de que a mente nunca se cansa, nunca tem medo e nunca se arrepende.", autor: "Leonardo da Vinci" },
];

function getDailyQuote() {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return frasesEducacionais[dayOfYear % frasesEducacionais.length];
}

function getGreeting(): { text: string; Icon: typeof Sun } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: "Bom dia", Icon: Sun };
  if (h >= 12 && h < 18) return { text: "Boa tarde", Icon: Sunset };
  return { text: "Boa noite", Icon: Moon };
}

function getBarColor(percent: number) {
  if (percent >= 91) return "bg-destructive";
  if (percent >= 71) return "bg-yellow-500";
  return "bg-primary";
}

export default function Dashboard() {
  const [docs, setDocs] = useState<any[]>([]);
  const [provas, setProvas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();


  useEffect(() => {
    loadDocs();
    loadUserName();
  }, [user]);

  const loadUserName = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle();
    if (data?.nome) setUserName(data.nome.split(" ")[0]);
  };

  const loadDocs = async () => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      const [{ data: savedDocs }, { data: provasData }] = await Promise.all([
        supabase.from("documentos_salvos")
          .select("id, titulo, tipo, modelo, disciplina, nivel, created_at")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("provas")
          .select("id, titulo, temas, nivel, serie, created_at")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (savedDocs) setDocs(savedDocs);
      if (provasData) {
        setProvas(provasData.map((p: any) => ({
          id: p.id, titulo: p.titulo, tipo: "prova",
          disciplina: p.temas, nivel: p.nivel, created_at: p.created_at, source: "provas",
        })));
      }
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async (item: any) => {
    try {
      if (item.source === "provas") {
        await supabase.from("questoes").delete().eq("prova_id", item.id);
        await supabase.from("versoes_prova").delete().eq("prova_id", item.id);
        const { error } = await supabase.from("provas").delete().eq("id", item.id);
        if (error) throw error;
        setProvas(prev => prev.filter(d => d.id !== item.id));
      } else {
        const { error } = await supabase.from("documentos_salvos").delete().eq("id", item.id);
        if (error) throw error;
        setDocs(prev => prev.filter(d => d.id !== item.id));
      }
      toast.success("Documento excluído");
    } catch { toast.error("Erro ao excluir"); }
  };

  const allDocs = [...docs, ...provas].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const recentDocs = allDocs.slice(0, 5);

  const { text: greetingText, Icon: GreetingIcon } = getGreeting();



  return (
    <div className="space-y-6">
      {/* Header with greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <GreetingIcon className="h-6 w-6 text-primary" />
            {greetingText}{userName ? `, Professor(a) ${userName}!` : "!"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Acesso rápido às suas ferramentas pedagógicas</p>
        </div>
        <CreditsIndicator />
      </div>



      {/* Quick Access Tools */}
      <div>
        <h2 className="font-display text-sm font-semibold text-muted-foreground mb-3">⚡ Acesso Rápido</h2>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {tools.map((tool) => (
            <button
              key={tool.title}
              onClick={() => navigate(tool.route)}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3 shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all group"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform`}>
                <tool.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">{tool.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Library - Last 5 as simplified list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-semibold text-muted-foreground">📚 Últimos Documentos</h2>
          <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/app/biblioteca")}>
            Ver todos
          </Button>
        </div>
        {loading ? (
          <div className="space-y-1">
            {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : recentDocs.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                Nenhum documento salvo ainda. Comece criando seu primeiro material! 🚀
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border divide-y">
            {recentDocs.map(doc => {
              const cfg = tipoConfig[doc.tipo] || tipoConfig.plano;
              const Icon = cfg.icon;
              return (
                <div
                  key={`${doc.source || "doc"}-${doc.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                  <span className="font-medium text-sm truncate flex-1 min-w-0">
                    {doc.titulo || <span className="text-muted-foreground italic">Sem título</span>}
                  </span>
                  <Badge variant="secondary" className="text-[10px] py-0 shrink-0">{cfg.label}</Badge>
                  <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
                    {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <div className="flex gap-0.5 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Visualizar" onClick={() => navigate(cfg.route, { state: { loadDocId: doc.id, source: doc.source || "documentos" } })}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title="Excluir" onClick={() => handleDelete(doc)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}


      </div>
    </div>
  );
}
