-- =====================================================================
--  Lịch tự động: đồng bộ Google Sheet mỗi 1 phút
--  Chạy file này 1 lần trong SQL Editor SAU KHI đã deploy Edge Function "sync-sheets"
--  (deploy.bat làm việc đó, hoặc: npx supabase functions deploy sync-sheets --no-verify-jwt --use-api)
--  Đã điền sẵn mã project reyytwoivafzyvszrdwb (đổi project thì sửa trong dòng url bên dưới)
--  KHÔNG cần và KHÔNG được dán khoá bí mật nào vào file này.
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
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := '{"action":"sync"}'::jsonb
  );
  $$
);
