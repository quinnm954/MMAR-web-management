// Website quote request → confirmed appointment funnel, split by Google ad visitors.
export type QuoteRow = {
  source: string | null;
  gclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  converted_appointment_id: string | null;
  appointment_status?: string | null;
};

export const isFromGoogleAd = (r: Pick<QuoteRow, "gclid" | "utm_source" | "utm_medium">) =>
  !!r.gclid || ((r.utm_source || "").toLowerCase().includes("google") && /cpc|paid|ppc/i.test(r.utm_medium || ""));

/** A quote request counts as a customer once it became an appointment that wasn't cancelled. */
export const isConfirmed = (r: QuoteRow) =>
  !!r.converted_appointment_id && !["cancelled", "canceled", "no_show"].includes((r.appointment_status || "").toLowerCase());

export type Funnel = { quotes: number; confirmed: number; rate: number | null };

export function quoteFunnel(rows: QuoteRow[]): { ad: Funnel; all: Funnel } {
  const web = rows.filter((r) => r.source === "in_app");
  const calc = (list: QuoteRow[]): Funnel => {
    const confirmed = list.filter(isConfirmed).length;
    return { quotes: list.length, confirmed, rate: list.length ? confirmed / list.length : null };
  };
  return { ad: calc(web.filter(isFromGoogleAd)), all: calc(web) };
}
