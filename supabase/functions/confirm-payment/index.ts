import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendUtmifyOrder, formatUtmifyDate, type UtmifyStatus } from "../_shared/utmify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback when Stripe webhook hasn't fired. Looks up the PaymentIntent
// directly on Stripe and finalizes the order if it's succeeded.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) throw new Error("paymentIntentId required");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log("PI", pi.id, "status:", pi.status);

    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_payment_intent_id", pi.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!order) throw new Error("order not found");

    if (pi.status !== "succeeded") {
      return new Response(
        JSON.stringify({ status: pi.status, delivered: order.delivered }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const approvedAt = new Date();
    const meta = pi.metadata || {};
    const piEmail = pi.receipt_email || meta.email || null;

    // Sync amounts + email if updated post-creation
    const piBumpSelected = meta.bump_selected === "true";
    const piBumpAmount = Number(meta.bump_amount || "0") || 0;
    const updatePayload: Record<string, unknown> = {};
    if (!order.delivered) {
      updatePayload.status = "paid";
      updatePayload.delivered = true;
      updatePayload.delivered_at = approvedAt.toISOString();
    }
    if (order.amount !== pi.amount) updatePayload.amount = pi.amount;
    if (order.bump_selected !== piBumpSelected) updatePayload.bump_selected = piBumpSelected;
    if (order.bump_amount !== piBumpAmount) updatePayload.bump_amount = piBumpAmount;
    if (piEmail && (!order.email || order.email.startsWith("pending+"))) {
      updatePayload.email = piEmail;
    }
    if (!order.customer_name && meta.customer_name) updatePayload.customer_name = meta.customer_name;
    if (!order.country && meta.country) updatePayload.country = meta.country;

    if (Object.keys(updatePayload).length > 0) {
      const { error: updErr } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", order.id);
      if (updErr) throw updErr;
      Object.assign(order, updatePayload);
    }

    if (!order.utmify_sent_paid) {
      const products = [
        {
          id: order.plan_id,
          name: order.plan_name,
          planId: order.plan_id,
          planName: order.plan_name,
          quantity: 1,
          priceInCents: order.amount - (order.bump_selected ? order.bump_amount : 0),
        },
      ];
      if (order.bump_selected && order.bump_amount > 0) {
        products.push({
          id: "bump-1k-diamonds",
          name: "+1,000 diamantes extras",
          planId: "bump-1k-diamonds",
          planName: "+1,000 diamantes extras",
          quantity: 1,
          priceInCents: order.bump_amount,
        });
      }
      const ok = await sendUtmifyOrder({
        orderId: order.id,
        status: "paid" as UtmifyStatus,
        createdAt: formatUtmifyDate(new Date(order.created_at)),
        approvedDate: formatUtmifyDate(approvedAt),
        customer: {
          name: order.customer_name || "Cliente",
          email: order.email,
          document: order.document,
          country: order.country,
          ip: order.ip || undefined,
        },
        products,
        trackingParameters: {
          src: order.src,
          sck: order.sck,
          utm_source: order.utm_source,
          utm_medium: order.utm_medium,
          utm_campaign: order.utm_campaign,
          utm_content: order.utm_content,
          utm_term: order.utm_term,
        },
        commission: {
          totalPriceInCents: order.amount,
          gatewayFeeInCents: 0,
          userCommissionInCents: order.amount,
          currency: "USD",
        },
      });
      if (ok) {
        await supabase.from("orders").update({ utmify_sent_paid: true }).eq("id", order.id);
      }
      // Pushcut is sent exclusively from stripe-webhook to avoid duplicate
      // notifications (this client-triggered confirm can fire in addition
      // to the Stripe webhook).
    }

    return new Response(
      JSON.stringify({ status: "succeeded", delivered: true, orderId: order.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("confirm-payment error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
