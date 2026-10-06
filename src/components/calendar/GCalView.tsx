import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  setHours, setMinutes, startOfDay, startOfMonth, startOfWeek, differenceInMinutes,
} from "date-fns";
import { cn } from "@/lib/utils";

export type CalView = "day" | "week" | "month";
export interface CalEvent {
  id: string;
  title: string;
  subtitle?: string | null;
  start: Date;
  end?: Date;
  /** Index into the color palette (e.g. technician index). */
  color?: number;
  muted?: boolean;
}

const HOUR_START = 7;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const H = 52; // px per hour
const DEFAULT_MIN = 120;

const PALETTE = [
  "bg-primary/20 border-primary text-foreground",
  "bg-accent/25 border-accent text-foreground",
  "bg-secondary border-secondary-foreground/40 text-secondary-foreground",
  "bg-destructive/15 border-destructive text-foreground",
  "bg-muted border-muted-foreground/50 text-foreground",
];
export const calColor = (i = 0) => PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length];

const TZ = "America/New_York";
/** Shop wall-clock (Eastern) time represented as a local Date. */
export function toShopTime(d: Date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return new Date(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
}
/** Inverse of toShopTime: shop wall-clock Date -> real instant. */
export function fromShopTime(w: Date) {
  let t = new Date(w.getTime() - (toShopTime(w).getTime() - w.getTime()));
  t = new Date(t.getTime() + (w.getTime() - toShopTime(t).getTime()));
  return t;
}

const endOf = (e: CalEvent) => e.end ?? new Date(e.start.getTime() + DEFAULT_MIN * 60000);

/** Lay out overlapping events side by side, Google Calendar style. */
function layout(events: CalEvent[]) {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const out: { e: CalEvent; col: number; cols: number }[] = [];
  let group: { e: CalEvent; col: number }[] = [];
  let groupEnd = 0;
  const flush = () => {
    const cols = Math.max(1, ...group.map((g) => g.col + 1));
    group.forEach((g) => out.push({ ...g, cols }));
    group = [];
  };
  for (const e of sorted) {
    if (group.length && e.start.getTime() >= groupEnd) flush();
    const used = new Set(group.filter((g) => endOf(g.e).getTime() > e.start.getTime()).map((g) => g.col));
    let col = 0; while (used.has(col)) col++;
    group.push({ e, col });
    groupEnd = Math.max(groupEnd, endOf(e).getTime());
  }
  if (group.length) flush();
  return out;
}

interface Props {
  events: CalEvent[];
  view: CalView;
  onViewChange: (v: CalView) => void;
  date: Date;
  onDateChange: (d: Date) => void;
  onEventClick?: (id: string) => void;
  /** Enables drag-to-reschedule in day/week view. */
  onEventDrop?: (id: string, start: Date) => void;
  views?: CalView[];
  weekDays?: 5 | 6 | 7;
  toolbarExtra?: React.ReactNode;
}

export function calRange(view: CalView, date: Date) {
  if (view === "day") return { from: startOfDay(date), to: addDays(startOfDay(date), 1) };
  if (view === "week") { const s = startOfWeek(date); return { from: s, to: addDays(s, 7) }; }
  const s = startOfWeek(startOfMonth(date)); const e = addDays(endOfWeek(endOfMonth(date)), 1);
  return { from: s, to: e };
}

export default function GCalView({
  events: rawEvents, view, onViewChange, date, onDateChange, onEventClick, onEventDrop,
  views = ["day", "week", "month"], weekDays = 7, toolbarExtra,
}: Props) {
  const [realNow, setNow] = useState(new Date());
  const now = toShopTime(realNow);
  const events = useMemo(() => rawEvents.map((e) => ({ ...e, start: toShopTime(e.start), end: e.end ? toShopTime(e.end) : undefined })), [rawEvents]);
  const [dragId, setDragId] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = Math.max(0, (Math.min(now.getHours(), 16) - HOUR_START - 1) * H);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const days = useMemo(() => {
    if (view === "day") return [startOfDay(date)];
    const s = startOfWeek(date);
    const offset = weekDays === 7 ? 0 : 1;
    return Array.from({ length: weekDays }, (_, i) => addDays(s, i + offset));
  }, [view, date, weekDays]);

  const step = (dir: 1 | -1) =>
    onDateChange(view === "day" ? addDays(date, dir) : view === "week" ? addWeeks(date, dir) : addMonths(date, dir));

  const title = view === "month"
    ? format(date, "MMMM yyyy")
    : view === "day" ? format(date, "EEEE, MMMM d, yyyy")
    : isSameMonth(days[0], days[days.length - 1]) ? format(days[0], "MMMM yyyy") : `${format(days[0], "MMM")} – ${format(days[days.length - 1], "MMM yyyy")}`;

  const drop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    if (!dragId || !onEventDrop) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const hf = HOUR_START + (e.clientY - rect.top) / H;
    const hour = Math.max(HOUR_START, Math.min(HOUR_END - 1, Math.floor(hf)));
    const min = Math.min(45, Math.round(((hf - hour) * 60) / 15) * 15);
    onEventDrop(dragId, fromShopTime(setMinutes(setHours(day, hour), min)));
    setDragId(null);
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border">
        <Button size="sm" variant="outline" onClick={() => onDateChange(startOfDay(toShopTime(new Date())))}>Today</Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Previous" onClick={() => step(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Next" onClick={() => step(1)}><ChevronRight className="h-4 w-4" /></Button>
        <h2 className="text-base sm:text-lg font-semibold mr-auto">{title}</h2>
        {toolbarExtra}
        <div className="inline-flex rounded-md border border-border p-0.5">
          {views.map((v) => (
            <button key={v} onClick={() => onViewChange(v)}
              className={cn("px-3 py-1 text-xs font-medium rounded capitalize", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <MonthGrid date={date} events={events} now={now} onEventClick={onEventClick}
          onDayClick={(d) => { onDateChange(d); onViewChange("day"); }} />
      ) : (
        <>
          {/* Day headers */}
          <div className="grid border-b border-border" style={{ gridTemplateColumns: `48px repeat(${days.length}, minmax(0,1fr))` }}>
            <div />
            {days.map((d) => {
              const today = isSameDay(d, now);
              return (
                <button key={d.toISOString()} onClick={() => { onDateChange(d); onViewChange("day"); }}
                  className="py-2 flex flex-col items-center border-l border-border/50">
                  <span className={cn("text-[10px] uppercase tracking-wide", today ? "text-primary font-semibold" : "text-muted-foreground")}>{format(d, "EEE")}</span>
                  <span className={cn("mt-0.5 h-8 w-8 grid place-items-center rounded-full text-lg", today ? "bg-primary text-primary-foreground font-semibold" : "text-foreground")}>{format(d, "d")}</span>
                </button>
              );
            })}
          </div>
          {/* Time grid */}
          <div ref={scroller} className="overflow-y-auto max-h-[70vh]">
            <div className="grid relative" style={{ gridTemplateColumns: `48px repeat(${days.length}, minmax(0,1fr))`, height: HOURS.length * H }}>
              <div className="relative">
                {HOURS.map((h) => (
                  <div key={h} className="absolute right-1.5 text-[10px] text-muted-foreground -translate-y-1/2" style={{ top: (h - HOUR_START) * H }}>
                    {h === HOUR_START ? "" : format(setHours(new Date(), h), "h a")}
                  </div>
                ))}
              </div>
              {days.map((d) => {
                const dayEvents = events.filter((e) => isSameDay(e.start, d));
                const showNow = isSameDay(d, now) && now.getHours() >= HOUR_START && now.getHours() < HOUR_END;
                return (
                  <div key={d.toISOString()} className="relative border-l border-border/50"
                    onDragOver={(e) => onEventDrop && e.preventDefault()} onDrop={(e) => drop(e, d)}>
                    {HOURS.map((h) => (
                      <div key={h} className="absolute inset-x-0 border-t border-border/40" style={{ top: (h - HOUR_START) * H }}>
                        <div className="border-t border-dashed border-border/20" style={{ marginTop: H / 2 - 1 }} />
                      </div>
                    ))}
                    {layout(dayEvents).map(({ e, col, cols }) => {
                      const startH = e.start.getHours() + e.start.getMinutes() / 60;
                      const mins = Math.max(30, differenceInMinutes(endOf(e), e.start));
                      const top = Math.max(0, (startH - HOUR_START) * H);
                      const height = Math.max(22, (mins / 60) * H - 2);
                      return (
                        <button key={e.id}
                          draggable={!!onEventDrop}
                          onDragStart={() => setDragId(e.id)}
                          onClick={() => onEventClick?.(e.id)}
                          className={cn("absolute rounded-md border-l-4 px-1.5 py-1 text-left text-[11px] leading-tight overflow-hidden shadow-sm hover:shadow-md hover:z-10 transition-shadow",
                            calColor(e.color), e.muted && "opacity-50 line-through", onEventDrop && "cursor-grab active:cursor-grabbing")}
                          style={{ top, height, left: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - 4px)` }}>
                          <div className="font-semibold truncate">{e.title}</div>
                          <div className="truncate opacity-80">{format(e.start, "h:mm")} – {format(endOf(e), "h:mm a")}</div>
                          {e.subtitle && height > 44 && <div className="truncate opacity-80">{e.subtitle}</div>}
                        </button>
                      );
                    })}
                    {showNow && (
                      <div className="absolute inset-x-0 z-20 pointer-events-none" style={{ top: (now.getHours() + now.getMinutes() / 60 - HOUR_START) * H }}>
                        <div className="relative border-t-2 border-destructive"><span className="absolute -left-1.5 -top-[7px] h-3 w-3 rounded-full bg-destructive" /></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MonthGrid({ date, events, now, onEventClick, onDayClick }: {
  date: Date; events: CalEvent[]; now: Date; onEventClick?: (id: string) => void; onDayClick: (d: Date) => void;
}) {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  const cells: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) cells.push(d);
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1.5 text-center text-[10px] uppercase tracking-wide text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const list = events.filter((e) => isSameDay(e.start, d)).sort((a, b) => a.start.getTime() - b.start.getTime());
          const today = isSameDay(d, now);
          return (
            <div key={d.toISOString()} className={cn("min-h-[92px] border-b border-l border-border/50 p-1", !isSameMonth(d, date) && "bg-muted/30")}>
              <button onClick={() => onDayClick(d)} className={cn("mx-auto mb-0.5 h-6 w-6 grid place-items-center rounded-full text-xs",
                today ? "bg-primary text-primary-foreground font-semibold" : isSameMonth(d, date) ? "text-foreground hover:bg-muted" : "text-muted-foreground")}>
                {format(d, "d")}
              </button>
              <div className="space-y-0.5">
                {list.slice(0, 3).map((e) => (
                  <button key={e.id} onClick={() => onEventClick?.(e.id)}
                    className={cn("w-full truncate rounded px-1 py-0.5 text-left text-[10px] border-l-2", calColor(e.color), e.muted && "opacity-50 line-through")}>
                    <span className="font-semibold">{format(e.start, "h:mma").toLowerCase()}</span> {e.title}
                  </button>
                ))}
                {list.length > 3 && (
                  <button onClick={() => onDayClick(d)} className="w-full text-left px-1 text-[10px] text-muted-foreground hover:text-foreground">+{list.length - 3} more</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
