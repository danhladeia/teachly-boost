import { useState } from "react";
import { Send, Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  nome: string | null;
  email: string | null;
  plan_type: string;
}

interface AdminNotificationSenderProps {
  users: UserProfile[];
}

export default function AdminNotificationSender({ users }: AdminNotificationSenderProps) {
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [userIdEspecifico, setUserIdEspecifico] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!titulo.trim() || !mensagem.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }

    setSending(true);
    try {
      let targetUsers: UserProfile[] = [];

      if (filtro === "especifico") {
        const found = users.find(u => u.user_id === userIdEspecifico || u.email === userIdEspecifico);
        if (!found) { toast.error("Usuário não encontrado"); setSending(false); return; }
        targetUsers = [found];
      } else if (filtro === "todos") {
        targetUsers = users;
      } else {
        targetUsers = users.filter(u => u.plan_type === filtro);
      }

      if (targetUsers.length === 0) {
        toast.error("Nenhum usuário encontrado com esse filtro");
        setSending(false);
        return;
      }

      const notifications = targetUsers.map(u => ({
        user_id: u.user_id,
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo: "admin",
      }));

      // Insert in batches of 100
      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        const { error } = await supabase.from("notificacoes").insert(batch as any);
        if (error) throw error;
      }

      toast.success(`Notificação enviada para ${targetUsers.length} usuário(s)`);
      setTitulo("");
      setMensagem("");
    } catch (err) {
      toast.error("Erro ao enviar notificações");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Enviar Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Título da notificação"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="text-sm"
        />
        <Textarea
          placeholder="Mensagem da notificação..."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={3}
          className="text-sm resize-none"
        />
        <Select value={filtro} onValueChange={(v) => { setFiltro(v); setUserIdEspecifico(""); }}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Filtrar destinatários" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os usuários</SelectItem>
            <SelectItem value="starter">Plano Starter</SelectItem>
            <SelectItem value="pro">Plano Pro</SelectItem>
            <SelectItem value="master">Plano Master</SelectItem>
            <SelectItem value="ultra">Plano Ultra</SelectItem>
            <SelectItem value="especifico">Usuário específico</SelectItem>
          </SelectContent>
        </Select>
        {filtro === "especifico" && (
          <Select value={userIdEspecifico} onValueChange={setUserIdEspecifico}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Selecionar usuário" />
            </SelectTrigger>
            <SelectContent>
              {users.map(u => (
                <SelectItem key={u.user_id} value={u.user_id}>
                  {u.nome || u.email || u.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          onClick={handleSend}
          disabled={sending || !titulo.trim() || !mensagem.trim()}
          className="w-full gradient-primary border-0 text-primary-foreground"
        >
          <Send className="h-4 w-4 mr-1" />
          {sending ? "Enviando..." : "Enviar Notificação"}
        </Button>
      </CardContent>
    </Card>
  );
}
