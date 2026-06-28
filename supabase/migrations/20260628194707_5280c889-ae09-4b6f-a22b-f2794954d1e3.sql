
-- Enable pg_net for outbound HTTP from triggers
create extension if not exists pg_net with schema extensions;

-- Generic helper to call the send-push edge function from triggers
create or replace function public._send_push(
  _user_id uuid,
  _title text,
  _body text,
  _category text,
  _url text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text := 'https://owgpxujfytskdfmrhjgk.supabase.co/functions/v1/send-push';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z3B4dWpmeXRza2RmbXJoamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQ5NDMsImV4cCI6MjA4MTM5MDk0M30.6zEygmSkP74HP3J8jrzIUmnZ82pMQc0FgbG6qeo_bFc';
begin
  if _user_id is null then return; end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer '||v_key,
      'apikey', v_key
    ),
    body := jsonb_build_object(
      'user_id', _user_id,
      'title', _title,
      'body', COALESCE(_body, ''),
      'category', _category,
      'data', case when _url is not null then jsonb_build_object('url', _url) else '{}'::jsonb end
    )
  );
exception when others then
  -- never break the originating transaction because of push failure
  null;
end;
$$;

-- Helper: push to all admins/managers/owners
create or replace function public._send_push_to_staff(
  _title text, _body text, _category text, _url text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  for r in
    select distinct user_id from public.user_roles
     where role in ('owner','admin','manager')
  loop
    perform public._send_push(r.user_id, _title, _body, _category, _url);
  end loop;
end;
$$;

-- ============ Messages ============
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  t public.message_threads;
  sender_name text;
  url text;
begin
  select * into t from public.message_threads where id = NEW.thread_id;
  if not found then return NEW; end if;
  select coalesce(full_name, email, 'Someone') into sender_name from public.profiles where id = NEW.sender_id;
  url := '/messages?t='||t.id;

  -- notify customer if they're not the sender
  if t.customer_id is not null and t.customer_id <> NEW.sender_id then
    perform public._send_push(t.customer_id, 'New message from '||sender_name, left(NEW.body,140), 'message_updates', url);
  end if;
  -- notify tech if they're not the sender
  if t.tech_id is not null and t.tech_id <> NEW.sender_id then
    perform public._send_push(t.tech_id, 'New message from '||sender_name, left(NEW.body,140), 'message_updates', url);
  end if;
  -- notify staff when sender is a customer/tech (not staff)
  if not public.is_staff(NEW.sender_id) then
    perform public._send_push_to_staff('New message from '||sender_name, left(NEW.body,140), 'message_updates', url);
  end if;
  return NEW;
end $$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- ============ Estimates ============
create or replace function public.notify_estimate_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare url text;
begin
  if TG_OP = 'UPDATE' and OLD.status is not distinct from NEW.status then
    return NEW;
  end if;
  url := '/portal/estimates';
  if NEW.status = 'sent' then
    perform public._send_push(NEW.customer_id, 'New estimate ready', 'Tap to review your estimate.', 'estimate_updates', url);
  elsif NEW.status in ('approved','partially_approved','declined') then
    perform public._send_push_to_staff('Estimate '||NEW.status, 'Estimate '||coalesce(NEW.estimate_number,'')||' '||NEW.status, 'estimate_updates', '/admin/dashboard');
  end if;
  return NEW;
end $$;

drop trigger if exists trg_notify_estimate_status on public.estimates;
create trigger trg_notify_estimate_status
  after insert or update of status on public.estimates
  for each row execute function public.notify_estimate_status();

-- ============ Invoices ============
create or replace function public.notify_invoice_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare url text;
begin
  url := '/portal/invoices/'||NEW.id;
  if TG_OP = 'INSERT' then
    perform public._send_push(NEW.customer_id, 'New invoice', 'Invoice '||coalesce(NEW.invoice_number,'')||' is ready.', 'invoice_updates', url);
    return NEW;
  end if;
  if NEW.status is distinct from OLD.status then
    if NEW.status = 'paid' then
      perform public._send_push(NEW.customer_id, 'Payment received', 'Thanks! Invoice '||coalesce(NEW.invoice_number,'')||' is paid.', 'invoice_updates', url);
      perform public._send_push_to_staff('Invoice paid', 'Invoice '||coalesce(NEW.invoice_number,'')||' paid.', 'invoice_updates', '/admin/dashboard');
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_notify_invoice_status on public.invoices;
create trigger trg_notify_invoice_status
  after insert or update of status on public.invoices
  for each row execute function public.notify_invoice_status();

-- ============ Inspections ============
create or replace function public.notify_inspection_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'UPDATE' and NEW.status is not distinct from OLD.status then return NEW; end if;
  if NEW.status = 'completed' then
    perform public._send_push(NEW.customer_id, 'Inspection complete', 'Your digital inspection report is ready.', 'inspection_updates', '/portal/inspections');
  end if;
  return NEW;
end $$;

drop trigger if exists trg_notify_inspection_status on public.inspections;
create trigger trg_notify_inspection_status
  after insert or update of status on public.inspections
  for each row execute function public.notify_inspection_status();

-- ============ Appointments ============
create or replace function public.notify_appointment_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    perform public._send_push_to_staff('New appointment', coalesce(NEW.service_type,'Service'), 'appointment_reminders', '/admin/dashboard');
    return NEW;
  end if;
  if NEW.status is distinct from OLD.status then
    if NEW.status = 'confirmed' then
      perform public._send_push(NEW.customer_id, 'Appointment confirmed', coalesce(NEW.service_type,'Your appointment')||' is confirmed.', 'appointment_reminders', '/portal/appointments');
    elsif NEW.status = 'in_progress' then
      perform public._send_push(NEW.customer_id, 'Service started', 'Your tech is working on your vehicle.', 'appointment_reminders', '/portal/appointments');
    elsif NEW.status = 'completed' then
      perform public._send_push(NEW.customer_id, 'Service complete', 'Your service is done. Tap for details.', 'appointment_reminders', '/portal/service-history');
    end if;
    -- notify assigned tech when they get assigned a new active job
    if NEW.assigned_technician_id is not null
       and NEW.status in ('scheduled','in_progress')
       and (OLD.assigned_technician_id is distinct from NEW.assigned_technician_id
            or OLD.status is distinct from NEW.status) then
      perform public._send_push(NEW.assigned_technician_id, 'Job assigned', coalesce(NEW.service_type,'New job'), 'appointment_reminders', '/tech/jobs');
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_notify_appointment_status on public.appointments;
create trigger trg_notify_appointment_status
  after insert or update on public.appointments
  for each row execute function public.notify_appointment_status();
