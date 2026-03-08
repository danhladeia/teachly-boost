import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PlanInfo {
  planType: string;
  creditsRemaining: number;
  logosLimit: number;
  subscriptionStatus: string;
}

interface CreditsContextType {
  plan: PlanInfo;
  loading: boolean;
  canUseAI: boolean;
  canUploadLogo: (currentLogosCount: number) => boolean;
  deductCredit: () => Promise<boolean>;
  refreshPlan: () => Promise<void>;
}

const defaultPlan: PlanInfo = {
  planType: "starter",
  creditsRemaining: 5,
  logosLimit: 0,
  subscriptionStatus: "active",
};

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanInfo>(defaultPlan);
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    
    // Sync subscription status from Stripe
    try {
      await supabase.functions.invoke("check-subscription");
    } catch (e) {
      // Silently fail - will use local profile data
    }

    const { data } = await supabase
      .from("profiles")
      .select("plan_type, credits_remaining, logos_limit, subscription_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setPlan({
        planType: (data as any).plan_type || "starter",
        creditsRemaining: (data as any).credits_remaining ?? 5,
        logosLimit: (data as any).logos_limit ?? 0,
        subscriptionStatus: (data as any).subscription_status || "active",
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const canUseAI = plan.planType === "ultra" || plan.creditsRemaining > 0;

  const canUploadLogo = (currentLogosCount: number) => {
    if (plan.planType === "ultra") return true;
    return currentLogosCount < plan.logosLimit;
  };

  const deductCredit = async (): Promise<boolean> => {
    if (!user) return false;
    if (plan.planType === "ultra") return true;
    if (plan.creditsRemaining <= 0) return false;

    const newCredits = plan.creditsRemaining - 1;
    const { error } = await supabase
      .from("profiles")
      .update({ credits_remaining: newCredits } as any)
      .eq("user_id", user.id);

    if (error) return false;
    setPlan(prev => ({ ...prev, creditsRemaining: newCredits }));
    return true;
  };

  return (
    <CreditsContext.Provider value={{ plan, loading, canUseAI, canUploadLogo, deductCredit, refreshPlan: fetchPlan }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) throw new Error("useCredits must be used within CreditsProvider");
  return context;
}
