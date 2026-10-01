import * as React from 'npm:react@18.3.1'
import { Section, Text } from 'npm:@react-email/components@0.0.22'

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
