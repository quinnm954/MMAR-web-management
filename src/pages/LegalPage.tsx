import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const BUSINESS = "Mike's Mobile Auto Repair (operated by Capital Services Management, INC.)";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    <div className="space-y-2 text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

const Shell = ({ title, children }: { title: string; children: React.ReactNode }) => {
  useEffect(() => { document.title = `${title} | Mike's Mobile Auto Repair`; }, [title]);
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-20 px-4">
        <article className="max-w-3xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-2">Last updated: September 27, 2026</p>
          </header>
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export const PrivacyPolicy = () => (
  <Shell title="Privacy Policy">
    <Section title="Who we are">
      <p>This policy explains how {BUSINESS} collects and uses your information. Contact us at (813) 501-7572.</p>
    </Section>
    <Section title="Information we collect">
      <p>Your name, mobile number, email, service address, vehicle details, and messages you send us when you request service, create an account, call, or text us.</p>
    </Section>
    <Section title="How we use it">
      <p>To schedule and perform service, send appointment confirmations, reminders, estimates, invoices, and respond to your questions.</p>
    </Section>
    <Section title="SMS / text messaging">
      <p>If you opt in, we send text messages about your appointments, service updates, estimates, and invoices. Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time, or HELP for help.</p>
      <p className="font-medium text-foreground">No mobile information will be shared with third parties or affiliates for marketing or promotional purposes. Text messaging originator opt-in data and consent will not be shared with any third parties.</p>
    </Section>
    <Section title="Sharing">
      <p>We do not sell your personal information. We share it only with service providers who help us run our business (such as payment processing and messaging delivery), and only as needed to serve you, or when required by law.</p>
    </Section>
    <Section title="Your choices">
      <p>You can ask us to update or delete your information by calling or texting (813) 501-7572.</p>
    </Section>
  </Shell>
);

export const TermsOfService = () => (
  <Shell title="Terms of Service">
    <Section title="Services">
      <p>{BUSINESS} provides mobile automotive repair in Southwest Florida. Estimates are provided before work begins, and work proceeds only with your approval.</p>
    </Section>
    <Section title="SMS messaging program">
      <p><strong className="text-foreground">Program:</strong> Mike's Mobile Auto Repair customer notifications — appointment confirmations, reminders, service updates, estimates, and invoices.</p>
      <p><strong className="text-foreground">Opt in:</strong> by checking the SMS consent box when requesting service on our website, or by texting us first.</p>
      <p><strong className="text-foreground">Frequency:</strong> message frequency varies. <strong className="text-foreground">Cost:</strong> message and data rates may apply.</p>
      <p><strong className="text-foreground">Opt out:</strong> reply STOP at any time. You'll receive one confirmation and no further messages. <strong className="text-foreground">Help:</strong> reply HELP or call (813) 501-7572.</p>
      <p>Carriers are not liable for delayed or undelivered messages.</p>
    </Section>
    <Section title="Warranty">
      <p>See our <a href="/warranty-policy" className="text-primary hover:underline">Warranty Policy</a>.</p>
    </Section>
    <Section title="Privacy">
      <p>See our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.</p>
    </Section>
  </Shell>
);
