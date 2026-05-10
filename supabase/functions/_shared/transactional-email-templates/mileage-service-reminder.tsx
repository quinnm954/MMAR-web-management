import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"
const PHONE = '813-501-7572'

interface DueService {
  name: string
  intervalMiles: number
  lastServiceMiles: number | null
  overdueBy: number
}

interface Props {
  customerName?: string
  vehicle?: string
  currentMileage?: number
  dueServices?: DueService[]
}

const fmt = (n: number) => n.toLocaleString('en-US')

const MileageServiceReminderEmail = ({ customerName, vehicle, currentMileage, dueServices = [] }: Props) => (
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

        <Section style={card}>
          {dueServices.map((s, i) => (
            <Text key={i} style={detail}>
              <strong>{s.name}</strong> — every {fmt(s.intervalMiles)} mi
              {s.lastServiceMiles != null
                ? ` · last done at ${fmt(s.lastServiceMiles)} mi`
                : ' · no record on file'}
              {s.overdueBy > 0 ? ` · overdue by ${fmt(s.overdueBy)} mi` : ''}
            </Text>
          ))}
        </Section>

        <Text style={text}>
          We come to you — no need to drop the vehicle off. Reply to this email or call/text{' '}
          <strong>{PHONE}</strong> and we'll get you scheduled.
        </Text>

        <Button href={`sms:${PHONE}`} style={button}>Text us to schedule</Button>

        <Hr style={hr} />
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MileageServiceReminderEmail,
  subject: (d: Record<string, any>) =>
    `Maintenance due on your ${d?.vehicle ?? 'vehicle'}`,
  displayName: 'Mileage-based service reminder',
  previewData: {
    customerName: 'Alex',
    vehicle: '2018 Honda Civic',
    currentMileage: 72000,
    dueServices: [
      { name: 'Oil & filter change', intervalMiles: 5000, lastServiceMiles: 65000, overdueBy: 2000 },
      { name: 'Tire rotation', intervalMiles: 7500, lastServiceMiles: 60000, overdueBy: 4500 },
      { name: 'Brake fluid flush', intervalMiles: 30000, lastServiceMiles: null, overdueBy: 42000 },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0a1628', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const card = { backgroundColor: '#f1f5f9', borderLeft: '4px solid #3aa6e0', padding: '16px 20px', margin: '20px 0', borderRadius: '4px' }
const detail = { fontSize: '14px', color: '#0a1628', margin: '6px 0', lineHeight: '1.5' }
const button = { backgroundColor: '#3aa6e0', color: '#ffffff', padding: '12px 22px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', display: 'inline-block', margin: '8px 0 16px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8' }
