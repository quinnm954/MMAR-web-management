import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandHeader, BrandCard, BrandFooter } from './_brand.tsx'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props { customerName?: string }

const MissedCallFollowupEmail = ({ customerName }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Sorry we missed your call — here's how to reach us fast.</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <BrandCard>
          <Heading style={h1}>Sorry we missed you</Heading>
          <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>
          <Text style={text}>
            We saw your call to {SITE_NAME} and couldn't get to it. Mike will follow up shortly.
            If it's easier, text us at <strong>813-501-7572</strong> or book a time online and we'll come to you.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href="https://mikesmautorepair.com/book" style={button}>Book a time</Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>— The {SITE_NAME} Team</Text>
        </BrandCard>
      <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MissedCallFollowupEmail,
  subject: `Sorry we missed your call — ${SITE_NAME}`,
  displayName: 'Missed call follow-up',
  previewData: { customerName: 'Alex' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const button = { backgroundColor: '#3ba7e6', color: '#ffffff', padding: '12px 22px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const footer = { fontSize: '13px', color: '#64748b' }
