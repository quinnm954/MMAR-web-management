create or replace function public.notify_staff_on_inbound_sms()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_phone text; v_name text;
begin
  if NEW.direction <> 'inbound' then return NEW; end if;
  select t.phone, p.full_name into v_phone, v_name from sms_threads t left join profiles p on p.id = t.customer_id where t.id = NEW.thread_id;
  insert into notifications (user_id, title, body, category, link)
  select distinct ur.user_id, 'New text from ' || coalesce(v_name, v_phone, 'customer'), left(NEW.body, 140), 'message_updates', '/admin/dashboard?tab=sms'
  from user_roles ur where ur.role in ('admin','owner');
  return NEW;
exception when others then return NEW;
end $$;
drop trigger if exists trg_notify_staff_on_inbound_sms on public.sms_messages;
create trigger trg_notify_staff_on_inbound_sms after insert on public.sms_messages for each row execute function public.notify_staff_on_inbound_sms();

create or replace function public.notify_staff_on_call()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if NEW.direction <> 'inbound' then return NEW; end if;
  insert into notifications (user_id, title, body, category, link)
  select distinct ur.user_id, 'Incoming call', 'From ' || coalesce(NEW.from_number, 'unknown number'), 'message_updates', '/admin/dashboard?tab=calls'
  from user_roles ur where ur.role in ('admin','owner');
  return NEW;
exception when others then return NEW;
end $$;
drop trigger if exists trg_notify_staff_on_call on public.call_logs;
create trigger trg_notify_staff_on_call after insert on public.call_logs for each row execute function public.notify_staff_on_call();