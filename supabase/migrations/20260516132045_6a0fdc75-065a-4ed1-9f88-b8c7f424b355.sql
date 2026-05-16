
DELETE FROM service_reminders_sent
WHERE status = 'failed'
  AND reminder_type IN ('mileage_email_reminder', 'checklist_email_reminder')
  AND sent_at > now() - interval '2 hours';
