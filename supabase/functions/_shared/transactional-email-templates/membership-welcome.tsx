import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props {
  customerName?: string
  planName?: string
  portalUrl?: string
}

const MembershipWelcomeEmail = ({ customerName, planName, portalUrl }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Welcome to MMAR Care</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to MMAR Care!</Heading>
        <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>
        <Text style={text}>
          Thanks for joining MMAR Care{planName ? ` on the ${planName} plan` : ''}. Your membership is active and your vehicle is in great hands with {SITE_NAME}.
        </Text>
        <Section style={card}>
          <Text style={detail}>✓ Priority scheduling</Text>
          <Text style={detail}>✓ Member-only pricing</Text>
          <Text style={detail}>✓ Service history at your fingertips</Text>
        </Section>
        {portalUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={portalUrl} style={button}>Go to Your Portal</Button>
          </Section>
        )}
        <Text style={text}>Questions? Call or text <strong>813-501-7572</strong> any time.</Text>
        <Hr style={hr} />
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MembershipWelcomeEmail,
  subject: 'Welcome to MMAR Care',
  displayName: 'Membership welcome',
  previewData: {
    customerName: 'Alex',
    planName: 'Full Care',
    portalUrl: 'https://shop-flow-home.lovable.app/portal',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0a1628', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const card = { backgroundColor: '#f1f5f9', borderLeft: '4px solid #f4c430', padding: '16px 20px', margin: '20px 0', borderRadius: '4px' }
const detail = { fontSize: '14px', color: '#0a1628', margin: '6px 0' }
const button = { backgroundColor: '#3aa6e0', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', fontSize: '15px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8' }
