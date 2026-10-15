-- Usage records are kept for 13 months (privacy notice v2), then removed.
-- Runs daily at 03:00 IST (21:30 UTC) via pg_cron. Applied live on 15 Oct 2026.
create extension if not exists pg_cron;
select cron.schedule('site-events-retention', '30 21 * * *',
  $$delete from public.site_events where created_at < now() - interval '13 months'$$);
