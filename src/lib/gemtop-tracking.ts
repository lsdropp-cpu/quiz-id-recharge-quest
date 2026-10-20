// Funnel tracking for the gemtop checkout pages (ported from the gemtop
// project). Events are posted to the gemtop analytics backend, kept in a
// separate module so the existing funnel tracking stays untouched.

const getSessionId = (): string => {
  let sessionId = localStorage.getItem("funnel_session");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("funnel_session", sessionId);
  }
  return sessionId;
};

interface TrackOptions {
  productId?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown>;
}

export const trackFunnel = async (step: string, options: TrackOptions = {}): Promise<void> => {
  const sessionId = getSessionId();
  const params = new URLSearchParams(window.location.search);

  try {
    await fetch("https://wzalbseskuzaieeogomm.supabase.co/functions/v1/track-funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        step: step,
        page_url: window.location.href,
        utm_source: options.source || params.get("utm_source") || null,
        utm_medium: params.get("utm_medium") || null,
        utm_campaign: params.get("utm_campaign") || null,
      }),
    });
    console.log("[FUNNEL] Evento rastreado:", step);
  } catch (error) {
    console.error("[FUNNEL] Erro ao rastrear:", error);
  }
};

// Legacy alias for backwards compatibility
export const track = (step: string, productId?: string | null, source?: string | null): void => {
  trackFunnel(step, { productId, source });
};
