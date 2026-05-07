import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props { name?: string; estimateNumber?: string; total?: string; approvalUrl?: string }

const EstimateReadyEmail = ({ name, estimateNumber, total, approvalUrl }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Your estimate is ready — review and approve online</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Estimate is Ready</Heading>
        <Text style={text}>{name ? `Hi ${name},` : 'Hi there,'}</Text>
        <Text style={text}>We've prepared estimate <strong>{estimateNumber || ''}</strong> for your review.</Text>
        {total && (
          <Section style={card}>
            <Text style={detail}><strong>Total:</strong> {total}</Text>
          </Section>
        )}
        {approvalUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={approvalUrl} style={button}>Review & Approve</Button>
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
  component: EstimateReadyEmail,
  subject: (d: any) => d.estimateNumber ? `Estimate ${d.estimateNumber} from ${SITE_NAME}` : `Your estimate from ${SITE_NAME}`,
  displayName: 'Estimate ready',
  previewData: { name: 'Alex', estimateNumber: 'EST-20260507-A1B2', total: '$425.00', approvalUrl: 'https://example.com/estimate/abc' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0a1628', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const card = { backgroundColor: '#f1f5f9', borderLeft: '4px solid #3aa6e0', padding: '16px 20px', margin: '20px 0', borderRadius: '4px' }
const detail = { fontSize: '14px', color: '#0a1628', margin: '4px 0' }
const button = { backgroundColor: '#3aa6e0', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', fontSize: '15px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8' }
