import { Phone, MessageSquare, Mail, Calendar, Globe, Star, MapPin, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import mmarLogo from "@/assets/mmar-logo.jpeg";
import { trackConversion } from "@/lib/gtag";
import { shareLink } from "@/lib/share";
import { useSeo } from "@/lib/useSeo";

const PHONE_DISPLAY = "(813) 501-7572";
const PHONE_TEL = "8135017572";
const EMAIL = "mikesmarllc@gmail.com";
const WEBSITE = "https://mikesmautorepair.com";
const GMB_URL = "https://share.google/bx2Gb42dslCITJdS8";

const VCARD = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "FN:Mike's Mobile Auto Repair",
  "ORG:Mike's Mobile Auto Repair",
  "TITLE:Mobile Mechanic",
  `TEL;TYPE=WORK,VOICE:+1${PHONE_TEL}`,
  `TEL;TYPE=CELL,VOICE:+1${PHONE_TEL}`,
  `EMAIL;TYPE=INTERNET,WORK:${EMAIL}`,
  `URL:${WEBSITE}`,
  "ADR;TYPE=WORK:;;Mobile Service;Lehigh Acres;FL;;USA",
  "NOTE:Mobile auto repair serving Southwest Florida. Call or text anytime.",
  "END:VCARD",
].join("\r\n");

const downloadVcf = () => {
  trackConversion();
  const blob = new Blob([VCARD], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mikes-mobile-auto-repair.vcf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const handleShare = () => {
  shareLink({
    url: `${WEBSITE}/card`,
    title: "Mike's Mobile Auto Repair",
    text: "Save my contact — mobile auto repair in Southwest Florida.",
  });
};

const BusinessCard = () => {
  useSeo({
    title: "Mike's Mobile Auto Repair — Digital Business Card",
    description:
      "Save Mike's Mobile Auto Repair to your contacts. Call or text (813) 501-7572 for mobile mechanic service across Southwest Florida.",
    canonical: "https://mikesmautorepair.com/card",
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl overflow-hidden p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-28 h-28 rounded-2xl overflow-hidden mb-4 ring-2 ring-primary/30">
              <img src={mmarLogo} alt="Mike's Mobile Auto Repair" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl tracking-wide">
              <span className="text-sky">MIKE'S MOBILE</span>{" "}
              <span className="text-gold">AUTO REPAIR</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Mobile Mechanic — Southwest Florida
            </p>
          </div>

          {/* Primary actions */}
          <div className="space-y-3">
            <a
              href={`tel:${PHONE_TEL}`}
              onClick={trackConversion}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-white text-black font-semibold hover-lift active:scale-[0.98] transition-transform"
            >
              <Phone className="w-5 h-5" />
              <div className="flex-1 text-left">
                <div className="text-xs text-black/60">Call</div>
                <div>{PHONE_DISPLAY}</div>
              </div>
            </a>

            <a
              href={`sms:${PHONE_TEL}`}
              onClick={trackConversion}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover-lift active:scale-[0.98] transition-transform"
            >
              <MessageSquare className="w-5 h-5" />
              <div className="flex-1 text-left">
                <div className="text-xs opacity-80">Text</div>
                <div>{PHONE_DISPLAY}</div>
              </div>
            </a>

            <a
              href="/book"
              className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover-lift active:scale-[0.98] transition-transform"
            >
              <Calendar className="w-5 h-5" />
              <div className="flex-1 text-left">
                <div className="text-xs opacity-80">Book</div>
                <div>Schedule Service</div>
              </div>
            </a>

            <a
              href={`mailto:${EMAIL}`}
              onClick={trackConversion}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover-lift active:scale-[0.98] transition-transform"
            >
              <Mail className="w-5 h-5" />
              <div className="flex-1 text-left min-w-0">
                <div className="text-xs opacity-80">Email</div>
                <div className="truncate">{EMAIL}</div>
              </div>
            </a>
          </div>

          {/* Secondary row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <a
              href={WEBSITE}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-xs">Website</span>
            </a>
            <a
              href={GMB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Star className="w-5 h-5 text-primary" />
              <span className="text-xs">Reviews</span>
            </a>
            <a
              href={GMB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-xs">Directions</span>
            </a>
          </div>

          {/* Save + Share */}
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={downloadVcf}
                className="w-full h-12 bg-gold text-black hover:bg-gold/90 font-semibold"
              >
                <Download className="w-5 h-5 mr-2" />
                Save to Contacts
              </Button>
              <Button
                onClick={downloadVcf}
                variant="outline"
                className="w-full h-12 border-primary/40 hover:bg-primary/10 font-semibold"
              >
                <Download className="w-5 h-5 mr-2" />
                Download vCard (.vcf)
              </Button>
            </div>
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full h-12"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Card
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-6">
            © Capital Services Management, INC.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
