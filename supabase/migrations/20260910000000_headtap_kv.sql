-- Spotify tokens must only be accessible through the service-role backend.
create table if not exists public.kv_store_a9c438e5 (
  key text primary key,
  value jsonb not null
);
alter table public.kv_store_a9c438e5 enable row level security;
revoke all on table public.kv_store_a9c438e5 from anon, authenticated;
grant all on table public.kv_store_a9c438e5 to service_role;
