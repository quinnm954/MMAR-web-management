import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandHeader, BrandCard, BrandFooter } from './_brand.tsx'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props { customerName?: string }

const ReviewRequestEmail = ({ customerName }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>How did we do?</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <BrandCard>
          <Heading style={h1}>How did we do?</Heading>
          <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>
          <Text style={text}>
            Thanks for trusting {SITE_NAME} with your vehicle. If we did a good job, a quick Google review helps other drivers find a mechanic who comes to them. It takes about 30 seconds.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={'https://mikesmautorepair.com/review'} style={button}>Leave a review</Button>
          </Section>
          <Text style={text}>Questions? Call or text <strong>813-501-7572</strong>.</Text>
          <Hr style={hr} />
          <Text style={footer}>— The {SITE_NAME} Team</Text>
        </BrandCard>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ReviewRequestEmail,
  subject: `How did we do? — ${SITE_NAME}`,
  displayName: 'Review request',
  previewData: { customerName: 'Alex' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const button = { backgroundColor: '#3ba7e6', color: '#ffffff', padding: '12px 22px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const footer = { fontSize: '13px', color: '#64748b' }
