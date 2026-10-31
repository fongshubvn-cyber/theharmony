-- =====================================================================
--  Lịch tự động: đồng bộ Google Sheet 15 phút/lần
--  Chạy file này 1 lần trong SQL Editor SAU KHI đã deploy Edge Function "sync-sheets".
--  Thay 2 chỗ <...> bên dưới:
--    <PROJECT_REF>        : mã project (trong Project URL https://<PROJECT_REF>.supabase.co)
--    <SERVICE_ROLE_KEY>   : Project Settings > API > service_role (GIỮ BÍ MẬT, không dán vào web)
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('harmony-sync-sheets') where exists (select 1 from cron.job where jobname = 'harmony-sync-sheets');

select cron.schedule(
  'harmony-sync-sheets',
  '* * * * *',
  $$
  select net.http_post(
    url     := 'https://reyytwoivafzyvszrdwb.supabase.co/functions/v1/sync-sheets',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>', 'Content-Type', 'application/json'),
    body    := '{"action":"sync"}'::jsonb
  );
  $$
);
