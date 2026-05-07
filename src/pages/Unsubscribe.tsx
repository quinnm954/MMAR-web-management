import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type Status = "loading" | "valid" | "already" | "invalid" | "submitting" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("Missing unsubscribe token.");
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await r.json();
        if (r.ok && data.valid) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else { setStatus("invalid"); setMessage(data.error || "Invalid token."); }
      } catch {
        setStatus("error"); setMessage("Could not validate the link.");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setStatus("submitting");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ token }),
      });
      const data = await r.json();
      if (r.ok && data.success) setStatus("success");
      else if (data.reason === "already_unsubscribed") setStatus("already");
      else { setStatus("error"); setMessage(data.error || "Failed to unsubscribe."); }
    } catch {
      setStatus("error"); setMessage("Network error.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Email Preferences</h1>
          {status === "loading" && <p className="text-muted-foreground">Verifying…</p>}
          {status === "valid" && (
            <>
              <p className="text-muted-foreground">Click below to unsubscribe from Mike's Mobile Auto Repair emails.</p>
              <Button onClick={confirm} className="w-full">Confirm Unsubscribe</Button>
            </>
          )}
          {status === "submitting" && <p className="text-muted-foreground">Processing…</p>}
          {status === "success" && <p className="text-foreground">You've been unsubscribed. We're sorry to see you go.</p>}
          {status === "already" && <p className="text-foreground">You're already unsubscribed.</p>}
          {(status === "invalid" || status === "error") && <p className="text-destructive">{message}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
