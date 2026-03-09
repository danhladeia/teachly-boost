import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Loader2, Plus, Clock, CheckCircle2, AlertCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";

const WHATSAPP_URL = "https://wa.me/5500000000000?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20GoPedagoX%20Ultra";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Message {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Aberto", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  resolved: { label: "Resolvido", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
};

export default function Support() {
  const { user } = useAuth();
  const { plan } = useCredits();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadTickets(); }, [user]);
  useEffect(() => { if (selected) loadMessages(selected.id); }, [selected]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadTickets = async () => {
    if (!user) return;
    const { data } = await (supabase.from("support_tickets" as any) as any)
      .select("id, subject, status, priority, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setTickets(data);
    setLoading(false);
  };

  const loadMessages = async (ticketId: string) => {
    const { data } = await (supabase.from("support_messages" as any) as any)
      .select("id, sender_type, content, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const createTicket = async () => {
    if (!user || !newSubject.trim() || !newMessage.trim()) { toast.error("Preencha assunto e mensagem"); return; }
    setCreating(true);
    const priority = plan.planType === "ultra" ? "urgent" : plan.planType === "master" ? "high" : plan.planType === "pro" ? "normal" : "low";
    const { data: ticket } = await (supabase.from("support_tickets" as any) as any)
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.nome || user.email,
        user_plan: plan.planType,
        subject: newSubject,
        priority,
      })
      .select()
      .single();

    if (ticket) {
      await (supabase.from("support_messages" as any) as any).insert({
        ticket_id: (ticket as any).id,
        sender_type: "user",
        sender_id: user.id,
        content: newMessage,
      });
      toast.success("Ticket criado!");
      setNewSubject("");
      setNewMessage("");
      setShowNew(false);
      await loadTickets();
      setSelected(ticket as any);
    }
    setCreating(false);
  };

  const sendMessage = async () => {
    if (!user || !selected || !newMessage.trim()) return;
    setSending(true);
    await (supabase.from("support_messages" as any) as any).insert({
      ticket_id: selected.id,
      sender_type: "user",
      sender_id: user.id,
      content: newMessage,
    });
    setNewMessage("");
    await loadMessages(selected.id);
    setSending(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Suporte
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Entre em contato com a equipe GoPedagoX</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Ticket list */}
        <div className="space-y-2">
          <Button onClick={() => { setShowNew(true); setSelected(null); }} className="w-full" variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Novo ticket
          </Button>
          {tickets.map((t) => {
            const st = statusMap[t.status] || statusMap.open;
            return (
              <Card
                key={t.id}
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${selected?.id === t.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => { setSelected(t); setShowNew(false); }}
              >
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{t.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {tickets.length === 0 && !showNew && <p className="text-xs text-muted-foreground text-center py-4">Nenhum ticket ainda</p>}
        </div>

        {/* New ticket form or chat */}
        {showNew ? (
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg">Novo Ticket</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input placeholder="Descreva brevemente o problema" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea placeholder="Detalhe sua dúvida ou problema..." rows={5} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={createTicket} disabled={creating} className="gradient-primary border-0 text-primary-foreground hover:opacity-90">
                  {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : <><Send className="mr-2 h-4 w-4" /> Enviar</>}
                </Button>
                <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        ) : selected ? (
          <Card className="shadow-card flex flex-col">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base truncate">{selected.subject}</CardTitle>
                <Badge variant="secondary" className={`text-[10px] shrink-0 ${(statusMap[selected.status] || statusMap.open).color}`}>
                  {(statusMap[selected.status] || statusMap.open).label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-auto max-h-[400px] p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_type === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${m.sender_type === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-1 ${m.sender_type === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {selected.status !== "resolved" && (
                <div className="border-t p-3 flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  />
                  <Button size="icon" onClick={sendMessage} disabled={sending} className="shrink-0">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card flex items-center justify-center min-h-[300px]">
            <p className="text-muted-foreground text-sm">Selecione um ticket ou crie um novo</p>
          </Card>
        )}
      </div>
    </div>
  );
}
