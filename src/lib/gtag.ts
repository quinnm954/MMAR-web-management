// Google Ads conversion tracking + attribution
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export type ConversionEvent = "phone_call" | "text_click" | "quote_submit" | "lead";

type Settings = {
  google_ads_conversion_id: string | null;
  phone_call_label: string | null;
  text_click_label: string | null;
  quote_submit_label: string | null;
  lead_label: string | null;
  wcc_phone_number: string | null;
  wcc_conversion_id: string | null;
  dni_enabled: boolean;
};

let cached: Settings | null = null;
let pending: Promise<Settings | null> | null = null;

const ATTR_KEY = "mmar_attribution";

export type Attribution = {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page?: string;
  captured_at?: string;
};

/** Capture gclid / utm params on first landing. Call once at app boot. */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const keys = ["gclid", "gbraid", "wbraid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
    const fresh: Attribution = {};
    let any = false;
    for (const k of keys) {
      const v = params.get(k);
      if (v) {
        (fresh as Record<string, string>)[k] = v;
        any = true;
      }
    }
    if (!any) return;
    fresh.landing_page = url.pathname + url.search;
    fresh.captured_at = new Date().toISOString();
    // Merge with existing — but new gclid wins
    const existing = getAttribution();
    const merged = { ...existing, ...fresh };
    localStorage.setItem(ATTR_KEY, JSON.stringify(merged));
  } catch {
    /* noop */
  }
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ATTR_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}

async function loadSettings(): Promise<Settings | null> {
  if (cached) return cached;
  if (pending) return pending;
  pending = (async () => {
    const { data } = await supabase.rpc("get_public_tracking_settings");
    cached = (data as Settings | null) ?? null;
    // Configure DNI / Website Call Conversion if enabled
    if (cached?.dni_enabled && cached.wcc_conversion_id && cached.wcc_phone_number && cached.google_ads_conversion_id && typeof window !== "undefined" && window.gtag) {
      window.gtag("config", cached.google_ads_conversion_id, {
        phone_conversion_number: cached.wcc_phone_number,
        phone_conversion_ids: [cached.wcc_conversion_id],
      });
    }
    return cached;
  })();
  return pending;
}

// Eager-load on import so DNI fires ASAP
if (typeof window !== "undefined") {
  loadSettings();
}

function labelFor(s: Settings, type: ConversionEvent): string | null {
  switch (type) {
    case "phone_call": return s.phone_call_label;
    case "text_click": return s.text_click_label;
    case "quote_submit": return s.quote_submit_label;
    case "lead": return s.lead_label;
  }
}

const VALID: ConversionEvent[] = ["phone_call", "text_click", "quote_submit", "lead"];

/** Fire a Google Ads conversion. `type` defaults to phone_call for back-compat.
 *  Tolerates being passed directly as a React onClick handler — non-string args are ignored. */
export const trackConversion = async (type?: unknown) => {
  if (typeof window === "undefined" || !window.gtag) return;
  const eventType: ConversionEvent =
    typeof type === "string" && (VALID as string[]).includes(type)
      ? (type as ConversionEvent)
      : "phone_call";
  const s = await loadSettings();
  if (!s?.google_ads_conversion_id) return;
  const label = labelFor(s, eventType);
  if (!label) return; // not configured yet — silently skip
  window.gtag("event", "conversion", {
    send_to: `${s.google_ads_conversion_id}/${label}`,
  });
};
