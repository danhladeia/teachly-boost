import { Coins, FileCheck, FolderOpen } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useDocumentLimits } from "@/hooks/useDocumentLimits";
import { Link } from "react-router-dom";

/** Compact inline credits indicator — right-aligned on desktop, centered on mobile */
export default function CreditsIndicator() {
  const { plan, loading, planLimits } = useCredits();
  const { docCount, docLimit } = useDocumentLimits();

  if (loading) return null;

  const isUnlimited = plan.planType === "ultra";

  return (
    <div className="flex items-center justify-center sm:justify-end gap-3 text-[10px] sm:text-xs text-muted-foreground">
      <Link to="/app/planos" className="flex items-center gap-1 hover:text-foreground transition-colors" title="Créditos de criação">
        <Coins className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
        {isUnlimited ? (
          <span className="font-medium text-primary">∞</span>
        ) : (
          <span className="font-medium">{plan.creditsGeneral}/{planLimits.maxGeneral}</span>
        )}
      </Link>

      <Link to="/app/planos" className="flex items-center gap-1 hover:text-foreground transition-colors" title="Créditos de correção">
        <FileCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-destructive" />
        {isUnlimited ? (
          <span className="font-medium text-primary">∞</span>
        ) : (
          <span className="font-medium">{plan.creditsExams}/{planLimits.maxExams}</span>
        )}
      </Link>

      <Link to="/app/biblioteca" className="flex items-center gap-1 hover:text-foreground transition-colors" title="Documentos salvos">
        <FolderOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-plan-pratico" />
        {isUnlimited ? (
          <span className="font-medium text-primary">∞</span>
        ) : (
          <span className="font-medium">{docCount}/{docLimit}</span>
        )}
      </Link>
    </div>
  );
}
