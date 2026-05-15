import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"
const PHONE = '813-501-7572'

interface Props {
  customerName?: string
  vehicle?: string
  lastMileage?: number | null
  daysSinceUpdate?: number | null
  updateUrl?: string
}

const fmt = (n: number) => n.toLocaleString('en-US')

const MileageUpdateRequestEmail = ({ customerName, vehicle, lastMileage, daysSinceUpdate, updateUrl }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Quick favor — what's the current mileage on your {vehicle ?? 'vehicle'}?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>What's your current mileage?</Heading>
        <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>
        <Text style={text}>
          Quick favor — we use your odometer reading to time service reminders so you only hear from us when something
          actually needs attention. The reading on file for your <strong>{vehicle ?? 'vehicle'}</strong>
          {lastMileage ? <> is <strong>{fmt(lastMileage)} mi</strong></> : null}
          {daysSinceUpdate ? <> from <strong>{daysSinceUpdate} days ago</strong></> : null}.
        </Text>
        <Section style={card}>
          <Text style={cardLabel}>One-click update</Text>
          <Text style={cardText}>
            Tap the button below, type your current odometer reading, and that's it. Takes 5 seconds.
          </Text>
          {updateUrl && (
            <Button href={updateUrl} style={button}>
              Update my mileage
            </Button>
          )}
        </Section>
        <Text style={smallText}>
          Prefer to text? Reply to <strong>{PHONE}</strong> with just the number (e.g. "47200") and we'll log it.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MileageUpdateRequestEmail,
  subject: ({ vehicle }: Props) => `Quick odometer check on your ${vehicle ?? 'vehicle'}`,
  displayName: 'Mileage update request',
  previewData: {
    customerName: 'Alex',
    vehicle: '2018 Honda Civic',
    lastMileage: 47200,
    daysSinceUpdate: 62,
    updateUrl: 'https://mikesmautorepair.com/m/abc123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0a1628', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const smallText = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#f1f5f9', borderLeft: '4px solid #3aa6e0', padding: '20px', margin: '20px 0', borderRadius: '4px', textAlign: 'center' as const }
const cardLabel = { fontSize: '12px', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 8px', fontWeight: 'bold' }
const cardText = { fontSize: '14px', color: '#334155', margin: '0 0 16px' }
const button = { backgroundColor: '#3aa6e0', color: '#ffffff', padding: '12px 28px', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8' }
