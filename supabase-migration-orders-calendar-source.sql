-- Run in Supabase SQL Editor once.
-- Adds a column to link orders to Google Calendar events so the daily sync can avoid duplicates.

alter table public.orders
  add column if not exists source_calendar_event_id text;

comment on column public.orders.source_calendar_event_id is 'Google Calendar event id; used by calendar sync to avoid duplicate orders';

create unique index if not exists idx_orders_source_calendar_event_id
  on public.orders (source_calendar_event_id)
  where source_calendar_event_id is not null;
