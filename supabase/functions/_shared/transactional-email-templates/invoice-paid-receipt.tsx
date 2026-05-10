import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr, Row, Column } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"
const PHONE = '813-501-7572'

interface LineItem {
  description?: string
  quantity?: number
  unit_price?: number | string
  amount?: number | string
}

interface Props {
  customerName?: string
  invoiceNumber?: string
  paidAt?: string
  amountPaid?: string
  subtotal?: string
  discountAmount?: string
  discountReason?: string
  shopSupplies?: string
  tax?: string
  total?: string
  paymentMethod?: string
  lineItems?: LineItem[]
  invoiceUrl?: string
  vehicle?: string
}

const fmt = (v: any) => (v == null || v === '' ? '' : typeof v === 'number' ? `$${v.toFixed(2)}` : `${v}`)

const InvoicePaidReceiptEmail = ({
  customerName, invoiceNumber, paidAt, amountPaid, subtotal,
  discountAmount, discountReason, shopSupplies, tax, total,
  paymentMethod, lineItems = [], invoiceUrl, vehicle,
}: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Receipt {invoiceNumber ? `for ${invoiceNumber}` : ''} — Thank you!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={paidBanner}>
          <Text style={paidBadge}>✓ PAID</Text>
        </Section>
        <Heading style={h1}>Thank you for your payment!</Heading>
        <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>
        <Text style={text}>
          We've received your payment{amountPaid ? ` of ${amountPaid}` : ''}. Below is a copy of
          your paid invoice for your records.
        </Text>

        <Section style={card}>
          {invoiceNumber && <Text style={detail}><strong>Invoice #:</strong> {invoiceNumber}</Text>}
          {paidAt && <Text style={detail}><strong>Paid on:</strong> {paidAt}</Text>}
          {paymentMethod && <Text style={detail}><strong>Payment method:</strong> {paymentMethod}</Text>}
          {vehicle && <Text style={detail}><strong>Vehicle:</strong> {vehicle}</Text>}
        </Section>

        {lineItems.length > 0 && (
          <Section>
            <Text style={sectionLabel}>Line items</Text>
            {lineItems.map((li, i) => (
              <Row key={i} style={lineRow}>
                <Column>
                  <Text style={lineDesc}>{li.description || 'Item'}</Text>
                  {li.quantity != null && (
                    <Text style={lineMeta}>{li.quantity} × {fmt(li.unit_price)}</Text>
                  )}
                </Column>
                <Column align="right" style={{ width: '90px' }}>
                  <Text style={lineAmount}>{fmt(li.amount ?? (Number(li.quantity || 1) * Number(li.unit_price || 0)))}</Text>
                </Column>
              </Row>
            ))}
          </Section>
        )}

        <Hr style={hr} />

        <Section>
          {subtotal && (
            <Row style={totalRow}><Column><Text style={totalLabel}>Subtotal</Text></Column>
            <Column align="right"><Text style={totalValue}>{subtotal}</Text></Column></Row>
          )}
          {discountAmount && Number(String(discountAmount).replace(/[^0-9.]/g, '')) > 0 && (
            <Row style={totalRow}>
              <Column><Text style={discountLabel}>Discount{discountReason ? ` — ${discountReason}` : ''}</Text></Column>
              <Column align="right"><Text style={discountValue}>−{discountAmount}</Text></Column>
            </Row>
          )}
          {shopSupplies && Number(String(shopSupplies).replace(/[^0-9.]/g, '')) > 0 && (
            <Row style={totalRow}><Column><Text style={totalLabel}>Shop / disposal fees</Text></Column>
            <Column align="right"><Text style={totalValue}>{shopSupplies}</Text></Column></Row>
          )}
          {tax && Number(String(tax).replace(/[^0-9.]/g, '')) > 0 && (
            <Row style={totalRow}><Column><Text style={totalLabel}>Tax</Text></Column>
            <Column align="right"><Text style={totalValue}>{tax}</Text></Column></Row>
          )}
          {total && (
            <Row style={grandTotalRow}>
              <Column><Text style={grandTotalLabel}>Total paid</Text></Column>
              <Column align="right"><Text style={grandTotalValue}>{amountPaid || total}</Text></Column>
            </Row>
          )}
        </Section>

        {invoiceUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={invoiceUrl} style={button}>View invoice online</Button>
          </Section>
        )}

        <Text style={text}>
          Questions about this invoice? Call or text <strong>{PHONE}</strong> any time.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InvoicePaidReceiptEmail,
  subject: (d: any) =>
    d?.invoiceNumber
      ? `Receipt for invoice ${d.invoiceNumber} — Thank you!`
      : `Payment received — Thank you from ${SITE_NAME}`,
  displayName: 'Invoice paid receipt',
  previewData: {
    customerName: 'Alex',
    invoiceNumber: 'INV-20260507-A1B2C3',
    paidAt: 'May 10, 2026',
    amountPaid: '$280.00',
    subtotal: '$285.00',
    discountAmount: '$5.00',
    discountReason: '5-star Google review discount',
    shopSupplies: '$10.00',
    tax: '$19.95',
    total: '$309.95',
    paymentMethod: 'Card ending 4242',
    vehicle: '2018 Honda Civic',
    lineItems: [
      { description: 'Oil & filter change', quantity: 1, unit_price: 89.99, amount: 89.99 },
      { description: 'Brake inspection', quantity: 1, unit_price: 0, amount: 0 },
    ],
    invoiceUrl: 'https://shop-flow-home.lovable.app/portal/invoices',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const paidBanner = { textAlign: 'center' as const, margin: '0 0 12px' }
const paidBadge = { display: 'inline-block', backgroundColor: '#d1fae5', color: '#065f46', padding: '6px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 'bold' as const, letterSpacing: '1px', margin: 0 }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0a1628', margin: '0 0 16px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const card = { backgroundColor: '#f1f5f9', borderLeft: '4px solid #3aa6e0', padding: '16px 20px', margin: '20px 0', borderRadius: '4px' }
const detail = { fontSize: '14px', color: '#0a1628', margin: '4px 0' }
const sectionLabel = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#64748b', margin: '16px 0 8px', fontWeight: 'bold' as const }
const lineRow = { borderBottom: '1px solid #e2e8f0' }
const lineDesc = { fontSize: '14px', color: '#0a1628', margin: '8px 0 2px', fontWeight: 'bold' as const }
const lineMeta = { fontSize: '12px', color: '#64748b', margin: '0 0 8px' }
const lineAmount = { fontSize: '14px', color: '#0a1628', margin: '8px 0' }
const totalRow = { margin: '4px 0' }
const totalLabel = { fontSize: '13px', color: '#64748b', margin: 0 }
const totalValue = { fontSize: '13px', color: '#0a1628', margin: 0 }
const discountLabel = { fontSize: '13px', color: '#3aa6e0', margin: 0, fontWeight: 'bold' as const }
const discountValue = { fontSize: '13px', color: '#3aa6e0', margin: 0, fontWeight: 'bold' as const }
const grandTotalRow = { borderTop: '2px solid #0a1628', paddingTop: '8px', marginTop: '8px' }
const grandTotalLabel = { fontSize: '16px', color: '#0a1628', margin: 0, fontWeight: 'bold' as const }
const grandTotalValue = { fontSize: '18px', color: '#0a1628', margin: 0, fontWeight: 'bold' as const }
const button = { backgroundColor: '#3aa6e0', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold' as const, textDecoration: 'none', fontSize: '15px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8' }
