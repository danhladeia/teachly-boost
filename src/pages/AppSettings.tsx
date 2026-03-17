import { useState, useEffect } from "react";
import { Settings, User, CreditCard, Loader2, ArrowUpCircle, ArrowDownCircle, XCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import planStarter from "@/assets/plan-starter.png";
import planPro from "@/assets/plan-pro.png";
import planMaster from "@/assets/plan-master.png";
import planUltra from "@/assets/plan-ultra.png";

const planMeta: Record<string, { label: string; image: string; color: string; order: number }> = {
  starter: { label: "Starter (Grátis)", image: planStarter, color: "text-muted-foreground", order: 0 },
  pro: { label: "Pro", image: planPro, color: "text-blue-600", order: 1 },
  master: { label: "Master", image: planMaster, color: "text-purple-600", order: 2 },
  ultra: { label: "Ultra", image: planUltra, color: "text-amber-600", order: 3 },
};

const planLinks: Record<string, { monthly: string; annual: string; priceMonthly: string; priceAnnual: string }> = {
  pro: {
    monthly: "https://buy.stripe.com/5kQ6oB3d45bD07geIm9sk08",
    annual: "https://buy.stripe.com/5kQ28lbJA6fH07gbwa9sk09",
    priceMonthly: "R$ 19,90/mês",
    priceAnnual: "R$ 199,00/ano",
  },
  master: {
    monthly: "https://buy.stripe.com/5kQ6oB4h80Vnf2a6bQ9sk06",
    annual: "https://buy.stripe.com/7sYeV75lc33v6vE8jY9sk07",
    priceMonthly: "R$ 34,90/mês",
    priceAnnual: "R$ 349,00/ano",
  },
  ultra: {
    monthly: "https://buy.stripe.com/5kQdR37tk7jL6vE2ZE9sk04",
    annual: "https://buy.stripe.com/7sY8wJeVM0Vng6e6bQ9sk05",
    priceMonthly: "R$ 69,90/mês",
    priceAnnual: "R$ 699,00/ano",
  },
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
      if (err.message?.includes("No Stripe customer")) {
        toast.info("Você ainda não possui uma assinatura ativa para gerenciar.");
      } else {
        toast.error(err.message || "Erro ao abrir portal de assinatura");
      }
    } finally { setManagingPortal(false); }
  };

  const meta = planMeta[plan.planType] || planMeta.starter;
  const hasPaidPlan = plan.planType !== "starter";
  const isUnlimited = plan.planType === "ultra";
  const currentOrder = meta.order;

  const upgradePlans = Object.entries(planMeta).filter(([key]) => key !== "starter" && (planMeta[key]?.order ?? 0) > currentOrder);
  const downgradePlans = Object.entries(planMeta).filter(([key]) => key !== "starter" && (planMeta[key]?.order ?? 0) < currentOrder && key !== "starter");

  const handlePlanAction = (planKey: string) => {
    const link = planLinks[planKey];
    if (!link) return;
    const url = `${link.monthly}${user?.email ? `?prefilled_email=${encodeURIComponent(user.email)}` : ""}`;
    window.open(url, "_blank");
  };

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
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2">📋 Gerenciar Assinatura</CardTitle></CardHeader>
        <CardContent className="space-y-5">

          {/* Upgrade options */}
          {upgradePlans.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-green-600">
                <ArrowUpCircle className="h-4 w-4" /> Fazer Upgrade
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {upgradePlans.map(([key]) => {
                  const pm = planMeta[key];
                  const pl = planLinks[key];
                  if (!pm || !pl) return null;
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors">
                      <img src={pm.image} alt={pm.label} className="h-10 w-auto" />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${pm.color}`}>{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pl.priceMonthly}</p>
                      </div>
                      <Button size="sm" className="shrink-0" onClick={() => handlePlanAction(key)}>
                        <ExternalLink className="h-3 w-3 mr-1" /> Assinar
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Downgrade options */}
          {downgradePlans.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-orange-500">
                  <ArrowDownCircle className="h-4 w-4" /> Fazer Downgrade
                </h4>
                <p className="text-xs text-muted-foreground">
                  Para trocar para um plano inferior, primeiro cancele sua assinatura atual e depois assine o novo plano.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {downgradePlans.map(([key]) => {
                    const pm = planMeta[key];
                    const pl = planLinks[key];
                    if (!pm || !pl) return null;
                    return (
                      <div key={key} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <img src={pm.image} alt={pm.label} className="h-10 w-auto" />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${pm.color}`}>{pm.label}</p>
                          <p className="text-xs text-muted-foreground">{pl.priceMonthly}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Cancel / Portal */}
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" /> Cancelar Assinatura
            </h4>
            {hasPaidPlan ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Ao cancelar, você continuará com acesso ao plano atual até o fim do período de faturamento. Após isso, sua conta voltará ao plano Starter.
                </p>
                <Button variant="destructive" size="sm" onClick={handleManageSubscription} disabled={managingPortal}>
                  {managingPortal ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Abrindo...</> : "Cancelar / Gerenciar no Portal"}
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Você está no plano gratuito Starter. Faça upgrade para desbloquear mais recursos!
              </p>
            )}
          </div>

          {/* Link to pricing page */}
          <Separator />
          <div className="text-center">
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/app/planos"}>
              Ver todos os planos e comparar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
