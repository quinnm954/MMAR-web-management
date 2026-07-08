import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props {
  technicianName?: string
  assignedByName?: string
  customerName?: string
  customerPhone?: string
  serviceType?: string
  vehicle?: string
  scheduledAt?: string
  serviceAddress?: string
  description?: string
  jobsUrl?: string
}

const TechJobAssignedEmail = ({
  technicianName, assignedByName, customerName, customerPhone,
  serviceType, vehicle, scheduledAt, serviceAddress, description, jobsUrl,
}: Props) => (
  <Html lang="en">
    <Head />
    <Preview>New job assigned{serviceType ? ` — ${serviceType}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔧 New Job Assigned</Heading>
        <Text style={text}>
          {technicianName ? `Hey ${technicianName},` : 'Hey there,'} you've been assigned a new job
          {assignedByName ? ` by ${assignedByName}` : ''}.
        </Text>
        <Section style={card}>
          {serviceType && <Text style={detail}><strong>Service:</strong> {serviceType}</Text>}
          {vehicle && <Text style={detail}><strong>Vehicle:</strong> {vehicle}</Text>}
          {customerName && <Text style={detail}><strong>Customer:</strong> {customerName}</Text>}
          {customerPhone && <Text style={detail}><strong>Phone:</strong> {customerPhone}</Text>}
          {scheduledAt && <Text style={detail}><strong>Scheduled:</strong> {scheduledAt}</Text>}
          {serviceAddress && <Text style={detail}><strong>Address:</strong> {serviceAddress}</Text>}
          {description && <Text style={detail}><strong>Notes:</strong> {description}</Text>}
        </Section>
        {jobsUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={jobsUrl} style={button}>Open job</Button>
          </Section>
        )}
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME} · Technician notification</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TechJobAssignedEmail,
  subject: (d: Record<string, any>) =>
    `New job assigned${d?.serviceType ? ` — ${d.serviceType}` : ''}${d?.vehicle ? ` (${d.vehicle})` : ''}`,
  displayName: 'Tech: job assigned',
  previewData: {
    technicianName: 'Jordan',
    assignedByName: 'Mike',
    customerName: 'Alex Diaz',
    customerPhone: '(813) 555-0190',
    serviceType: 'Brake pad replacement',
    vehicle: '2018 Honda Civic',
    scheduledAt: 'May 20, 2026 · 9:00 AM',
    serviceAddress: 'Fort Myers, FL',
    description: 'Front pads squeaking, customer available all morning.',
    jobsUrl: 'https://shop-flow-home.lovable.app/tech/jobs',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0a1628', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const card = { backgroundColor: '#f1f5f9', borderLeft: '4px solid #eab308', padding: '16px 20px', margin: '20px 0', borderRadius: '4px' }
const detail = { fontSize: '14px', color: '#0a1628', margin: '4px 0' }
const button = { backgroundColor: '#0a1628', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const }
