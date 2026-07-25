-- The Harmony — Supabase schema, security policies, and seed data.
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT DO NOTHING everywhere.

-- =========================================================================
-- TABLES
-- =========================================================================

create table if not exists public.villas (
    id text primary key,
    name text not null,
    category text not null,
    address text not null,
    bedrooms int not null,
    bathrooms int not null,
    capacity int not null,
    price text,
    image text,
    images jsonb not null default '[]'::jsonb,
    amenities jsonb not null default '[]'::jsonb,
    short_description text,
    description text,
    featured boolean not null default false,
    approval_status text, -- NULL = normal listing, 'pending' = awaiting admin approval, 'approved' = approved partner listing
    partner_name text,
    partner_phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz
);

create table if not exists public.destinations (
    id text primary key,
    title text not null,
    category text not null,
    address text not null,
    image text,
    short_description text,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz
);

create table if not exists public.bookings (
    id text primary key,
    villa_id text,
    villa_name text,
    customer_name text not null,
    customer_phone text not null,
    check_in date,
    guests int,
    note text,
    status text not null default 'pending',
    created_at timestamptz not null default now()
);

create table if not exists public.reviews (
    id text primary key,
    villa_id text not null,
    avatar text,
    name text not null,
    date text not null, -- pre-formatted display string (dd/mm/yyyy), matches current app behavior
    rating int not null check (rating between 1 and 5),
    content text not null,
    created_at timestamptz not null default now()
);

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

alter table public.villas enable row level security;
alter table public.destinations enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;

-- villas: public can see everything except pending partner submissions;
-- public can only insert new rows as pending (the partner-consignment form);
-- logged-in admin can do anything.
drop policy if exists "villas_public_select" on public.villas;
create policy "villas_public_select" on public.villas
    for select using (approval_status is distinct from 'pending');

drop policy if exists "villas_public_insert_pending" on public.villas;
create policy "villas_public_insert_pending" on public.villas
    for insert with check (approval_status = 'pending');

drop policy if exists "villas_admin_all" on public.villas;
create policy "villas_admin_all" on public.villas
    for all to authenticated using (true) with check (true);

-- destinations: public read-only; admin manages content.
drop policy if exists "destinations_public_select" on public.destinations;
create policy "destinations_public_select" on public.destinations
    for select using (true);

drop policy if exists "destinations_admin_all" on public.destinations;
create policy "destinations_admin_all" on public.destinations
    for all to authenticated using (true) with check (true);

-- bookings: public can submit a lead (insert-only, can't read others' data);
-- only admin can view/manage the inbox.
drop policy if exists "bookings_public_insert" on public.bookings;
create policy "bookings_public_insert" on public.bookings
    for insert with check (true);

drop policy if exists "bookings_admin_all" on public.bookings;
create policy "bookings_admin_all" on public.bookings
    for all to authenticated using (true) with check (true);

-- reviews: public can read and submit; admin can moderate (delete/update) too.
drop policy if exists "reviews_public_select" on public.reviews;
create policy "reviews_public_select" on public.reviews
    for select using (true);

drop policy if exists "reviews_public_insert" on public.reviews;
create policy "reviews_public_insert" on public.reviews
    for insert with check (true);

drop policy if exists "reviews_admin_all" on public.reviews;
create policy "reviews_admin_all" on public.reviews
    for all to authenticated using (true) with check (true);

-- =========================================================================
-- STORAGE (villa images)
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('villa-images', 'villa-images', true)
on conflict (id) do nothing;

drop policy if exists "villa_images_public_read" on storage.objects;
create policy "villa_images_public_read" on storage.objects
    for select using (bucket_id = 'villa-images');

drop policy if exists "villa_images_public_upload" on storage.objects;
create policy "villa_images_public_upload" on storage.objects
    for insert with check (bucket_id = 'villa-images');

drop policy if exists "villa_images_admin_delete" on storage.objects;
create policy "villa_images_admin_delete" on storage.objects
    for delete to authenticated using (bucket_id = 'villa-images');

-- =========================================================================
-- SEED DATA (transcribed from the current js/db.js INITIAL_* arrays.
-- Each row uses ON CONFLICT (id) DO NOTHING, so re-running this script is safe.)
-- =========================================================================

