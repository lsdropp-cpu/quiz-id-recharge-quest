// Returns only the Stripe publishable key so the frontend can
// initialize Stripe.js / Elements in deferred-intent mode
// WITHOUT creating a PaymentIntent on page load.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
  if (!publishableKey) {
    return new Response(JSON.stringify({ error: "STRIPE_PUBLISHABLE_KEY not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
  return new Response(JSON.stringify({ publishableKey }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
    status: 200,
  });
});
