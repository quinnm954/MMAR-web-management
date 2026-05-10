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
    priceRegionLabel: 'Naples / Marco Island, FL',
    dueServices: [
      // Sample shows Naples-area pricing (national base × 1.12, rounded to $5)
      { name: 'Oil & filter change', intervalMiles: 5000, lastServiceMiles: 85000, overdueBy: 2000, competitorPriceRange: [65, 135] },
      { name: 'Tire rotation', intervalMiles: 7500, lastServiceMiles: 80000, overdueBy: 4500, competitorPriceRange: [30, 55] },
      { name: 'Multi-point inspection', intervalMiles: 10000, lastServiceMiles: 80000, overdueBy: 2000, competitorPriceRange: [45, 100] },
      { name: 'Wheel alignment check', intervalMiles: 15000, lastServiceMiles: 70000, overdueBy: 7000, competitorPriceRange: [100, 170] },
      { name: 'Brake inspection', intervalMiles: 15000, lastServiceMiles: 75000, overdueBy: 2000, competitorPriceRange: [45, 100] },
      { name: 'Cabin air filter', intervalMiles: 20000, lastServiceMiles: 70000, overdueBy: 2000, competitorPriceRange: [55, 125] },
      { name: 'Battery test', intervalMiles: 25000, lastServiceMiles: null, overdueBy: 67000, competitorPriceRange: [30, 65] },
      { name: 'Engine air filter', intervalMiles: 30000, lastServiceMiles: 60000, overdueBy: 2000, competitorPriceRange: [45, 105] },
      { name: 'Brake fluid flush', intervalMiles: 30000, lastServiceMiles: null, overdueBy: 62000, competitorPriceRange: [125, 195] },
      { name: 'A/C system performance check', intervalMiles: 30000, lastServiceMiles: null, overdueBy: 62000, competitorPriceRange: [90, 200] },
      { name: 'Brake pads & rotors', intervalMiles: 40000, lastServiceMiles: 50000, overdueBy: 2000, competitorPriceRange: [390, 840] },
      { name: 'Power steering fluid flush', intervalMiles: 50000, lastServiceMiles: null, overdueBy: 42000, competitorPriceRange: [125, 195] },
      { name: 'Transmission fluid service', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [200, 390] },
      { name: 'Coolant flush', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [135, 245] },
      { name: 'Spark plug replacement', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [200, 505] },
      { name: 'Differential fluid service', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [125, 245] },
      { name: 'Serpentine belt inspection', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [140, 280] },
      { name: 'Fuel filter replacement', intervalMiles: 60000, lastServiceMiles: null, overdueBy: 32000, competitorPriceRange: [90, 225] },
      { name: 'Shocks & struts inspection', intervalMiles: 75000, lastServiceMiles: null, overdueBy: 17000, competitorPriceRange: [55, 135] },
      { name: 'Timing belt replacement', intervalMiles: 90000, lastServiceMiles: null, overdueBy: 2000, competitorPriceRange: [670, 1345] },
      { name: 'Oxygen sensor replacement', intervalMiles: 100000, lastServiceMiles: null, overdueBy: -8000, competitorPriceRange: [245, 560] },
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
