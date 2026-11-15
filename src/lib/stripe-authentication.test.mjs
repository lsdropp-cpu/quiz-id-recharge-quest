import { test, expect, mock } from "bun:test";

mock.module("@tanstack/react-router", () => ({ createFileRoute: () => (options) => options }));
mock.module("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        gte: () => query,
        not: () => query,
        insert: () => query,
        then: (resolve) => Promise.resolve({ count: 0, data: [], error: null }).then(resolve),
      };
      return query;
    },
  },
}));

const { Route } = await import("../routes/api/public/process-card-payment");

test('Stripe receives 3DS "automatic" and required bank authentication still reaches the client', async () => {
  const originalFetch = globalThis.fetch;
  const originalSecret = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_test_mock_not_a_real_key";
  let intentParams;
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith("/payment_intents")) {
      intentParams = new URLSearchParams(init.body);
      return Response.json({ id: "pi_mock", status: "requires_action", client_secret: "mock_client_secret" });
    }
    return Response.json({ card: { last4: "4242" }, billing_details: {} });
  };
  try {
    const response = await Route.server.handlers.POST({ request: new Request("http://localhost:8080/api/public/process-card-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodId: "pm_mock", priceKey: "35", email: "" }),
    }) });
    expect(intentParams?.get("payment_method_options[card][request_three_d_secure]")).toBe("automatic");
    expect(intentParams?.get("confirm")).toBe("true");
    expect(await response.json()).toEqual({ requires_action: true, client_secret: "mock_client_secret", paymentIntentId: "pi_mock" });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalSecret === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalSecret;
  }
});