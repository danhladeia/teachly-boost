import { Coins, AlertTriangle, Crown, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCredits } from "@/hooks/useCredits";
import { Link } from "react-router-dom";

export default function CreditsDisplay() {
  const { plan, loading, planLimits } = useCredits();

  if (loading) return null;

  const isUnlimited = plan.planType === "ultra";
  const isLowGeneral = !isUnlimited && plan.creditsGeneral <= 2;
  const isLowExams = !isUnlimited && plan.creditsExams <= 2;
  const isZeroGeneral = !isUnlimited && plan.creditsGeneral === 0;
  const isZeroExams = !isUnlimited && plan.creditsExams === 0;
  const anyZero = isZeroGeneral || isZeroExams;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* General credits */}
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isZeroGeneral ? "border-destructive/50 bg-destructive/5" : isLowGeneral ? "border-yellow-500/50 bg-yellow-50" : "border-border bg-card"}`}>
        {isUnlimited ? (
          <>
            <Crown className="h-4 w-4 text-plan-mestre" />
            <span className="font-medium text-xs">Créditos Ilimitados</span>
          </>
        ) : (
          <>
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-medium text-xs">Criação: {plan.creditsGeneral} / {planLimits.maxGeneral}</span>
          </>
        )}
      </div>

      {/* Exam credits */}
      {!isUnlimited && (
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isZeroExams ? "border-destructive/50 bg-destructive/5" : isLowExams ? "border-yellow-500/50 bg-yellow-50" : "border-border bg-card"}`}>
          <FileCheck className="h-4 w-4 text-destructive" />
          <span className="font-medium text-xs">Correções: {plan.creditsExams} / {planLimits.maxExams}</span>
        </div>
      )}

      {isUnlimited && (
        <Badge variant="secondary" className="text-xs capitalize">{plan.planType}</Badge>
      )}

      {anyZero && (
        <Link to="/app/planos" className="text-xs text-primary font-medium hover:underline">
          Fazer upgrade
        </Link>
      )}
    </div>
  );
}
