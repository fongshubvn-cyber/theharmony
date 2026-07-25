# villa-post — Nơi chuẩn bị dữ liệu villa để đăng lên website

Mỗi villa muốn đăng lên The Harmony sẽ có **một folder riêng** trong đây. Trong
folder đó gồm:

1. **Ảnh villa** — bất kỳ file `.jpg`, `.jpeg`, `.png`, `.webp` nào bạn chép vào.
   Ảnh xếp đầu tiên theo tên file (a → z) sẽ là ảnh đại diện, các ảnh còn lại
   vào album phụ. Muốn ảnh đại diện là ảnh nào thì đặt tên file đó bắt đầu
   bằng `1-`, ví dụ `1-mat-tien.jpg`, `2-phong-khach.jpg`, `3-ho-boi.jpg`...

2. **Một file `info.txt`** — nội dung villa, theo đúng cấu trúc trong
   [`_TEMPLATE/info.txt`](_TEMPLATE/info.txt). Copy file mẫu đó vào folder
   villa của bạn rồi điền thông tin thật vào.

Xem ví dụ đã điền sẵn (chỉ thiếu ảnh) tại [`vi-du-pine-hills/`](vi-du-pine-hills/).

## Cấu trúc folder

```
villa-post/
├── _TEMPLATE/              <- Copy folder này để tạo villa mới, đừng sửa trực tiếp
│   └── info.txt
├── ten-villa-cua-ban/      <- Tên folder tuỳ ý, không dấu, không cần trùng tên villa
│   ├── info.txt
│   ├── 1-mat-tien.jpg
│   ├── 2-phong-khach.jpg
│   └── 3-ho-boi.jpg
└── villa-thu-hai/
    ├── info.txt
    └── ...
```

## Các giá trị PHAN_KHUC hợp lệ

Phải gõ đúng một trong các mã sau (không dịch nghĩa, không viết hoa):

| Mã | Ý nghĩa |
|---|---|
| `villa-giadinh` | Villa Gia Đình |
| `villa-tamtrung` | Villa Tầm Trung |
| `villa-caocap` | Villa Cao Cấp |
| `home-giadinh` | Home Gia Đình |
| `home-nhomban` | Home Nhóm Bạn |

## Sau khi điền xong tất cả villa

Báo lại để bóc tách dữ liệu — sẽ có 2 bước:

1. Chạy script để đọc toàn bộ `villa-post/`, copy ảnh vào `asset/villa-post/`,
   và xuất ra file `villa-post-import.json` ở thư mục gốc dự án.
2. Vào trang **Quản Trị → tab Quản Lý Villa → nút "Nhập Hàng Loạt"**, chọn file
   `villa-post-import.json` vừa tạo — toàn bộ villa sẽ được thêm vào danh sách
   (không mất villa cũ, có thể làm lại nhiều lần khi có villa mới).

Villa nào thiếu trường trong `info.txt` sẽ dùng giá trị mặc định hợp lý và cần
vào trang Quản Trị chỉnh sửa lại thủ công sau khi nhập.
