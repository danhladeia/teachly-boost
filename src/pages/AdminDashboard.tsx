import { useState, useEffect } from "react";
import { ShieldCheck, Search, CreditCard, Users, Gift, LogOut, User, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import logoGoPedagoX from "@/assets/logo-gopedagox.png";

interface UserProfile {
  id: string;
  user_id: string;
  nome: string | null;
  email: string | null;
  plan_type: string;
  credits_remaining: number;
  creditos_ia: number;
  creditos_correcao: number;
  logos_limit: number;
  subscription_status: string;
  created_at: string;
}

const planColors: Record<string, string> = {
  starter: "bg-muted text-muted-foreground",
  pro: "bg-yellow-100 text-yellow-800",
  master: "bg-orange-100 text-orange-800",
  ultra: "bg-primary/10 text-primary",
};

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [creditAmount, setCreditAmount] = useState("10");
  const [creditType, setCreditType] = useState<string>("credits_remaining");
  const [stats, setStats] = useState({ total: 0, starter: 0, pro: 0, master: 0, ultra: 0 });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: "", description: "", onConfirm: () => {},
  });

  useEffect(() => {
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  const checkAdmin = async () => {
    if (!user) { setChecking(false); return; }
    const { data } = await supabase.from("support_admins").select("id").eq("user_id", user.id).maybeSingle();
    setIsAdmin(!!data);
    setChecking(false);
    if (!data) navigate("/app");
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, nome, email, plan_type, credits_remaining, creditos_ia, creditos_correcao, logos_limit, subscription_status, created_at")
      .order("created_at", { ascending: false });
    if (data) {
      setUsers(data);
      setStats({
        total: data.length,
        starter: data.filter(u => u.plan_type === "starter").length,
        pro: data.filter(u => u.plan_type === "pro").length,
        master: data.filter(u => u.plan_type === "master").length,
        ultra: data.filter(u => u.plan_type === "ultra").length,
      });
    }
  };

  const creditTypeLabels: Record<string, string> = {
    credits_remaining: "Créditos gerais",
    creditos_ia: "Créditos IA",
    creditos_correcao: "Créditos correção",
    logos_limit: "Limite de logos",
  };

  const requestGiveCredits = () => {
    if (!selected) return;
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Informe um valor válido"); return; }
    setConfirmDialog({
      open: true,
      title: "Confirmar envio de créditos",
      description: `Adicionar +${amount} ${creditTypeLabels[creditType] || creditType} para ${selected.nome || selected.email}?`,
      onConfirm: () => executeGiveCredits(amount),
    });
  };

  const executeGiveCredits = async (amount: number) => {
    if (!selected) return;
    const currentValue = (selected as any)[creditType] as number;
    const newValue = currentValue + amount;

    const { error } = await supabase
      .from("profiles")
      .update({ [creditType]: newValue } as any)
      .eq("id", selected.id);

    if (error) { toast.error("Erro ao dar créditos"); return; }
    toast.success(`+${amount} créditos adicionados com sucesso!`);
    setSelected({ ...selected, [creditType]: newValue } as any);
    await loadUsers();
  };

  const requestUpdatePlan = (newPlan: string) => {
    if (!selected) return;
    setConfirmDialog({
      open: true,
      title: "Confirmar alteração de plano",
      description: `Alterar o plano de ${selected.nome || selected.email} de ${selected.plan_type?.toUpperCase()} para ${newPlan.toUpperCase()}?`,
      onConfirm: () => executeUpdatePlan(newPlan),
    });
  };

  const executeUpdatePlan = async (newPlan: string) => {
    if (!selected) return;
    const planCredits: Record<string, { credits_remaining: number; logos_limit: number }> = {
      starter: { credits_remaining: 5, logos_limit: 0 },
      pro: { credits_remaining: 50, logos_limit: 1 },
      master: { credits_remaining: 150, logos_limit: 3 },
      ultra: { credits_remaining: 9999, logos_limit: 999 },
    };

    const update = { plan_type: newPlan, ...planCredits[newPlan] };
    const { error } = await supabase.from("profiles").update(update as any).eq("id", selected.id);
    if (error) { toast.error("Erro ao alterar plano"); return; }
    toast.success(`Plano alterado para ${newPlan.toUpperCase()}`);
    setSelected({ ...selected, ...update } as any);
    await loadUsers();
  };

  const filteredUsers = users.filter(u =>
    (u.nome || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (checking) return <div className="flex items-center justify-center min-h-screen"><p>Verificando permissões...</p></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoGoPedagoX} alt="GoPedagoX" className="h-8 w-auto" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-sm">Painel Administrativo</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/suporte-admin")}>
            <MessageSquare className="h-4 w-4 mr-1" /> Suporte
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/app")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao App
          </Button>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <div className="p-4 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="font-display text-2xl font-bold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          {(["starter", "pro", "master", "ultra"] as const).map(plan => (
            <Card key={plan} className="shadow-card">
              <CardContent className="p-4 text-center">
                <Badge className={`${planColors[plan]} text-[10px] mb-1`}>{plan.toUpperCase()}</Badge>
                <p className="font-display text-2xl font-bold">{stats[plan]}</p>
                <p className="text-[10px] text-muted-foreground">usuários</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          {/* User list */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Usuários Cadastrados
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[60vh] overflow-auto">
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selected?.id === u.id ? "ring-2 ring-primary bg-muted/30" : ""}`}
                    onClick={() => setSelected(u)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.nome || "Sem nome"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`${planColors[u.plan_type] || planColors.starter} text-[10px]`}>
                        {u.plan_type?.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{u.credits_remaining} cr</span>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado</p>}
              </div>
            </CardContent>
          </Card>

          {/* User detail / credit management */}
          {selected ? (
            <div className="space-y-4">
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <User className="h-4 w-4" /> {selected.nome || "Sem nome"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{selected.email}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Plano</p>
                      <Badge className={`${planColors[selected.plan_type]} mt-0.5`}>{selected.plan_type?.toUpperCase()}</Badge>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Status</p>
                      <p className="font-medium text-xs mt-0.5">{selected.subscription_status}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Créditos gerais</p>
                      <p className="font-display font-bold text-lg">{selected.credits_remaining}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Créditos IA</p>
                      <p className="font-display font-bold text-lg">{selected.creditos_ia}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Créditos correção</p>
                      <p className="font-display font-bold text-lg">{selected.creditos_correcao}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Logos</p>
                      <p className="font-display font-bold text-lg">{selected.logos_limit}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Cadastro: {new Date(selected.created_at).toLocaleDateString("pt-BR")}</p>
                </CardContent>
              </Card>

              {/* Give Credits */}
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-sm flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" /> Dar Créditos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={creditType} onValueChange={setCreditType}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credits_remaining">Créditos gerais</SelectItem>
                      <SelectItem value="creditos_ia">Créditos IA</SelectItem>
                      <SelectItem value="creditos_correcao">Créditos correção</SelectItem>
                      <SelectItem value="logos_limit">Limite de logos</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="text-sm"
                    />
                    <Button onClick={requestGiveCredits} className="shrink-0 gradient-primary border-0 text-primary-foreground">
                      <Gift className="h-4 w-4 mr-1" /> Dar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Change Plan */}
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" /> Alterar Plano
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {["starter", "pro", "master", "ultra"].map(plan => (
                      <Button
                        key={plan}
                        variant={selected.plan_type === plan ? "default" : "outline"}
                        size="sm"
                        className={`text-xs ${selected.plan_type === plan ? "gradient-primary border-0 text-primary-foreground" : ""}`}
                        onClick={() => requestUpdatePlan(plan)}
                        disabled={selected.plan_type === plan}
                      >
                        {plan.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="shadow-card flex items-center justify-center min-h-[300px]">
              <p className="text-muted-foreground text-sm">Selecione um usuário para gerenciar</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
