import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const saleInput = z.object({
  orderId: z.string().regex(/^pi_[a-zA-Z0-9]+$/),
  clientSecret: z.string().min(20).max(300),
});

export const Route = createFileRoute("/api/public/register-utmify-sale")({
  server: { handlers: {
    POST: async ({ request }) => {
      const input = saleInput.safeParse(await request.json().catch(() => null));
      if (!input.success) return Response.json({ success: false }, { status: 400 });
      try {
        const stripeSecret = process.env["STRIPE_SECRET_KEY"];
        const token = process.env["UTMIFY_API_TOKEN"];
        if (!stripeSecret || !token) return Response.json({ success: false }, { status: 503 });
        const { deliverPaidSale } = await import("@/lib/utmify-sales.server");
        return Response.json(await deliverPaidSale(input.data.orderId, stripeSecret, token, input.data.clientSecret));
      } catch {
        console.error("[UTMIFY] Verified sale delivery failed; payment unchanged");
        return Response.json({ success: false }, { status: 502 });
      }
    },
  } },
});
