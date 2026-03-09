import { useEffect, useState } from "react";
import { BookOpen, FileText, Gamepad2, Presentation, FileCheck, Trash2, Eye, GitBranch, StickyNote, Stamp, Settings, CreditCard, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import CreditsDisplay from "@/components/CreditsDisplay";

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

export default function Dashboard() {
  const [docs, setDocs] = useState<any[]>([]);
  const [provas, setProvas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadDocs(); }, []);

  const loadDocs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: savedDocs }, { data: provasData }] = await Promise.all([
        supabase.from("documentos_salvos")
          .select("id, titulo, tipo, modelo, disciplina, nivel, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("provas")
          .select("id, titulo, temas, nivel, serie, created_at")
          .eq("user_id", user.id)
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

  const counts: Record<string, number> = {
    plano: docs.filter(d => d.tipo === "plano").length,
    atividade: docs.filter(d => d.tipo === "atividade").length,
    jogo: docs.filter(d => d.tipo === "jogo").length,
    slide: docs.filter(d => d.tipo === "slide").length,
    prova: provas.length,
  };
  const totalCount = docs.length + provas.length;

  // Last 3 docs
  const allDocs = [...docs, ...provas].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const recentDocs = allDocs.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Acesso rápido às suas ferramentas pedagógicas</p>
        </div>
        <CreditsDisplay />
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

      {/* Minimal Activity Report */}
      <div>
        <h2 className="font-display text-sm font-semibold text-muted-foreground mb-3">📊 Resumo</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(counts).map(([key, count]) => {
            const cfg = tipoConfig[key];
            if (!cfg) return null;
            return (
              <div key={key} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-card">
                <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                <span className="text-xs text-muted-foreground">{cfg.label}s</span>
                <span className="font-display text-sm font-bold">{count}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-2 rounded-lg border bg-primary/5 px-3 py-2 shadow-card">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="font-display text-sm font-bold text-primary">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Recent Library - Last 3 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-semibold text-muted-foreground">📚 Últimos Documentos</h2>
          <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/app/biblioteca")}>
            Ver todos
          </Button>
        </div>
        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : recentDocs.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                Nenhum documento salvo ainda. Comece criando seu primeiro material! 🚀
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentDocs.map(doc => {
              const cfg = tipoConfig[doc.tipo] || tipoConfig.plano;
              const Icon = cfg.icon;
              return (
                <Card key={`${doc.source || "doc"}-${doc.id}`} className="shadow-card hover:shadow-elevated transition-all">
                  <CardContent className="flex items-center justify-between gap-3 p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted ${cfg.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{doc.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">{cfg.label}</Badge>
                          {doc.disciplina && <span className="text-[10px] text-muted-foreground">{doc.disciplina}</span>}
                          <span className="text-[10px] text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(cfg.route, { state: { loadDocId: doc.id, source: doc.source || "documentos" } })}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(doc)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
