export type BlogFAQ = { question: string; answer: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  dateISO: string;
  readMinutes: number;
  tags: string[];
  // Body is HTML — kept as a string so we don't need MDX. Internal links are <a href="/...">.
  body: string;
  faqs?: BlogFAQ[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "why-cars-overheat-in-florida",
    title: "Why Cars Overheat in Florida (and How to Prevent It)",
    excerpt:
      "Florida's brutal heat punishes cooling systems. Here's what causes overheating in Southwest Florida and how to stop it before you're stuck on the side of I-75.",
    dateISO: "2026-04-15",
    readMinutes: 6,
    tags: ["Cooling", "Maintenance"],
    body: `
      <p>If you've lived in Southwest Florida for more than a summer, you already know what 95°F at 90% humidity does to a car. Cooling systems work harder here than almost anywhere else in the country, and when something inside that system starts to fail, you find out about it fast — usually in stop-and-go traffic on US-41 or I-75 with the temperature gauge climbing.</p>

      <h2>The most common reasons cars overheat in Florida</h2>
      <p>Almost every overheating call we take in <a href="/areas/lehigh-acres">Lehigh Acres</a>, <a href="/areas/fort-myers">Fort Myers</a>, and <a href="/areas/cape-coral">Cape Coral</a> traces back to one of these:</p>
      <ul>
        <li><strong>Low coolant.</strong> Either you're due for a flush or there's a leak somewhere — radiator, water pump, hose, or a failing intake gasket.</li>
        <li><strong>Bad thermostat.</strong> Stuck closed and the engine can't shed heat. Stuck open and it never reaches operating temperature, which is also bad.</li>
        <li><strong>Failed water pump.</strong> If the pump can't circulate coolant, it doesn't matter how full your radiator is.</li>
        <li><strong>Cooling fan not engaging.</strong> At low speeds (drive-thrus, stoplights, parking lots) the electric fan does all the work. When it dies, you overheat the moment you stop moving.</li>
        <li><strong>Clogged radiator.</strong> Years of mineral buildup and skipped flushes restrict flow.</li>
      </ul>

      <h2>What to do the moment your temperature gauge climbs</h2>
      <p>Pull over safely, turn off the AC, turn the heater on full blast (it pulls heat out of the engine), and shut the engine down as soon as you can do so safely. Driving an overheated engine even a few extra miles can warp a head, blow a head gasket, or destroy the engine. A $200 thermostat job becomes a $5,000 engine replacement very quickly.</p>

      <h2>Mobile cooling-system service</h2>
      <p>A mobile mechanic is genuinely the right call for overheating issues — most diagnostics, hose replacements, thermostat swaps, and even some water pump and radiator jobs can be done in your driveway with no tow bill. Get a quote any time at <a href="tel:8135017572">(813) 501-7572</a> or learn more about our <a href="/services/cooling">cooling-system service</a>.</p>
    `,
    faqs: [
      { question: "Is it safe to drive a car that's overheating?", answer: "No. Driving even a few miles with the temperature gauge in the red can warp the cylinder head, blow the head gasket, or destroy the engine. Pull over, shut it down, and call a mobile mechanic." },
      { question: "How much does it cost to fix an overheating car in Florida?", answer: "A thermostat or hose replacement is usually $150–$350 mobile. Water pumps run $300–$700. Radiator replacement is typically $400–$900. Most jobs are done on site without a tow bill." },
      { question: "Can a mobile mechanic fix a cooling system in my driveway?", answer: "Yes. Coolant flushes, thermostat replacement, hose and water pump jobs, and even most radiator swaps are routinely done at your home or workplace across Lehigh Acres, Fort Myers, and Cape Coral." },
    ],
  },
  {
    slug: "signs-of-a-bad-alternator",
    title: "7 Warning Signs of a Bad Alternator",
    excerpt:
      "Battery light, dim headlights, weird electrical glitches — here are the seven biggest signs your alternator is on its way out.",
    dateISO: "2026-04-22",
    readMinutes: 5,
    tags: ["Electrical", "Diagnostics"],
    body: `
      <p>Your alternator is the part that actually keeps your car running once it starts — the battery just gets it going. When the alternator starts to fail, the symptoms can be confusing because they often look like a battery problem at first.</p>

      <h2>The 7 biggest signs of a failing alternator</h2>
      <ol>
        <li><strong>Battery / charging warning light.</strong> The most obvious one. Don't ignore it.</li>
        <li><strong>Dim or flickering headlights.</strong> Especially noticeable at idle.</li>
        <li><strong>Electrical accessories acting up.</strong> Power windows slowing down, radio cutting out, dash lights flickering.</li>
        <li><strong>Whining or grinding noise.</strong> A failing internal bearing or a worn pulley.</li>
        <li><strong>Burning rubber or hot wire smell.</strong> The drive belt slipping or wires overheating from a shorted alternator.</li>
        <li><strong>Car dies after a jump-start.</strong> The battery may be fine — it's just not getting recharged while you drive.</li>
        <li><strong>Hard to start, then dead.</strong> The battery slowly drains because nothing is replacing the charge.</li>
      </ol>

      <h2>Battery vs alternator — which is it?</h2>
      <p>Both can produce the same symptoms. We always test both before condemning a part. If you're in <a href="/areas/fort-myers">Fort Myers</a>, <a href="/areas/cape-coral">Cape Coral</a>, or anywhere across SWFL, our <a href="/mobile-alternator-repair-fort-myers">mobile alternator repair</a> service includes a full charging-system test on site so you only pay for what you actually need.</p>

      <p>Stuck right now? Call <a href="tel:8135017572">(813) 501-7572</a> — same-day mobile service is usually available.</p>
    `,
    faqs: [
      { question: "Can a bad alternator drain a brand new battery?", answer: "Yes. A failing alternator can either undercharge (slowly draining the battery while you drive) or overcharge (boiling and ruining a new battery in days). Always test the alternator before replacing the battery." },
      { question: "How long can I drive with a bad alternator?", answer: "Usually 20–60 minutes once the warning light comes on, depending on accessories running. Once the battery is depleted, the engine stalls. Don't risk it — get tested same day." },
      { question: "How much does mobile alternator replacement cost in Fort Myers?", answer: "Most alternator jobs in SWFL run $350–$750 fully installed mobile, depending on vehicle. We provide upfront quotes after a free on-site charging-system test." },
    ],
  },
  {
    slug: "dead-battery-vs-bad-starter",
    title: "Dead Battery vs Bad Starter — How to Tell the Difference",
    excerpt:
      "Won't start, but you can't tell why? Here's how to know if it's your battery, your starter, or something else entirely.",
    dateISO: "2026-04-29",
    readMinutes: 5,
    tags: ["Electrical", "Diagnostics"],
    body: `
      <p>You turn the key (or push the button) and… nothing. Or maybe just a single click. Or maybe the dash flickers and then dies. So which is it — battery or starter? The good news is the symptoms are usually pretty different once you know what to listen for.</p>

      <h2>Signs it's the battery</h2>
      <ul>
        <li>Dash lights are dim or don't come on at all.</li>
        <li>Engine cranks slowly or barely at all.</li>
        <li>You hear rapid clicking when you try to start.</li>
        <li>Battery is more than 3 years old (Florida heat is brutal — most batteries here only last 2–3 years).</li>
        <li>Headlights work fine when the engine is off but die when you try to crank.</li>
      </ul>

      <h2>Signs it's the starter</h2>
      <ul>
        <li>You hear a single loud <em>clunk</em> instead of cranking.</li>
        <li>Dash lights stay bright when you turn the key — full power, no crank.</li>
        <li>Sometimes it cranks, sometimes it doesn't (a starter solenoid going bad intermittently).</li>
        <li>Smoke or burning smell from under the hood after trying to start.</li>
        <li>Tapping the starter with a wrench gets it to crank one more time.</li>
      </ul>

      <h2>What about the alternator?</h2>
      <p>If the car runs but slowly dies, or starts after a jump and won't restart later, that's an <a href="/blog/signs-of-a-bad-alternator">alternator problem</a>, not a starter or battery one.</p>

      <h2>Don't guess — test</h2>
      <p>A real charging-system test takes 5 minutes and saves you from buying the wrong part. Our mobile mechanics test the battery, alternator, and starter circuit on site before recommending any repair. Get help anywhere in SWFL at <a href="tel:8135017572">(813) 501-7572</a> or learn more about <a href="/mobile-battery-replacement-cape-coral">mobile battery replacement</a>.</p>
    `,
    faqs: [
      { question: "How can I tell if it's the battery or the starter?", answer: "Dim dash lights and slow cranking point to the battery. Bright dash lights with a single loud click and no crank point to the starter. A 5-minute on-site test confirms which one it is." },
      { question: "Will jump-starting damage my car if it's actually the starter?", answer: "No, but it won't help either. If your battery tests good, no amount of jumping will fix a bad starter — you need the starter replaced." },
      { question: "Can a mobile mechanic replace a starter in my driveway?", answer: "Yes. Starter replacement is one of the most common mobile repairs we perform across Lehigh Acres, Fort Myers, and Cape Coral. Most jobs take under 2 hours." },
    ],
  },
  {
    slug: "why-your-car-wont-start",
    title: "Why Your Car Won't Start (and What a Mobile Mechanic Can Do)",
    excerpt:
      "From dead batteries to bad fuel pumps, here's a practical no-start checklist — and how a mobile mechanic can get you running without a tow.",
    dateISO: "2026-05-02",
    readMinutes: 7,
    tags: ["No-Start", "Diagnostics"],
    body: `
      <p>A no-start is one of the most stressful car problems because everything stops. You can't drive to a shop. You can't get to work. You're just stuck. The good news: most no-starts have a small handful of common causes, and almost all of them can be diagnosed and often repaired right where the car sits.</p>

      <h2>The most common no-start causes</h2>
      <ol>
        <li><strong>Dead or weak battery.</strong> The #1 cause by a wide margin. Florida heat kills batteries in 2–3 years.</li>
        <li><strong>Bad starter.</strong> Single click, no crank, full dash lights = classic starter symptom.</li>
        <li><strong>Fuel pump failure.</strong> Cranks but won't fire. Often preceded by long crank times that got worse over weeks.</li>
        <li><strong>Bad ignition switch or push-button start module.</strong> Nothing happens when you turn the key.</li>
        <li><strong>Security / immobilizer fault.</strong> Key fob battery dead, anti-theft tripped, or PCM lost the key.</li>
        <li><strong>Crank sensor or cam sensor failure.</strong> Engine spins but the computer doesn't know where it is, so it never sparks.</li>
        <li><strong>Empty tank.</strong> Yes, really. Always check first.</li>
      </ol>

      <h2>What you can check yourself</h2>
      <ul>
        <li>Do dash lights come on bright? If yes, probably not the battery.</li>
        <li>When you crank, do you hear engine spinning? If no — battery, starter, or ignition.</li>
        <li>Engine spins but doesn't fire? — fuel, spark, or sensor problem.</li>
        <li>Smell fuel? Don't keep cranking — call.</li>
      </ul>

      <h2>Why mobile is the right call for no-starts</h2>
      <p>A no-start is the worst possible time to need a tow. Our <a href="/emergency-mobile-mechanic-lehigh-acres">emergency mobile mechanic</a> service rolls to your driveway, parking lot, or roadside breakdown with diagnostic scanners, jump packs, replacement batteries, starters, and the experience to find the real problem fast. Most no-starts in SWFL get fixed on the spot.</p>

      <p>Stuck right now in <a href="/areas/lehigh-acres">Lehigh Acres</a>, <a href="/areas/fort-myers">Fort Myers</a>, or anywhere in SWFL? Call <a href="tel:8135017572">(813) 501-7572</a>.</p>
    `,
    faqs: [
      { question: "Can a mobile mechanic fix a no-start in a parking lot?", answer: "Yes. Most no-starts — dead battery, bad starter, fuel pump, sensor faults — are diagnosed and repaired right where the car sits, including parking lots, driveways, and roadside." },
      { question: "How fast can you get to me for a no-start?", answer: "Typical response time across Lehigh Acres, Fort Myers, and Cape Coral is 60–120 minutes for emergency no-start calls. Call (813) 501-7572 for current ETA." },
      { question: "Is mobile no-start service cheaper than a tow plus shop?", answer: "Almost always. A tow alone is $100–$250 in SWFL, plus shop diagnostic fees and waiting. Mobile diagnosis is typically $89–$129 with no tow needed." },
    ],
  },
  {
    slug: "common-car-problems-southwest-florida",
    title: "6 Common Car Problems in Southwest Florida",
    excerpt:
      "Heat, salt air, stop-and-go traffic — SWFL is hard on vehicles. Here are the six issues we see most often and how to stay ahead of them.",
    dateISO: "2026-05-03",
    readMinutes: 6,
    tags: ["Maintenance", "Local"],
    body: `
      <p>Cars in Southwest Florida live a tougher life than most people realize. Year-round heat, season-long humidity, salt air on the coast, and the daily creep of season traffic all conspire against the average vehicle. After thousands of mobile service calls across <a href="/areas/lehigh-acres">Lehigh Acres</a>, <a href="/areas/fort-myers">Fort Myers</a>, <a href="/areas/cape-coral">Cape Coral</a>, and beyond, the same six problems keep coming up.</p>

      <h2>1. Dead batteries (way earlier than expected)</h2>
      <p>Most batteries are rated for 4–5 years. In SWFL, plan on 2–3. Heat boils off the electrolyte and accelerates internal corrosion. Get yours load-tested every visit.</p>

      <h2>2. AC compressor and recharge issues</h2>
      <p>Florida AC systems run nearly year-round. Compressors fail, refrigerant leaks develop, and condenser fans burn out. A weak AC is a maintenance issue here, not a luxury problem.</p>

      <h2>3. Brake wear from stop-and-go traffic</h2>
      <p>Season traffic and constant red-light driving wears out pads twice as fast as highway commuting. Squealing or a soft pedal? Don't wait. Mobile <a href="/services/brakes">brake service</a> is fast and on-site.</p>

      <h2>4. Overheating and cooling-system failures</h2>
      <p>See our full guide on <a href="/blog/why-cars-overheat-in-florida">why cars overheat in Florida</a>. Stuck thermostats, failing water pumps, and clogged radiators top the list.</p>

      <h2>5. Salt-air corrosion on coastal vehicles</h2>
      <p>If you live anywhere near the Gulf — Cape Coral, Bonita Beach, Naples — salt eats brake lines, exhaust, suspension components, and electrical connectors. Annual undercarriage inspections matter.</p>

      <h2>6. Alternator and electrical gremlins</h2>
      <p>Heat plus humidity plus age = electrical issues. Bad alternators, corroded grounds, and failing fuses become more common past 80,000 miles. See <a href="/blog/signs-of-a-bad-alternator">7 signs of a bad alternator</a>.</p>

      <h2>The fix: stay ahead of it with mobile service</h2>
      <p>Skip the shop visits — we come to you for inspections, fluid services, and repairs on your schedule. Call or text <a href="tel:8135017572">(813) 501-7572</a> to book.</p>
    `,
    faqs: [
      { question: "Why do car batteries die so fast in Florida?", answer: "Year-round heat boils off battery electrolyte and accelerates internal corrosion. Most SWFL batteries last 2–3 years instead of the 4–5 years rated by the manufacturer." },
      { question: "How often should I service my AC in Southwest Florida?", answer: "AC performance check every 1–2 years, refrigerant level check annually. Florida AC systems run nearly year-round and develop leaks faster than in cooler climates." },
      { question: "Does salt air really damage cars in Cape Coral and Naples?", answer: "Yes. Salt corrodes brake lines, exhaust, suspension components, and electrical connectors. An annual undercarriage inspection catches issues early on coastal vehicles." },
    ],
  },
];

export const getBlogPostBySlug = (slug: string) =>
  blogPosts.find((p) => p.slug === slug);
