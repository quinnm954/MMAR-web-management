import { expect, test } from 'bun:test';
import { screenedTransferXml, standardVoicemailXml, transferNeedsVoicemail } from '../supabase/functions/_shared/transfer-voicemail.ts';

test('unanswered and declined receptionist transfers go to standard voicemail', () => {
  for (const status of ['no-answer', 'busy', 'failed', 'canceled']) {
    expect(transferNeedsVoicemail(status, false)).toBe(true);
  }
});
test('a carrier answering without Mike accepting still goes to voicemail', () => {
  expect(transferNeedsVoicemail('completed', false)).toBe(true);
  expect(transferNeedsVoicemail('answered', false)).toBe(true);
});
test('accepted, completed transfers hang up instead of asking for voicemail', () => {
  expect(transferNeedsVoicemail('completed', true)).toBe(false);
  expect(transferNeedsVoicemail('answered', true)).toBe(false);
});
test('voicemail uses existing transcript callbacks and explicit finish action, not the AI', () => {
  const xml = standardVoicemailXml('https://example.test/functions/v1', 'Leave a message');
  expect(xml).toContain('maxLength="120"');
  expect(xml).toContain('playBeep="true"');
  expect(xml).toContain('transcribe="true"');
  expect(xml).toContain('/twilio-voice-recording');
  expect(xml).toContain('/twilio-voice-transcription');
  expect(xml).toContain('action=voicemail_done');
  expect(xml).not.toContain('<Dial');
});
test('screened transfer has a signed-provider completion callback and original call identity', () => {
  const xml = screenedTransferXml('https://example.test/functions/v1', 'test-token', 'CA123', '+15555550100');
  expect(xml).toContain('action=transfer_complete');
  expect(xml).toContain('parent_call_sid=CA123');
  expect(xml).toContain('answerOnBridge="true"');
});