import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Range = "all" | "7" | "30" | "90";

export interface Tab { key: string; label: string; count: number }

export function ListControls(props: {
  q: string; setQ: (v: string) => void; placeholder: string;
  tabs: Tab[]; tab: string; setTab: (v: string) => void;
  range: Range; setRange: (v: Range) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={props.q} onChange={(e) => props.setQ(e.target.value)} placeholder={props.placeholder} className="pl-9" />
        </div>
        <Select value={props.range} onValueChange={(v) => props.setRange(v as Range)}>
          <SelectTrigger className="w-[130px] shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {props.tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => props.setTab(t.key)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              props.tab === t.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} <span className="opacity-70">{t.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function inRange(dateStr: string | null | undefined, range: Range) {
  if (range === "all" || !dateStr) return true;
  return Date.now() - new Date(dateStr).getTime() <= Number(range) * 86400000;
}

export function dateGroup(dateStr: string | null | undefined): string {
  if (!dateStr) return "Older";
  const d = new Date(dateStr);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startToday) return "Today";
  if (t >= startToday - 6 * 86400000) return "This week";
  if (t >= startToday - 29 * 86400000) return "This month";
  return "Older";
}

/** Returns a group header label when row idx starts a new date group. */
export function groupHeader<T>(rows: T[], idx: number, getDate: (r: T) => string | null | undefined) {
  const g = dateGroup(getDate(rows[idx]));
  return idx === 0 || dateGroup(getDate(rows[idx - 1])) !== g ? g : null;
}

export function GroupLabel({ label }: { label: string }) {
  return <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold pt-3 pb-1">{label}</div>;
}

export function matches(q: string, ...fields: (string | null | undefined | number)[]) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return fields.some((f) => f != null && String(f).toLowerCase().includes(s));
}
