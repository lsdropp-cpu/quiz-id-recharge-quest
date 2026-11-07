import { createFileRoute } from "@tanstack/react-router";
import { rechargePackages } from "@/lib/recharge-packages";

// Ported from the gemtop process-card-payment edge function. Runs as a
// TanStack server route and talks to Stripe's REST API directly via fetch
// (Worker-safe, no Node-only SDK). The request body is not trusted: prices
// come from the server-side PRICES map only.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// Rate limiting constants
const MAX_ATTEMPTS_PER_IP = 8;
const MAX_ATTEMPTS_PER_EMAIL = 8;
const MAX_ATTEMPTS_PER_CARD = 4;
const MAX_DIFFERENT_CARDS_PER_IP = 4;
const MAX_DIFFERENT_CARDS_PER_EMAIL = 4;
const TIME_WINDOW_MINUTES = 10;

// Price mapping for each package - Método de Mejores Prácticas (amount in
// cents). Amounts come from the shared recharge pack table so the value
// charged always matches the value the recharge pages display.
const PRICES: Record<string, { amount: number; description: string }> = {
  "1": { amount: 100, description: "NMJ Test" },
  ...Object.fromEntries(
    rechargePackages.map((pkg) => [pkg.key, { amount: pkg.cents, description: pkg.statement }]),
  ),
};


function encode(params: Record<string, unknown>, prefix?: string): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") {
      parts.push(encode(v as Record<string, unknown>, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.filter(Boolean).join("&");
}

async function stripeFetch(
  path: string,
  method: "GET" | "POST",
  secret: string,
  body?: Record<string, unknown>,
): Promise<any> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? encode(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(json?.error?.message || `Stripe error ${res.status}`);
    err.stripeCode = json?.error?.code;
    err.declineCode = json?.error?.decline_code;
    err.isCardError = json?.error?.type === "card_error";
    throw err;
  }
  return json;
}

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;
  return "unknown";
}

