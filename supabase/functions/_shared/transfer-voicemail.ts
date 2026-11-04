export const escapeVoiceXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Screening must be accepted by Mike; his carrier voicemail answering is not acceptance. */
export function transferNeedsVoicemail(status: string, accepted: boolean): boolean {
  return !(['completed', 'answered'].includes(status) && accepted);
}

export function standardVoicemailXml(base: string, greeting: string): string {
  const callback = (name: string) => escapeVoiceXml(`${base}/${name}`);
  return `<Response><Say voice="alice">${escapeVoiceXml(greeting)}</Say>` +
    `<Record maxLength="120" playBeep="true" action="${callback('ai-receptionist?action=voicemail_done')}" method="POST" recordingStatusCallback="${callback('twilio-voice-recording')}" recordingStatusCallbackMethod="POST" transcribe="true" transcribeCallback="${callback('twilio-voice-transcription')}"/>` +
    `<Hangup/></Response>`;
}

export function screenedTransferXml(base: string, token: string, sid: string, forward: string): string {
  const whisper = escapeVoiceXml(`${base}/ai-receptionist?action=whisper&token=${encodeURIComponent(token)}&parent_call_sid=${encodeURIComponent(sid)}`);
  const complete = escapeVoiceXml(`${base}/ai-receptionist?action=transfer_complete`);
  return `<Response><Say voice="alice">Connecting you to Mike now.</Say>` +
    `<Dial timeout="25" answerOnBridge="true" callerId="+18135017572" action="${complete}" method="POST"><Number url="${whisper}">${escapeVoiceXml(forward)}</Number></Dial></Response>`;
}