import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";

type Settings = {
  google_ads_conversion_id: string | null;
  phone_call_label: string | null;
  text_click_label: string | null;
  quote_submit_label: string | null;
  lead_label: string | null;
  wcc_phone_number: string | null;
  wcc_conversion_id: string | null;
  dni_enabled: boolean;
  enhanced_conversions: boolean;
};

const empty: Settings = {
  google_ads_conversion_id: "",
  phone_call_label: "",
  text_click_label: "",
  quote_submit_label: "",
  lead_label: "",
  wcc_phone_number: "",
  wcc_conversion_id: "",
  dni_enabled: false,
  enhanced_conversions: true,
};

export default function AdminTrackingSettings() {
  const [s, setS] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tracking_settings").select("*").eq("id", 1).maybeSingle();
      if (data) setS({ ...empty, ...data });
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("tracking_settings").update(s).eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Tracking settings saved. Reload site to pick up changes.");
  };

  if (loading) return <div className="flex justify-center p-6"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Ads Tracking</CardTitle>
          <CardDescription>
            Conversion IDs and labels can be added or updated anytime. The site automatically uses
            whatever is saved here — no code changes needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="conv-id">Google Ads Conversion ID</Label>
            <Input
              id="conv-id"
              placeholder="AW-1234567890"
              value={s.google_ads_conversion_id ?? ""}
              onChange={(e) => set("google_ads_conversion_id", e.target.value.trim())}
            />
            <p className="text-xs text-muted-foreground">
              Found in Google Ads → Tools → Conversions → Tag setup. Starts with <code>AW-</code>.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone-label">Phone Call — Conversion Label</Label>
              <Input
                id="phone-label"
                placeholder="WpXhCN-p-t0bELWPvIdB"
                value={s.phone_call_label ?? ""}
                onChange={(e) => set("phone_call_label", e.target.value.trim())}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="text-label">Text Click — Conversion Label</Label>
              <Input
                id="text-label"
                placeholder="abc123…"
                value={s.text_click_label ?? ""}
                onChange={(e) => set("text_click_label", e.target.value.trim())}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quote-label">Quote Submit — Conversion Label</Label>
              <Input
                id="quote-label"
                placeholder="abc123…"
                value={s.quote_submit_label ?? ""}
                onChange={(e) => set("quote_submit_label", e.target.value.trim())}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-label">Lead (booking link) — Conversion Label</Label>
              <Input
                id="lead-label"
                placeholder="abc123…"
                value={s.lead_label ?? ""}
                onChange={(e) => set("lead_label", e.target.value.trim())}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Website Call Conversions (Dynamic Number Insertion)</CardTitle>
          <CardDescription>
            Swap your displayed phone number with a Google forwarding number for visitors that arrive
            from Google Ads. Calls placed from those visits are then automatically counted as conversions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="dni" className="text-base">Enable number swap (DNI)</Label>
              <p className="text-xs text-muted-foreground">
                Requires creating a "Calls from a website" conversion action in Google Ads first.
              </p>
            </div>
            <Switch id="dni" checked={s.dni_enabled} onCheckedChange={(v) => set("dni_enabled", v)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wcc-phone">Displayed Phone Number</Label>
              <Input
                id="wcc-phone"
                placeholder="(813) 501-7572"
                value={s.wcc_phone_number ?? ""}
                onChange={(e) => set("wcc_phone_number", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wcc-id">WCC Conversion ID/Label</Label>
              <Input
                id="wcc-id"
                placeholder="AW-1234567890/AbCdEf-XYZ"
                value={s.wcc_conversion_id ?? ""}
                onChange={(e) => set("wcc_conversion_id", e.target.value.trim())}
              />
              <p className="text-xs text-muted-foreground">Format: <code>AW-XXXX/LABEL</code></p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to find these values</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p><strong>1.</strong> Go to <a className="text-primary underline" href="https://ads.google.com/" target="_blank" rel="noreferrer">Google Ads <ExternalLink className="inline h-3 w-3" /></a> → Tools → Conversions.</p>
          <p><strong>2.</strong> Create three conversion actions: "Phone Call (click)", "Text Click", "Quote Submit". Use category <em>Contact</em> or <em>Lead</em>.</p>
          <p><strong>3.</strong> For each, copy the Conversion ID (<code>AW-…</code>) and Conversion Label and paste them above.</p>
          <p><strong>4.</strong> For Website Call Conversions, create a "Calls from a website" action and paste the displayed phone + the AW-ID/Label combo.</p>
          <p>All events fire automatically once labels are saved. No site re-deploy needed.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save tracking settings
        </Button>
      </div>
    </div>
  );
}
