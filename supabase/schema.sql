-- =====================================================================
--  THE HARMONY – Database cho lịch giá villa
--  Chạy toàn bộ file này 1 lần trong Supabase > SQL Editor > New query
--  (chạy lại nhiều lần cũng không sao)
-- =====================================================================

-- ---------- 1. Tài khoản quản trị ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'pending' check (role in ('pending','partner','admin')),
  created_at  timestamptz default now()
);

-- Tài khoản ĐẦU TIÊN đăng ký sẽ tự thành admin. Các tài khoản sau: chờ duyệt.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name',
          case when exists (select 1 from public.profiles where role = 'admin') then 'pending' else 'admin' end);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- ---------- 2. Căn villa (thông tin công khai, KHÔNG có giá) ----------
create table if not exists public.villas (
  id          uuid primary key default gen_random_uuid(),
  code        text unique,
  name        text not null,
  area        text,
  address     text,
  bedrooms    int default 0,
  toilets     int default 0,
  std_guests  int default 0,
  max_guests  int default 0,
  amenities   text[] default '{}',
  rules       text[] default '{}',
  description text,
  photos      text[] default '{}',
  active      boolean default true,
  sort        int default 0,
  created_at  timestamptz default now()
);

-- ---------- 3. Giá gốc từng căn ----------
create table if not exists public.villa_rates (
  villa_id    uuid primary key references public.villas on delete cascade,
  weekday     bigint,           -- giá NET T2–T5
  weekend     bigint,           -- giá NET T6, T7, CN
  open_until  date,             -- sau ngày này hiện "Chưa cập nhật"
  note        text
);

-- ---------- 4. Lịch theo ngày: giá riêng / đã book / khoá ----------
create table if not exists public.calendar (
  villa_id    uuid references public.villas on delete cascade,
  date        date,
  price       bigint,
  status      text not null default 'open' check (status in ('open','booked','blocked')),
  note        text,
  primary key (villa_id, date)
);
create index if not exists calendar_date_idx on public.calendar (date);

-- ---------- 5. Link chia sẻ cho đối tác ----------
create table if not exists public.share_links (
  id            uuid primary key default gen_random_uuid(),
  token         text unique not null default replace(gen_random_uuid()::text, '-', ''),
  name          text not null,
  phone         text,
  note          text,
  active        boolean default true,
  created_at    timestamptz default now(),
  last_used_at  timestamptz
);

-- ---------- 6. Yêu cầu book ----------
create table if not exists public.booking_requests (
  id          uuid primary key default gen_random_uuid(),
  villa_id    uuid references public.villas on delete cascade,
  link_id     uuid references public.share_links on delete set null,
  check_in    date not null,
  check_out   date not null,
  guests      int,
  total       bigint,
  contact     text,
  note        text,
  status      text not null default 'new' check (status in ('new','confirmed','rejected','cancelled')),
  created_at  timestamptz default now()
);
alter table public.booking_requests add column if not exists link_id uuid references public.share_links on delete set null;

-- ---------- 6a. Màu người chốt (mỗi người/đối tác 1 màu) ----------
alter table public.calendar         add column if not exists color     text;   -- VD #e5484d
alter table public.calendar         add column if not exists booked_by text;   -- tên người chốt (chỉ admin xem)
alter table public.share_links      add column if not exists color     text default '#2f6fed';
alter table public.booking_requests add column if not exists color     text;
alter table public.share_links      add column if not exists color_locked boolean not null default false; -- true sau lần đối tác gửi yêu cầu đầu tiên
-- Màu đã khoá thì không ai đổi được (kể cả admin)
create or replace function public.keep_locked_color() returns trigger language plpgsql as $$
begin
  if old.color_locked then new.color := old.color; new.color_locked := true; end if;
  return new;
end $$;
drop trigger if exists share_links_keep_color on public.share_links;
create trigger share_links_keep_color before update on public.share_links for each row execute function public.keep_locked_color();

