import { useState, useEffect } from "react";
import { Settings, User, CreditCard, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import planStarter from "@/assets/plan-starter.png";
import planPro from "@/assets/plan-pro.png";
import planMaster from "@/assets/plan-master.png";
import planUltra from "@/assets/plan-ultra.png";

const planMeta: Record<string, { label: string; image: string; color: string }> = {
  starter: { label: "Starter (Grátis)", image: planStarter, color: "text-muted-foreground" },
  pro: { label: "Pro", image: planPro, color: "text-blue-600" },
  master: { label: "Master", image: planMaster, color: "text-purple-600" },
  ultra: { label: "Ultra", image: planUltra, color: "text-amber-600" },
};

export default function AppSettings() {
  const { user } = useAuth();
  const { plan, refreshPlan, planLimits } = useCredits();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [escola, setEscola] = useState("");
  const [saving, setSaving] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("nome, email, escola").eq("user_id", user.id).single();
      if (data) {
        setNome(data.nome || "");
        setEmail(data.email || "");
        setEscola(data.escola || "");
      }
    })();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ nome, escola } as any).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Perfil salvo!");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Erro ao abrir portal de assinatura");
    } finally { setManagingPortal(false); }
  };

  const meta = planMeta[plan.planType] || planMeta.starter;
  const hasPaidPlan = plan.planType !== "starter";
  const isUnlimited = plan.planType === "ultra";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Configurações
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie sua conta e preferências</p>
      </div>

      {/* Profile */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><User className="h-5 w-5" /> Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Nome</Label><Input placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} disabled className="opacity-60" /></div>
          </div>
          <div className="space-y-2"><Label>Escola</Label><Input placeholder="Nome da escola" value={escola} onChange={e => setEscola(e.target.value)} /></div>
          <Button className="gradient-primary border-0 text-primary-foreground hover:opacity-90" onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Plan */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><CreditCard className="h-5 w-5" /> Plano Ativo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <img src={meta.image} alt={meta.label} className="h-16 w-auto" />
            <div className="flex-1">
              <h3 className={`font-display text-xl font-bold ${meta.color}`}>{meta.label}</h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {isUnlimited ? "Créditos Ilimitados" : `Criação: ${plan.creditsGeneral} / ${planLimits.maxGeneral}`}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {isUnlimited ? "Correções Ilimitadas" : `Correções: ${plan.creditsExams} / ${planLimits.maxExams}`}
                </Badge>
                <Badge variant={plan.subscriptionStatus === "active" ? "default" : "destructive"} className="text-xs">
                  {plan.subscriptionStatus === "active" ? "Ativo" : plan.subscriptionStatus}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Logos: {isUnlimited ? "Ilimitados" : `até ${plan.logosLimit}`}
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {hasPaidPlan ? (
              <Button variant="outline" onClick={handleManageSubscription} disabled={managingPortal}>
                {managingPortal ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Abrindo...</> : "Gerenciar / Cancelar Assinatura"}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => window.location.href = "/app/planos"}>
                Fazer upgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
