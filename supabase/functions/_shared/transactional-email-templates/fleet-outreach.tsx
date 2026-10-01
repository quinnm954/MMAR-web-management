import * as React from 'npm:react@18.3.1'
import { BrandFooter } from './_brand.tsx'
import { Body, Button, Container, Head, Hr, Html, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { subject?: string; body?: string; step?: number; mailingAddress?: string }

const PHONE = '813-501-7572'
const FLEET_URL = 'https://mikesmautorepair.com/fleet'

const Paragraphs = ({ text }: { text: string }) => (
  <>
    {text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p, i) => (
      <Text key={i} style={textStyle}>
        {p.split('\n').map((line, j, arr) => (
          <React.Fragment key={j}>{line}{j < arr.length - 1 && <br />}</React.Fragment>
        ))}
      </Text>
    ))}
  </>
)

const FleetOutreachEmail = ({ subject, body, step = 1, mailingAddress }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>{subject ?? 'Keeping your work trucks on the road'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>Mike's Mobile Auto Repair</Text>
          <Text style={pill}>Fleet Partner Program · Fort Myers &amp; Lehigh Acres</Text>
        </Section>
        <Section style={card}>
          <Paragraphs text={body ?? ''} />
          {step === 1 && (
            <Section style={highlight}>
              <Text style={hlTitle}>What fleet partners get</Text>
              <Text style={hlItem}>• Monthly on-site "Yard Days" at your lot</Text>
              <Text style={hlItem}>• Priority dispatch when a vehicle goes down</Text>
              <Text style={hlItem}>• Digital health reports for every vehicle</Text>
              <Text style={hlItem}>• No mobile diagnostic fees, fair labor rates</Text>
            </Section>
          )}
          <Section style={{ textAlign: 'center', margin: '24px 0 8px' }}>
            <Button href={`tel:+1${PHONE.replace(/-/g, '')}`} style={btnPrimary}>Call or text {PHONE}</Button>
          </Section>
          <Section style={{ textAlign: 'center' }}>
            <Link href={FLEET_URL} style={link}>See the Fleet Partner Plan →</Link>
          </Section>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Mike's Mobile Auto Repair{mailingAddress ? ` · ${mailingAddress}` : ''}
        </Text>
      <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FleetOutreachEmail,
  subject: (d: Record<string, any>) => (d?.subject as string) || 'Keeping your work trucks on the road',
  displayName: 'Fleet outreach',
  previewData: {
    subject: 'Keeping your vans on the road',
    body: 'Hi Acme Plumbing team,\n\nEvery hour a van sits at a shop is an hour your crew isn’t billing. We bring the shop to your yard.\n\n— Mike, Mike\'s Mobile Auto Repair',
    step: 1,
    mailingAddress: 'Lehigh Acres, FL',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '580px', margin: '0 auto', padding: '24px 16px' }
const header = { backgroundColor: '#0f172a', borderRadius: '12px 12px 0 0', padding: '20px 24px' }
const brand = { color: '#ffffff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }
const pill = { display: 'inline-block', backgroundColor: '#f5b82e', color: '#0f172a', fontSize: '12px', fontWeight: 700, borderRadius: '999px', padding: '4px 12px', margin: 0 }
const card = { border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '24px' }
const textStyle = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const highlight = { backgroundColor: '#fffbeb', borderLeft: '4px solid #f5b82e', borderRadius: '8px', padding: '14px 18px', margin: '8px 0' }
const hlTitle = { fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }
const hlItem = { fontSize: '14px', color: '#334155', margin: '2px 0', lineHeight: '1.5' }
const btnPrimary = { backgroundColor: '#3ba7e8', color: '#ffffff', fontSize: '15px', fontWeight: 700, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const link = { color: '#1d7fbf', fontSize: '14px', fontWeight: 600 }
const hr = { borderColor: '#e2e8f0', margin: '24px 0 12px' }
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, margin: 0 }
