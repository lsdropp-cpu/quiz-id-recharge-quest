const redactUrl = (value: string): string => {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return "invalid-url";
  }
};

Deno.serve(async () => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("STRIPE_ENDPOINT_AUDIT missing Stripe key");
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const response = await fetch("https://api.stripe.com/v1/webhook_endpoints?limit=100", {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });

  if (!response.ok) {
    console.error("STRIPE_ENDPOINT_AUDIT request failed", response.status, await response.text());
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await response.json();
  const endpoints = (payload.data ?? []).map((endpoint: Record<string, unknown>) => ({
    id: endpoint.id,
    status: endpoint.status,
    url: redactUrl(String(endpoint.url ?? "")),
    enabled_events: endpoint.enabled_events,
  }));

  console.log("STRIPE_ENDPOINT_AUDIT", JSON.stringify(endpoints));

  return new Response(JSON.stringify({ ok: true, count: endpoints.length, endpoints }), {
    headers: { "Content-Type": "application/json" },
  });
});