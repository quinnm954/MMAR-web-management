import { useHomeRegion, AREA_TEXT } from "@/lib/homeRegion";
// Voice-search optimized answer block. Short, conversational, first-sentence
// answers are what Google Assistant / Siri / Alexa read aloud. The matching
// SpeakableSpecification in Index.tsx points to #speakable-summary and the
// .speakable-answer class so assistants know which text to vocalize.
const VoiceSearchAnswers = () => {
  const region = useHomeRegion();
  const A = AREA_TEXT[region];
  return (
    <section
      id="speakable-summary"
      aria-label="Quick answers"
      className="py-12 md:py-16 border-t border-border/40"
    >
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-wide mb-6 text-center">
          <span className="text-sky">QUICK</span>{" "}
          <span className="text-gold">ANSWERS</span>
        </h2>

        <dl className="space-y-5 text-base md:text-lg">
          <div>
            <dt className="font-semibold text-foreground">
              Who is the best mobile mechanic near me in {A.areas}?
            </dt>
            <dd className="speakable-answer text-muted-foreground mt-1">
              Mike's Mobile Auto Repair is a 5-star rated mobile mechanic
              serving {A.areas},
              Florida. Call 813-501-7572 for next-day service.
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-foreground">
              What does a mobile mechanic cost?
            </dt>
            <dd className="speakable-answer text-muted-foreground mt-1">
              Most repairs cost the same as a regular auto shop with no extra
              trip fee inside our service area. Diagnosis is 100 dollars,
              and 50 of it is credited toward the repair labor.
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-foreground">
              How fast can a mechanic come to my house?
            </dt>
            <dd className="speakable-answer text-muted-foreground mt-1">
              Next-day appointments are usually available across {A.areaShort}.
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-foreground">
              What services do you offer?
            </dt>
            <dd className="speakable-answer text-muted-foreground mt-1">
              Brake repair, battery replacement, alternators, starters, AC
              repair, check-engine diagnostics, cooling systems, and suspension
              work — all at your home or office.
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-foreground">
              How do I book an appointment?
            </dt>
            <dd className="speakable-answer text-muted-foreground mt-1">
              Call or text 813-501-7572, or book online at mikesmautorepair.com.
              We accept all major credit cards.
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
};

export default VoiceSearchAnswers;