-- villas
INSERT INTO public.villas (id, name, category, address, bedrooms, bathrooms, capacity, price, image, images, amenities, short_description, description, featured, created_at)
VALUES ('harmony-villa-family-1', 'The Harmony Family Pine Villa', 'villa-giadinh', 'Đường Khởi Nghĩa Bắc Sơn, Phường 10, Đà Lạt', 4, 4, 12, 'Liên hệ trực tiếp', 'asset/family_villa_1.png', '["asset/family_villa_1.png","asset/family_villa_2.png"]'::jsonb, '["Bình nước nóng","Sân nướng BBQ","Khuôn viên sân vườn","Phòng bếp đầy đủ tiện nghi","Smart TV & Karaoke","Chỗ đậu xe rộng rãi"]'::jsonb, 'Villa gia đình ấm cúng ẩn mình giữa rừng thông Đà Lạt xanh mát, thích hợp cho nhóm 8-12 người nghỉ dưỡng.', 'The Harmony Family Pine Villa mang đến không gian yên bình tuyệt đối giữa rừng thông rì rào của Đà Lạt. Căn villa có lối kiến trúc hiện đại kết hợp các chi tiết gỗ ấm áp, mang lại cảm giác thân thuộc như chính ngôi nhà của bạn.

Với thiết kế 4 phòng ngủ khép kín rộng rãi, đầy đủ ánh sáng tự nhiên từ hệ thống cửa kính lớn nhìn thẳng ra đồi thông, căn villa là lựa chọn hoàn hảo cho các gia đình hoặc nhóm bạn thân tìm kiếm sự riêng tư.

Sân vườn ngoài trời được thiết kế sẵn khu vực nướng BBQ tiện lợi, bàn ăn dài cho các buổi tối quây quản ấm cúng dưới làn sương mờ của Đà Lạt. Căn villa trang bị đầy đủ dụng cụ nấu nướng hiện đại, hệ thống âm thanh giải trí gia đình tiện ích.', true, '2026-07-17T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.villas (id, name, category, address, bedrooms, bathrooms, capacity, price, image, images, amenities, short_description, description, featured, created_at)
VALUES ('harmony-villa-luxury-1', 'The Harmony Luxury Horizon Estate', 'villa-caocap', 'Đường Đống Đa, Phường 3, Đà Lạt', 6, 7, 18, 'Liên hệ trực tiếp', 'asset/luxury_villa_1.png', '["asset/luxury_villa_1.png","asset/luxury_villa_2.png"]'::jsonb, '["Hồ bơi vô cực nước ấm","Sân BBQ ngoài trời siêu rộng","Phòng chiếu phim gia đình","Bàn Bi-a & Giải trí","Phòng xông hơi Sauna","Quản gia phục vụ 24/7","View thung lũng 360 độ"]'::jsonb, 'Villa siêu sang view thung lũng mây 360 độ với bể bơi nước ấm vô cực đầu tiên tại Đà Lạt.', 'Tọa lạc tại vị trí đắc địa trên đồi Đống Đa, The Harmony Luxury Horizon Estate là một kiệt tác kiến trúc hiện đại, mở ra tầm nhìn bao trọn thung lũng mây ngút ngàn và toàn cảnh thành phố Đà Lạt thơ mộng.

Villa sở hữu 6 phòng ngủ hạng sang với bồn tắm nằm cao cấp view ngắm mây trời, phòng khách thông tầng ngập tràn ánh sáng và nội thất nhập khẩu xa xỉ. Điểm nhấn đắt giá nhất của dinh thự là hồ bơi vô cực tràn viền sử dụng hệ thống làm nóng nước hiện đại, giúp bạn thư thái ngâm mình ngắm hoàng hôn Đà Lạt rực rỡ.

Các tiện ích đi kèm đẳng cấp bao gồm phòng chiếu phim mini tiêu chuẩn cao, khu giải trí có bàn Bi-a cao cấp, phòng xông hơi sauna đá nóng thư giãn. Đội ngũ quản gia chuyên nghiệp luôn sẵn sàng hỗ trợ chuẩn bị tiệc BBQ ngoài trời hay các bữa tiệc sang trọng theo yêu cầu.', true, '2026-07-17T12:10:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.villas (id, name, category, address, bedrooms, bathrooms, capacity, price, image, images, amenities, short_description, description, featured, created_at)
VALUES ('harmony-villa-family-2', 'Pinecrest Cozy Family Retreat', 'home-giadinh', 'Đường Hùng Vương, Phường 11, Đà Lạt', 3, 3, 8, 'Liên hệ trực tiếp', 'asset/family_villa_2.png', '["asset/family_villa_2.png","asset/family_villa_1.png"]'::jsonb, '["Sân vườn nhiều hoa","Bếp sưởi trong nhà","Khu vui chơi trẻ em","Dụng cụ BBQ ngoài trời","Bếp nấu tự phục vụ"]'::jsonb, 'Villa phong cách Bắc Âu mộc mạc với lò sưởi ấm cúng và vườn hồng xinh xắn quanh năm khoe sắc.', 'Pinecrest Cozy Family Retreat được thiết kế theo phong cách Cottage Bắc Âu với gạch đỏ và gỗ thông tự nhiên. Không gian mang tông màu ấm cúng chủ đạo, có lò sưởi đóng củi thật tại phòng khách - nơi gia đình bạn có thể cùng nhau nướng khoai và trò chuyện trong đêm lạnh Đà Lạt.

Villa gồm 3 phòng ngủ nhỏ nhắn, thiết kế tinh tế với cửa sổ nhìn ra vườn hoa hồng ngoại quanh nhà. Sân vườn ngập tràn hoa cỏ là không gian lý tưởng để đọc sách, uống trà chiều, hay để trẻ nhỏ vui chơi an toàn. Căn bếp nhỏ đầy đủ gia vị sẵn sàng để bạn trổ tài nấu nướng cho gia đình.', false, '2026-07-17T12:20:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.villas (id, name, category, address, bedrooms, bathrooms, capacity, price, image, images, amenities, short_description, description, featured, created_at)
VALUES ('harmony-villa-luxury-2', 'The Harmony Obsidian Mansion', 'home-nhomban', 'Phường 11 (Khu Trại Mát), Đà Lạt', 5, 6, 15, 'Liên hệ trực tiếp', 'asset/luxury_villa_2.png', '["asset/luxury_villa_2.png","asset/luxury_villa_1.png"]'::jsonb, '["Bếp sưởi lửa trại ngoài trời","Hầm rượu vang","Kính thiên văn ngắm sao","Sân golf mini","Dịch vụ trà chiều hoàng hôn","Smart Home toàn diện"]'::jsonb, 'Villa phong cách Luxury Obsidian tối giản sang trọng với khu đốt lửa trại ngắm thung lũng đèn Trại Mát về đêm.', 'Nằm tách biệt trên ngọn đồi thơ mộng hướng thẳng về phía thung lũng đèn Trại Mát lung linh, The Harmony Obsidian Mansion mang sắc đen huyền bí kết hợp gỗ trầm ấm tạo nên một không gian nghỉ dưỡng cực kỳ tinh tế và đẳng cấp.

Mansion sở hữu hệ thống kính thiên văn chuyên nghiệp phục vụ trải nghiệm săn sao và ngắm thung lũng đèn lung linh về đêm. Sân thượng rộng lớn được trang bị hố lửa sưởi ấm ngoài trời thiết kế chìm ấn tượng, nơi lý tưởng để thưởng thức ly vang Đà Lạt hảo hạng giữa không khí se lạnh.

Tất cả các thiết bị trong nhà đều được điều khiển thông minh qua hệ thống Smart Home hiện đại. Căn villa hứa hẹn sẽ mang đến trải nghiệm nghỉ dưỡng khác biệt, cao cấp khó quên cho đoàn khách quý tộc.', false, '2026-07-17T12:30:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.villas (id, name, category, address, bedrooms, bathrooms, capacity, price, image, images, amenities, short_description, description, featured, created_at)
VALUES ('harmony-villa-mid-1', 'The Harmony Pine Hills Villa', 'villa-tamtrung', 'Đường Triệu Việt Vương, Phường 4, Đà Lạt', 4, 3, 10, 'Liên hệ trực tiếp', 'asset/family_villa_2.png', '["asset/family_villa_2.png"]'::jsonb, '["Sân nướng BBQ rộng","Phòng khách ấm cúng","Nhà bếp tự nấu ăn","Chỗ đậu xe hơi"]'::jsonb, 'Biệt thự nghỉ dưỡng tầm trung đầy đủ tiện ích, không gian yên tĩnh gần hồ Tuyền Lâm.', 'The Harmony Pine Hills Villa tọa lạc trên đường Triệu Việt Vương bình yên. Căn chỗ nghỉ thích hợp cho các gia đình hoặc nhóm bạn nhỏ khoảng 8-10 người với mức giá thuê vô cùng hợp lý nhưng vẫn đảm bảo tiện nghi đầy đủ.', true, '2026-07-17T12:40:00Z')
ON CONFLICT (id) DO NOTHING;

-- destinations
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-lake-tuyen-lam', 'Hồ Tuyền Lâm - Lá phổi xanh của Đà Lạt', 'sightseeing', 'Phường 4, Đà Lạt (Cách trung tâm 7km)', 'asset/dest_lake.png', 'Hồ nước ngọt rộng nhất Đà Lạt với cảnh quan rừng thông hoang sơ bao quanh, mây phủ sương mờ mỗi sáng sớm.', 'Hồ Tuyền Lâm là hồ nước ngọt rộng nhất Đà Lạt, được bao quanh bởi những cánh rừng thông bạt ngàn tạo nên bức tranh thiên nhiên tuyệt mỹ. Đây là địa điểm lý tưởng để cắm trại, đi thuyền kayak ngắm lá phong, câu cá hoặc dạo bộ hít thở không khí trong lành thoang thoảng hương thông rừng.', '2026-07-21T08:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-aesthetic-cafe', 'Aesthetic Glasshouse Coffee - Góc check-in hoàng hôn đồi thông', 'cafe', 'Đường Khởi Nghĩa Bắc Sơn, Phường 10, Đà Lạt', 'asset/dest_cafe.png', 'Quán cà phê nhà kính phong cách tối giản với view thung lũng thông rì rào, địa điểm ngắm hoàng hôn rực rỡ nhất Đà Lạt.', 'Nằm nép mình bên sườn đồi thơ mộng, quán cafe sở hữu không gian nhà kính ngập tràn ánh nắng và cây xanh. Với ban công gỗ mở rộng hướng thẳng ra thung lũng, quán là điểm hẹn hò lãng mạn bậc nhất để thưởng thức tách cà phê ấm nóng và ngắm trọn vẹn khoảnh khắc hoàng hôn nhuộm đỏ sương mù Đà Lạt.', '2026-07-21T08:10:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-linh-phuoc', 'Chùa Linh Phước - Độc đáo công trình khảm sành Ve Chai', 'checkin', '120 Tự Phước, Trại Mát, Phường 11, Đà Lạt', 'asset/dest_pagoda.png', 'Ngôi chùa khảm sành giữ nhiều kỷ lục nhất Việt Nam, nổi bật với rồng dài 49m làm từ 12.000 vỏ chai bia.', 'Chùa Linh Phước (hay còn gọi là Chùa Ve Chai) là một công trình kiến trúc Phật giáo khảm sành vô cùng đặc sắc và tinh xảo tại Đà Lạt. Toàn bộ các bức tường, cột chùa và tượng rồng dài 49m đều được khảm tỉ mỉ bằng hàng triệu mảnh sành, sứ và thủy tinh nhiều màu sắc, thu hút đông đảo du khách thập phương đến chiêm bái.', '2026-07-21T08:20:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-cau-dat', 'Đồi Chè Cầu Đất - Trải nghiệm săn mây đón bình minh cực chill', 'sightseeing', 'Thôn Cầu Đất, Xã Xuân Trường, Đà Lạt', 'asset/dest_lake.png', 'Không gian chè xanh mướt trải dài vô tận cùng thảm gỗ săn mây bồng bềnh tuyệt đẹp lúc sáng sớm.', 'Đồi Chè Cầu Đất là địa điểm săn mây nổi tiếng bậc nhất Đà Lạt. Với đồi chè xanh ngút ngàn và các tua-bin gió khổng lồ, nơi đây mang vẻ đẹp bình yên thơ mộng. Du khách thường đến từ 4h30 sáng để ngắm nhìn biển mây bồng bềnh phủ lấy đồi chè xanh mướt.', '2026-07-21T08:30:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-ga-dalat', 'Ga Đà Lạt - Nhà ga cổ kính mang kiến trúc Pháp độc đáo', 'checkin', 'Đường Quang Trung, Phường 9, Đà Lạt', 'asset/dest_pagoda.png', 'Nhà ga xe lửa cổ nhất Việt Nam và Đông Dương, biểu tượng check-in không thể bỏ qua tại Đà Lạt.', 'Ga Đà Lạt được xây dựng từ năm 1932 bởi người Pháp, mang kiến trúc độc đáo lấy cảm hứng từ ngọn núi Langbiang hùng vĩ. Nơi đây hiện vẫn lưu giữ những toa tàu gỗ cổ kính phục vụ tuyến du lịch ngắn đi Trại Mát.', '2026-07-21T08:40:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-datanla', 'Thác Datanla - Trải nghiệm hệ thống máng trượt xuyên rừng thông', 'sightseeing', 'Đèo Prenn, Phường 3, Đà Lạt', 'asset/dest_lake.png', 'Khu du lịch sinh thái nổi tiếng với máng trượt uốn lượn quanh rừng thông và các hoạt động mạo hiểm ngoài trời.', 'Thác Datanla sở hữu dòng nước trong lành chảy hiền hòa qua các tầng đá. Hệ thống máng trượt alpine coaster hiện đại uốn lượn qua các sườn thông mang lại cảm giác phấn khích tột độ cho du khách.', '2026-07-21T08:50:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-tui-mo-to', 'Tiệm Cà Phê Túi Mơ To - Góc vườn cúc họa mi thơ mộng', 'cafe', 'Hẻm 31 Sào Nam, Phường 11, Đà Lạt', 'asset/dest_cafe.png', 'Quán cà phê view thung lũng đèn cực đẹp về đêm, nổi tiếng với vườn hoa cúc họa mi ngập tràn sắc trắng.', 'Tiệm Cà Phê Túi Mơ To mang phong cách hoài niệm cổ xưa, nổi tiếng bậc nhất Đà Lạt với khu vườn tràn ngập cúc họa mi. Đây là nơi ngắm thung lũng đèn rực sáng huyền ảo khi đêm về.', '2026-07-21T09:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-lau-ga-la-e', 'Lẩu Gà Lá É Tao Ngộ - Ẩm thực nức tiếng làm ấm lòng du khách', 'food', '5 Đường 3 Tháng 4, Phường 3, Đà Lạt', 'asset/dest_cafe.png', 'Món lẩu trứ danh nóng hổi kết hợp thịt gà ta chắc ngọt cùng vị cay nồng của lá é và ớt xiêm xanh.', 'Lẩu gà lá é là món ăn tối quốc dân tại Đà Lạt. Dưới không khí se lạnh, một nồi lẩu nghi ngút khói thơm lừng mùi sả, vị ngọt thanh của thịt gà cùng vị cay ấm lòng của lá é chắc chắn sẽ chinh phục bất kỳ vị khách khó tính nào.', '2026-07-21T09:10:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-cho-dem', 'Chợ Đêm Đà Lạt - Thiên đường ẩm thực đường phố sôi động', 'food', 'Đường Nguyễn Thị Minh Khai, Phường 1, Đà Lạt', 'asset/dest_cafe.png', 'Nơi tụ hội các món ăn vặt ấm nóng như bánh tráng nướng, sữa đậu nành, dâu lắc sương đêm Đà Lạt.', 'Chợ đêm Đà Lạt (Chợ Âm Phủ) là trung tâm giao lưu văn hóa ẩm thực náo nhiệt. Trải nghiệm dạo bộ chợ đêm lạnh, thưởng thức cốc sữa đậu nành nóng hổi, cắn miếng bánh tráng nướng giòn rụm là kỷ niệm khó quên của du khách.', '2026-07-21T09:20:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-clay-tunnel', 'Đường Hầm Điêu Khắc - Kỳ quan bằng đất sét khổng lồ', 'sightseeing', 'Khu du lịch Hồ Tuyền Lâm, Phường 4, Đà Lạt', 'asset/dest_pagoda.png', 'Công trình điêu khắc bằng đất sét tái hiện lại lịch sử hình thành và phát triển của thành phố ngàn hoa.', 'Đường hầm đất sét là công trình nghệ thuật độc đáo dài hơn 2km. Nổi tiếng nhất là khu vực Hồ Vô Cực với hai bức tượng đầu người đối mặt nhau tuyệt đẹp giữa mặt hồ trong vắt.', '2026-07-21T09:30:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-langbiang', 'Langbiang - Nóc nhà huyền thoại của cao nguyên Lâm Viên', 'sightseeing', 'Thị trấn Lạc Dương, Huyện Lạc Dương (Cách Đà Lạt 12km)', 'asset/dest_lake.png', 'Đỉnh núi cao nhất Đà Lạt với view ngắm toàn cảnh suối Vàng, suối Bạc thơ mộng từ trên cao.', 'Langbiang gắn liền với truyền thuyết tình yêu lãng mạn của chàng K''lang và nàng H''biang. Du khách có thể đi xe jeep leo lên đỉnh núi radar ngắm nhìn mây bay lững lờ và toàn cảnh thành phố phía dưới.', '2026-07-21T09:40:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-chika-farm', 'Chika Farm - Nông trại cừu phong cách châu Âu siêu dễ thương', 'sightseeing', 'Đường Đình Đa Quý, Xuân Thọ, Đà Lạt', 'asset/dest_lake.png', 'Nông trại cừu, lạc đà Alpaca thân thiện giữa thảo nguyên xanh bao la tuyệt đẹp.', 'Chika Farm sở hữu khuôn viên rộng lớn bao quanh bởi thung lũng thông mộng mơ. Nơi đây nuôi dưỡng nhiều bạn cừu, dê và lạc đà Alpaca hiếu khách. Du khách có thể tự tay cho thú ăn và chụp những bức ảnh đồng quê cực thơ.', '2026-07-21T09:51:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-binh-minh-oi', 'Bình Minh Ơi Cafe - Săn mây và ngắm bình minh đồi thông lý tưởng', 'cafe', '89 Hoàng Hoa Thám, Phường 10, Đà Lạt', 'asset/dest_cafe.png', 'Quán cà phê mộc mạc làm bằng gỗ với view thung lũng mây giăng ngút ngàn lúc bình minh lên.', 'Bình Minh Ơi là điểm săn mây không thể bỏ qua tại trung tâm Đà Lạt. Thưởng thức một ly trà nóng ngắm nhìn những tia nắng đầu tiên xuyên qua làn mây sương đọng trên đồi thông là trải nghiệm khó quên.', '2026-07-21T09:52:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-puppy-farm', 'Puppy Farm - Nông trại cún cưng kết hợp vườn nông nghiệp công nghệ cao', 'sightseeing', 'Đường Cam Ly, Phường 7, Đà Lạt', 'asset/dest_lake.png', 'Nơi vui đùa cùng hàng chục giống cún đáng yêu và tham quan vườn dâu tây, cà chua bi trĩu quả.', 'Puppy Farm tụ hội hơn 100 chú cún thuộc các giống Corgi, Husky, Alaska siêu đáng yêu. Ngoài chơi cùng cún, du khách còn được tham quan vườn bí ngô khổng lồ và vườn dâu tây công nghệ cao hái tại vườn.', '2026-07-21T09:53:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-doi-vo-anh', 'Đồi Vô Ảnh - Tác phẩm gương nghệ thuật ngoài trời độc nhất vô nhị', 'checkin', 'Đường đèo Mimosa, Phường 10, Đà Lạt', 'asset/dest_pagoda.png', 'Ngọn đồi với hàng trăm tấm gương phản chiếu bầu trời tạo nên không gian sống ảo ảo diệu khôn lường.', 'Đồi Vô Ảnh nổi bật với những bức tường gương sáng loáng ngoài trời, phản chiếu mây trời rừng thông và hồ nước vô cực. Nơi đây là điểm check-in độc lạ, sáng tạo hàng đầu của giới trẻ.', '2026-07-21T09:54:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-lam-vien', 'Quảng Trường Lâm Viên - Đóa hoa dã quỳ khổng lồ bên hồ Xuân Hương', 'sightseeing', 'Đường Trần Quốc Toản, Phường 1, Đà Lạt', 'asset/dest_lake.png', 'Trái tim của thành phố Đà Lạt với hai biểu tượng kiến trúc kính bông hoa dã quỳ và nụ hoa Atisô.', 'Quảng trường Lâm Viên rộng lớn hướng ra hồ Xuân Hương thơ mộng. Hai công trình bằng kính màu khổng lồ là đóa hoa dã quỳ và nụ hoa Atisô rực rỡ, bên trong có rạp chiếu phim và quán cafe độc đáo.', '2026-07-21T09:55:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-lang-cu-lan', 'Làng Cù Lần - Ngôi làng cổ tích ẩn mình dưới chân thung lũng xanh', 'sightseeing', 'Xã Lát, Huyện Lạc Dương, Lâm Đồng', 'asset/dest_lake.png', 'Ngôi làng nhỏ yên bình giữa thung lũng thông xanh mướt, mang đậm bản sắc văn hóa Tây Nguyên.', 'Làng Cù Lần mang vẻ đẹp hoang sơ thơ mộng với những ngôi nhà sàn gỗ mộc mạc bên hồ nước. Du khách đến đây có thể đi xe jeep leo dốc, vượt suối hoặc chèo bè tre ngắm cảnh sắc thiên nhiên trong lành.', '2026-07-21T09:56:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-dinh-1', 'Dinh 1 Bảo Đại - Biệt điện hoàng gia Pháp cổ kính', 'sightseeing', 'Đường Trần Quang Diệu, Phường 10, Đà Lạt', 'asset/dest_pagoda.png', 'Dinh thự mang đậm kiến trúc quý tộc Pháp cổ kính ẩn mình giữa hàng thông trăm tuổi.', 'Dinh 1 từng là tổng hành dinh của Vua Bảo Đại trong thời gian làm Quốc trưởng. Nơi đây sở hữu lối kiến trúc tân cổ điển sang trọng, khuôn viên rộng với con đường trải đá rợp bóng cây cổ thụ mát mẻ.', '2026-07-21T09:57:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-valley-gold', 'Thung Lũng Vàng - Cảnh quan rừng thông hồ nước yên bình', 'sightseeing', 'Đường Ankroet, Xã Lát, Lạc Dương, Lâm Đồng', 'asset/dest_lake.png', 'Khu du lịch sinh thái với đồi cỏ hồng trải dài rực rỡ cùng hồ nước Đan Kia rộng mênh mông.', 'Thung Lũng Vàng nổi tiếng với rừng thông ba lá cổ thụ, những vườn hoa cảnh bonsai tinh tế và hồ nước thơ mộng. Đây cũng là điểm ngắm đồi cỏ hồng mọc tự nhiên vào dịp cuối năm tuyệt đẹp.', '2026-07-21T09:58:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-coi-xay-gio', 'Tiệm Bánh Cối Xay Gió - Bức tường vàng check-in biểu tượng', 'checkin', 'Đường Tăng Bạt Hổ, Phường 1, Đà Lạt', 'asset/dest_cafe.png', 'Bức tường vàng retro huyền thoại luôn tấp nập du khách xếp hàng chụp ảnh lưu niệm.', 'Bức tường vàng với font chữ retro viết tay màu đỏ độc đáo đã trở thành biểu tượng sống ảo quen thuộc của Đà Lạt. Tiệm nổi tiếng với nhiều loại bánh mì truyền thống và bánh ngọt thơm ngon.', '2026-07-21T09:59:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-kem-bo-thanh-thao', 'Kem Bơ Thanh Thảo - Món ngọt thanh mát nức tiếng phố núi', 'food', '76 Nguyễn Văn Trỗi, Phường 2, Đà Lạt', 'asset/dest_cafe.png', 'Món kem bơ sánh mịn thơm béo kết hợp cùng viên kem dừa ngọt thanh mát lạnh.', 'Kem Bơ Thanh Thảo là quán ăn vặt lâu đời nổi tiếng nhất Đà Lạt. Bơ sáp đắc nông chín dẻo được xay nhuyễn mịn, phủ thêm viên kem dừa ngọt béo ngậy và chút dừa nạo giòn sần sật cực kỳ hấp dẫn.', '2026-07-21T10:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-banh-uot-long-ga', 'Bánh Ướt Lòng Gà Long - Hương vị độc đáo ăn là nhớ mãi', 'food', 'Hẻm 202 Phan Đình Phùng, Phường 2, Đà Lạt', 'asset/dest_cafe.png', 'Sự kết hợp hoàn hảo giữa bánh ướt mềm dai nóng hổi, lòng gà, thịt gà xé cùng nước mắm chua ngọt đậm đà.', 'Bánh ướt lòng gà Long là quán ăn gia truyền có lượng khách vô cùng đông đúc. Đĩa bánh đầy ắp lòng mề gà giòn dai, thịt gà ta ngọt dai cùng hành tây, rau thơm chấm nước mắm pha cay cay cực hấp dẫn.', '2026-07-21T10:10:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-domaine-marie', 'Nhà Thờ Domaine de Marie - Kiến trúc tôn giáo sắc hồng ngọt ngào', 'sightseeing', '1 Ngô Quyền, Phường 6, Đà Lạt', 'asset/dest_pagoda.png', 'Nhà Thờ Mai Anh mang lối kiến trúc Pháp cổ kết hợp phong cách nhà rông Tây Nguyên đặc sắc.', 'Nhà thờ Domaine de Marie nổi bật giữa đồi thông nhờ lớp tường sơn màu hồng ngọt ngào và những khóm hoa rực rỡ trong khuôn viên. Nơi đây là điểm tham quan thanh tịnh và thanh lịch cho mọi du khách.', '2026-07-21T10:20:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-kombi-land', 'Kombi Land - Vương quốc xương rồng miền viễn tây giữa lòng Đà Lạt', 'checkin', 'Đèo Mimosa, Phường 3, Đà Lạt', 'asset/dest_cafe.png', 'Quán cafe sa mạc độc đáo với hàng trăm giống xương rồng và những chiếc xe bus retro màu sắc.', 'Kombi Land mang lại làn gió mới cho du lịch Đà Lạt với phong cách miền viễn Tây đầy nắng gió. Hàng ngàn chậu xương rồng lớn nhỏ cùng mô hình xe bus cũ tạo nên phông nền chụp ảnh cực ngầu.', '2026-07-21T10:30:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-que-garden', 'Que Garden - Khu vườn bonsai Nhật Bản thu nhỏ yên bình', 'sightseeing', 'Đèo Mimosa, Phường 10, Đà Lạt', 'asset/dest_lake.png', 'Khu vườn tùng bonsai lá kim khổng lồ kết hợp hồ cá Koi Nhật Bản đầy màu sắc sống động.', 'Que Garden được mệnh danh là tiểu Nhật Bản giữa lòng Đà Lạt. Với diện tích hơn 20.000m2, nơi đây có hàng trăm cây bonsai uốn nắn nghệ thuật tinh tế và hồ cá Koi hàng trăm con bơi lội yên bình.', '2026-07-21T10:40:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-tuyet-tinh-coc', 'Tuyệt Tình Cốc - Hồ nước xanh ngọc bích ảo diệu giữa rừng sâu', 'sightseeing', 'Suối Cạn, Xã Lát, Huyện Lạc Dương, Lâm Đồng', 'asset/dest_lake.png', 'Hồ nước mỏ đá bỏ hoang với màu nước xanh ngọc bích trong veo như ngọc, bao quanh bởi vách đá dựng đứng.', 'Tuyệt Tình Cốc mang vẻ đẹp hoang sơ kỳ bí của thiên nhiên. Con đường đi đến đây gồ ghề đầy thử thách bằng xe jeep, nhưng bù lại bạn sẽ được chiêm ngưỡng chiếc hồ nước màu xanh ngọc bích vô cùng lạ mắt.', '2026-07-21T10:50:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-pongour', 'Thác Pongour - Nam Thiên Đệ Nhất Thác bảy tầng hùng vĩ', 'sightseeing', 'Thôn Tân Nghĩa, Xã Ninh Gia, Huyện Đức Trọng', 'asset/dest_lake.png', 'Kỳ quan thác nước đổ xuống qua 7 tầng đá bậc thang, rộng hơn 100m bao quanh bởi rừng nguyên sinh.', 'Thác Pongour là ngọn thác nổi tiếng với vẻ đẹp hoang dã, hùng vĩ bậc nhất Tây Nguyên. Thác chảy qua hệ thống đá bậc thềm tạo nên những thảm bọt tuyết trắng xóa vô cùng tráng lệ.', '2026-07-21T11:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-lau-bo-ba-toa', 'Lẩu Bò Ba Toa Nhà Gỗ - Món lẩu bò gia truyền ngon trứ danh', 'food', '1/29 Hoàng Diệu, Phường 5, Đà Lạt', 'asset/dest_cafe.png', 'Quán lẩu nhà gỗ mộc mạc với hương vị lẩu bò đậm đà ngọt xương ống nóng hổi lâu đời.', 'Lẩu bò quán gỗ Ba Toa là điểm hẹn ẩm thực trứ danh. Một nồi lẩu bò đầy ắp nạm bò, dựng bò, đuôi bò mềm dẻo ngập trong nước dùng thơm lừng gia vị thuốc bắc sưởi ấm hoàn hảo cái lạnh Đà Lạt.', '2026-07-21T11:10:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-van-thanh', 'Làng Hoa Vạn Thành - Làng trồng hoa truyền thống lâu đời nhất', 'sightseeing', '43 Vạn Hạnh, Phường 5, Đà Lạt', 'asset/dest_lake.png', 'Thiên đường ngập tràn các loài hoa ly, cẩm tú cầu, hoa hồng ngoại khoe sắc rực rỡ.', 'Làng hoa Vạn Thành ứng dụng kỹ thuật trồng hoa trong nhà kính hiện đại. Đến đây du khách được chiêm ngưỡng những luống hồng ngoại kiêu sa, những vườn cẩm tú cầu nở rộ tạo thành tấm thảm hoa khổng lồ.', '2026-07-21T11:20:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-zoodoo', 'ZooDoo Da Lat - Sở thú thân thiện phong cách nước Úc độc đáo', 'sightseeing', 'Quốc lộ 27C, Xã Đạ Nhim, Lạc Dương, Lâm Đồng', 'asset/dest_lake.png', 'Sở thú mở thân thiện nuôi dưỡng kangaroo, cừu merino, ngựa lùn pony giữa rừng thông mát mẻ.', 'ZooDoo Da Lat mang mô hình sở thú mở thân thiện kiểu Úc. Các loài động vật tại đây được huấn luyện cẩn thận, du khách có thể cho ăn và vuốt ve những bạn thú hiền lành sống giữa thiên nhiên rừng thông trong trẻo.', '2026-07-21T11:30:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.destinations (id, title, category, address, image, short_description, description, created_at)
VALUES ('dest-me-linh', 'Mê Linh Coffee Garden - Quán cà phê view thung lũng đồi chè bao la', 'cafe', 'Tổ 20 Thôn 4, Xã Tà Nung, Đà Lạt', 'asset/dest_cafe.png', 'Quán cà phê có view ôm trọn thung lũng cà phê xanh mát và đập nước Cam Ly thơ mộng từ trên cao.', 'Mê Linh Coffee Garden sở hữu không gian mở 360 độ ngắm toàn cảnh núi rừng Tà Nung xanh ngút ngàn. Nơi đây nổi tiếng với hương vị cà phê chồn thơm ngon nguyên bản và các góc sống ảo nấc thang lên thiên nhiên đắt giá.', '2026-07-21T11:40:00Z')
ON CONFLICT (id) DO NOTHING;

-- reviews
INSERT INTO public.reviews (id, villa_id, avatar, name, date, rating, content, created_at)
VALUES ('rev-1', 'harmony-villa-family-1', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&fit=crop', 'Nguyễn Hải Yến', '12/05/2026', 5, 'Đại gia đình mình 10 người đã ở đây 3 ngày 2 đêm rất vui vẻ. Villa nằm giữa đồi thông rất mát mẻ, phòng bếp đầy đủ đồ dùng tự nấu ăn. Sân nướng BBQ siêu rộng có sẵn bàn ghế gỗ.', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, villa_id, avatar, name, date, rating, content, created_at)
VALUES ('rev-2', 'harmony-villa-family-1', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop', 'Trần Anh Tú', '28/04/2026', 5, 'Nhân viên hỗ trợ rất chu đáo nhiệt tình. Villa sạch sẽ, phòng ốc thoáng mát view ngắm thông cực đẹp. Chắc chắn sẽ quay lại!', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, villa_id, avatar, name, date, rating, content, created_at)
VALUES ('rev-3', 'harmony-villa-luxury-1', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop', 'Chị Nguyễn Lan Anh', '15/06/2026', 5, 'View thung lũng mây đẹp xuất sắc. Điểm cộng lớn nhất là hồ bơi nước ấm vô cực rất sang trọng, tắm buổi chiều ngắm hoàng hôn siêu đẹp. Quản gia túc trực hỗ trợ gia đình 24/7.', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, villa_id, avatar, name, date, rating, content, created_at)
VALUES ('rev-4', 'harmony-villa-luxury-1', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&fit=crop', 'Anh Phạm Thế Hải', '02/06/2026', 5, 'Trải nghiệm nghỉ dưỡng tuyệt vời, xứng đáng từng xu. Phòng chiếu phim gia đình âm thanh nổi rất xịn, bàn Bi-a chơi cực đã. Nội thất rất đẳng cấp.', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, villa_id, avatar, name, date, rating, content, created_at)
VALUES ('rev-5', 'harmony-villa-family-2', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&fit=crop', 'Chị Mai Phương', '10/06/2026', 5, 'Phong cách cottage Bắc Âu rất dễ thương. Lò sưởi thật trong nhà đốt ấm cúng cực kỳ, cảm giác rất thơ mộng. Sân vườn nhiều hoa hồng ngoại nở rộ.', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, villa_id, avatar, name, date, rating, content, created_at)
VALUES ('rev-6', 'harmony-villa-family-2', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop', 'Anh Trần Hoàng Minh', '20/05/2026', 5, 'Thích hợp cho gia đình nhỏ tìm kiếm sự bình yên tĩnh lặng. Bếp tự phục vụ đầy đủ gia vị nấu ăn. Mọi ngóc ngách đều sạch sẽ tinh tươm.', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, villa_id, avatar, name, date, rating, content, created_at)
VALUES ('rev-7', 'harmony-villa-luxury-2', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop', 'Chị Lê Minh Hằng', '05/06/2026', 5, 'Kiến trúc đen tối giản obsidian cực kỳ độc đáo và chất lượng. Tối nhóm mình quây quản bên hố lửa trại chìm ngắm thung lũng đèn Trại Mát siêu đẹp. Kính thiên văn ngắm sao rất thú vị.', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, villa_id, avatar, name, date, rating, content, created_at)
VALUES ('rev-8', 'harmony-villa-luxury-2', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&fit=crop', 'Anh Hoàng Quốc Việt', '24/05/2026', 5, 'Dịch vụ trà chiều hoàng hôn rất chill. Villa trang bị nhà thông minh điều khiển tiện lợi. Phục vụ chuyên nghiệp 5 sao.', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, villa_id, avatar, name, date, rating, content, created_at)
VALUES ('rev-9', 'harmony-villa-mid-1', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&fit=crop', 'Chị Khánh Linh', '14/06/2026', 5, 'Villa Triệu Việt Vương giá cả vô cùng hợp lý so với chất lượng nhận được. Không gian yên tĩnh, gần hồ Tuyền Lâm. Sân nướng BBQ rộng rãi.', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, villa_id, avatar, name, date, rating, content, created_at)
VALUES ('rev-10', 'harmony-villa-mid-1', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop', 'Anh Vũ Văn Nam', '18/05/2026', 5, 'Phòng khách ấm cúng, thiết bị đồ gia dụng đầy đủ nấu ăn thoải mái. Rất thích hợp cho nhóm bạn trẻ khoảng 8-10 người đi nghỉ mát.', now())
ON CONFLICT (id) DO NOTHING;
