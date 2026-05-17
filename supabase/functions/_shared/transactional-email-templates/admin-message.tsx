import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mike's Mobile Auto Repair"
const PHONE = '813-501-7572'

interface Props {
  subject?: string
  body?: string
  customerName?: string
}

const AdminMessageEmail = ({ subject, body, customerName }: Props) => {
  const paragraphs = (body ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  return (
    <Html lang="en">
      <Head />
      <Preview>{subject ?? `A message from ${SITE_NAME}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {subject && <Heading style={h1}>{subject}</Heading>}
          {customerName && <Text style={text}>Hi {customerName},</Text>}
          {paragraphs.length === 0 ? (
            <Text style={text}>{body}</Text>
          ) : (
            paragraphs.map((p, i) => (
              <Text key={i} style={text}>
                {p.split('\n').map((line, j, arr) => (
                  <React.Fragment key={j}>
                    {line}
                    {j < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </Text>
            ))
          )}
          <Hr style={hr} />
          <Text style={footer}>
            Reply to this email or call/text <strong>{PHONE}</strong>.<br />
            — The {SITE_NAME} Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AdminMessageEmail,
  subject: (data: Record<string, any>) => (data?.subject as string) || `A message from ${SITE_NAME}`,
  displayName: 'Admin message',
  previewData: {
    subject: 'Following up on your appointment',
    body: 'Hi,\n\nJust wanted to follow up on the brake inspection from last week. Let me know if you have any questions.\n\nThanks!',
    customerName: 'Alex',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0a1628', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }
