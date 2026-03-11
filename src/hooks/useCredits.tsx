import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setCache, getCache } from "@/lib/cache-utils";
import { useAuth } from "./useAuth";

interface PlanInfo {
  planType: string;
  creditsGeneral: number;
  creditsExams: number;
  creditsRemaining: number; // kept for backward compat
  logosLimit: number;
  subscriptionStatus: string;
}

interface PlanLimits {
  maxGeneral: number;
  maxExams: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: { maxGeneral: 10, maxExams: 10 },
  pro: { maxGeneral: 30, maxExams: 50 },
  master: { maxGeneral: 60, maxExams: 100 },
  ultra: { maxGeneral: Infinity, maxExams: Infinity },
};

interface CreditsContextType {
  plan: PlanInfo;
  loading: boolean;
  canUseAI: boolean;
  canCorrectExam: (count?: number) => boolean;
  canUploadLogo: (currentLogosCount: number) => boolean;
  deductCredit: () => Promise<boolean>;
  deductExamCredits: (count: number) => Promise<boolean>;
  refreshPlan: () => Promise<void>;
  planLimits: PlanLimits;
}

const defaultPlan: PlanInfo = {
  planType: "starter",
  creditsGeneral: 10,
  creditsExams: 10,
  creditsRemaining: 10,
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

    // Load from cache instantly
    const cached = getCache<PlanInfo>(`plan_${user.id}`, 10 * 60 * 1000);
    if (cached) {
      setPlan(cached);
      setLoading(false);
    }
    
    try {
      await supabase.functions.invoke("check-subscription");
    } catch (e) {}

    const { data } = await supabase
      .from("profiles")
      .select("plan_type, credits_remaining, credits_general, credits_exams, logos_limit, subscription_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      const planData: PlanInfo = {
        planType: (data as any).plan_type || "starter",
        creditsGeneral: (data as any).credits_general ?? 10,
        creditsExams: (data as any).credits_exams ?? 10,
        creditsRemaining: (data as any).credits_remaining ?? 5,
        logosLimit: (data as any).logos_limit ?? 0,
        subscriptionStatus: (data as any).subscription_status || "active",
      };
      setPlan(planData);
      setCache(`plan_${user.id}`, planData);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const planLimits = PLAN_LIMITS[plan.planType] || PLAN_LIMITS.starter;
  const canUseAI = plan.planType === "ultra" || plan.creditsGeneral > 0;

  const canCorrectExam = (count: number = 1) => {
    if (plan.planType === "ultra") return true;
    return plan.creditsExams >= count;
  };

  const canUploadLogo = (currentLogosCount: number) => {
    if (plan.planType === "ultra") return true;
    return currentLogosCount < plan.logosLimit;
  };

  const deductCredit = async (): Promise<boolean> => {
    if (!user) return false;
    if (plan.planType === "ultra") return true;
    if (plan.creditsGeneral <= 0) return false;

    const newCredits = plan.creditsGeneral - 1;
    const { error } = await supabase
      .from("profiles")
      .update({ credits_general: newCredits, credits_remaining: newCredits } as any)
      .eq("user_id", user.id);

    if (error) return false;
    const updated = { ...plan, creditsGeneral: newCredits, creditsRemaining: newCredits };
    setPlan(prev => ({ ...prev, creditsGeneral: newCredits, creditsRemaining: newCredits }));
    if (user) setCache(`plan_${user.id}`, updated);
    return true;
  };

  const deductExamCredits = async (count: number): Promise<boolean> => {
    if (!user) return false;
    if (plan.planType === "ultra") return true;
    if (plan.creditsExams < count) return false;

    const newCredits = plan.creditsExams - count;
    const { error } = await supabase
      .from("profiles")
      .update({ credits_exams: newCredits } as any)
      .eq("user_id", user.id);

    if (error) return false;
    const updated = { ...plan, creditsExams: newCredits };
    setPlan(prev => ({ ...prev, creditsExams: newCredits }));
    if (user) setCache(`plan_${user.id}`, updated);
    return true;
  };

  return (
    <CreditsContext.Provider value={{ plan, loading, canUseAI, canCorrectExam, canUploadLogo, deductCredit, deductExamCredits, refreshPlan: fetchPlan, planLimits }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) throw new Error("useCredits must be used within CreditsProvider");
  return context;
}
