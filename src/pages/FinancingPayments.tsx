import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Contract = {
  id: string; client_name: string; vehicle_info: string | null; service_description: string | null;
  total_service_price: number; down_payment: number; principal: number; interest: number; total_financed: number;
  bank_last4: string | null; stripe_payment_method_id: string | null;
};
type Payment = { id: string; contract_id: string; seq: number; label: string; due_date: string; amount: number; status: string; failure_reason: string | null; paid_at: string | null };

const money = (n: number) => `$${Number(n).toFixed(2)}`;
const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

const statusBadge = (p: Payment) => {
  if (p.status === "paid") return <Badge className="bg-primary/15 text-primary">Paid</Badge>;
  if (p.status === "processing") return <Badge className="bg-accent/15 text-accent-foreground">Processing</Badge>;
  if (p.status === "failed") return <Badge className="bg-destructive/15 text-destructive">Failed</Badge>;
  if (p.due_date < today) return <Badge className="bg-destructive/15 text-destructive">Past due</Badge>;
  if (p.due_date === today) return <Badge className="bg-accent/15 text-accent-foreground">Due today</Badge>;
  return <Badge variant="outline">Scheduled</Badge>;
};

const call = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("financing-ach", { body });
  if (error) {
    let msg = error.message;
    try { msg = (await (error as any).context?.json())?.error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
};

const FinancingPayments = ({ adminView = false }: { adminView?: boolean }) => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    let q = supabase.from("financing_contracts").select("*").eq("status", "active");
    if (!adminView) q = q.eq("customer_id", user.id);
    const { data: cs } = await q.order("created_at", { ascending: false });
    const list = (cs as unknown as Contract[]) || [];
    setContracts(list);
    if (list.length) {
      const { data: ps } = await supabase.from("financing_payments").select("*").in("contract_id", list.map((c) => c.id)).order("seq");
      setPayments((ps as Payment[]) || []);
    } else setPayments([]);
    setLoading(false);
  }, [user, adminView]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get("bank_session");
      if (sid) {
        try { const r = await call({ action: "confirm_bank", session_id: sid }); if (r?.ok) toast.success(`${r.brand || "Card"} ending ${r.last4} saved`); }
        catch (e: any) { toast.error(e.message); }
        window.history.replaceState({}, "", window.location.pathname);
      }
      if (params.get("bank_canceled")) toast.info("Card setup canceled");
      await load();
      const { data: cs } = await supabase.from("financing_contracts").select("id").eq("status", "active");
      for (const c of cs || []) await call({ action: "refresh", contract_id: c.id }).catch(() => {});
      await load();
    })();
  }, [user, load]);

  const linkBank = async (id: string) => {
    setBusy("bank-" + id);
    try { const r = await call({ action: "setup_bank", contract_id: id }); window.location.href = r.url; }
    catch (e: any) { toast.error(e.message); setBusy(null); }
  };
  const runDraft = async (p: Payment) => {
    if (!confirm(`Charge ${money(p.amount)} to the saved card for "${p.label}"?`)) return;
    setBusy(p.id);
    try {
      const r = await call({ action: "run", payment_id: p.id });
      toast.success(r.status === "paid" ? "Payment collected" : "Payment submitted");
    } catch (e: any) { toast.error(e.message); }
    setBusy(null); load();
  };
  const refresh = async () => {
    setBusy("refresh");
    for (const c of contracts) await call({ action: "refresh", contract_id: c.id }).catch(() => {});
    await load(); setBusy(null);
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          {adminView && <Link to="/admin" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-1"><ArrowLeft className="h-4 w-4" /> Admin</Link>}
          <h1 className="text-2xl sm:text-3xl font-bold">Financing payments</h1>
          <p className="text-muted-foreground text-sm mt-1">Each payment, its due date, amount and status. Paid by saved debit or credit card.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={busy === "refresh"}>
          {busy === "refresh" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />} Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : contracts.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-10 text-center text-muted-foreground">No active financing.</CardContent></Card>
      ) : contracts.map((c) => {
        const ps = payments.filter((p) => p.contract_id === c.id);
        const paid = ps.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
        const totalOwed = ps.reduce((s, p) => s + Number(p.amount), 0);
        const next = ps.find((p) => p.status !== "paid");
        return (
          <Card key={c.id} className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{adminView ? `${c.client_name} — ` : ""}{c.service_description}</CardTitle>
              <p className="text-sm text-muted-foreground">{c.vehicle_info}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="rounded-md bg-muted/40 p-3"><div className="text-muted-foreground text-xs">Paid so far</div><div className="font-bold text-lg">{money(paid)}</div></div>
                <div className="rounded-md bg-muted/40 p-3"><div className="text-muted-foreground text-xs">Remaining</div><div className="font-bold text-lg">{money(totalOwed - paid)}</div></div>
                <div className="rounded-md bg-muted/40 p-3"><div className="text-muted-foreground text-xs">Next payment</div><div className="font-bold">{next ? `${money(next.amount)}` : "—"}</div><div className="text-xs text-muted-foreground">{next ? fmtDate(next.due_date) : "Paid in full"}</div></div>
                <div className="rounded-md bg-muted/40 p-3"><div className="text-muted-foreground text-xs">Interest (10% simple)</div><div className="font-bold">{money(c.interest)}</div></div>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap rounded-md border border-border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-primary" />
                  {c.stripe_payment_method_id ? <span>Card ending <b>{c.bank_last4}</b></span> : <span className="text-muted-foreground">No card saved yet</span>}
                </div>
                <Button size="sm" variant={c.stripe_payment_method_id ? "outline" : "default"} onClick={() => linkBank(c.id)} disabled={busy === "bank-" + c.id}>
                  {busy === "bank-" + c.id && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  {c.stripe_payment_method_id ? "Change card" : "Add debit or credit card"}
                </Button>
              </div>

              <div className="divide-y divide-border rounded-md border border-border">
                {ps.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{fmtDate(p.due_date)}{p.paid_at && ` · paid ${new Date(p.paid_at).toLocaleDateString()}`}</div>
                      {p.status === "failed" && p.failure_reason && <div className="text-xs text-destructive mt-0.5">{p.failure_reason}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums">{money(p.amount)}</span>
                      {statusBadge(p)}
                      {!["paid", "processing"].includes(p.status) && (
                        <Button size="sm" onClick={() => runDraft(p)} disabled={!c.stripe_payment_method_id || busy === p.id}>
                          {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : p.status === "failed" ? "Retry charge" : "Charge card"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Cash is not accepted — payments are charged to the saved card only, never paid to the technician.</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return adminView ? <div className="min-h-screen bg-background p-4 sm:p-6 max-w-4xl mx-auto">{content}</div> : <PortalLayout>{content}</PortalLayout>;
};

export default FinancingPayments;
