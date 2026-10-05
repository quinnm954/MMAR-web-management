import * as React from 'npm:react@18.3.1'
import { Link, Section, Text, Img } from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://mikesmautorepair.com/mmar-logo.jpeg'

export const BrandHeader = ({ tag = 'MOBILE AUTO REPAIR' }: { tag?: string }) => (
  <Section style={header}>
    <Img src={LOGO_URL} width="104" alt="MMAR" style={logo} />
    <Text style={brand}>MMAR</Text>
    <Text style={name}>Mike's Mobile Auto Repair</Text>
    <Text style={tagline}>{tag}</Text>
  </Section>
)

export const BrandCard = ({ children }: { children: React.ReactNode }) => (
  <Section style={card}>{children}</Section>
)

const header = { backgroundColor: '#0f172a', borderTop: '4px solid #38aee8', padding: '22px 28px 20px', textAlign: 'center' as const }
const logo = { display: 'block', width: '104px', height: '60px', objectFit: 'cover' as const, margin: '0 auto 12px', borderRadius: '4px' }
const brand = { color: '#ffffff', fontSize: '28px', lineHeight: '32px', fontWeight: 800, letterSpacing: '0', margin: '0' }
const name = { color: '#cbd5e1', fontSize: '13px', lineHeight: '20px', fontWeight: 600, margin: '3px 0 0' }
const tagline = { color: '#e5b72c', fontSize: '10px', lineHeight: '16px', fontWeight: 700, margin: '10px 0 0' }
const card = { backgroundColor: '#ffffff', border: '1px solid #dbe3eb', borderTop: 'none', padding: '30px 28px 28px' }

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

const footWrap = { backgroundColor: '#f8fafc', border: '1px solid #dbe3eb', borderTop: 'none', padding: '20px 20px 22px', textAlign: 'center' as const }
const footLine = { fontSize: '13px', lineHeight: '20px', color: '#475569', margin: '0 0 6px' }
const footLink = { color: '#167caf', textDecoration: 'underline', fontWeight: 700 }
const footSmall = { fontSize: '11px', lineHeight: '18px', color: '#64748b', margin: '8px 0 0' }
