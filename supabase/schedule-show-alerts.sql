-- Run after the migration, function deployment and secrets setup.
-- Store these two values in Supabase Vault first (Dashboard → Vault):
-- headtap_project_url: https://<project-ref>.supabase.co
-- headtap_show_alerts_cron_secret: same value as SHOW_ALERTS_CRON_SECRET
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('headtap-show-alerts', '* * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'headtap_project_url') || '/functions/v1/show-alerts/run',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'headtap_show_alerts_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
$$);
-- Each invocation claims at most two due devices. Each device is checked no more
-- than hourly. Capacity: 120 devices/hour; use a queue before scaling beyond this.
