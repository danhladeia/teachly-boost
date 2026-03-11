import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCredits } from "./useCredits";
import { toast } from "sonner";

const DOC_LIMITS: Record<string, number> = {
  starter: 20,
  pro: 150,
  master: 500,
  ultra: Infinity,
};

interface DocLimitsContextType {
  docCount: number;
  docLimit: number;
  loading: boolean;
  canSaveDocument: () => boolean;
  checkAndWarnLimit: () => boolean; // returns true if can save
  refreshCount: () => Promise<void>;
  usagePercent: number;
}

const DocLimitsContext = createContext<DocLimitsContextType | undefined>(undefined);

export function DocLimitsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { plan } = useCredits();
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const docLimit = DOC_LIMITS[plan.planType] || DOC_LIMITS.starter;

  const fetchCount = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [{ count: docsCount }, { count: provasCount }] = await Promise.all([
        supabase.from("documentos_salvos").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("provas").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setDocCount((docsCount || 0) + (provasCount || 0));
    } catch {} finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  const canSaveDocument = () => {
    if (plan.planType === "ultra") return true;
    return docCount < docLimit;
  };

  const checkAndWarnLimit = () => {
    if (canSaveDocument()) return true;
    const planName = plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1);
    toast.error(`Limite de documentos atingido para o plano ${planName}. Exclua arquivos antigos ou faça um upgrade para continuar salvando novos materiais.`);
    return false;
  };

  const usagePercent = docLimit === Infinity ? 0 : Math.min(100, (docCount / docLimit) * 100);

  return (
    <DocLimitsContext.Provider value={{ docCount, docLimit, loading, canSaveDocument, checkAndWarnLimit, refreshCount: fetchCount, usagePercent }}>
      {children}
    </DocLimitsContext.Provider>
  );
}

export function useDocumentLimits() {
  const context = useContext(DocLimitsContext);
  if (!context) throw new Error("useDocumentLimits must be used within DocLimitsProvider");
  return context;
}