-- ---------- 6b. Nguồn Google Sheet của chủ villa (đồng bộ tự động) ----------
create table if not exists public.sheet_sources (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  sheet_url      text not null,
  config         jsonb not null default '{}'::jsonb,  -- mapping {nhãn cột: villa_id}, markup, booked_colors, booked_words
  active         boolean default true,
  last_sync_at   timestamptz,
  last_status    text,       -- ok | warning | error
  last_message   text,
  created_at     timestamptz default now()
);
create table if not exists public.sheet_sync_runs (
  id          bigint generated always as identity primary key,
  source_id   uuid references public.sheet_sources on delete cascade,
  at          timestamptz default now(),
  status      text,
  message     text,
  rows        int
);
alter table public.villas add column if not exists source_id  uuid references public.sheet_sources on delete set null;
alter table public.villas add column if not exists source_key text;

-- ---------- 7. Phân quyền ----------
alter table public.profiles         enable row level security;
alter table public.villas           enable row level security;
alter table public.villa_rates      enable row level security;
alter table public.calendar         enable row level security;
alter table public.share_links      enable row level security;
alter table public.booking_requests enable row level security;
alter table public.sheet_sources    enable row level security;
alter table public.sheet_sync_runs  enable row level security;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public'
    and tablename in ('profiles','villas','villa_rates','calendar','share_links','booking_requests','sheet_sources','sheet_sync_runs')
  loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop;
end $$;
alter table public.booking_requests drop column if exists partner_id;  -- bản cũ dùng tài khoản đối tác

create policy "profiles self"  on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles admin" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
-- Khách: ai cũng xem được căn đang hiển thị
create policy "villas read"    on public.villas for select using (active or public.is_admin());
create policy "villas admin"   on public.villas for all using (public.is_admin()) with check (public.is_admin());
-- Giá, lịch, link, yêu cầu: chỉ admin đọc trực tiếp. Đối tác đọc qua hàm partner_* bên dưới (cần mã link).
create policy "rates admin"    on public.villa_rates for all using (public.is_admin()) with check (public.is_admin());
create policy "calendar admin" on public.calendar for all using (public.is_admin()) with check (public.is_admin());
create policy "links admin"    on public.share_links for all using (public.is_admin()) with check (public.is_admin());
create policy "req admin"      on public.booking_requests for all using (public.is_admin()) with check (public.is_admin());
create policy "sources admin"  on public.sheet_sources for all using (public.is_admin()) with check (public.is_admin());
create policy "runs admin"     on public.sheet_sync_runs for all using (public.is_admin()) with check (public.is_admin());

-- ---------- 8. Hàm cho trang đối tác (chỉ chạy khi mã link hợp lệ) ----------
create or replace function public.partner_link(p_token text) returns public.share_links
language sql stable security definer set search_path = public as $$
  select * from public.share_links where token = p_token and active limit 1
$$;

create or replace function public.partner_get(p_token text, p_from date, p_to date) returns json
language plpgsql security definer set search_path = public as $$
declare l public.share_links;
begin
  l := public.partner_link(p_token);
  if l.id is null then raise exception 'LINK_INVALID'; end if;
  update public.share_links set last_used_at = now() where id = l.id;
  return json_build_object(
    'link', json_build_object('name', l.name, 'phone', l.phone, 'color', l.color, 'color_locked', l.color_locked),
    'rates', coalesce((select json_agg(r) from public.villa_rates r join public.villas v on v.id = r.villa_id where v.active), '[]'),
    'calendar', coalesce((select json_agg(json_build_object('villa_id', c.villa_id, 'date', c.date, 'price', c.price, 'status', c.status, 'color', c.color)) from public.calendar c where c.date >= p_from and c.date < p_to), '[]'));
end $$;

