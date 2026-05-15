import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"
const PHONE = '813-501-7572'
const SITE_URL = 'https://mikesmautorepair.com'

interface DueService {
  name: string
  intervalMiles: number
  lastServiceMiles: number | null
  overdueBy: number
  competitorPriceRange?: [number, number]
  importance?: string
}

interface Props {
  customerName?: string
  vehicle?: string
  currentMileage?: number
  dueServices?: DueService[]
  priceRegionLabel?: string
}

const fmt = (n: number) => n.toLocaleString('en-US')

const MileageServiceReminderEmail = ({ customerName, vehicle, currentMileage, dueServices = [], priceRegionLabel }: Props) => {
  const serviceList = dueServices.map((s) => s.name).join(', ')
  const quoteBody = `Hi Mike — I'd like a quote for: ${serviceList || 'recommended maintenance'}${vehicle ? ` on my ${vehicle}` : ''}. Please apply my 20% mileage reminder discount.`
  const smsQuoteHref = `sms:${PHONE}?&body=${encodeURIComponent(quoteBody)}`
  const webQuoteHref = `${SITE_URL}/contact?services=${encodeURIComponent(serviceList)}${vehicle ? `&vehicle=${encodeURIComponent(vehicle)}` : ''}&promo=MILEAGE20`

  return (
    <Html lang="en">
      <Head />
      <Preview>Recommended maintenance is due on your {vehicle ?? 'vehicle'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Time for some maintenance</Heading>
          <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>
          <Text style={text}>
            Based on your {vehicle ?? 'vehicle'}{currentMileage ? ` (${fmt(currentMileage)} miles)` : ''}, the
            following mileage-based services are due or overdue. Keeping up with these protects your warranty and
            prevents bigger repair bills down the road.
          </Text>
          <Text style={smallText}>
            Each item below shows the typical <strong>competitor price range</strong> for your area
            {priceRegionLabel ? <> (<strong>{priceRegionLabel}</strong>)</> : null} at local dealers
            and national chains (Firestone, Pep Boys, Tires Plus) so you can see what you'd pay
            elsewhere — our mobile pricing is usually well below the low end, plus the 20% discount
            stacks on top.
          </Text>

          <Section style={card}>
            {dueServices.map((s, i) => {
              const isOverdue = s.overdueBy > 0
              const statusLabel = isOverdue
                ? `overdue by ${fmt(s.overdueBy)} mi`
                : s.overdueBy === 0
                  ? 'due now'
                  : `due in ${fmt(Math.abs(s.overdueBy))} mi`
              return (
                <Section key={i} style={itemBlock}>
                  <Text style={itemTitle}>
                    <span style={isOverdue ? badgeOverdue : badgeDueSoon}>
                      {isOverdue ? 'OVERDUE' : 'DUE SOON'}
                    </span>{' '}
                    <strong>{s.name}</strong>
                  </Text>
                  <Text style={itemMeta}>
                    every {fmt(s.intervalMiles)} mi
                    {s.lastServiceMiles != null
                      ? ` · last done at ${fmt(s.lastServiceMiles)} mi`
                      : ' · no record on file'}
                    {' · '}{statusLabel}
                  </Text>
                  {s.competitorPriceRange && (
                    <Text style={priceRow}>
                      <span style={priceLabel}>{priceRegionLabel ? `${priceRegionLabel} price:` : 'Competitor price:'}</span>{' '}
                      <span style={priceValue}>
                        ${fmt(s.competitorPriceRange[0])}–${fmt(s.competitorPriceRange[1])}
                      </span>
                    </Text>
                  )}
                  {s.importance && (
                    <details style={detailsBlock}>
                      <summary style={detailsSummary}>Why this matters ▾</summary>
                      <div style={detailsBody}>{s.importance}</div>
                    </details>
                  )}
                </Section>
              )
            })}
          </Section>

          <Section style={promoCard}>
            <Text style={promoBadge}>LIMITED TIME</Text>
            <Text style={promoHeadline}>20% OFF any service from this reminder</Text>
            <Text style={promoSubtext}>
              Mention this email when you book and we'll take 20% off labor on any of the
              recommended services above. One discount per visit.
            </Text>
          </Section>

          <Text style={text}>
            Want pricing before you book? Tap below to request a free quote on the services listed above —
            we'll text you back with a transparent estimate that already includes your 20% off. We come to
            you, no shop drop-off needed.
          </Text>

          <Button href={smsQuoteHref} style={button}>Claim 20% off — get a quote</Button>

          <Text style={text}>
            Prefer the web?{' '}
            <Link href={webQuoteHref} style={link}>Request your quote online →</Link>
          </Text>

          <Text style={smallText}>
            Or call/text <strong>{PHONE}</strong> any time and reference your 20% mileage reminder discount.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>— The {SITE_NAME} Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MileageServiceReminderEmail,
  subject: (d: Record<string, any>) =>
    `Maintenance due on your ${d?.vehicle ?? 'vehicle'}`,
  displayName: 'Mileage-based service reminder',
  previewData: {
    customerName: 'Alex',
    vehicle: '2018 Honda Civic',
    currentMileage: 92000,
    priceRegionLabel: 'Fort Myers / Cape Coral, FL',
    dueServices: [
      // Sample shows Fort Myers-area pricing (national base × 1.05, rounded to $5)
      { name: 'Oil & filter change', intervalMiles: 5000, lastServiceMiles: 85000, overdueBy: 2000, competitorPriceRange: [90, 170], importance: 'Fresh oil keeps moving engine parts lubricated and cool. Skipping it leads to sludge buildup, accelerated wear, and eventually catastrophic engine damage — by far the cheapest service that prevents the most expensive repair.' },
      { name: 'Tire rotation', intervalMiles: 7500, lastServiceMiles: 80000, overdueBy: 4500, competitorPriceRange: [30, 65], importance: 'Front and rear tires wear at very different rates. Rotating them evens out tread depth, extends tire life by 20–25%, and keeps handling predictable in wet weather.' },
      { name: 'Multi-point inspection', intervalMiles: 10000, lastServiceMiles: 80000, overdueBy: 2000, competitorPriceRange: [55, 105], importance: 'A trained set of eyes catches small issues — leaking seals, worn bushings, cracked hoses — before they strand you. Most failures show warning signs months before they break.' },
      { name: 'Wheel alignment check', intervalMiles: 15000, lastServiceMiles: 70000, overdueBy: 7000, competitorPriceRange: [115, 210], importance: 'Even slight misalignment chews through tires unevenly and pulls the steering. A $100 alignment can save $400+ in premature tire replacement and improves fuel economy.' },
      { name: 'Brake inspection', intervalMiles: 15000, lastServiceMiles: 75000, overdueBy: 2000, competitorPriceRange: [55, 105], importance: 'Catching worn pads early means a simple pad swap. Ignore it and metal-on-metal grinding ruins the rotors — turning a $200 job into $700+.' },
      { name: 'Cabin air filter', intervalMiles: 20000, lastServiceMiles: 70000, overdueBy: 2000, competitorPriceRange: [65, 145], importance: 'A clogged cabin filter restricts A/C airflow, makes the blower work harder, and dumps dust, pollen, and mold spores into the air you breathe. Florida humidity makes this much worse.' },
      { name: 'Battery test', intervalMiles: 25000, lastServiceMiles: null, overdueBy: 67000, competitorPriceRange: [30, 75], importance: 'Florida heat is brutal on batteries — most fail in 3–4 years with little warning. A 5-minute load test tells us if yours is on borrowed time so you don\'t get stranded.' },
      { name: 'Engine air filter', intervalMiles: 30000, lastServiceMiles: 60000, overdueBy: 2000, competitorPriceRange: [60, 125], importance: 'A clogged air filter starves the engine of oxygen, hurting MPG, throttle response, and over time can foul the mass airflow sensor — a much pricier repair.' },
      { name: 'Brake fluid flush', intervalMiles: 30000, lastServiceMiles: null, overdueBy: 62000, competitorPriceRange: [145, 230], importance: 'Brake fluid absorbs water from the air. Old fluid boils under hard braking (causing pedal fade), corrodes ABS components, and shortens caliper life.' },
      { name: 'A/C system performance check', intervalMiles: 30000, lastServiceMiles: null, overdueBy: 62000, competitorPriceRange: [115, 240], importance: 'In Florida, A/C is non-negotiable. Catching a slow refrigerant leak or weak compressor early avoids a $1,500+ compressor replacement later.' },
      { name: 'Brake pads & rotors', intervalMiles: 40000, lastServiceMiles: 50000, overdueBy: 2000, competitorPriceRange: [580, 1155], importance: 'The single most safety-critical wear item on the car. Worn pads dramatically increase stopping distance and damage rotors if pushed too far.' },
      { name: 'Power steering fluid flush', intervalMiles: 50000, lastServiceMiles: null, overdueBy: 42000, competitorPriceRange: [145, 230], importance: 'Old fluid turns abrasive and wears out the pump and rack seals. A flush is a fraction of the cost of a steering rack replacement ($1,200+).' },
      { name: 'Transmission fluid service', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [250, 475], importance: 'Transmission rebuilds run $3,000–$5,000+. Fresh fluid keeps clutches and valves working smoothly — this is one of the highest-ROI services on the entire car.' },
      { name: 'Coolant flush', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [160, 295], importance: 'Coolant additives wear out and become acidic, corroding the radiator, water pump, and heater core. Overheating warps heads — a multi-thousand-dollar repair.' },
      { name: 'Spark plug replacement', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [290, 685], importance: 'Worn plugs misfire, hurting MPG, dropping power, and dumping unburned fuel into the catalytic converter — which can fail at $1,000+ to replace.' },
      { name: 'Differential fluid service', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [145, 295], importance: 'The differential takes the engine\'s torque to the wheels. Burnt fluid grinds the gears and bearings — a rebuild runs $1,500+.' },
      { name: 'Serpentine belt inspection', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [160, 335], importance: 'This one belt drives the alternator, water pump, A/C, and power steering. If it snaps on the road, the car overheats within minutes and dies.' },
      { name: 'Fuel filter replacement', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [115, 295], importance: 'A clogged filter makes the fuel pump work harder and shortens its life. Pump replacement is a $700+ job on most vehicles.' },
      { name: 'Shocks & struts inspection', intervalMiles: 75000, lastServiceMiles: null, overdueBy: 17000, competitorPriceRange: [65, 145], importance: 'Worn shocks lengthen stopping distance significantly and cause uneven tire wear. They degrade gradually so most drivers don\'t notice until they\'re replaced.' },
      { name: 'Timing belt replacement', intervalMiles: 90000, lastServiceMiles: null, overdueBy: 2000, competitorPriceRange: [840, 1680], importance: 'On interference engines, a snapped timing belt destroys the engine instantly — bent valves, damaged pistons. Replacement is the single most important high-mileage service.' },
      { name: 'Oxygen sensor replacement', intervalMiles: 100000, lastServiceMiles: null, overdueBy: -8000, competitorPriceRange: [290, 605], importance: 'A lazy O2 sensor causes the engine to run rich, hurting MPG by 10–15% and slowly poisoning the catalytic converter (a $1,000+ part).' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0a1628', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const card = { backgroundColor: '#f1f5f9', borderLeft: '4px solid #3aa6e0', padding: '16px 20px', margin: '20px 0', borderRadius: '4px' }
const detail = { fontSize: '14px', color: '#0a1628', margin: '8px 0', lineHeight: '1.5' }
const button = { backgroundColor: '#3aa6e0', color: '#ffffff', padding: '12px 22px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', display: 'inline-block', margin: '8px 0 16px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8' }
const link = { color: '#3aa6e0', textDecoration: 'underline', fontWeight: 'bold' as const }
const smallText = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 12px' }
const promoCard = { backgroundColor: '#fff8e1', border: '2px dashed #f5b400', padding: '16px 20px', margin: '20px 0', borderRadius: '6px', textAlign: 'center' as const }
const promoBadge = { fontSize: '11px', fontWeight: 'bold' as const, color: '#a07400', letterSpacing: '1px', margin: '0 0 6px' }
const promoHeadline = { fontSize: '20px', fontWeight: 'bold' as const, color: '#0a1628', margin: '0 0 8px' }
const promoSubtext = { fontSize: '13px', color: '#5b4a14', lineHeight: '1.5', margin: '0' }
const badgeOverdue = { display: 'inline-block', backgroundColor: '#dc2626', color: '#ffffff', fontSize: '10px', fontWeight: 'bold' as const, padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.5px', verticalAlign: 'middle' }
const badgeDueSoon = { display: 'inline-block', backgroundColor: '#f5b400', color: '#0a1628', fontSize: '10px', fontWeight: 'bold' as const, padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.5px', verticalAlign: 'middle' }
const itemBlock = { padding: '10px 0', borderBottom: '1px solid #e2e8f0', margin: '0' }
const itemTitle = { fontSize: '14px', color: '#0a1628', margin: '0 0 4px', lineHeight: '1.4' }
const itemMeta = { fontSize: '12px', color: '#64748b', margin: '0 0 4px', lineHeight: '1.4' }
const priceRow = { fontSize: '12px', margin: '2px 0 0', lineHeight: '1.4' }
const priceLabel = { color: '#64748b', fontStyle: 'italic' as const }
const priceValue = { color: '#0a1628', fontWeight: 'bold' as const }
const detailsBlock = { margin: '6px 0 2px', padding: '0', fontSize: '12px' }
const detailsSummary = { cursor: 'pointer', color: '#3aa6e0', fontWeight: 'bold' as const, fontSize: '12px', listStyle: 'none', padding: '2px 0', userSelect: 'none' as const }
const detailsBody = { fontSize: '12px', color: '#475569', lineHeight: '1.5', padding: '6px 10px 4px', margin: '4px 0 0', backgroundColor: '#f8fafc', borderLeft: '3px solid #cbd5e1', borderRadius: '3px' }
