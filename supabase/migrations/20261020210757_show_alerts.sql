-- Spotify sessions are verified by the Edge Function, not Supabase Auth JWTs.
-- No browser role can read device endpoints or listening preferences.
create table public.headtap_show_alerts (
  id text primary key,
  owner_id text not null,
  subscription jsonb not null,
  preferences jsonb not null,
  app_origin text not null,
  enabled boolean not null default true,
  seen_ids jsonb not null default '[]'::jsonb,
  latest_matches jsonb not null default '[]'::jsonb,
  last_sent_at timestamptz,
  last_checked_at timestamptz,
  next_check_at timestamptz not null default now(),
  last_error text,
  coverage_limited boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.headtap_show_alerts enable row level security;
revoke all on public.headtap_show_alerts from public, anon, authenticated;
grant select, insert, update, delete on public.headtap_show_alerts to service_role;
create index headtap_show_alerts_due_idx on public.headtap_show_alerts (next_check_at) where enabled;
create index headtap_show_alerts_owner_idx on public.headtap_show_alerts (owner_id);
