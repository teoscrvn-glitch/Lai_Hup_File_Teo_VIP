# Lại Húp File — Téo Studio v9

## Cấu trúc
- `frontend/` — Cloudflare Pages site.
- `cloudflare/worker.js` — API Worker.
- `cloudflare/schema.sql` — D1 schema.
- `cloudflare/wrangler.toml` — Worker config.

## Chạy demo
Mở `frontend/index.html` trên trình duyệt/Acode. Demo vẫn có localStorage fallback.

## Chạy thật
1. Tạo D1 `teo-studio-db` và chạy `cloudflare/schema.sql`.
2. Điền `database_id` trong `cloudflare/wrangler.toml`.
3. Đặt secrets: `GOOGLE_CLIENT_ID`, `SESSION_SECRET`, `LINK4M_API`.
4. Đặt `ADMIN_EMAIL` là email Google quản trị.
5. Deploy Worker.
6. Sửa `frontend/assets/js/config.js`: `API_BASE_URL` = URL Worker và `GOOGLE_CLIENT_ID` = OAuth Client ID.
7. Deploy `frontend/` lên Cloudflare Pages.

Bản v9 đã có backend endpoints cho Google auth, users, Link4M task, video submit/dedupe, nguồn, rút tiền và Admin duyệt. Việc tự động đọc view TikTok/YouTube vẫn cần một nguồn xác minh hợp lệ trước khi cộng mốc tự động.
