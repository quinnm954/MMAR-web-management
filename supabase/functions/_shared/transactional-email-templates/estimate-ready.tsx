import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text, Section } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandHeader, BrandCard, BrandFooter } from './_brand.tsx'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props { name?: string; estimateNumber?: string; total?: string; approvalUrl?: string; accountUrl?: string }

const EstimateReadyEmail = ({ name, estimateNumber, total, approvalUrl, accountUrl }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Your estimate is ready — review and approve online</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <BrandCard>
        <Text style={eyebrow}>ESTIMATE READY</Text>
        <Heading style={h1}>Your estimate is ready</Heading>
        <Text style={text}>{name ? `Hi ${name},` : 'Hi there,'}</Text>
        <Text style={text}>We've prepared your estimate. Review the details, ask questions, or approve the work securely online.</Text>
        <Section style={summary}>
          {estimateNumber && <Text style={label}>ESTIMATE</Text>}
          {estimateNumber && <Text style={estimateValue}>{estimateNumber}</Text>}
          {total && <Text style={label}>ESTIMATED TOTAL</Text>}
          {total && <Text style={totalValue}>{total}</Text>}
        </Section>
        {approvalUrl && (
          <Section style={actionWrap}>
            <Button href={approvalUrl} style={button}>Review &amp; Approve Estimate</Button>
          </Section>
        )}
        {accountUrl && (
          <Section style={accountBox}>
            <Text style={accountTitle}>Your service account is ready</Text>
            <Text style={detail}>View approvals, invoices, vehicles, and maintenance history in one place. No password is needed for this secure link.</Text>
            <Button href={accountUrl} style={secondaryButton}>Open My Account</Button>
          </Section>
        )}
        <Text style={help}>Questions about the estimate? Call or text us at <strong>813-501-7572</strong>.</Text>
      </BrandCard>
      <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EstimateReadyEmail,
  subject: (d: any) => d.estimateNumber ? `Estimate ${d.estimateNumber} from ${SITE_NAME}` : `Your estimate from ${SITE_NAME}`,
  displayName: 'Estimate ready',
  previewData: { name: 'Alex', estimateNumber: 'EST-20260507-A1B2', total: '$425.00', approvalUrl: 'https://example.com/estimate/abc' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0 }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px 12px' }
const eyebrow = { color: '#167caf', fontSize: '11px', lineHeight: '16px', fontWeight: 800, margin: '0 0 8px' }
const h1 = { fontSize: '27px', lineHeight: '34px', fontWeight: 800, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '16px', color: '#334155', lineHeight: '25px', margin: '0 0 16px' }
const summary = { backgroundColor: '#f8fafc', border: '1px solid #dbe3eb', borderLeft: '4px solid #38aee8', padding: '18px 20px', margin: '22px 0' }
const label = { fontSize: '10px', lineHeight: '14px', color: '#64748b', fontWeight: 700, margin: '0 0 3px' }
const estimateValue = { fontSize: '14px', lineHeight: '20px', color: '#334155', margin: '0 0 14px' }
const totalValue = { fontSize: '28px', lineHeight: '34px', color: '#0f172a', fontWeight: 800, margin: 0 }
const detail = { fontSize: '14px', color: '#475569', lineHeight: '22px', margin: '0 0 14px' }
const actionWrap = { margin: '24px 0', textAlign: 'center' as const }
const button = { backgroundColor: '#168fca', color: '#ffffff', padding: '14px 24px', borderRadius: '5px', fontWeight: 700, textDecoration: 'none', fontSize: '15px', display: 'block', textAlign: 'center' as const }
const accountBox = { backgroundColor: '#fffbeb', border: '1px solid #e5b72c', padding: '18px 20px', margin: '20px 0 24px' }
const accountTitle = { color: '#0f172a', fontSize: '16px', lineHeight: '22px', fontWeight: 700, margin: '0 0 6px' }
const secondaryButton = { backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 20px', borderRadius: '5px', fontWeight: 700, textDecoration: 'none', fontSize: '14px', display: 'inline-block' }
const help = { fontSize: '14px', color: '#475569', lineHeight: '22px', margin: '24px 0 0' }
