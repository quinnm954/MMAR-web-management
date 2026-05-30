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

interface Inspection {
  id: string;
  status: string;
  mileage: number | null;
  share_token: string | null;
  summary_notes: string | null;
  completed_at: string | null;
  created_at: string;
  vehicle: { year: number | null; make: string | null; model: string | null } | null;
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
          "id, status, mileage, share_token, summary_notes, completed_at, created_at, vehicle:vehicles(year, make, model)",
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
              const body = (
                <Card className="hover:bg-muted/40 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{vehicleLabel}</CardTitle>
                      <Badge variant={statusVariant[insp.status] ?? "outline"} className="capitalize">
                        {insp.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <div>
                      {date}
                      {insp.mileage ? ` · ${insp.mileage.toLocaleString()} mi` : ""}
                    </div>
                    {insp.summary_notes && (
                      <div className="line-clamp-2 text-foreground/80">{insp.summary_notes}</div>
                    )}
                  </CardContent>
                </Card>
              );
              return insp.share_token ? (
                <Link key={insp.id} to={`/inspection/${insp.share_token}`}>
                  {body}
                </Link>
              ) : (
                <div key={insp.id}>{body}</div>
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
