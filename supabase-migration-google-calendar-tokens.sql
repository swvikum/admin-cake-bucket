-- Run in Supabase SQL Editor once.
-- Stores OAuth refresh_token (and access_token cache) for Google Calendar API.
-- Service role / sync job reads this to call Calendar API.

create table if not exists public.google_calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- One row is enough (single “business” calendar connection).
-- RLS: only backend (service_role) should read/write; restrict public.
alter table public.google_calendar_tokens enable row level security;

create policy "no_public_access"
  on public.google_calendar_tokens
  for all
  using (false)
  with check (false);

comment on table public.google_calendar_tokens is 'OAuth tokens for Google Calendar API; used by sync job via service_role';
