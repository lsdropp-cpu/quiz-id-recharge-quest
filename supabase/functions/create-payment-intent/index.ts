import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendUtmifyOrder, formatUtmifyDate } from "../_shared/utmify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const plans: Record<string, { name: string; description: string; amount: number }> = {
  "1": { name: "Método de Mejores Prácticas", description: "Método de Mejores Prácticas", amount: 900 },
  "2": { name: "Método de Mejores Prácticas", description: "Método de Mejores Prácticas", amount: 1590 },
  "3": { name: "Método de Mejores Prácticas", description: "Método de Mejores Prácticas", amount: 1900 },
  "4": { name: "Método de Mejores Prácticas", description: "Método de Mejores Prácticas", amount: 2500 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!publishableKey) throw new Error("STRIPE_PUBLISHABLE_KEY not configured");

    const {
      planId,
      email,
      playerId,
      name,
      country,
      document,
      tracking,
      bumpSelected,
    } = await req.json();
    const plan = plans[String(planId)];
    if (!plan) throw new Error("Invalid plan");
    const effectiveEmail = (email && String(email).trim()) || `pending+${Date.now()}@checkout.local`;
    const wantsBump = bumpSelected === true;
    const BUMP_AMOUNT_CENTS = 299;
    const bumpDelta = wantsBump ? BUMP_AMOUNT_CENTS : 0;
    const finalAmount = plan.amount + bumpDelta;

    const utm = tracking || {};
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;
    const userAgent = req.headers.get("user-agent") || null;

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: effectiveEmail,
      description: plan.description,
      metadata: {
        plan_id: String(planId),
        plan_name: plan.name,
        email: effectiveEmail,
        player_id: playerId || "",
        customer_name: name || "",
        country: country || "",
        document: document || "",
        bump_selected: wantsBump ? "true" : "false",
        bump_amount: String(bumpDelta),
        utm_source: utm.utm_source || "",
        utm_medium: utm.utm_medium || "",
        utm_campaign: utm.utm_campaign || "",
        utm_content: utm.utm_content || "",
        utm_term: utm.utm_term || "",
        src: utm.src || "",
        sck: utm.sck || "",
      },
    });

    // Create pending order keyed by payment_intent id
    const { data: inserted, error: insertError } = await supabase
      .from("orders")
      .insert({
        stripe_payment_intent_id: paymentIntent.id,
        email: effectiveEmail,
        player_id: playerId || null,
        plan_id: String(planId),
        plan_name: plan.name,
        amount: finalAmount,
        currency: "usd",
        status: "pending",
        customer_name: name || null,
        country: country || null,
        document: document || null,
        ip,
        user_agent: userAgent,
        bump_selected: wantsBump,
        bump_amount: bumpDelta,
        utm_source: utm.utm_source || null,
        utm_medium: utm.utm_medium || null,
        utm_campaign: utm.utm_campaign || null,
        utm_content: utm.utm_content || null,
        utm_term: utm.utm_term || null,
        src: utm.src || null,
        sck: utm.sck || null,
      })
      .select("id")
      .maybeSingle();

    if (insertError) {
      console.error("Failed to insert order:", insertError);
    }

    // Send "waiting_payment" event to Utmify
    try {
      const ok = await sendUtmifyOrder({
        orderId: paymentIntent.id,
        status: "waiting_payment",
        createdAt: formatUtmifyDate(new Date()),
        approvedDate: null,
        customer: {
          name: name || "Cliente",
          email: effectiveEmail,
          document: document || null,
          country: country || null,
          ip,
        },
        products: [
          {
            id: String(planId),
            name: plan.name,
            planId: String(planId),
            planName: plan.name,
            quantity: 1,
            priceInCents: plan.amount,
          },
        ],
        trackingParameters: {
          src: utm.src || null,
          sck: utm.sck || null,
          utm_source: utm.utm_source || null,
          utm_medium: utm.utm_medium || null,
          utm_campaign: utm.utm_campaign || null,
          utm_content: utm.utm_content || null,
          utm_term: utm.utm_term || null,
        },
        commission: {
          totalPriceInCents: plan.amount,
          gatewayFeeInCents: 0,
          userCommissionInCents: plan.amount,
          currency: "USD",
        },
      });

      if (ok && inserted?.id) {
        await supabase
          .from("orders")
          .update({ utmify_sent_waiting: true })
          .eq("id", inserted.id);
      }
    } catch (utmErr) {
      const msg = utmErr instanceof Error ? utmErr.message : "unknown";
      console.error("Utmify waiting_payment error:", msg);
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        publishableKey,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-payment-intent error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
