import { toast } from "sonner";

/**
 * Open the device's native share sheet (iOS/Android) for a URL.
 * Falls back to copying the link to the clipboard on desktop browsers
 * that don't support navigator.share.
 */
export async function shareLink(opts: {
  url: string;
  title?: string;
  text?: string;
  copyToastMessage?: string;
}) {
  const { url, title, text, copyToastMessage = "Link copied to clipboard" } = opts;

  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ url, title, text });
      return { method: "share" as const };
    } catch (e: any) {
      if (e?.name === "AbortError") return { method: "cancelled" as const };
      // fall through to copy
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success(copyToastMessage);
    return { method: "clipboard" as const };
  } catch {
    window.prompt("Copy link:", url);
    return { method: "prompt" as const };
  }
}
