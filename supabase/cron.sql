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
    headers := jsonb_build_object('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJleXl0d29pdmFmenl2c3pyZHdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzQwNzIxMSwiZXhwIjoyMTA4OTgzMjExfQ.-Ns39VOO-qeEs0W08zeFhkzQ1u5anJIK2xXA3CA61B4', 'Content-Type', 'application/json'),
    body    := '{"action":"sync"}'::jsonb
  );
  $$
);
