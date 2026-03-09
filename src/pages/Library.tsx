import { useEffect, useState, useMemo } from "react";
import { Library, BookOpen, FileText, Gamepad2, Presentation, FileCheck, Trash2, ExternalLink, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const tipoConfig: Record<string, { label: string; icon: any; color: string; route: string; bgColor: string }> = {
  plano: { label: "Plano de Aula", icon: BookOpen, color: "text-primary", bgColor: "bg-primary/10", route: "/app/bncc" },
  atividade: { label: "Atividade A4", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-50", route: "/app/atividades" },
  jogo: { label: "Jogo Educativo", icon: Gamepad2, color: "text-green-600", bgColor: "bg-green-50", route: "/app/jogos" },
  slide: { label: "Apresentação", icon: Presentation, color: "text-purple-600", bgColor: "bg-purple-50", route: "/app/slides" },
  prova: { label: "Prova", icon: FileCheck, color: "text-destructive", bgColor: "bg-destructive/10", route: "/app/provas" },
};

const FILTER_TYPES = ["todos", "plano", "atividade", "jogo", "slide", "prova"] as const;
type FilterType = typeof FILTER_TYPES[number];

interface DocItem {
  id: string;
  titulo: string;
  tipo: string;
  disciplina?: string | null;
  nivel?: string | null;
  modelo?: string | null;
  created_at: string;
  source: "documentos" | "provas";
  temas?: string | null;
}

export default function LibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("todos");
  const [search, setSearch] = useState("");

  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: savedDocs }, { data: provas }] = await Promise.all([
        supabase.from("documentos_salvos")
          .select("id, titulo, tipo, disciplina, nivel, modelo, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("provas")
          .select("id, titulo, created_at, temas, nivel, serie")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      const docItems: DocItem[] = (savedDocs || []).map((d: any) => ({
        id: d.id,
        titulo: d.titulo,
        tipo: d.tipo,
        disciplina: d.disciplina,
        nivel: d.nivel,
        modelo: d.modelo,
        created_at: d.created_at,
        source: "documentos",
      }));

      const provaItems: DocItem[] = (provas || []).map((p: any) => ({
        id: p.id,
        titulo: p.titulo,
        tipo: "prova",
        nivel: p.nivel,
        created_at: p.created_at,
        source: "provas",
        temas: p.temas,
      }));

      const all = [...docItems, ...provaItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setDocs(all);
    } catch (err) {
      toast.error("Erro ao carregar biblioteca");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: DocItem) => {
    try {
      if (item.source === "provas") {
        await supabase.from("questoes").delete().eq("prova_id", item.id);
        await supabase.from("versoes_prova").delete().eq("prova_id", item.id);
        const { error } = await supabase.from("provas").delete().eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("documentos_salvos").delete().eq("id", item.id);
        if (error) throw error;
      }
      setDocs(prev => prev.filter(d => d.id !== item.id));
      toast.success("Documento excluído");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: docs.length };
    docs.forEach(d => { c[d.tipo] = (c[d.tipo] || 0) + 1; });
    return c;
  }, [docs]);

  const filtered = useMemo(() => {
    let result = filterType === "todos" ? docs : docs.filter(d => d.tipo === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.titulo.toLowerCase().includes(q) ||
        d.disciplina?.toLowerCase().includes(q) ||
        d.temas?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [docs, filterType, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Library className="h-6 w-6 text-primary" /> Biblioteca
        </h1>
        <p className="text-muted-foreground mt-1">Todos os seus materiais pedagógicos salvos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {FILTER_TYPES.map(type => {
          const cfg = tipoConfig[type];
          const Icon = cfg?.icon || Filter;
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-xl border-2 p-3 text-center transition-all hover:shadow-md ${
                filterType === type ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              {type === "todos" ? (
                <Library className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              ) : (
                <Icon className={`h-4 w-4 mx-auto mb-1 ${cfg?.color || "text-muted-foreground"}`} />
              )}
              <p className="text-xs font-semibold">{counts[type] || 0}</p>
              <p className="text-[10px] text-muted-foreground capitalize truncate">
                {type === "todos" ? "Todos" : cfg?.label?.split(" ")[0] || type}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, disciplina ou tema..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Document List */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-base">
              {filterType === "todos" ? "Todos os documentos" : `${tipoConfig[filterType]?.label}s`}
              {search && <span className="text-muted-foreground font-normal text-sm ml-2">· "{search}"</span>}
            </CardTitle>
            <span className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "item" : "itens"}</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Library className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum documento encontrado</p>
              <p className="text-sm">
                {search ? "Tente outros termos de busca." : "Comece criando materiais nos módulos disponíveis."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(doc => {
                const cfg = tipoConfig[doc.tipo] || tipoConfig.plano;
                const Icon = cfg.icon;
                return (
                  <div
                    key={`${doc.source}-${doc.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`h-9 w-9 rounded-lg ${cfg.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{doc.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] py-0">{cfg.label}</Badge>
                          {doc.disciplina && (
                            <span className="text-[10px] text-muted-foreground">{doc.disciplina}</span>
                          )}
                          {doc.nivel && (
                            <span className="text-[10px] text-muted-foreground">{doc.nivel}</span>
                          )}
                          {doc.temas && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{doc.temas}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Abrir no editor"
                        onClick={() => navigate(cfg.route)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Excluir"
                        onClick={() => handleDelete(doc)}
                      >
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
