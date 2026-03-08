import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_MAP: Record<string, { plan_type: string; credits: number; logos_limit: number }> = {
  "prod_U6n8quHrrPOmYK": { plan_type: "pro", credits: 15, logos_limit: 1 },
  "prod_U6n9jH2bYUkyA4": { plan_type: "master", credits: 50, logos_limit: 3 },
  "prod_U6nANb09m2BmIv": { plan_type: "ultra", credits: 9999, logos_limit: 9999 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({
        subscribed: false,
        plan_type: "starter",
        credits: 5,
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
    const planInfo = PLAN_MAP[productId] || { plan_type: "starter", credits: 5, logos_limit: 0 };
    
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

    // Sync profile
    await supabaseClient
      .from("profiles")
      .update({
        plan_type: planInfo.plan_type,
        credits_remaining: planInfo.credits,
        logos_limit: planInfo.logos_limit,
        subscription_status: "active",
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({
      subscribed: true,
      plan_type: planInfo.plan_type,
      credits: planInfo.credits,
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
