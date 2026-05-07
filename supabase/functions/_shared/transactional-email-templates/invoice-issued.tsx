import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"

interface Props {
  customerName?: string
  invoiceNumber?: string
  total?: string
  dueDate?: string
  invoiceUrl?: string
}

const InvoiceIssuedEmail = ({ customerName, invoiceNumber, total, dueDate, invoiceUrl }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>New invoice from {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Invoice</Heading>
        <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>
        <Text style={text}>A new invoice from {SITE_NAME} is ready for you.</Text>
        <Section style={card}>
          {invoiceNumber && <Text style={detail}><strong>Invoice #:</strong> {invoiceNumber}</Text>}
          {total && <Text style={detail}><strong>Total:</strong> {total}</Text>}
          {dueDate && <Text style={detail}><strong>Due:</strong> {dueDate}</Text>}
        </Section>
        {invoiceUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={invoiceUrl} style={button}>View & Pay Invoice</Button>
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
  component: InvoiceIssuedEmail,
  subject: (d: any) => d.invoiceNumber ? `Invoice ${d.invoiceNumber} from ${SITE_NAME}` : `New invoice from ${SITE_NAME}`,
  displayName: 'Invoice issued',
  previewData: {
    customerName: 'Alex',
    invoiceNumber: 'INV-20260507-A1B2C3',
    total: '$285.00',
    dueDate: 'May 21, 2026',
    invoiceUrl: 'https://shop-flow-home.lovable.app/portal/invoices',
  },
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
