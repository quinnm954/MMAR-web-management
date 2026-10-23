export type Happiness = "happy" | "unhappy" | null;
export type HappinessRow = { customer_id: string | null; phone: string | null; happy: boolean };

export const phoneTail = (v?: string | null) => (v || "").replace(/\D/g, "").slice(-10);

/** Rows arrive newest-per-customer from the server; index them by id and phone. */
export function indexHappiness(rows: HappinessRow[]) {
  const byId = new Map<string, boolean>();
  const byPhone = new Map<string, boolean>();
  for (const r of rows) {
    if (r.customer_id) byId.set(r.customer_id, r.happy);
    const p = phoneTail(r.phone);
    if (p.length === 10 && !byPhone.has(p)) byPhone.set(p, r.happy);
  }
  return { byId, byPhone };
}

export function happinessFor(idx: ReturnType<typeof indexHappiness>, id?: string | null, phone?: string | null): Happiness {
  const v = (id && idx.byId.get(id)) ?? idx.byPhone.get(phoneTail(phone));
  return v === undefined ? null : v ? "happy" : "unhappy";
}

/** Newest answer wins: Yes or 4-5 stars = happy; No or 1-3 stars = unhappy. */
export function latestHappiness(answers: { at: string; satisfied?: boolean | null; rating?: number | null }[]): Happiness {
  const sorted = [...answers].filter(a => a.satisfied != null || a.rating != null).sort((a, b) => b.at.localeCompare(a.at));
  const a = sorted[0];
  if (!a) return null;
  const happy = a.satisfied != null ? a.satisfied : (a.rating as number) >= 4;
  return happy ? "happy" : "unhappy";
}

export const happinessClass = (h: Happiness) => (h === "happy" ? "text-success" : h === "unhappy" ? "text-destructive" : "");
