# The Harmony – Hướng dẫn cài đặt hệ thống lịch giá villa

## Gồm những gì
| File | Ai dùng | Cách vào |
|---|---|---|
| `index.html` | Tự chuyển | Mở tên miền là chuyển thẳng sang `villa.html` |
| `villa.html` | **Khách – trang đầu tiên** | Tìm villa theo ngày & số khách, xem **ngày trống / đã kín** từng căn, ảnh, quy định. **Không có giá**, có nút Zalo báo giá |
| `gioi-thieu.html` | Trang phụ | Giới thiệu The Harmony, villa nổi bật, câu hỏi thường gặp, mục mời đối tác. Vào từ nút "Giới thiệu" |
| `doi-tac.html` | Đối tác / sale | **Chỉ vào được bằng link riêng** anh tạo (VD `…/doi-tac.html#7a6yun9wf8hn7xi6`). Không cần tài khoản |
| `admin.html` | Anh | Đăng nhập bằng email + mật khẩu |
| `config.js` | Cấu hình | Logo, hotline, Zalo, khoá Supabase |
| `supabase/schema.sql` | Database | Tạo bảng + phân quyền |

Khi `config.js` chưa có khoá Supabase, hệ thống chạy **chế độ demo**:
tài khoản quản trị demo `admin@theharmony.vn` / `Harmony@2026`, dữ liệu 4 căn mẫu lưu trên trình duyệt.

## Cài đặt (khoảng 15 phút)

**1. Tạo database:** vào https://supabase.com → đăng ký → **New project** (region Singapore).

**2. Tạo bảng:** **SQL Editor → New query** → dán toàn bộ `supabase/schema.sql` → **Run**.

**3. Nối web với database:** **Project Settings → API** → sao chép **Project URL** và khoá **anon public** → dán vào `config.js`. Sửa luôn `HOTLINE`, `ZALO`, `LOGO_URL`.

**4. Tạo tài khoản quản trị của anh**
- Mở `admin.html` → **Lần đầu cài đặt? Tạo tài khoản quản trị** → nhập email + mật khẩu (từ 8 ký tự).
- **Tài khoản đầu tiên tự động là quản trị.** Nếu Supabase yêu cầu xác nhận email, mở email bấm xác nhận rồi đăng nhập.
- Sau đó vào Supabase → **Authentication → Sign In / Providers** → tắt **Allow new users to sign up**, để không ai tạo thêm tài khoản được nữa.
- Đổi mật khẩu bất cứ lúc nào bằng nút **Đổi mật khẩu** trên trang quản trị.

**5. Đưa lên website:** chép cả thư mục (giữ nguyên cấu trúc, **bỏ thư mục `demo/`**) vào website The Harmony. Mở tên miền, khách vào thẳng trang Villa (tìm căn, xem ngày trống).

## Nội dung trang chủ (trong `config.js`)
- `PROOF`: điểm đánh giá, số lượt đánh giá, số khách đã phục vụ, số năm hoạt động. **Chỉ điền số thật**; ô trống tự ẩn.
- `TESTIMONIALS`: 2–3 đánh giá thật của khách (chép từ Google/Facebook, có sự đồng ý của khách). Để trống thì mục này tự ẩn.
- `FAQ`: câu hỏi thường gặp. Anh kiểm tra lại đặt cọc, huỷ phòng, giờ nhận/trả phòng cho đúng thực tế.
- Ảnh chia sẻ Zalo/Facebook: `assets/og.jpg`. Khi lên web, đổi dòng `og:image` trong `villa.html` và `gioi-thieu.html` thành đường dẫn đầy đủ (VD `https://theharmony.vn/assets/og.jpg`).

## Link cho đối tác
- Trang quản trị → tab **Link đối tác** → **+ Tạo link mới** → nhập tên, SĐT → **Sao chép link** → gửi Zalo.
- Mỗi đối tác một link riêng: yêu cầu book ghi rõ đến từ ai, và xem được ai mở link lần gần nhất.
- **Khoá** link khi không hợp tác nữa hoặc lỡ bị lộ. Người có link sẽ thấy "Link không hợp lệ". Cần thì tạo link mới.
- Anh muốn xem trang đối tác như họ thấy: bấm **Xem như → Đối tác** trên thanh tiêu đề (chỉ hiện khi anh đã đăng nhập).

