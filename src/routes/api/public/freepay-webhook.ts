import { createFileRoute } from "@tanstack/react-router";

// FreePay postback. The body is not trusted: we re-check the transaction
// status directly with FreePay before marking anything as paid.
export const Route = createFileRoute("/api/public/freepay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as any;
        const txId = String(body?.Id ?? body?.id ?? "");
        if (!/^[a-zA-Z0-9]{8,64}$/.test(txId)) return new Response("ignored", { status: 200 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { freepayGetStatus, finalizePaidOrder } = await import("@/lib/freepay.server");
        const { data: order } = await supabaseAdmin
          .from("orders").select("id, delivered").eq("freepay_transaction_id", txId).maybeSingle();
        if (!order || order.delivered) return new Response("ok", { status: 200 });

        let status = await freepayGetStatus(txId);
        if (status === null) {
          await new Promise((r) => setTimeout(r, 11000)); // FreePay rate limit per transaction
          status = await freepayGetStatus(txId);
        }
        if (status === "PAID") await finalizePaidOrder(order.id);
        else if (status === "EXPIRED" || status === "REFUSED") {
          await supabaseAdmin.from("orders").update({ status: status.toLowerCase() }).eq("id", order.id);
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
