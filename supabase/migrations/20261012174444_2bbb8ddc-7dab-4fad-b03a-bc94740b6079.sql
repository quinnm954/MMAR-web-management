create table public.ad_conversion_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('phone_call','text_click','quote_submit','lead')),
  from_google_ad boolean not null default false,
  gclid text,
  utm_source text,
  utm_campaign text,
  landing_page text,
  page_path text,
  created_at timestamptz not null default now()
);
alter table public.ad_conversion_events enable row level security;
grant insert on public.ad_conversion_events to anon, authenticated;
grant select on public.ad_conversion_events to authenticated;
create policy "anyone logs conversion" on public.ad_conversion_events for insert to anon, authenticated
  with check (char_length(coalesce(gclid,'')) <= 300 and char_length(coalesce(page_path,'')) <= 500 and char_length(coalesce(landing_page,'')) <= 500 and char_length(coalesce(utm_campaign,'')) <= 200 and char_length(coalesce(utm_source,'')) <= 100);
create policy "admins read conversions" on public.ad_conversion_events for select to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));
create index on public.ad_conversion_events (created_at desc);