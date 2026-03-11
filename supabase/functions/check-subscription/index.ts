import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_MAP: Record<string, { plan_type: string; credits_general: number; credits_exams: number; logos_limit: number }> = {
  "prod_U7rgC68r4gOsXE": { plan_type: "pro", credits_general: 30, credits_exams: 50, logos_limit: 1 },
  "prod_U7rj8fMAjazzyW": { plan_type: "master", credits_general: 60, credits_exams: 100, logos_limit: 3 },
  "prod_U7rl14Z9M62oqL": { plan_type: "ultra", credits_general: 9999, credits_exams: 9999, logos_limit: 9999 },
};

const STARTER_DEFAULTS = {
  plan_type: "starter",
  credits_general: 10,
  credits_exams: 10,
  credits_remaining: 10,
  logos_limit: 0,
  subscription_status: "inactive",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("User not authenticated");

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    if (!userEmail) throw new Error("User not authenticated");

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Read current profile to check existing plan
    const { data: currentProfile } = await supabaseClient
      .from("profiles")
      .select("plan_type, credits_general, credits_exams, subscription_status")
      .eq("user_id", userId)
      .maybeSingle();

    const currentPlanType = currentProfile?.plan_type || "starter";
    const currentSubStatus = currentProfile?.subscription_status || "inactive";

    // If admin manually set an active plan, don't override it when there's no Stripe subscription
    const isAdminManaged = currentPlanType !== "starter" && currentSubStatus === "active";

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (customers.data.length === 0) {
      // No Stripe customer — only downgrade if NOT admin-managed
      if (!isAdminManaged && currentPlanType !== "starter") {
        await supabaseClient
          .from("profiles")
          .update(STARTER_DEFAULTS)
          .eq("user_id", userId);
      }
      return new Response(JSON.stringify({
        subscribed: isAdminManaged,
        plan_type: isAdminManaged ? currentPlanType : "starter",
        credits: isAdminManaged ? (currentProfile?.credits_general ?? 10) : 5,
        logos_limit: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription — downgrade to starter if not already
      if (currentPlanType !== "starter") {
        await supabaseClient
          .from("profiles")
          .update({ ...STARTER_DEFAULTS, stripe_customer_id: customerId })
          .eq("user_id", userId);
      } else {
        // Just update stripe_customer_id and status
        await supabaseClient
          .from("profiles")
          .update({ subscription_status: "inactive", stripe_customer_id: customerId })
          .eq("user_id", userId);
      }
      return new Response(JSON.stringify({
        subscribed: false,
        plan_type: "starter",
        credits: 5,
        logos_limit: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscription = subscriptions.data[0];
    const productId = subscription.items.data[0].price.product as string;
    const planInfo = PLAN_MAP[productId] || { plan_type: "starter", credits_general: 10, credits_exams: 10, logos_limit: 0 };
    
    let subscriptionEnd: string | null = null;
    try {
      const endVal = subscription.current_period_end;
      if (typeof endVal === 'number') {
        subscriptionEnd = new Date(endVal * 1000).toISOString();
      } else if (typeof endVal === 'string') {
        subscriptionEnd = new Date(endVal).toISOString();
      }
    } catch (_) {
      subscriptionEnd = null;
    }

    // Only reset credits if plan CHANGED (upgrade/downgrade)
    const planChanged = currentPlanType !== planInfo.plan_type;

    if (planChanged) {
      // Plan changed — update everything including credits
      await supabaseClient
        .from("profiles")
        .update({
          plan_type: planInfo.plan_type,
          credits_general: planInfo.credits_general,
          credits_exams: planInfo.credits_exams,
          credits_remaining: planInfo.credits_general,
          logos_limit: planInfo.logos_limit,
          subscription_status: "active",
          stripe_customer_id: customerId,
        })
        .eq("user_id", userId);
    } else {
      // Same plan — only update status and customer id, preserve credits
      await supabaseClient
        .from("profiles")
        .update({
          subscription_status: "active",
          stripe_customer_id: customerId,
          logos_limit: planInfo.logos_limit,
        })
        .eq("user_id", userId);
    }

    return new Response(JSON.stringify({
      subscribed: true,
      plan_type: planInfo.plan_type,
      credits_general: planInfo.credits_general,
      credits_exams: planInfo.credits_exams,
      logos_limit: planInfo.logos_limit,
      subscription_end: subscriptionEnd,
      product_id: productId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
