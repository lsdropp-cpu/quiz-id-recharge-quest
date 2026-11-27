import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/xpag-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("t")?.trim() ?? "";
        if (!token || token.length > 4096) {
          return Response.json({ ok: false }, { status: 401 });
        }
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return Response.json({ ok: false }, { status: 400 });
        }
        try {
          const { handleXpagWebhookServer } = await import("@/lib/xpag.server");
          const result = await handleXpagWebhookServer(token, body as Record<string, unknown>);
          return Response.json({ ok: result.ok }, { status: result.status });
        } catch {
          console.error("[XPAG-WEBHOOK] Processing failed");
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});