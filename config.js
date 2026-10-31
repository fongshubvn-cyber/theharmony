// ===== CẤU HÌNH – anh chỉ cần sửa file này =====
window.HARMONY_CONFIG = {
  BRAND: "The Harmony",
  LOGO_URL: "",                 // VD: "assets/logo.png" – để trống sẽ hiện chữ "The Harmony"
  HOTLINE: "0854 604 339",      // số chính hiển thị (Nghi)
  ZALO: "0854604339",           // số Zalo chính (không dấu cách)
  // Nút Zalo nổi góc màn hình: bấm vào hiện các số dưới đây (số đầu tiên = số chính)
  CONTACTS: [
    { name: "Nghi", role: "Số chính · tư vấn & đặt phòng", phone: "0854 604 339", zalo: "0854604339" },
    { name: "Phong", role: "Quản lý", phone: "0908 667 207", zalo: "0908667207" },
  ],
  SITE_URL: "",                 // VD: "https://theharmony.vn/" – dùng cho ảnh chia sẻ Zalo/Facebook

  // Lấy ở Supabase > Project Settings > API. Để trống = chạy chế độ DEMO
  SUPABASE_URL: "https://reyytwoivafzyvszrdwb.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_IZ4QlraeppOynrwIJlSjIg_5RtDJUSN",

  // ===== NỘI DUNG TRANG CHỦ =====
  // Chỉ điền số liệu THẬT. Ô nào để trống sẽ tự ẩn trên trang.
  PROOF: {
    rating: "",          // VD: "4.9"  (điểm Google/Facebook)
    rating_source: "",   // VD: "Google Maps"
    rating_count: "",    // VD: "120"  (số lượt đánh giá)
    guests_served: "",   // VD: "3.000+" (lượt khách đã phục vụ)
    years: "",           // VD: "5"    (số năm hoạt động)
  },
  // Đánh giá thật của khách (chép từ Google/Facebook/Zalo, có sự đồng ý của khách). Để [] sẽ ẩn mục này.
  TESTIMONIALS: [
    // { name: "Chị Lan", from: "TP.HCM", group: "Gia đình 12 người", villa: "My Villa Đống Đa", stars: 5, text: "…", source: "Google" },
  ],
  // Câu hỏi thường gặp – anh kiểm tra lại cho đúng chính sách thực tế
  FAQ: [
    { q: "Đặt villa như thế nào?", a: "Chọn căn bạn thích, bấm “Nhận báo giá” hoặc nhắn Zalo ngày nhận/trả phòng và số khách. Chúng tôi gửi báo giá chính thức và các căn còn trống." },
    { q: "Đặt cọc bao nhiêu?", a: "Đặt cọc 50% tổng tiền để giữ căn. Phần còn lại thanh toán khi nhận phòng." },
    { q: "Giờ nhận và trả phòng?", a: "Nhận phòng từ 14:00, trả phòng trước 12:00. Cần nhận sớm / trả muộn vui lòng báo trước để chúng tôi sắp xếp." },
    { q: "Huỷ phòng có mất cọc không?", a: "Chính sách huỷ tuỳ từng căn và thời điểm (ngày thường, cuối tuần, lễ Tết). Chúng tôi ghi rõ trong báo giá trước khi bạn đặt cọc." },
    { q: "Đi đông hơn số khách tiêu chuẩn được không?", a: "Được, trong giới hạn số khách tối đa của từng căn và có phụ thu cho khách vượt tiêu chuẩn." },
    { q: "Villa có bếp và chỗ nướng BBQ không?", a: "Phần lớn các căn có bếp đầy đủ dụng cụ và sân BBQ. Tiện ích từng căn ghi rõ trong trang chi tiết." },
  ],
};
