import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendUtmifyOrder, formatUtmifyDate } from "../_shared/utmify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin utility to resend a "paid" event to Utmify for an existing order.
// Call: POST { "orderId": "<uuid>" }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) throw error;
    if (!order) throw new Error("Order not found");

    const approvedAt = order.delivered_at ? new Date(order.delivered_at) : new Date();

    const ok = await sendUtmifyOrder({
      orderId: order.id,
      status: "paid",
      createdAt: formatUtmifyDate(new Date(order.created_at)),
      approvedDate: formatUtmifyDate(approvedAt),
      customer: {
        name: order.customer_name || "Cliente",
        email: order.email,
        document: order.document,
        country: order.country,
        ip: order.ip,
      },
      products: [
        {
          id: order.plan_id,
          name: order.plan_name,
          planId: order.plan_id,
          planName: order.plan_name,
          quantity: 1,
          priceInCents: order.amount,
        },
      ],
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

    return new Response(JSON.stringify({ ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("utmify-resend error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
