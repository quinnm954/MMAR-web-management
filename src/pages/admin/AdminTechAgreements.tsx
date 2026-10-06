import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Copy, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import SignaturePad from "@/components/financing/SignaturePad";
import TechAgreementDocument from "@/components/TechAgreementDocument";
import type { Tables } from "@/integrations/supabase/types";

type Row = Tables<"technician_agreements">;

const blank = { tech_name: "", tech_phone: "", tech_email: "", tech_address: "", cashapp_handle: "", hourly_rate: "40", effective_date: new Date().toISOString().slice(0, 10), employee_id: "" };

type Employee = { id: string; full_name: string; phone: string | null; email: string | null };

export default function AdminTechAgreements() {
  const [rows, setRows] = useState<Row[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Row | null>(null);
  const [signer, setSigner] = useState("Michael Quinn");
  const [searchParams] = useSearchParams();

  const load = async () => {
    const { data, error } = await supabase.from("technician_agreements").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const link = (r: Row) => `${window.location.origin}/tech-agreement/${r.token}`;

  const create = async () => {
    if (!form.tech_name.trim()) return toast.error("Technician name is required");
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("technician_agreements").insert({
      ...form, hourly_rate: Number(form.hourly_rate) || 40, created_by: u.user?.id,
    }).select().single();
    if (error) return toast.error(error.message);
    setOpen(false); setForm(blank); await load(); setView(data);
    navigator.clipboard?.writeText(link(data)).catch(() => {});
    toast.success("Agreement created — signing link copied");
  };

  const companySign = async (sig: string) => {
    if (!view) return;
    const { data, error } = await supabase.from("technician_agreements").update({
      company_signature: sig, company_signer_name: signer, company_signed_at: new Date().toISOString(),
      status: view.tech_signed_at ? "completed" : "company_signed",
    }).eq("id", view.id).select().single();
    if (error) return toast.error(error.message);
    setView(data); load(); toast.success("Company signature saved");
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete agreement for ${r.tech_name}?`)) return;
    await supabase.from("technician_agreements").delete().eq("id", r.id);
    load();
  };

  const statusLabel = (r: Row) => r.tech_signed_at && r.company_signed_at ? "Fully signed" : r.tech_signed_at ? "Tech signed" : r.company_signed_at ? "Awaiting tech" : "Awaiting signatures";

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <Link to="/admin/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Admin</Link>
            <h1 className="text-2xl font-bold">Technician Agreements</h1>
            <p className="text-sm text-muted-foreground">1099 subcontractor agreement with NDA and non-solicitation, signed electronically.</p>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> New agreement</Button>
        </div>

        <div className="rounded-lg border border-border divide-y divide-border print:hidden">
          {rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">No agreements yet.</p>}
          {rows.map((r) => (
            <div key={r.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
              <div>
                <p className="font-medium">{r.tech_name}</p>
                <p className="text-xs text-muted-foreground">${Number(r.hourly_rate).toFixed(2)}/labor hr · {r.effective_date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "completed" ? "default" : "secondary"}>{statusLabel(r)}</Badge>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(link(r)); toast.success("Signing link copied"); }}><Copy className="h-4 w-4 mr-1" /> Link</Button>
                <Button size="sm" onClick={() => setView(r)}>Open</Button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>

        {view && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Download PDF</Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(link(view)); toast.success("Signing link copied — text it to the technician"); }}><Copy className="h-4 w-4 mr-1" /> Copy signing link</Button>
              <Button variant="ghost" onClick={() => setView(null)}>Close</Button>
            </div>
            <TechAgreementDocument a={{ ...view, tech_initials: view.tech_initials as Record<string, string> }} />
            {!view.company_signed_at && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 print:hidden">
                <h2 className="font-semibold">Company signature</h2>
                <div className="space-y-1 max-w-sm">
                  <Label htmlFor="signer">Signer name &amp; title</Label>
                  <Input id="signer" value={signer} onChange={(e) => setSigner(e.target.value)} />
                </div>
                <SignaturePad width={320} height={130} label="Sign for the company" onSignatureComplete={companySign} />
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New technician agreement</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {([
              ["tech_name", "Technician full name"], ["tech_phone", "Phone"], ["tech_email", "Email"],
              ["tech_address", "Address"], ["cashapp_handle", "Cash App $handle"], ["hourly_rate", "Flat rate per labor hour ($)"], ["effective_date", "Effective date"],
            ] as const).map(([k, l]) => (
              <div key={k} className="space-y-1">
                <Label htmlFor={k}>{l}</Label>
                <Input id={k} type={k === "effective_date" ? "date" : k === "hourly_rate" ? "number" : "text"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <Button onClick={create}>Create &amp; copy signing link</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
