import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props {
  customerName?: string
  serviceType?: string
  vehicle?: string
  notes?: string
}

const ServiceCompletedEmail = ({ customerName, serviceType, vehicle, notes }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Your service with {SITE_NAME} is complete</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Service Completed</Heading>
        <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>
        <Text style={text}>
          Good news — your service is complete. Thank you for trusting {SITE_NAME}.
        </Text>
        <Section style={card}>
          {serviceType && <Text style={detail}><strong>Service:</strong> {serviceType}</Text>}
          {vehicle && <Text style={detail}><strong>Vehicle:</strong> {vehicle}</Text>}
          {notes && <Text style={detail}><strong>Notes:</strong> {notes}</Text>}
        </Section>
        <Text style={text}>
          If you have any questions, call or text us at <strong>813-501-7572</strong>. We'd also love a Google review!
        </Text>
        <Hr style={hr} />
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ServiceCompletedEmail,
  subject: 'Your service is complete',
  displayName: 'Service completed',
  previewData: {
    customerName: 'Alex',
    serviceType: 'Brake pad replacement',
    vehicle: '2018 Honda Civic',
    notes: 'Replaced front pads and rotors. Recommend tire rotation in 3,000 miles.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0a1628', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const card = { backgroundColor: '#f1f5f9', borderLeft: '4px solid #3aa6e0', padding: '16px 20px', margin: '20px 0', borderRadius: '4px' }
const detail = { fontSize: '14px', color: '#0a1628', margin: '4px 0' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8' }
