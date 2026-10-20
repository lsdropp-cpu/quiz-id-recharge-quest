import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { captureTracking } from "@/lib/tracking";

const SESSION_KEY = "funnel_session_id";
const GEO_KEY = "funnel_geo_cache";

type GeoData = {
  country: string | null;
  country_code: string | null;
  ip: string | null;
};

const getOrCreateSessionId = (): string => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
};

const getCachedGeo = (): GeoData | null => {
  try {
    const raw = sessionStorage.getItem(GEO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const cacheGeo = (data: GeoData) => {
  try {
    sessionStorage.setItem(GEO_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
};

const fetchGeo = async (): Promise<GeoData> => {
  const cached = getCachedGeo();
  if (cached) return cached;
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error("geo failed");
    const data = await res.json();
    const geo: GeoData = {
      country: data?.country_name || null,
      country_code: (data?.country_code || data?.country || null)?.toUpperCase?.() || null,
      ip: data?.ip || null,
    };
    cacheGeo(geo);
    return geo;
  } catch {
    return { country: null, country_code: null, ip: null };
  }
};

/**
 * Tracks a funnel step. Sends a "view" event on mount and a "heartbeat"
 * every 30s while the user stays on the page.
 */
export const useFunnelTracking = (step: string) => {
  const sentViewRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const sessionId = getOrCreateSessionId();
    const searchParams = new URLSearchParams(window.location.search);

    const merged = captureTracking(searchParams);

    const utm_source = searchParams.get("utm_source") || merged.utm_source || null;
    const utm_medium = searchParams.get("utm_medium") || merged.utm_medium || null;
    const utm_campaign = searchParams.get("utm_campaign") || merged.utm_campaign || null;
    const utm_content = searchParams.get("utm_content") || merged.utm_content || null;
    const utm_term = searchParams.get("utm_term") || merged.utm_term || null;
    const referrer = typeof document !== "undefined" ? document.referrer || null : null;

    let derivedSource = utm_source;
    if (!derivedSource && referrer) {
      try {
        derivedSource = new URL(referrer).hostname;
      } catch {
        derivedSource = referrer;
      }
    }
    if (!derivedSource) derivedSource = "direct";

    const sendEvent = async (event_type: "view" | "heartbeat") => {
      const geo = await fetchGeo();
      if (cancelled) return;
      await supabase.from("funnel_events").insert({
        session_id: sessionId,
        step,
        event_type,
        country: geo.country,
        country_code: geo.country_code,
        source: derivedSource,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        ip: geo.ip,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
    };

    if (!sentViewRef.current) {
      sentViewRef.current = true;
      sendEvent("view");
    }

    const interval = setInterval(() => sendEvent("heartbeat"), 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [step]);
};
