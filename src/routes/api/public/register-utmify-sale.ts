import { createFileRoute } from "@tanstack/react-router";

// Ported from the gemtop register-utmify-sale edge function. Used by the
// checkout to register 3D Secure sales with UTMify from the browser.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const Route = createFileRoute("/api/public/register-utmify-sale")({
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
          const apiToken = process.env["UTMIFY_API_TOKEN"];
          if (!apiToken) {
            throw new Error("UTMIFY_API_TOKEN is not configured");
          }

          const { orderId, email, name, value, currency, productName, leadId, trackingParams } =
            (await request.json()) as any;

          const now = new Date();
          const formattedDate = now.toISOString().replace("T", " ").substring(0, 19);

          const utmifyPayload = {
            orderId,
            platform: "Stripe",
            paymentMethod: "credit_card",
            status: "paid",
            createdAt: formattedDate,
            approvedDate: formattedDate,
            refundedAt: null,
            customer: {
              name: name || "Cliente",
              email: email || "",
              phone: null,
              document: null,
              country: "US",
            },
            products: [
              {
                id: orderId,
                name: "Produto 01",
                planId: null,
                planName: null,
                quantity: 1,
                priceInCents: Math.round((value || 0) * 100),
              },
            ],
            trackingParameters: {
              src: trackingParams?.src || leadId || null,
              sck: trackingParams?.sck || null,
              utm_source: trackingParams?.utm_source || null,
              utm_medium: trackingParams?.utm_medium || null,
              utm_campaign: trackingParams?.utm_campaign || null,
              utm_content: trackingParams?.utm_content || null,
              utm_term: trackingParams?.utm_term || null,
            },
            commission: {
              totalPriceInCents: Math.round((value || 0) * 100),
              gatewayFeeInCents: 0,
              userCommissionInCents: Math.round((value || 0) * 100),
              currency: currency || "USD",
            },
            isTest: false,
          };

          const utmifyResponse = await fetch("https://api.utmify.com.br/api-credentials/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-token": apiToken,
            },
            body: JSON.stringify(utmifyPayload),
          });

          const responseText = await utmifyResponse.text();
          console.log("[REGISTER-UTMIFY-SALE] UTMify API response", {
            status: utmifyResponse.status,
            response: responseText,
          });

          return json({
            success: utmifyResponse.ok,
            message: utmifyResponse.ok
              ? "Sale registered with UTMify"
              : "UTMify registration failed but payment succeeded",
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("[REGISTER-UTMIFY-SALE] Error:", errorMessage);
          // Return success anyway - we don't want UTMify issues to affect user experience
          return json({
            success: false,
            error: errorMessage,
            message: "UTMify registration failed but this doesn't affect your payment",
          });
        }
      },
    },
  },
});
