import { agreementSections, COMPANY_DBA, COMPANY_LEGAL, INITIAL_LABELS } from "@/lib/techAgreement";

export type TechAgreementRecord = {
  id?: string;
  tech_name: string;
  tech_phone?: string | null;
  tech_email?: string | null;
  tech_address?: string | null;
  cashapp_handle?: string | null;
  hourly_rate: number;
  effective_date: string;
  company_signer_name?: string | null;
  company_signature?: string | null;
  company_signed_at?: string | null;
  tech_signature?: string | null;
  tech_signed_name?: string | null;
  tech_signed_at?: string | null;
  tech_initials?: Record<string, string> | null;
};

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString("en-US", { timeZone: "America/New_York" }) + " ET" : "");

/** Printable agreement body. `initialsSlot` lets the signing page render inputs beside each section. */
export default function TechAgreementDocument({
  a,
  initialsSlot,
}: {
  a: TechAgreementRecord;
  initialsSlot?: (key: string) => React.ReactNode;
}) {
  const sections = agreementSections(a.hourly_rate);
  return (
    <article className="tech-agreement bg-card text-card-foreground rounded-lg border border-border p-5 sm:p-8 space-y-5 text-sm leading-relaxed print:border-0 print:p-0">
      <header className="text-center space-y-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{COMPANY_DBA}</p>
        <h1 className="text-xl sm:text-2xl font-bold">Independent Technician Subcontractor Agreement &amp; Non-Disclosure Agreement</h1>
        <p className="text-xs text-muted-foreground">Effective {new Date(a.effective_date + "T12:00:00").toLocaleDateString("en-US")}</p>
      </header>

      <p>
        This Agreement is between <strong>{COMPANY_LEGAL}</strong>, doing business as {COMPANY_DBA} ("Company"), and{" "}
        <strong>{a.tech_name || "________________"}</strong> ("Technician").
      </p>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>Phone: {a.tech_phone || "—"}</span>
        <span>Email: {a.tech_email || "—"}</span>
        <span>Address: {a.tech_address || "—"}</span>
        <span>Cash App: {a.cashapp_handle || "—"}</span>
      </div>

      {sections.map((s) => (
        <section key={s.title} className="space-y-2 break-inside-avoid">
          <h2 className="font-semibold text-base">{s.title}</h2>
          {s.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {s.initialKey && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-muted-foreground">Technician initials — {INITIAL_LABELS[s.initialKey]}:</span>
              {initialsSlot ? (
                initialsSlot(s.initialKey)
              ) : (
                <span className="font-semibold border-b border-foreground min-w-12 px-2">{a.tech_initials?.[s.initialKey] || "\u00a0"}</span>
              )}
            </div>
          )}
        </section>
      ))}

      <section className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-border break-inside-avoid">
        <div className="space-y-1">
          <p className="font-semibold">Company — {COMPANY_LEGAL}</p>
          {a.company_signature ? <img src={a.company_signature} alt="Company signature" className="h-20 bg-white rounded" /> : <div className="h-20 border-b border-foreground" />}
          <p className="text-xs">{a.company_signer_name || "Authorized signer"}</p>
          <p className="text-xs text-muted-foreground">{fmt(a.company_signed_at) || "Not yet signed"}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Technician</p>
          {a.tech_signature ? <img src={a.tech_signature} alt="Technician signature" className="h-20 bg-white rounded" /> : <div className="h-20 border-b border-foreground" />}
          <p className="text-xs">{a.tech_signed_name || a.tech_name}</p>
          <p className="text-xs text-muted-foreground">{fmt(a.tech_signed_at) || "Not yet signed"}</p>
        </div>
      </section>
    </article>
  );
}
