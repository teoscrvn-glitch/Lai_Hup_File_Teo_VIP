# Téo Studio v9 — Cloudflare backend

## Kiến trúc
- Pages: frontend tĩnh.
- Worker: API + auth + điểm + duyệt.
- D1: users/products/video/points/withdrawals/source.
- Không dùng Firebase, không cần R2 ở giai đoạn này.

## 1) Tạo D1
Tạo database `teo-studio-db`, sau đó chạy `schema.sql` trong D1 Console.
Lấy `database_id` và điền vào `wrangler.toml`.

## 2) Secrets
Trong Worker/Cloudflare dashboard tạo:
- `GOOGLE_CLIENT_ID` = OAuth Web Client ID của Google.
- `SESSION_SECRET` = chuỗi bí mật dài, ngẫu nhiên.
- `LINK4M_API` = API Link4M của bạn.

`ADMIN_EMAIL` trong wrangler.toml là email Google được phép vào API Admin.

## 3) Google login
Google OAuth thật cần tạo OAuth Client ID loại Web application và khai báo domain Pages trong Authorized JavaScript origins. Frontend v9 có sẵn luồng nhận Google ID token và gửi sang `/api/auth/google`.

## 4) Deploy Worker
Nếu dùng Wrangler:
`npx wrangler deploy`

Sau deploy, lấy URL Worker và đặt vào `frontend/assets/js/config.js`.

## 5) Deploy Pages
Đưa thư mục `frontend/` lên Cloudflare Pages/GitHub. URL Pages không đổi khi dữ liệu D1 thay đổi.

## 6) Điểm/video
Video chỉ nhận TikTok/YouTube và khóa theo `(user_id, platform, canonical_video_id)`. Lịch sử mốc nằm ở `video_reward_history`. Phần tự đọc view theo lịch cần nối nguồn xác minh TikTok/YouTube trước khi bật cộng tự động; Admin vẫn có thể duyệt thủ công.

## 7) Email
`email_queue` lưu email cần gửi. Muốn gửi Gmail/email thật cần nối một email provider/API vào Worker; không nên gửi SMTP trực tiếp từ frontend.