drop function if exists public.partner_request(text, uuid, date, date, int, bigint, text, text);
create or replace function public.partner_request(p_token text, p_villa uuid, p_in date, p_out date,
  p_guests int, p_total bigint, p_contact text, p_note text, p_color text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare l public.share_links; rid uuid;
begin
  l := public.partner_link(p_token);
  if l.id is null then raise exception 'LINK_INVALID'; end if;
  if p_out <= p_in or p_out - p_in > 60 then raise exception 'BAD_DATES'; end if;
  -- Lần đầu: màu đối tác chọn được gắn cố định vào link. Từ lần sau luôn dùng màu đã khoá.
  if not l.color_locked and p_color ~ '^#[0-9a-fA-F]{6}$' then
    update public.share_links set color = lower(p_color), color_locked = true where id = l.id;
    l.color := lower(p_color); l.color_locked := true;
  end if;
  insert into public.booking_requests (villa_id, link_id, check_in, check_out, guests, total, contact, note, color)
  values (p_villa, l.id, p_in, p_out, p_guests, p_total, left(p_contact, 300), left(p_note, 2000), l.color) returning id into rid;
  return rid;
end $$;

create or replace function public.partner_requests(p_token text) returns json
language plpgsql stable security definer set search_path = public as $$
declare l public.share_links;
begin
  l := public.partner_link(p_token);
  if l.id is null then raise exception 'LINK_INVALID'; end if;
  return coalesce((select json_agg(x order by x.created_at desc) from (
    select b.*, json_build_object('name', v.name) as villas from public.booking_requests b
    left join public.villas v on v.id = b.villa_id where b.link_id = l.id) x), '[]');
end $$;

revoke all on function public.partner_get(text, date, date) from public;
revoke all on function public.partner_request(text, uuid, date, date, int, bigint, text, text, text) from public;
revoke all on function public.partner_requests(text) from public;
revoke all on function public.partner_link(text) from public, anon, authenticated;
grant execute on function public.partner_get(text, date, date) to anon, authenticated;
grant execute on function public.partner_request(text, uuid, date, date, int, bigint, text, text, text) to anon, authenticated;
grant execute on function public.partner_requests(text) to anon, authenticated;

-- ---------- 8b. Lịch trống CÔNG KHAI cho khách (KHÔNG có giá) ----------
-- Trả về: ngày đã kín (booked/blocked), ngày có giá riêng (mở bán), và "mở bán đến ngày" của từng căn.
create or replace function public.public_availability(p_from date, p_to date) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if p_to < p_from or p_to - p_from > 400 then raise exception 'RANGE_INVALID'; end if;
  return json_build_object(
    'busy', coalesce((select json_agg(json_build_object('v', c.villa_id, 'd', c.date, 'c', c.color))
              from public.calendar c join public.villas v on v.id = c.villa_id
              where v.active and c.status <> 'open' and c.date >= p_from and c.date < p_to), '[]'),
    'ok',   coalesce((select json_agg(json_build_object('v', c.villa_id, 'd', c.date))
              from public.calendar c join public.villas v on v.id = c.villa_id
              where v.active and c.status = 'open' and c.price is not null and c.date >= p_from and c.date < p_to), '[]'),
    'open', coalesce((select json_object_agg(r.villa_id, json_build_object('until', r.open_until, 'rate', (r.weekday is not null or r.weekend is not null)))
              from public.villa_rates r join public.villas v on v.id = r.villa_id where v.active), '{}'));
end $$;
revoke all on function public.public_availability(date, date) from public;
grant execute on function public.public_availability(date, date) to anon, authenticated;

-- ---------- 9. Kho ảnh ----------
insert into storage.buckets (id, name, public) values ('villa-photos','villa-photos', true)
  on conflict (id) do nothing;
drop policy if exists "photos admin write"  on storage.objects;
drop policy if exists "photos admin update" on storage.objects;
drop policy if exists "photos admin delete" on storage.objects;
create policy "photos admin write"  on storage.objects for insert with check (bucket_id = 'villa-photos' and public.is_admin());
create policy "photos admin update" on storage.objects for update using (bucket_id = 'villa-photos' and public.is_admin());
create policy "photos admin delete" on storage.objects for delete using (bucket_id = 'villa-photos' and public.is_admin());
