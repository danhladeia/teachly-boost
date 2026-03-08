import { Coins, AlertTriangle, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCredits } from "@/hooks/useCredits";
import { Link } from "react-router-dom";

export default function CreditsDisplay() {
  const { plan, loading } = useCredits();

  if (loading) return null;

  const isUnlimited = plan.planType === "ultra";
  const isLow = !isUnlimited && plan.creditsRemaining <= 2;
  const isZero = !isUnlimited && plan.creditsRemaining === 0;

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isZero ? "border-destructive/50 bg-destructive/5" : isLow ? "border-yellow-500/50 bg-yellow-50" : "border-border bg-card"}`}>
      {isUnlimited ? (
        <>
          <Crown className="h-4 w-4 text-plan-mestre" />
          <span className="font-medium">Créditos Ilimitados</span>
          <Badge variant="secondary" className="text-xs capitalize">{plan.planType}</Badge>
        </>
      ) : isZero ? (
        <>
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="font-medium text-destructive">Sem créditos</span>
          <Link to="/app/planos" className="text-xs text-primary font-medium hover:underline ml-1">
            Fazer upgrade
          </Link>
        </>
      ) : (
        <>
          <Coins className="h-4 w-4 text-primary" />
          <span className="font-medium">{plan.creditsRemaining} crédito{plan.creditsRemaining !== 1 ? "s" : ""}</span>
          <Badge variant="secondary" className="text-xs capitalize">{plan.planType}</Badge>
        </>
      )}
    </div>
  );
}
