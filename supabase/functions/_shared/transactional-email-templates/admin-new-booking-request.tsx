import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props {
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  serviceType?: string
  vehicle?: string
  requestedDate?: string
  requestedTimeWindow?: string
  serviceAddress?: string
  description?: string
  source?: string
  adminUrl?: string
}

const AdminNewBookingRequestEmail = ({
  customerName, customerPhone, customerEmail, serviceType, vehicle,
  requestedDate, requestedTimeWindow, serviceAddress, description, source, adminUrl,
}: Props) => (
  <Html lang="en">
    <Head />
    <Preview>New booking request from {customerName ?? 'a customer'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔔 New Booking Request</Heading>
        <Text style={text}>
          A new request just came in{source ? ` via ${source}` : ''}.
        </Text>
        <Section style={card}>
          {customerName && <Text style={detail}><strong>Customer:</strong> {customerName}</Text>}
          {customerPhone && <Text style={detail}><strong>Phone:</strong> {customerPhone}</Text>}
          {customerEmail && <Text style={detail}><strong>Email:</strong> {customerEmail}</Text>}
          {serviceType && <Text style={detail}><strong>Service:</strong> {serviceType}</Text>}
          {vehicle && <Text style={detail}><strong>Vehicle:</strong> {vehicle}</Text>}
          {requestedDate && <Text style={detail}><strong>Preferred date:</strong> {requestedDate}</Text>}
          {requestedTimeWindow && <Text style={detail}><strong>Time window:</strong> {requestedTimeWindow}</Text>}
          {serviceAddress && <Text style={detail}><strong>Address:</strong> {serviceAddress}</Text>}
          {description && <Text style={detail}><strong>Notes:</strong> {description}</Text>}
        </Section>
        {adminUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={adminUrl} style={button}>Open in admin</Button>
          </Section>
        )}
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME} · Internal notification</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminNewBookingRequestEmail,
  subject: (d: Record<string, any>) => `New booking request${d?.customerName ? ` — ${d.customerName}` : ''}`,
  displayName: 'Admin: new booking request',
  previewData: {
    customerName: 'Alex Diaz',
    customerPhone: '(813) 555-0190',
    customerEmail: 'alex@example.com',
    serviceType: 'Brake inspection',
    vehicle: '2018 Honda Civic',
    requestedDate: 'May 20, 2026',
    requestedTimeWindow: 'Morning (8am – 12pm)',
    serviceAddress: 'Fort Myers, FL',
    description: 'Squeaking when braking from 35mph.',
    source: 'in_app',
    adminUrl: 'https://shop-flow-home.lovable.app/admin/bookings',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0a1628', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const card = { backgroundColor: '#f1f5f9', borderLeft: '4px solid #3aa6e0', padding: '16px 20px', margin: '20px 0', borderRadius: '4px' }
const detail = { fontSize: '14px', color: '#0a1628', margin: '4px 0' }
const button = { backgroundColor: '#3aa6e0', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const }
