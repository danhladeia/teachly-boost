import { useEffect, useState } from "react";
import { BookOpen, FileText, Gamepad2, Presentation, FileCheck, TrendingUp, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const tipoConfig: Record<string, { label: string; icon: any; color: string; route: string }> = {
  plano: { label: "Plano de Aula", icon: BookOpen, color: "text-primary", route: "/app/bncc" },
  atividade: { label: "Atividade", icon: FileText, color: "text-accent-foreground", route: "/app/atividades" },
  jogo: { label: "Jogo", icon: Gamepad2, color: "text-plan-pratico", route: "/app/jogos" },
  slide: { label: "Slides", icon: Presentation, color: "text-plan-mestre", route: "/app/slides" },
  prova: { label: "Prova", icon: FileCheck, color: "text-destructive", route: "/app/provas" },
};

export default function Dashboard() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadDocs(); }, []);

  const loadDocs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("documentos_salvos")
        .select("id, titulo, tipo, modelo, disciplina, nivel, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setDocs(data);
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("documentos_salvos").delete().eq("id", id);
      if (error) throw error;
      setDocs(prev => prev.filter(d => d.id !== id));
      toast.success("Documento excluído");
    } catch { toast.error("Erro ao excluir"); }
  };

  const counts = {
    plano: docs.filter(d => d.tipo === "plano").length,
    atividade: docs.filter(d => d.tipo === "atividade").length,
    jogo: docs.filter(d => d.tipo === "jogo").length,
    slide: docs.filter(d => d.tipo === "slide").length,
    prova: docs.filter(d => d.tipo === "prova").length,
  };

  const stats = [
    { label: "Planos criados", value: String(counts.plano), icon: BookOpen, color: "text-primary" },
    { label: "Atividades geradas", value: String(counts.atividade), icon: FileText, color: "text-accent-foreground" },
    { label: "Jogos criados", value: String(counts.jogo), icon: Gamepad2, color: "text-plan-pratico" },
    { label: "Slides gerados", value: String(counts.slide), icon: Presentation, color: "text-plan-mestre" },
    { label: "Provas criadas", value: String(counts.prova), icon: FileCheck, color: "text-destructive" },
    { label: "Total de documentos", value: String(docs.length), icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu planejamento pedagógico</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">📚 Biblioteca Pessoal</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Carregando documentos...</p>
          ) : docs.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum documento salvo ainda. Comece criando seu primeiro plano de aula no{" "}
              <a href="/app/bncc" className="text-primary font-medium hover:underline">Planejador BNCC</a>{" "}
              ou explore o{" "}
              <a href="/app/atividades" className="text-primary font-medium hover:underline">Editor de Atividades</a>.
            </p>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => {
                const cfg = tipoConfig[doc.tipo] || tipoConfig.plano;
                const Icon = cfg.icon;
                return (
                  <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
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
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(cfg.route)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
