// Persist UTM / tracking parameters captured on any funnel page so they
// survive client-side navigations and reach the checkout.
const STORAGE_KEY = "funnel_tracking";

export type TrackingParams = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  src?: string | null;
  sck?: string | null;
};

const KEYS: (keyof TrackingParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "src",
  "sck",
];

const safeStorage = (): Storage | null => {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const captureTracking = (search: URLSearchParams | string): TrackingParams => {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const storage = safeStorage();
  const stored: TrackingParams = (() => {
    if (!storage) return {};
    try {
      const raw = storage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as TrackingParams) : {};
    } catch {
      return {};
    }
  })();

  const merged: TrackingParams = { ...stored };
  let changed = false;
  for (const key of KEYS) {
    const v = params.get(key);
    if (v && v.trim()) {
      if (merged[key] !== v) {
        merged[key] = v;
        changed = true;
      }
    }
  }

  if (changed && storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      /* ignore */
    }
  }

  return merged;
};

export const getStoredTracking = (): TrackingParams => {
  const storage = safeStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackingParams) : {};
  } catch {
    return {};
  }
};

// Utmify's script (cdn.utmify.com.br) persists each UTM/click param directly
// in localStorage by key (utm_source, utm_medium, ..., src, sck) with an
// expiry stored under `<key>_expires`. We read from there as the
// authoritative cross-page source, since it survives full page reloads,
// new tabs and lost search params — exactly what Utmify uses to attribute.
const readFromLocalStorage = (key: string): string | null => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const value = window.localStorage.getItem(key);
    if (!value || value === "null" || value === "undefined") return null;
    const expiresRaw = window.localStorage.getItem(`${key}_expires`);
    if (expiresRaw) {
      const expires = new Date(expiresRaw);
      if (!isNaN(expires.getTime()) && expires < new Date()) {
        return null;
      }
    }
    return value;
  } catch {
    return null;
  }
};

export const resolveTracking = (search: URLSearchParams | string): TrackingParams => {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const stored = captureTracking(params);
  const out: TrackingParams = {};
  for (const key of KEYS) {
    const fromUrl = params.get(key);
    const fromLs = readFromLocalStorage(key);
    const v =
      (fromUrl && fromUrl.trim()) ||
      (fromLs && fromLs.trim()) ||
      stored[key] ||
      undefined;
    if (v) out[key] = v;
  }

  // Fallback: when no utm_source was captured anywhere, derive one from the
  // referrer so Utmify always receives a meaningful traffic source
  // (e.g. "instagram", "facebook", "direct") instead of an empty value.
  if (!out.utm_source && typeof document !== "undefined") {
    const referrer = document.referrer || "";
    let derived = "direct";
    if (referrer) {
      try {
        const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
        const selfHost =
          typeof window !== "undefined"
            ? window.location.hostname.replace(/^www\./, "").toLowerCase()
            : "";
        if (selfHost && host === selfHost) {
          // Internal navigation — keep as "direct" to avoid polluting the
          // source with our own domain.
          derived = "direct";
        } else if (host.includes("instagram")) derived = "instagram";
        else if (
          host.includes("facebook") ||
          host === "m.facebook.com" ||
          host === "l.facebook.com"
        )
          derived = "facebook";
        else if (host.includes("tiktok")) derived = "tiktok";
        else if (host.includes("youtube") || host === "youtu.be") derived = "youtube";
        else if (host.includes("google")) derived = "google";
        else if (host.includes("bing")) derived = "bing";
        else if (host.includes("twitter") || host === "t.co" || host === "x.com")
          derived = "twitter";
        else derived = host || "direct";
      } catch {
        derived = "direct";
      }
    }
    out.utm_source = derived;
    if (!out.utm_medium) out.utm_medium = derived === "direct" ? "none" : "social";
  }

  return out;
};
