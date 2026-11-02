type ReadClient = { from: (table: string) => any };

export const NOTIFICATIONS_CLEARED_EVENT = 'ga-notifications-cleared';

/** Clear only communications received before the user pressed Clear. */
export async function clearCommunicationUnread(client: ReadClient, before: string) {
  const results = await Promise.all([
    client.from('call_logs').update({ read_at: before }).is('read_at', null).lte('created_at', before),
    client.from('sms_threads').update({ unread_count: 0 }).gt('unread_count', 0).lte('last_message_at', before),
    client.from('inbound_messages').update({ read_at: before }).is('read_at', null).lte('received_at', before),
  ]);
  const failed = results.find(result => result.error);
  if (failed) throw failed.error;
}