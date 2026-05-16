import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"
const PHONE = '813-501-7572'

interface Props {
  customerName?: string
  vehicle?: string
  checklistUrl?: string
}

const MaintenanceChecklistReminderEmail = ({ customerName, vehicle, checklistUrl }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Take 60 seconds to tell us what's already been done on your {vehicle ?? 'vehicle'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Finish your maintenance checklist</Heading>
        <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>
        <Text style={text}>
          We don't have any maintenance history on file for your <strong>{vehicle ?? 'vehicle'}</strong> yet.
          Without it, we can't send you accurate reminders — or worse, we'd nag you about services you've already had done.
        </Text>
        <Section style={card}>
          <Text style={cardLabel}>One quick checklist</Text>
          <Text style={cardText}>
            Open the maintenance log, find any services that have already been performed (oil change, tires, brakes, etc.),
            and note the mileage they were done at. Takes about a minute.
          </Text>
          {checklistUrl && (
            <Button href={checklistUrl} style={button}>
              Complete my checklist
            </Button>
          )}
        </Section>
        <Text style={smallText}>
          Not sure what's been done? Skip what you don't know — even partial history helps us send smarter reminders.
          Questions? Call or text <strong>{PHONE}</strong>.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MaintenanceChecklistReminderEmail,
  subject: 'Finish your maintenance checklist (takes 1 minute)',
  displayName: 'Maintenance checklist reminder',
  previewData: {
    customerName: 'Alex',
    vehicle: '2018 Honda Civic',
    checklistUrl: 'https://mikesmautorepair.com/portal/maintenance',
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
