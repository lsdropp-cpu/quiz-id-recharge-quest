import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const plans: Record<string, { name: string; description: string; amount: number }> = {
  "1": { name: "5,600 Diamantes + 1,120 Bonus", description: "Free Fire - Bono de Diamantes", amount: 900 },
  "2": { name: "11,200 Diamantes + 2,240 Bonus", description: "Free Fire - Bono de Diamantes", amount: 1590 },
  "3": { name: "22,400 Diamantes + 4,480 Bonus", description: "Free Fire - Bono de Diamantes", amount: 1900 },
  "4": { name: "29,500 Diamantes + 5,900 Bonus", description: "Free Fire - Bono de Diamantes", amount: 2500 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const { planId, email, playerId } = await req.json();
    const plan = plans[String(planId)];
    if (!plan) throw new Error("Invalid plan");
    if (!email) throw new Error("Email required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const origin = req.headers.get("origin") || "https://example.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: plan.name, description: plan.description },
            unit_amount: plan.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan_id: String(planId),
        plan_name: plan.name,
        email,
        player_id: playerId || "",
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/${planId}?canceled=true`,
    });

    // Create pending order record
    const { error: insertError } = await supabase.from("orders").insert({
      stripe_session_id: session.id,
      email,
      player_id: playerId || null,
      plan_id: String(planId),
      plan_name: plan.name,
      amount: plan.amount,
      currency: "usd",
      status: "pending",
    });

    if (insertError) {
      console.error("Failed to insert order:", insertError);
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-checkout error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