async function checkRateLimits(
  supabase: any,
  ip: string,
  email: string,
  cardLast4?: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const timeWindowStart = new Date(Date.now() - TIME_WINDOW_MINUTES * 60 * 1000).toISOString();
  const blockedReason = "Pagamento temporariamente indisponível. Tente novamente mais tarde.";

  try {
    const { count: ipCount, error: ipError } = await supabase
      .from("payment_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", timeWindowStart);

    if (ipError) {
      console.error("[RATE-LIMIT] Error checking IP attempts:", ipError);
    } else if (ipCount && ipCount >= MAX_ATTEMPTS_PER_IP) {
      return { allowed: false, reason: blockedReason };
    }

    const { data: ipCards, error: ipCardsError } = await supabase
      .from("payment_attempts")
      .select("card_last4")
      .eq("ip_address", ip)
      .not("card_last4", "is", null)
      .gte("created_at", timeWindowStart);

    if (ipCardsError) {
      console.error("[RATE-LIMIT] Error checking IP cards:", ipCardsError);
    } else if (ipCards) {
      const uniqueCards = new Set(ipCards.map((r: any) => r.card_last4).filter(Boolean));
      if (cardLast4 && !uniqueCards.has(cardLast4) && uniqueCards.size >= MAX_DIFFERENT_CARDS_PER_IP) {
        return { allowed: false, reason: blockedReason };
      }
    }

    if (email) {
      const { count: emailCount, error: emailError } = await supabase
        .from("payment_attempts")
        .select("*", { count: "exact", head: true })
        .eq("email", email.toLowerCase())
        .gte("created_at", timeWindowStart);

      if (emailError) {
        console.error("[RATE-LIMIT] Error checking email attempts:", emailError);
      } else if (emailCount && emailCount >= MAX_ATTEMPTS_PER_EMAIL) {
        return { allowed: false, reason: blockedReason };
      }

      const { data: emailCards, error: emailCardsError } = await supabase
        .from("payment_attempts")
        .select("card_last4")
        .eq("email", email.toLowerCase())
        .not("card_last4", "is", null)
        .gte("created_at", timeWindowStart);

      if (emailCardsError) {
        console.error("[RATE-LIMIT] Error checking email cards:", emailCardsError);
      } else if (emailCards) {
        const uniqueCards = new Set(emailCards.map((r: any) => r.card_last4).filter(Boolean));
        if (cardLast4 && !uniqueCards.has(cardLast4) && uniqueCards.size >= MAX_DIFFERENT_CARDS_PER_EMAIL) {
          return { allowed: false, reason: blockedReason };
        }
      }
    }

    if (cardLast4) {
      const { count: cardCount, error: cardError } = await supabase
        .from("payment_attempts")
        .select("*", { count: "exact", head: true })
        .eq("card_last4", cardLast4)
        .gte("created_at", timeWindowStart);

      if (cardError) {
        console.error("[RATE-LIMIT] Error checking card attempts:", cardError);
      } else if (cardCount && cardCount >= MAX_ATTEMPTS_PER_CARD) {
        return { allowed: false, reason: blockedReason };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error("[RATE-LIMIT] Error checking rate limits:", error);
    // On error, allow the attempt (fail open) but log it
    return { allowed: true };
  }
}

async function recordPaymentAttempt(
  supabase: any,
  ip: string,
  email: string,
  cardLast4?: string,
  attemptType: string = "payment",
): Promise<void> {
  try {
    const { error } = await supabase.from("payment_attempts").insert({
      ip_address: ip,
      email: email?.toLowerCase() || null,
      card_last4: cardLast4 || null,
      attempt_type: attemptType,
    });
    if (error) console.error("[RATE-LIMIT] Error recording attempt:", error);
  } catch (error) {
    console.error("[RATE-LIMIT] Error recording attempt:", error);
  }
}

async function registerUtmifySale(data: {
  orderId: string;
  email: string;
  name: string;
  value: number;
  productName: string;
  trackingParams?: any;
}) {
  const apiToken = process.env["UTMIFY_API_TOKEN"];
  if (!apiToken) {
    console.log("[UTMIFY] No API token configured, skipping registration");
    return;
  }

  try {
    const now = new Date();
    const formattedDate = now.toISOString().replace("T", " ").substring(0, 19);

    const utmifyPayload = {
      orderId: data.orderId,
      platform: "Stripe",
      paymentMethod: "credit_card",
      status: "paid",
      createdAt: formattedDate,
      approvedDate: formattedDate,
      refundedAt: null,
      customer: {
        name: data.name || "Cliente",
        email: data.email || "",
        phone: null,
        document: null,
        country: "US",
      },
      products: [
        {
          id: data.orderId,
          name: "Produto 01",
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: Math.round(data.value * 100),
        },
      ],
      trackingParameters: {
        src: data.trackingParams?.src || null,
        sck: data.trackingParams?.sck || null,
        utm_source: data.trackingParams?.utm_source || null,
        utm_medium: data.trackingParams?.utm_medium || null,
        utm_campaign: data.trackingParams?.utm_campaign || null,
        utm_content: data.trackingParams?.utm_content || null,
        utm_term: data.trackingParams?.utm_term || null,
      },
      commission: {
        totalPriceInCents: Math.round(data.value * 100),
        gatewayFeeInCents: 0,
        userCommissionInCents: Math.round(data.value * 100),
        currency: "USD",
      },
      isTest: false,
    };

    const response = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": apiToken,
      },
      body: JSON.stringify(utmifyPayload),
    });

    const responseText = await response.text();
    console.log("[UTMIFY] API response", { status: response.status, response: responseText });
  } catch (error) {
    console.error("[UTMIFY] Error registering sale:", error);
  }
}

