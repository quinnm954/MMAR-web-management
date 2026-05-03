import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

const currentYear = new Date().getFullYear();
const digitsOnly = (v: string) => v.replace(/\D/g, "");

interface QuoteRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string | null;
  phone?: string;
}

const QuoteRequestDialog = ({
  open,
  onOpenChange,
  serviceName,
  phone = "8135017572",
}: QuoteRequestDialogProps) => {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const STORAGE_KEY = "quoteRequest:vehicleInfo";

  useEffect(() => {
    if (open) {
      setPreviewText(null);
      setErrors({});
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const v = JSON.parse(saved);
          setYear(v.year ?? "");
          setMake(v.make ?? "");
          setModel(v.model ?? "");
          setMileage(v.mileage ?? "");
          setLocation(v.location ?? "");
          setNotes(v.notes ?? "");
          return;
        }
      } catch {
        // ignore
      }
      setYear("");
      setMake("");
      setModel("");
      setMileage("");
      setLocation("");
      setNotes("");
    }
  }, [open, serviceName]);

  const handleReview = () => {
    const next: Record<string, string> = {};
    if (year) {
      const y = Number(year);
      if (!/^\d{4}$/.test(year) || y < 1900 || y > currentYear + 1) {
        next.year = `Enter a 4-digit year (1900–${currentYear + 1})`;
      }
    }
    if (mileage) {
      const m = Number(digitsOnly(mileage));
      if (!Number.isFinite(m) || m < 0 || m > 1_000_000) {
        next.mileage = "Enter a mileage between 0 and 1,000,000";
      }
    }
    if (make.length > 50) next.make = "Make is too long (50 max)";
    if (model.length > 50) next.model = "Model is too long (50 max)";
    if (location.length > 100) next.location = "Location is too long (100 max)";
    if (notes.length > 1000) next.notes = "Notes are too long (1000 max)";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    const vehicle = [year, make, model].filter(Boolean).join(" ").trim();
    const lines = [
      `Hi, I'd like a quote for: ${serviceName ?? ""}`,
      vehicle ? `Vehicle: ${vehicle}` : "",
      mileage ? `Mileage: ${mileage}` : "",
      location ? `Location: ${location}` : "",
      notes ? `Notes: ${notes}` : "",
    ].filter(Boolean);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ year, make, model, mileage, location, notes }),
      );
    } catch {
      // ignore
    }

    setPreviewText(lines.join("\n"));
  };

  const handleSend = () => {
    if (!previewText) return;
    const body = encodeURIComponent(previewText);
    window.location.href = `sms:${phone}?body=${body}`;
    setPreviewText(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wide">
            <span className="text-sky">REQUEST</span>{" "}
            <span className="text-gold">QUOTE</span>
          </DialogTitle>
          <DialogDescription>
            {serviceName ? (
              <>
                Service: <span className="font-semibold text-foreground">{serviceName}</span>
              </>
            ) : (
              "Add your vehicle info — we'll text you back."
            )}
          </DialogDescription>
        </DialogHeader>

        {previewText === null ? (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={4}
                    placeholder="2018"
                    value={year}
                    onChange={(e) => setYear(digitsOnly(e.target.value).slice(0, 4))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    placeholder="Toyota"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="Camry"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="mileage">Mileage (optional)</Label>
                  <Input
                    id="mileage"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={7}
                    placeholder="85000"
                    value={mileage}
                    onChange={(e) => setMileage(digitsOnly(e.target.value).slice(0, 7))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    placeholder="Fort Myers, FL"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Symptoms, sounds, when it started…"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleReview} className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Review Text
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="preview">Preview & edit your message</Label>
              <Textarea
                id="preview"
                rows={8}
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                maxLength={1500}
              />
              <p className="text-xs text-muted-foreground">
                Sending to {phone}. Your messaging app will open next.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setPreviewText(null)}>
                Back
              </Button>
              <Button variant="hero" onClick={handleSend} className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Send Text
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuoteRequestDialog;
