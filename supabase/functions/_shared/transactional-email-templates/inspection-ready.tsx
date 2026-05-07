import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props { name?: string; vehicle?: string; reportUrl?: string }

const InspectionReadyEmail = ({ name, vehicle, reportUrl }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Your vehicle inspection report is ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Inspection Report Ready</Heading>
        <Text style={text}>{name ? `Hi ${name},` : 'Hi there,'}</Text>
        <Text style={text}>We've completed the inspection on your <strong>{vehicle || 'vehicle'}</strong>. View the full report — including photos and recommendations — using the button below.</Text>
        {reportUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={reportUrl} style={button}>View Inspection Report</Button>
          </Section>
        )}
        <Text style={text}>Questions? Call or text <strong>813-501-7572</strong>.</Text>
        <Hr style={hr} />
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InspectionReadyEmail,
  subject: `Your vehicle inspection report from ${SITE_NAME}`,
  displayName: 'Inspection ready',
  previewData: { name: 'Alex', vehicle: '2018 Toyota Camry', reportUrl: 'https://example.com/inspection/abc' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0a1628', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#3aa6e0', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', fontSize: '15px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8' }