export const Route = createFileRoute("/api/public/process-card-payment")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
      POST: async ({ request }) => {
        const json = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });

        try {
          const stripeSecret = process.env["STRIPE_SECRET_KEY"];
          if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY not configured");

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const clientIP = getClientIP(request);

          const { paymentMethodId, priceKey, email, name, phone, trackingParams, billingAddress } =
            (await request.json()) as any;

          if (!paymentMethodId) throw new Error("PaymentMethod ID is required");

          // Never send a city (or ZIP) disguised as the street line: it causes AVS street
          // mismatches. Without a real street, Stripe/issuers validate the ZIP only.
          if (billingAddress) {
            const l1 = String(billingAddress.line1 || "").trim().toLowerCase();
            const city = String(billingAddress.city || "").trim().toLowerCase();
            const zip = String(billingAddress.postal_code || "").trim().toLowerCase();
            if (!l1 || l1 === city || l1 === zip) billingAddress.line1 = undefined;
          }

          const priceData = PRICES[String(priceKey)];
          if (!priceData) throw new Error(`Invalid price key: ${priceKey}`);

          // Get card last 4 digits from PaymentMethod and existing billing details
          let cardLast4: string | undefined;
          let existingBillingDetails: any = null;
          try {
            const paymentMethod = await stripeFetch(
              `/payment_methods/${paymentMethodId}`,
              "GET",
              stripeSecret,
            );
            cardLast4 = paymentMethod.card?.last4;
            existingBillingDetails = paymentMethod.billing_details;
          } catch (e) {
            console.log("[PROCESS-CARD-PAYMENT] Could not retrieve card info:", e);
          }

          // Update the PaymentMethod with billing details for AVS verification
          if (billingAddress && (billingAddress.line1 || billingAddress.postal_code)) {
            try {
              await stripeFetch(`/payment_methods/${paymentMethodId}`, "POST", stripeSecret, {
                billing_details: {
                  name: name || existingBillingDetails?.name || "Customer",
                  email: email || existingBillingDetails?.email || undefined,
                  address: {
                    line1: billingAddress.line1 || undefined,
                    line2: billingAddress.line2 || existingBillingDetails?.address?.line2 || undefined,
                    city: billingAddress.city || existingBillingDetails?.address?.city || undefined,
                    state: billingAddress.state || existingBillingDetails?.address?.state || undefined,
                    postal_code:
                      billingAddress.postal_code || existingBillingDetails?.address?.postal_code || undefined,
                    country: billingAddress.country || existingBillingDetails?.address?.country || "US",
                  },
                },
              });
            } catch (e) {
              console.log("[PROCESS-CARD-PAYMENT] Could not update PaymentMethod billing details:", e);
            }
          }

          // Check rate limits BEFORE processing payment
          const rateLimitCheck = await checkRateLimits(supabaseAdmin, clientIP, email, cardLast4);
          if (!rateLimitCheck.allowed) {
            await recordPaymentAttempt(supabaseAdmin, clientIP, email, cardLast4, "blocked");
            return json({ error: rateLimitCheck.reason, rate_limited: true }, 429);
          }

          await recordPaymentAttempt(supabaseAdmin, clientIP, email, cardLast4, "payment");

          const effectiveBillingAddress = {
            line1: billingAddress?.line1 || undefined,
            line2: billingAddress?.line2 || existingBillingDetails?.address?.line2 || undefined,
            city: billingAddress?.city || existingBillingDetails?.address?.city || undefined,
            state: billingAddress?.state || existingBillingDetails?.address?.state || undefined,
            postal_code:
              billingAddress?.postal_code || existingBillingDetails?.address?.postal_code || undefined,
            country: billingAddress?.country || existingBillingDetails?.address?.country || "US",
          };

          // Stripe requires shipping.address.line1, so only attach shipping with a real street.
          const hasAddressData = Boolean(effectiveBillingAddress.line1);

          // Official Stripe Customer (reuse by email) so Radar sees a named buyer.
          // Created only at payment time; failure never blocks the payment.
          let customerId: string | undefined;
          const cleanEmail = String(email || "").trim().toLowerCase();
          if (cleanEmail) {
            try {
              const found = await stripeFetch(`/customers?email=${encodeURIComponent(cleanEmail)}&limit=1`, "GET", stripeSecret);
              const customerData = {
                name: name || existingBillingDetails?.name || undefined,
                phone: phone || undefined,
                address: effectiveBillingAddress.postal_code ? effectiveBillingAddress : undefined,
              };
              if (found?.data?.[0]?.id) {
                customerId = found.data[0].id;
                await stripeFetch(`/customers/${customerId}`, "POST", stripeSecret, customerData);
              } else {
                const created = await stripeFetch("/customers", "POST", stripeSecret, { email: cleanEmail, ...customerData });
                customerId = created.id;
              }
              await stripeFetch(`/payment_methods/${paymentMethodId}/attach`, "POST", stripeSecret, { customer: customerId });
            } catch (e) {
              console.log("[PROCESS-CARD-PAYMENT] Customer setup skipped:", e instanceof Error ? e.message : e);
              customerId = undefined;
            }
          }

          const paymentIntent = await stripeFetch("/payment_intents", "POST", stripeSecret, {
            customer: customerId,
            amount: priceData.amount,
            currency: "usd",
            payment_method: paymentMethodId,
            confirm: "true",
            automatic_payment_methods: {
              enabled: "true",
              allow_redirects: "never",
            },
            // Ask the issuer for 3D Secure when available so risky-looking
            // payments get a bank confirmation instead of a straight decline.
            payment_method_options: { card: { request_three_d_secure: "any" } },
            ...(hasAddressData
              ? {
                  shipping: {
                    name: name || existingBillingDetails?.name || "Customer",
                    address: effectiveBillingAddress,
                  },
                }
              : {}),
            metadata: {
              customer_name: name || "",
              customer_email: email || "",
              product: priceData.description,
              price_key: String(priceKey),
              client_ip: clientIP,
              product_type: "digital_goods",
              product_name: priceData.description,
              source: "checkout_form",
              billing_line1: effectiveBillingAddress.line1 || "",
              billing_city: effectiveBillingAddress.city || "",
              billing_postal_code: effectiveBillingAddress.postal_code || "",
              billing_country: effectiveBillingAddress.country || "",
            },
            description: priceData.description,
            receipt_email: email || undefined,
            return_url: `${request.headers.get("origin") || "https://recargadediamantesoficial.online"}/obrigado`,
          });

          console.log("[PROCESS-CARD-PAYMENT] PaymentIntent status:", paymentIntent.status);

          if (paymentIntent.status === "requires_action" || paymentIntent.status === "requires_source_action") {
            return json({
              requires_action: true,
              client_secret: paymentIntent.client_secret,
              paymentIntentId: paymentIntent.id,
            });
          }

          if (paymentIntent.status === "succeeded") {
            await registerUtmifySale({
              orderId: paymentIntent.id,
              email: email || "",
              name: name || "",
              value: priceData.amount / 100,
              productName: priceData.description,
              trackingParams,
            });
            return json({ success: true, paymentIntentId: paymentIntent.id });
          }

          const lpe = paymentIntent.last_payment_error;
          return json({
            error: lpe?.message || `Payment failed with status: ${paymentIntent.status}`,
            code: lpe?.code,
            decline_code: lpe?.decline_code,
            paymentIntentId: paymentIntent.id,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("[PROCESS-CARD-PAYMENT] Error:", errorMessage);
          const e: any = error;
          if (e?.isCardError || e?.declineCode || e?.stripeCode) {
            return json({ error: errorMessage, code: e.stripeCode, decline_code: e.declineCode });
          }
          return json({ error: errorMessage }, 500);
        }
      },
    },
  },
});
