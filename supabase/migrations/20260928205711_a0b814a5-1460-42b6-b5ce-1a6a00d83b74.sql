CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
SELECT cron.schedule('prospect-email-worker-hourly', '7 * * * *', $$
  SELECT net.http_post(
    url := 'https://owgpxujfytskdfmrhjgk.supabase.co/functions/v1/prospect-email-worker',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
$$);