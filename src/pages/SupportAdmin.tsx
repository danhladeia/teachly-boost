import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Send, Loader2, CheckCircle2, Clock, AlertCircle, Crown, Zap, Star, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import logoGoPedagoX from "@/assets/logo-gopedagox.png";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  user_email: string;
  user_name: string;
  user_plan: string;
  created_at: string;
}

interface Message {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: "Aberto", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-800" },
  resolved: { label: "Resolvido", color: "bg-green-100 text-green-800" },
};

const priorityMap: Record<string, { label: string; color: string; icon: any }> = {
  urgent: { label: "🔴 Urgente (Ultra)", color: "text-red-600 bg-red-50 border-red-200", icon: Rocket },
  high: { label: "🟠 Alta (Master)", color: "text-orange-600 bg-orange-50 border-orange-200", icon: Crown },
  normal: { label: "🟡 Normal (Pro)", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: Zap },
  low: { label: "⚪ Baixa (Starter)", color: "text-muted-foreground bg-muted", icon: Star },
};

export default function SupportAdmin() {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { checkAdmin(); }, [user]);
  useEffect(() => { if (isAdmin) loadTickets(); }, [isAdmin, filterStatus, filterPriority]);
  useEffect(() => { if (selected) loadMessages(selected.id); }, [selected]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const checkAdmin = async () => {
    if (!user) { setChecking(false); return; }
    const { data } = await (supabase.from("support_admins" as any) as any)
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    setIsAdmin(!!data);
    setChecking(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoginLoading(false);
    if (error) toast.error("Credenciais inválidas");
  };

  const loadTickets = async () => {
    let query = (supabase.from("support_tickets" as any) as any)
      .select("id, subject, status, priority, user_email, user_name, user_plan, created_at")
      .order("created_at", { ascending: false });
    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    if (filterPriority !== "all") query = query.eq("priority", filterPriority);
    const { data } = await query;
    if (data) setTickets(data);
  };

  const loadMessages = async (ticketId: string) => {
    const { data } = await (supabase.from("support_messages" as any) as any)
      .select("id, sender_type, content, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const sendReply = async () => {
    if (!user || !selected || !reply.trim()) return;
    setSending(true);
    await (supabase.from("support_messages" as any) as any).insert({
      ticket_id: selected.id,
      sender_type: "admin",
      sender_id: user.id,
      content: reply,
    });
    // Update status to in_progress if still open
    if (selected.status === "open") {
      await (supabase.from("support_tickets" as any) as any).update({ status: "in_progress" }).eq("id", selected.id);
      setSelected({ ...selected, status: "in_progress" });
      await loadTickets();
    }
    setReply("");
    await loadMessages(selected.id);
    setSending(false);
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    await (supabase.from("support_tickets" as any) as any).update({ status }).eq("id", selected.id);
    setSelected({ ...selected, status });
    await loadTickets();
    toast.success("Status atualizado");
  };

  // Login screen for non-authenticated or non-admin
  if (checking) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <Link to="/" className="inline-flex items-center justify-center mb-4">
              <img src={logoGoPedagoX} alt="GoPedagoX" className="h-16 w-auto" />
            </Link>
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="font-display text-lg">Suporte Admin</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Acesso restrito à equipe de suporte</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input type="email" placeholder="Email do admin" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Input type="password" placeholder="Senha" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              </div>
              <Button type="submit" size="lg" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loginLoading}>
                {loginLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-elevated text-center p-8">
          <ShieldCheck className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Acesso negado</h2>
          <p className="text-muted-foreground text-sm mb-4">Esta conta não tem permissão de administrador de suporte.</p>
          <Button variant="outline" onClick={() => signOut()}>Sair</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoGoPedagoX} alt="GoPedagoX" className="h-8 w-auto" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-sm">Painel de Suporte</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>Sair</Button>
      </header>

      <div className="p-4 grid gap-4 lg:grid-cols-[340px_1fr] max-w-7xl mx-auto">
        {/* Tickets panel */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {tickets.map((t) => {
              const st = statusMap[t.status] || statusMap.open;
              const pr = priorityMap[t.priority] || priorityMap.normal;
              return (
                <Card
                  key={t.id}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors border ${selected?.id === t.id ? "ring-2 ring-primary" : ""} ${pr.color}`}
                  onClick={() => setSelected(t)}
                >
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{t.subject}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.user_name || t.user_email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className={`text-[9px] ${st.color}`}>{st.label}</Badge>
                      <Badge variant="outline" className="text-[9px]">{t.user_plan}</Badge>
                      <span className="text-[9px] text-muted-foreground ml-auto">{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {tickets.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum ticket encontrado</p>}
          </div>
        </div>

        {/* Chat */}
        {selected ? (
          <Card className="shadow-card flex flex-col">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="font-display text-base">{selected.subject}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.user_name} ({selected.user_email}) • Plano: {selected.user_plan}</p>
                </div>
                <Select value={selected.status} onValueChange={updateStatus}>
                  <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${m.sender_type === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      <p className={`text-[10px] font-medium mb-1 ${m.sender_type === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {m.sender_type === "admin" ? "Suporte" : "Usuário"}
                      </p>
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-1 ${m.sender_type === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t p-3 flex gap-2">
                <Input
                  placeholder="Responder..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                />
                <Button size="icon" onClick={sendReply} disabled={sending} className="shrink-0">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground text-sm">Selecione um ticket para responder</p>
          </Card>
        )}
      </div>
    </div>
  );
}
