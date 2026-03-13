import { useState, useEffect } from "react";
import { Bell, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadNotificacoes();
    checkWelcomeNotification();
  }, [user]);

  const loadNotificacoes = async () => {
    if (!user) return;
    // Only fetch notifications from last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    if (data) setNotificacoes(data as Notificacao[]);
  };

  const checkWelcomeNotification = async () => {
    if (!user) return;
    // Check if user already has any notification (welcome already sent)
    const { count } = await supabase
      .from("notificacoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tipo", "boas-vindas");
    
    if (count === 0) {
      // Insert welcome notification
      await supabase.from("notificacoes").insert({
        user_id: user.id,
        titulo: "🎉 Bem-vindo(a) ao GoPedagoX!",
        mensagem: "Estamos felizes em ter você aqui! Explore nossas ferramentas pedagógicas e crie materiais incríveis para suas aulas.",
        tipo: "boas-vindas",
      } as any);
      loadNotificacoes();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notificacoes").delete().eq("id", id);
    setNotificacoes(prev => prev.filter(n => n.id !== id));
    toast.success("Notificação removida");
  };

  const markAllRead = async () => {
    if (!user) return;
    const unread = notificacoes.filter(n => !n.lida);
    if (unread.length === 0) return;
    await supabase
      .from("notificacoes")
      .update({ lida: true } as any)
      .eq("user_id", user.id)
      .eq("lida", false);
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) markAllRead(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-display font-semibold text-sm">Notificações</h3>
          {notificacoes.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{notificacoes.length}</Badge>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notificacoes.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.map(n => (
                <div key={n.id} className="px-4 py-3 hover:bg-muted/40 transition-colors group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{n.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.mensagem}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
