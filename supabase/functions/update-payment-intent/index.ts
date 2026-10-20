import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base prices per plan (in cents). Must match create-payment-intent.
const PLAN_BASE_AMOUNTS: Record<string, number> = {
  "1": 900,
  "2": 1590,
  "3": 1900,
  "4": 2500,
};

// Order bump: +1,000 diamantes for +US$ 2.99
const BUMP_AMOUNT_CENTS = 299;
const BUMP_LABEL = "+1,000 diamantes extras";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const { paymentIntentId, email, name, country, bumpSelected, tracking } = await req.json();
    if (!paymentIntentId) throw new Error("paymentIntentId required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch current PI to merge metadata + know its plan/base amount
    const current = await stripe.paymentIntents.retrieve(paymentIntentId);

    const cleanEmail = (email || "").trim();
    const cleanName = (name || "").trim();
    const cleanCountry = (country || "").trim();
    const wantsBump = bumpSelected === true;
    const utm = tracking || {};

    const mergedMetadata: Record<string, string> = { ...(current.metadata || {}) };
    if (cleanEmail) mergedMetadata.email = cleanEmail;
    if (cleanName) mergedMetadata.customer_name = cleanName;
    if (cleanCountry) mergedMetadata.country = cleanCountry;
    if (utm.utm_source) mergedMetadata.utm_source = String(utm.utm_source);
    if (utm.utm_medium) mergedMetadata.utm_medium = String(utm.utm_medium);
    if (utm.utm_campaign) mergedMetadata.utm_campaign = String(utm.utm_campaign);
    if (utm.utm_content) mergedMetadata.utm_content = String(utm.utm_content);
    if (utm.utm_term) mergedMetadata.utm_term = String(utm.utm_term);
    if (utm.src) mergedMetadata.src = String(utm.src);
    if (utm.sck) mergedMetadata.sck = String(utm.sck);

    // Compute the correct amount based on plan + bump selection. Always
    // recompute from the base plan price so toggling bump on/off works.
    const planId = mergedMetadata.plan_id || current.metadata?.plan_id || "1";
    const baseAmount = PLAN_BASE_AMOUNTS[planId] ?? current.amount;
    const bumpDelta = wantsBump ? BUMP_AMOUNT_CENTS : 0;
    const newAmount = baseAmount + bumpDelta;

    mergedMetadata.bump_selected = wantsBump ? "true" : "false";
    mergedMetadata.bump_amount = String(bumpDelta);
    if (wantsBump) {
      mergedMetadata.bump_label = BUMP_LABEL;
    } else {
      delete mergedMetadata.bump_label;
    }

    const updateParams: Stripe.PaymentIntentUpdateParams = {
      metadata: mergedMetadata,
      amount: newAmount,
    };
    if (cleanEmail) {
      updateParams.receipt_email = cleanEmail;
    }

    await stripe.paymentIntents.update(paymentIntentId, updateParams);

    // Mirror to the pending order row so dashboards/Utmify see real values
    const orderUpdate: Record<string, unknown> = {
      bump_selected: wantsBump,
      bump_amount: bumpDelta,
      amount: newAmount,
    };
    if (cleanEmail) orderUpdate.email = cleanEmail;
    if (cleanName) orderUpdate.customer_name = cleanName;
    if (cleanCountry) orderUpdate.country = cleanCountry;
    if (utm.utm_source) orderUpdate.utm_source = String(utm.utm_source);
    if (utm.utm_medium) orderUpdate.utm_medium = String(utm.utm_medium);
    if (utm.utm_campaign) orderUpdate.utm_campaign = String(utm.utm_campaign);
    if (utm.utm_content) orderUpdate.utm_content = String(utm.utm_content);
    if (utm.utm_term) orderUpdate.utm_term = String(utm.utm_term);
    if (utm.src) orderUpdate.src = String(utm.src);
    if (utm.sck) orderUpdate.sck = String(utm.sck);

    await supabase
      .from("orders")
      .update(orderUpdate)
      .eq("stripe_payment_intent_id", paymentIntentId);

    return new Response(
      JSON.stringify({ ok: true, amount: newAmount, bumpSelected: wantsBump }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("update-payment-intent error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
