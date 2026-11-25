-- Run the supplier sync every 2 minutes (each call does a few pages; a full sync repeats every 6 hours).
-- Replace PROJECT_REF with the project's reference before running.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('supplier-sync') where exists (select 1 from cron.job where jobname = 'supplier-sync');
select cron.schedule('supplier-sync', '*/2 * * * *', $job$
  select net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/supplier-sync',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-key', (select v from public.private_config where k = 'sync_key')),
    body := '{}'::jsonb,
    timeout_milliseconds := 140000)
$job$);
