import * as React from 'npm:react@18.3.1'
import { Link, Section, Text } from 'npm:@react-email/components@0.0.22'

export const BrandHeader = ({ tag = 'Mobile Auto Repair · Fort Myers & Lehigh Acres' }: { tag?: string }) => (
  <Section style={header}>
    <Text style={brand}>Mike's Mobile Auto Repair</Text>
    <Text style={pill}>{tag}</Text>
  </Section>
)

export const BrandCard = ({ children }: { children: React.ReactNode }) => (
  <Section style={card}>{children}</Section>
)

const header = { backgroundColor: '#0f172a', borderRadius: '12px 12px 0 0', padding: '20px 24px' }
const brand = { color: '#ffffff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }
const pill = { display: 'inline-block', backgroundColor: '#f5b82e', color: '#0f172a', fontSize: '12px', fontWeight: 700, borderRadius: '999px', padding: '4px 12px', margin: 0 }
const card = { border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '24px' }

export const BrandFooter = () => (
  <Section style={footWrap}>
    <Text style={footLine}>
      <Link href="tel:+18135017572" style={footLink}>Call 813-501-7572</Link>{'  ·  '}
      <Link href="sms:+18135017572" style={footLink}>Text us</Link>{'  ·  '}
      <Link href="https://mikesmautorepair.com/book" style={footLink}>Book online</Link>
    </Text>
    <Text style={footLine}>
      <Link href="https://mikesmautorepair.com" style={footLink}>mikesmautorepair.com</Link>{'  ·  '}
      <Link href="mailto:mikesmarllc@gmail.com" style={footLink}>mikesmarllc@gmail.com</Link>
    </Text>
    <Text style={footSmall}>Mike's Mobile Auto Repair · 1143 Joel Blvd, Lehigh Acres, FL 33936</Text>
  </Section>
)

const footWrap = { padding: '16px 8px 0', textAlign: 'center' as const }
const footLine = { fontSize: '13px', color: '#475569', margin: '0 0 6px' }
const footLink = { color: '#1d8fd0', textDecoration: 'underline', fontWeight: 600 }
const footSmall = { fontSize: '11px', color: '#94a3b8', margin: '6px 0 0' }
