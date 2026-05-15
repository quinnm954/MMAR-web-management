import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props {
  customerName?: string
  serviceType?: string
  vehicle?: string
  requestedDate?: string
  requestedTimeWindow?: string
  serviceAddress?: string
}

const BookingRequestReceivedEmail = ({
  customerName, serviceType, vehicle, requestedDate, requestedTimeWindow, serviceAddress,
}: Props) => (
  <Html lang="en">
    <Head />
    <Preview>We got your request — {SITE_NAME} will text you to confirm.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Request Received</Heading>
        <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>
        <Text style={text}>
          Thanks for reaching out to {SITE_NAME}. We've received your request and a team member will text you shortly to confirm a day and time.
        </Text>
        <Section style={card}>
          {serviceType && <Text style={detail}><strong>Service:</strong> {serviceType}</Text>}
          {vehicle && <Text style={detail}><strong>Vehicle:</strong> {vehicle}</Text>}
          {requestedDate && <Text style={detail}><strong>Preferred date:</strong> {requestedDate}</Text>}
          {requestedTimeWindow && <Text style={detail}><strong>Time window:</strong> {requestedTimeWindow}</Text>}
          {serviceAddress && <Text style={detail}><strong>Address:</strong> {serviceAddress}</Text>}
        </Section>
        <Text style={text}>
          Need to update anything? Call or text us at <strong>813-501-7572</strong>.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingRequestReceivedEmail,
  subject: `We got your request — ${SITE_NAME}`,
  displayName: 'Booking request received',
  previewData: {
    customerName: 'Alex',
    serviceType: 'Brake inspection',
    vehicle: '2018 Honda Civic',
    requestedDate: 'May 20, 2026',
    requestedTimeWindow: 'Morning (8am – 12pm)',
    serviceAddress: 'Fort Myers, FL',
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
