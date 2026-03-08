import { useState } from "react";
import { CheckCircle2, Star, Zap, Crown, Rocket, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const plans = [
  {
    id: "starter",
    name: "Starter",
    icon: Star,
    priceOriginal: null,
    priceDiscount: null,
    priceDisplay: "R$ 0,00",
    period: "",
    popular: false,
    color: "text-muted-foreground",
    features: [
      "5 créditos únicos",
      "Acesso a todos os módulos",
      "Exportação PDF",
      "Com marca d'água",
    ],
    cta: "Plano Atual",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    priceOriginal: "R$ 24,90",
    priceDiscount: "R$ 18,67",
    priceDisplay: "R$ 24,90",
    period: "/mês",
    popular: false,
    color: "text-primary",
    features: [
      "15 créditos/mês",
      "1 Timbre Escolar",
      "Sem marca d'água",
      "Suporte via e-mail",
    ],
    cta: "Assinar Pro",
    disabled: false,
  },
  {
    id: "master",
    name: "Master",
    icon: Crown,
    priceOriginal: "R$ 44,90",
    priceDiscount: "R$ 33,67",
    priceDisplay: "R$ 44,90",
    period: "/mês",
    popular: true,
    color: "text-plan-pratico",
    features: [
      "50 créditos/mês",
      "Até 3 Timbres (Multiescolas)",
      "Sem marca d'água",
      "Suporte prioritário",
    ],
    cta: "Assinar Master",
    disabled: false,
  },
  {
    id: "ultra",
    name: "Ultra",
    icon: Rocket,
    priceOriginal: "R$ 89,90",
    priceDiscount: "R$ 67,42",
    priceDisplay: "R$ 89,90",
    period: "/mês",
    popular: false,
    color: "text-plan-mestre",
    features: [
      "Créditos Ilimitados",
      "Timbres Ilimitados",
      "Sem marca d'água",
      "Suporte via WhatsApp",
    ],
    cta: "Assinar Ultra",
    disabled: false,
  },
];

export default function Pricing() {
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "GOPEDAGOX") {
      setCouponApplied(true);
      toast.success("Cupom aplicado! Você economizou 25% 🎉");
    } else {
      setCouponApplied(false);
      toast.error("Cupom inválido");
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Escolha seu Plano</h1>
        <p className="text-muted-foreground mt-1">Evolua quando precisar, cancele quando quiser</p>
      </div>

      {/* Coupon */}
      <div className="max-w-md mx-auto">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Possui um cupom?"
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyCoupon()}
            />
          </div>
          <Button variant="outline" onClick={applyCoupon}>Aplicar</Button>
        </div>
        {couponApplied && (
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Cupom aplicado! Você economizou 25%
          </p>
        )}
      </div>

      {/* Plans */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative shadow-card ${plan.popular ? "border-primary ring-2 ring-primary/20" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                MAIS POPULAR
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <plan.icon className={`h-6 w-6 ${plan.color}`} />
              </div>
              <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {/* Pricing */}
              <div>
                {plan.priceOriginal && couponApplied ? (
                  <>
                    <p className="text-sm text-muted-foreground line-through">{plan.priceOriginal}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="font-display text-3xl font-extrabold text-green-600">{plan.priceDiscount}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    <Badge variant="secondary" className="mt-1 text-green-600 bg-green-50">-25% OFF</Badge>
                  </>
                ) : plan.priceOriginal ? (
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-display text-3xl font-extrabold">{plan.priceDisplay}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                ) : (
                  <span className="font-display text-3xl font-extrabold">Grátis</span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 text-left">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.popular ? "gradient-primary border-0 text-primary-foreground hover:opacity-90" : ""}`}
                variant={plan.popular ? "default" : "outline"}
                disabled={plan.disabled}
              >
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
