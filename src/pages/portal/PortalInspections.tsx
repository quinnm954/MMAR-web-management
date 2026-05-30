import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClipboardCheck, Loader2, FileText } from "lucide-react";

interface InspItem {
  id: string;
  category: string;
  item_name: string;
  status: "green" | "yellow" | "red" | "na";
  notes: string | null;
  photo_urls: string[];
  sort_order: number;
}

interface Inspection {
  id: string;
  status: string;
  mileage: number | null;
  share_token: string | null;
  summary_notes: string | null;
  completed_at: string | null;
  created_at: string;
  vehicle: { year: number | null; make: string | null; model: string | null } | null;
  inspection_items: InspItem[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  focus_area: string | null;
  items: { id: string; label: string; description: string | null; sort_order: number }[];
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  completed: "default",
  sent: "default",
  in_progress: "secondary",
};

const dotColor: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  na: "bg-muted",
};


const PortalInspections = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Inspection[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("inspections")
        .select(
          "id, status, mileage, share_token, summary_notes, completed_at, created_at, vehicle:vehicles(year, make, model), inspection_items(id, category, item_name, status, notes, photo_urls, sort_order)",
        )
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("checklist_templates")
        .select("id, name, description, focus_area, items:checklist_template_items(id, label, description, sort_order)")
        .eq("category", "inspection")
        .eq("is_active", true)
        .eq("customer_visible", true)
        .order("name"),
    ]).then(([insp, tpl]) => {
      setItems((insp.data as unknown as Inspection[]) ?? []);
      const rows = ((tpl.data as unknown as Template[]) ?? []).map((t) => ({
        ...t,
        items: [...(t.items ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      }));
      setTemplates(rows);
      setLoading(false);
    });
  }, [user]);

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Your Inspections</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No inspections yet. After your next service we'll post the full digital inspection here.
              </CardContent>
            </Card>
          ) : (
            items.map((insp) => {
              const v = insp.vehicle;
              const vehicleLabel = v ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim() : "Vehicle";
              const date = new Date(insp.completed_at ?? insp.created_at).toLocaleDateString();
              const inspItems = [...(insp.inspection_items ?? [])].sort(
                (a, b) => a.sort_order - b.sort_order,
              );
              const grouped: Record<string, InspItem[]> = {};
              for (const it of inspItems) (grouped[it.category] ||= []).push(it);
              return (
                <Card key={insp.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{vehicleLabel}</CardTitle>
                      <Badge variant={statusVariant[insp.status] ?? "outline"} className="capitalize">
                        {insp.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="text-muted-foreground">
                      {date}
                      {insp.mileage ? ` · ${insp.mileage.toLocaleString()} mi` : ""}
                    </div>
                    {insp.summary_notes && (
                      <div className="rounded-md border border-border bg-muted/40 p-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">
                          Technician summary
                        </div>
                        <div className="whitespace-pre-wrap">{insp.summary_notes}</div>
                      </div>
                    )}

                    {inspItems.length > 0 ? (
                      <Accordion type="multiple" className="space-y-2">
                        {Object.entries(grouped).map(([cat, list]) => {
                          const reds = list.filter((i) => i.status === "red").length;
                          const yellows = list.filter((i) => i.status === "yellow").length;
                          return (
                            <AccordionItem
                              key={cat}
                              value={cat}
                              className="border border-border rounded-lg bg-card px-3"
                            >
                              <AccordionTrigger className="hover:no-underline py-3">
                                <div className="flex items-center gap-2 text-left w-full">
                                  <span className="font-semibold">{cat}</span>
                                  <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                                    {reds > 0 && (
                                      <span className="inline-flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-full bg-red-500" />
                                        {reds}
                                      </span>
                                    )}
                                    {yellows > 0 && (
                                      <span className="inline-flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                        {yellows}
                                      </span>
                                    )}
                                    <span>{list.length} items</span>
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-3 pt-1">
                                  {list.map((it) => (
                                    <li
                                      key={it.id}
                                      className="border-b border-border/50 last:border-0 pb-3 last:pb-0"
                                    >
                                      <div className="flex items-start gap-2">
                                        <span
                                          className={`mt-1.5 h-3 w-3 rounded-full shrink-0 ${dotColor[it.status]}`}
                                        />
                                        <div className="flex-1">
                                          <div className="font-medium">{it.item_name}</div>
                                          {it.notes && (
                                            <div className="text-muted-foreground mt-1 whitespace-pre-wrap">
                                              {it.notes}
                                            </div>
                                          )}
                                          {it.photo_urls?.length > 0 && (
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                              {it.photo_urls.map((url, i) => (
                                                <a
                                                  key={i}
                                                  href={url}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                >
                                                  <img
                                                    src={url}
                                                    className="w-20 h-20 object-cover rounded border border-border"
                                                  />
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase">
                                          {it.status}
                                        </Badge>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    ) : (
                      <div className="text-muted-foreground italic">
                        No inspection items recorded.
                      </div>
                    )}

                    {insp.share_token && (
                      <Link
                        to={`/inspection/${insp.share_token}`}
                        className="inline-block text-xs text-primary underline"
                      >
                        Open shareable report
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Inspection Checklists</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            These are the exact checklists our technicians run during each service. Tap any
            inspection to see every item we examine.
          </p>

          {loading ? null : templates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No inspection checklists published yet.
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {templates.map((t) => (
                <AccordionItem
                  key={t.id}
                  value={t.id}
                  className="border border-border rounded-lg bg-card px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-col items-start text-left">
                      <span className="font-semibold">{t.name}</span>
                      {t.description && (
                        <span className="text-xs text-muted-foreground font-normal">
                          {t.description}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pt-1">
                      {t.items.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-start gap-2 text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <div>
                            <div>{it.label}</div>
                            {it.description && (
                              <div className="text-xs text-muted-foreground">{it.description}</div>
                            )}
                          </div>
                        </li>
                      ))}
                      {t.items.length === 0 && (
                        <li className="text-sm text-muted-foreground">No items defined yet.</li>
                      )}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>
      </div>
    </PortalLayout>
  );
};

export default PortalInspections;
