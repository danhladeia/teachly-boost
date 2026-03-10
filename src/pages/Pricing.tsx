import { useState, useEffect } from "react";
import { CheckCircle2, Tag, Settings } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import planStarter from "@/assets/plan-starter.png";
import planPro from "@/assets/plan-pro.png";
import planMaster from "@/assets/plan-master.png";
import planUltra from "@/assets/plan-ultra.png";

const plans = [
  {
    id: "starter", planType: "starter", name: "Starter", image: planStarter,
    paymentLink: null, priceOriginal: null, priceDiscount: null, priceDisplay: "R$ 0,00",
    period: "", popular: false,
    features: ["10 créditos únicos", "10 correções de prova", "Acesso a todos os módulos", "Exportação PDF", "Com marca d'água"],
    cta: "Plano Atual",
  },
  {
    id: "pro", planType: "pro", name: "Pro", image: planPro,
    paymentLink: "https://buy.stripe.com/cNicMZcNEbA17zI57M9sk01",
    priceOriginal: "R$ 24,90", priceDiscount: "R$ 18,67", priceDisplay: "R$ 24,90",
    period: "/mês", popular: false,
    features: ["30 créditos/mês", "50 correções de prova/mês", "1 Timbre Escolar", "Sem marca d'água", "Suporte via e-mail"],
    cta: "Assinar Pro",
  },
  {
    id: "master", planType: "master", name: "Master", image: planMaster,
    paymentLink: "https://buy.stripe.com/eVq28lcNEavXbPY0Rw9sk03",
    priceOriginal: "R$ 44,90", priceDiscount: "R$ 33,67", priceDisplay: "R$ 44,90",
    period: "/mês", popular: true,
    features: ["60 créditos/mês", "80 correções de prova/mês", "Até 3 Timbres (Multiescolas)", "Sem marca d'água", "Suporte prioritário"],
    cta: "Assinar Master",
  },
  {
    id: "ultra", planType: "ultra", name: "Ultra", image: planUltra,
    paymentLink: "https://buy.stripe.com/7sY9AN29047zbPY57M9sk00",
    priceOriginal: "R$ 89,90", priceDiscount: "R$ 67,42", priceDisplay: "R$ 89,90",
    period: "/mês", popular: false,
    features: ["Créditos e Correções Ilimitados", "Timbres Ilimitados", "Sem marca d'água", "Suporte prioritário máximo"],
    cta: "Assinar Ultra",
  },
];

export default function Pricing() {
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);
  const { plan } = useCredits();

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

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "GOPEDAGOX") {
      setCouponApplied(true);
      toast.success("Cupom aplicado! Você economizou 25% 🎉");
    } else {
      setCouponApplied(false);
      toast.error("Cupom inválido");
    }
  };

  const handleCheckout = (paymentLink: string) => {
    const url = new URL(paymentLink);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) url.searchParams.set("prefilled_email", data.user.email);
      window.open(url.toString(), "_blank");
    });
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

      {/* Coupon */}
      <div className="max-w-md mx-auto">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Possui um cupom?" value={coupon} onChange={e => setCoupon(e.target.value)} onKeyDown={e => e.key === "Enter" && applyCoupon()} />
          </div>
          <Button variant="outline" onClick={applyCoupon}>Aplicar</Button>
        </div>
        {couponApplied && (
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> 🔥 Cupom aplicado! Insira o cupom <strong>GOPEDAGOX</strong> no checkout para garantir 25% OFF.
          </p>
        )}
      </div>

      {/* Plans */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => {
          const isCurrent = isCurrentPlan(p.planType);
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
                  {p.priceOriginal && couponApplied ? (
                    <>
                      <p className="text-sm text-muted-foreground line-through">{p.priceOriginal}</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="font-display text-3xl font-extrabold text-green-600">{p.priceDiscount}</span>
                        <span className="text-sm text-muted-foreground">{p.period}</span>
                      </div>
                      <Badge variant="secondary" className="mt-1 text-green-600 bg-green-50">-25% OFF</Badge>
                    </>
                  ) : p.priceOriginal ? (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="font-display text-3xl font-extrabold">{p.priceDisplay}</span>
                      <span className="text-sm text-muted-foreground">{p.period}</span>
                    </div>
                  ) : (
                    <span className="font-display text-3xl font-extrabold">Grátis</span>
                  )}
                </div>

                <ul className="space-y-2 text-left">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                {p.paymentLink ? (
                  <Button
                    className={`w-full ${p.popular ? "gradient-primary border-0 text-primary-foreground hover:opacity-90" : ""}`}
                    variant={p.popular ? "default" : "outline"}
                    disabled={isCurrent}
                    onClick={() => handleCheckout(p.paymentLink!)}
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
