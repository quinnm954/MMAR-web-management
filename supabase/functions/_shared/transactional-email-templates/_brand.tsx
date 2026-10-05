import * as React from 'npm:react@18.3.1'
import { Link, Section, Text, Img } from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://mikesmautorepair.com/__l5e/assets-v1/5b5c6d68-8a7d-4ec8-92f0-7c3c4fd0d096/mmar-logo.png'

export const BrandHeader = ({ tag = 'MOBILE AUTO REPAIR' }: { tag?: string }) => (
  <Section style={header}>
    <Img src={LOGO_URL} width="156" height="156" alt="Mike's Mobile Auto Repair" style={logo} />
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Rubik+Wet+Paint&family=Bangers&display=swap');`}</style>
    <Text style={brand}><span style={{ color: '#f1ead8' }}>MM</span><span style={{ color: '#2fa8ec' }}>AR</span></Text>
    <Text style={name}><span style={{ color: '#f1ead8' }}>Mike's </span><span style={{ color: '#2fa8ec' }}>Mobile </span><span style={{ color: '#e5b72c' }}>Auto Repair</span></Text>
    <Text style={tagline}>{tag}</Text>
  </Section>
)

export const BrandCard = ({ children }: { children: React.ReactNode }) => (
  <Section style={card}>{children}</Section>
)

const header = { backgroundColor: '#0f172a', borderTop: '4px solid #38aee8', padding: '22px 28px 20px', textAlign: 'center' as const }
const logo = { display: 'block', width: '156px', height: '156px', objectFit: 'contain' as const, margin: '0 auto 10px' }
const brand = { fontFamily: "'Rubik Wet Paint', Impact, 'Arial Black', sans-serif", color: '#ffffff', fontSize: '40px', lineHeight: '44px', fontWeight: 400, letterSpacing: '0', margin: '0' }
const name = { fontFamily: "Bangers, Impact, 'Arial Black', sans-serif", color: '#cbd5e1', fontSize: '22px', lineHeight: '26px', fontWeight: 400, letterSpacing: '1px', textTransform: 'uppercase' as const, margin: '3px 0 0' }
const tagline = { fontFamily: "Bangers, Impact, 'Arial Black', sans-serif", letterSpacing: '2px', color: '#e5b72c', fontSize: '10px', lineHeight: '16px', fontWeight: 700, margin: '10px 0 0' }
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
