import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandHeader, BrandCard, BrandFooter } from './_brand.tsx'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props { customerName?: string; estimateNumber?: string; total?: string; approvalUrl?: string; final?: boolean }

const EstimateReminderEmail = ({ customerName, estimateNumber, total, approvalUrl, final }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Your estimate is ready when you are</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <BrandCard>
          <Heading style={h1}>{final ? 'Still want us to take care of it?' : 'Your estimate is waiting'}</Heading>
          <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>
          <Text style={text}>
            {final
              ? `Just checking in one last time about estimate ${estimateNumber || ''}${total ? ` (${total})` : ''}. Approve it online and we'll get you on the schedule at the earliest open time.`
              : `Your estimate ${estimateNumber || ''}${total ? ` for ${total}` : ''} is ready to review. You can approve the whole thing or just the items you want, and we'll come to you.`}
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={approvalUrl || 'https://mikesmautorepair.com/portal/estimates'} style={button}>Review & approve</Button>
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
  component: EstimateReminderEmail,
  subject: (d: Props) => d.final ? `Last check-in on your estimate — ${SITE_NAME}` : `Your estimate is waiting — ${SITE_NAME}`,
  displayName: 'Estimate follow-up',
  previewData: { customerName: 'Alex', estimateNumber: 'EST-1042', total: '$385.00', approvalUrl: 'https://mikesmautorepair.com/estimate/abc', final: false },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const button = { backgroundColor: '#3ba7e6', color: '#ffffff', padding: '12px 22px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const footer = { fontSize: '13px', color: '#64748b' }