## Cách dùng hằng ngày
- **Thêm căn:** Danh sách căn → *+ Thêm căn* → thông tin, giá T2–T5, giá T6–CN, "Mở bán đến", ảnh. *Nhân bản* để tạo nhanh căn tương tự.
- **Giá lễ / Tết:** Lịch & giá → lọc nhóm căn → *Cập nhật hàng loạt* → khoảng ngày → *Đặt giá riêng* hoặc *Tăng %*.
- **Đánh dấu đã book:** chọn ô (hoặc bấm tiêu đề ngày / tên căn để chọn cả cột / hàng) → *Đã book*.
- **Yêu cầu từ đối tác:** tab Yêu cầu book → *Xác nhận* thì lịch tự chuyển sang Đã book.

## Đồng bộ lịch từ Google Sheet của chủ villa
Trang quản trị → tab **Nguồn Google Sheet** → **+ Thêm nguồn Sheet**:
1. Dán link Sheet (chủ nhà cần để chế độ *Bất kỳ ai có đường liên kết đều xem được*) → **Đọc thử Sheet**.
2. Kiểm tra các tab đã đọc (mỗi tháng 1 tab cũng được) và **màu ô = đã có khách** (mặc định: màu đỏ).
3. Ghép từng cột trên Sheet với 1 căn trên web, hoặc chọn **+ Tạo căn mới**. Cột không cần thì chọn *Bỏ qua*.
4. Chọn cộng giá cho đối tác (%, hoặc số tiền/đêm) → **Lưu & đồng bộ ngay**.

Hệ thống hiểu: ô tô đỏ = đã có khách · ô có giá (1tr5, 750k, 1.300, 9.500.000 đ…) = còn trống với giá đó · ô ghi chữ (VD “Sơn nhà”) = khoá · ô trống = chưa cập nhật.
Nếu chủ nhà đổi bố cục (mất cột đã ghép), nguồn chuyển sang **Cần kiểm tra** và không ghi dữ liệu cột đó cho tới khi anh ghép lại.
Lịch & giá của căn đã ghép do Sheet quyết định – đừng sửa tay trong tab Lịch & giá (sẽ bị ghi đè ở lần đồng bộ sau).

### Cài đặt máy chủ đồng bộ (1 lần)
1. Cài Supabase CLI (https://supabase.com/docs/guides/cli) → trong thư mục này chạy:
   `supabase login` → `supabase link --project-ref <PROJECT_REF>` → `supabase functions deploy sync-sheets`
   (thư mục `supabase/functions/` đã có sẵn mã; file `_shared/sheet-sync.js` là bản sao của `assets/sheet-sync.js`).
2. Mở `supabase/cron.sql`, thay `<PROJECT_REF>` và `<SERVICE_ROLE_KEY>`, chạy trong SQL Editor → tự đồng bộ **15 phút/lần**.
   Khoá service_role chỉ dán vào SQL Editor của Supabase, **không** dán vào `config.js` hay web.

## Màu người chốt
- Ngày đã book hiện **vòng màu ✕** thay cho con số. Mỗi màu là một người chốt.
- Quản trị đánh dấu "Đã book": mặc định **đỏ**; chọn màu + tên người chốt ở thanh dưới (VD Nam chốt → Xanh dương).
- Ngoài 9 màu có sẵn còn có **vòng màu** (nút cầu vồng cuối hàng) để chọn bất kỳ màu nào.
- Link đối tác: anh đặt màu gợi ý khi tạo link. **Lần đầu đối tác gửi yêu cầu book, màu họ chọn được khoá cố định vào link đó đến hết vòng đời** (biểu tượng 🔒). Sau đó cả đối tác lẫn quản trị đều không đổi được – database cũng chặn việc đổi.
- Bấm *Xác nhận* yêu cầu thì lịch hiện đúng màu của link.
- Nguồn Google Sheet: chọn màu riêng cho ngày kín của nguồn đó.
- Khách chỉ thấy vòng màu, không thấy tên người chốt; đối tác không thấy tên đối tác khác.

## Cập nhật database
Mỗi khi nhận bản mới, chạy lại toàn bộ `supabase/schema.sql` trong SQL Editor (chạy lại nhiều lần không mất dữ liệu). Bản này thêm cột `color_locked` (khoá màu theo link) và hàm `public_availability` để khách xem ngày trống.

## Bảo mật
- Giá chỉ nằm trong database. Trang khách chỉ nhận ngày trống / đã kín qua hàm `public_availability`, không bao giờ nhận giá.
- Đối tác chỉ lấy được giá khi có mã link đang mở. Database kiểm tra mã ở mọi lần tải.
- Trang quản trị cần đăng nhập. Nút "Xem như" chỉ hiện với tài khoản quản trị.
- Link đối tác giống chìa khoá: ai cầm link đều xem được giá, nên chỉ gửi đúng người và khoá khi cần.
