import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { subject?: string; body?: string }

const FleetOutreachEmail = ({ subject, body }: Props) => {
  const paragraphs = (body ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  return (
    <Html lang="en">
      <Head />
      <Preview>{subject ?? 'Keeping your work trucks on the road'}</Preview>
      <Body style={main}>
        <Container style={container}>
          {paragraphs.map((p, i) => (
            <Text key={i} style={text}>
              {p.split('\n').map((line, j, arr) => (
                <React.Fragment key={j}>{line}{j < arr.length - 1 && <br />}</React.Fragment>
              ))}
            </Text>
          ))}
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: FleetOutreachEmail,
  subject: (d: Record<string, any>) => (d?.subject as string) || 'Keeping your work trucks on the road',
  displayName: 'Fleet outreach',
  previewData: { subject: 'Keeping your vans on the road', body: 'Hi Acme Plumbing team,\n\nWe bring the shop to your yard.\n\n— Mike' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
