import { useState, useEffect } from "react";
import { CheckCircle2, Settings, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import planStarter from "@/assets/plan-starter.png";
import planPro from "@/assets/plan-pro.png";
import planMaster from "@/assets/plan-master.png";
import planUltra from "@/assets/plan-ultra.png";

const plans = [
  {
    id: "starter", planType: "starter", name: "Starter", image: planStarter,
    priceMonthly: 0, priceAnnualTotal: 0,
    linkMonthly: null as string | null,
    linkAnnual: null as string | null,
    popular: false,
    features: ["10 créditos únicos", "10 correções de prova", "Acesso a todos os módulos", "Exportação PDF", "Com marca d'água", "Suporte via ticket"],
    description: null as string | null,
    cta: "Plano Atual",
  },
  {
    id: "pro", planType: "pro", name: "Pro", image: planPro,
    priceMonthly: 19.90, priceAnnualTotal: 199.00,
    linkMonthly: "https://buy.stripe.com/5kQ6oB3d45bD07geIm9sk08",
    linkAnnual: "https://buy.stripe.com/5kQ28lbJA6fH07gbwa9sk09",
    popular: false,
    features: ["30 créditos/mês", "50 correções de prova/mês", "1 Timbre Escolar", "Sem marca d'água", "Suporte via ticket"],
    description: "Ideal para o docente que busca modernizar sua prática em uma única escola. Garanta 30 criações mensais (Planos BNCC, Slides, Jogos) e corrija até 50 provas via celular com agilidade. Elimine o trabalho manual e foque no que importa: o aprendizado do seu aluno.",
    cta: "Assinar Pro",
  },
  {
    id: "master", planType: "master", name: "Master", image: planMaster,
    priceMonthly: 34.90, priceAnnualTotal: 349.00,
    linkMonthly: "https://buy.stripe.com/5kQ6oB4h80Vnf2a6bQ9sk06",
    linkAnnual: "https://buy.stripe.com/7sYeV75lc33v6vE8jY9sk07",
    popular: true,
    features: ["60 créditos/mês", "100 correções de prova/mês", "Até 3 Timbres (Multiescolas)", "Sem marca d'água", "Suporte prioritário via ticket"],
    description: "Perfeito para o professor multiescolas. Gerencie até 3 timbres personalizados e conte com 60 criações e 100 correções de prova mensais. Produtividade máxima para sua rotina, sem sacrificar seus finais de semana.",
    cta: "Assinar Master",
  },
  {
    id: "ultra", planType: "ultra", name: "Ultra", image: planUltra,
    priceMonthly: 69.90, priceAnnualTotal: 699.00,
    linkMonthly: "https://buy.stripe.com/5kQdR37tk7jL6vE2ZE9sk04",
    linkAnnual: "https://buy.stripe.com/7sY8wJeVM0Vng6e6bQ9sk05",
    popular: false,
    features: ["Créditos e Correções Ilimitados", "Timbres Ilimitados", "Sem marca d'água", "Suporte prioritário via ticket e WhatsApp"],
    description: "A solução definitiva para coordenadores ou professores com altíssimo volume de alunos. Liberdade ilimitada para criar conteúdos, corrigir provas e cadastrar quantos timbres precisar.",
    cta: "Assinar Ultra",
  },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const discount = (v: number) => v * 0.75;

export default function Pricing() {
  const [managingPortal, setManagingPortal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const { plan } = useCredits();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Assinatura realizada com sucesso! 🎉");
      supabase.functions.invoke("check-subscription");
    }
    if (params.get("canceled") === "true") {
      toast.info("Checkout cancelado.");
    }
  }, []);

  const handlePaymentLink = (link: string) => {
    const url = new URL(link);
    if (user?.email) {
      url.searchParams.set("prefilled_email", user.email);
    }
    window.open(url.toString(), "_blank");
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Erro ao abrir portal");
    } finally { setManagingPortal(false); }
  };

  const isCurrentPlan = (planType: string) => plan.planType === planType;
  const hasPaidPlan = plan.planType !== "starter";

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Escolha seu Plano</h1>
        <p className="text-muted-foreground mt-1">Evolua quando precisar, cancele quando quiser</p>
      </div>

      {hasPaidPlan && (
        <div className="text-center">
          <Button variant="outline" onClick={handleManageSubscription} disabled={managingPortal}>
            <Settings className="mr-2 h-4 w-4" />
            {managingPortal ? "Abrindo..." : "Gerenciar Assinatura"}
          </Button>
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${billingCycle === "monthly" ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          Mensal
        </button>
        <button
          onClick={() => setBillingCycle("annual")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all relative ${billingCycle === "annual" ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          Anual
          <span className="absolute -top-2.5 -right-3 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">-17%</span>
        </button>
      </div>

      {/* Coupon banner */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 rounded-2xl border-2 border-destructive/40 bg-destructive/10 px-6 py-4 shadow-lg">
          <Sparkles className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-bold text-destructive">
            ⏰ Use o cupom <span className="rounded bg-destructive px-2 py-0.5 text-destructive-foreground font-extrabold">GOPEDAGOX</span> no checkout e ganhe 25% de desconto vitalício!
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => {
          const isCurrent = isCurrentPlan(p.planType);
          const isAnnual = billingCycle === "annual";
          const basePrice = isAnnual ? p.priceAnnualTotal : p.priceMonthly;
          const monthlyEquivalent = isAnnual ? p.priceAnnualTotal / 12 : p.priceMonthly;
          const finalPrice = couponApplied ? discount(basePrice) : basePrice;
          const paymentLink = isAnnual ? p.linkAnnual : p.linkMonthly;
          const isPaid = p.priceMonthly > 0;

          return (
            <Card key={p.id} className={`relative shadow-card ${p.popular ? "border-primary ring-2 ring-primary/20" : ""} ${isCurrent ? "ring-2 ring-green-500/30 border-green-500" : ""}`}>
              {p.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground">MAIS POPULAR</div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-4 py-1 text-xs font-semibold text-white">SEU PLANO</div>
              )}
              <CardHeader className="text-center pb-2">
                <img src={p.image} alt={`Plano ${p.name}`} className="mx-auto h-28 w-auto mb-2" />
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div>
                  {isPaid ? (
                    <>
                      {couponApplied && (
                        <p className="text-sm text-muted-foreground line-through">{fmt(basePrice)}</p>
                      )}
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`font-display text-3xl font-extrabold ${couponApplied ? "text-green-600" : ""}`}>
                          {fmt(couponApplied ? discount(monthlyEquivalent) : monthlyEquivalent)}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      {isAnnual && (
                        <p className="text-xs text-muted-foreground mt-1">
                          cobrado {fmt(finalPrice)}/ano (2 meses grátis)
                        </p>
                      )}
                      {couponApplied && (
                        <Badge variant="secondary" className="mt-1 text-green-600 bg-green-50">-25% OFF</Badge>
                      )}
                    </>
                  ) : (
                    <span className="font-display text-3xl font-extrabold">Grátis</span>
                  )}
                </div>

                {p.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed text-left">{p.description}</p>
                )}

                <ul className="space-y-2 text-left">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                {paymentLink ? (
                  <Button
                    className={`w-full ${p.popular ? "gradient-primary border-0 text-primary-foreground hover:opacity-90" : ""}`}
                    variant={p.popular ? "default" : "outline"}
                    disabled={isCurrent}
                    onClick={() => handlePaymentLink(paymentLink)}
                  >
                    {isCurrent ? "Plano Atual" : p.cta}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    {isCurrent ? "Plano Atual" : p.cta}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
