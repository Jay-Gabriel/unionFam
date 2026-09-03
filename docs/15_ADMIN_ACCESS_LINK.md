# Admin access link

Life Lab vẫn giữ đăng nhập email/mật khẩu tại `/auth/admin` cho người quản trị. Ngoài ra có thể cấp một link riêng cho AI/operator mở thẳng bảng admin mà không hiện màn hình đăng nhập.

## Cách hoạt động

`GET /auth/admin-link?key=...` là một bearer credential. Route chỉ tiếp tục khi:

- `ADMIN_ACCESS_KEY` khớp bằng so sánh constant-time và dài tối thiểu 24 ký tự;
- `ADMIN_LINK_EMAIL` trỏ tới user Auth đã tồn tại;
- user đó có role `admin` trong `public.user_roles`.

Server dùng service-role client để tạo magic-link token một lần, sau đó xác minh token bằng server Supabase client. Session Supabase thật được ghi vào cookie phiên Supabase; vì vậy middleware, RLS và `admin_access_logs.admin_id` vẫn hoạt động như khi đăng nhập bình thường. Không có `?admin=true` và không tin bất kỳ user ID nào do client gửi lên.

## Cấu hình Vercel

Trong **Settings → Environment Variables**, thêm vào Production (Preview chỉ khi cần):

```env
ADMIN_LINK_EMAIL=admin@example.com
ADMIN_ACCESS_KEY=<openssl rand -hex 32>
```

Các biến bắt buộc khác vẫn là `NEXT_PUBLIC_SUPABASE_URL`, publishable/anon key và `SUPABASE_SERVICE_ROLE_KEY`. Sau khi lưu biến phải redeploy.

Mở link:

```text
https://union-fam.vercel.app/auth/admin-link?key=<ADMIN_ACCESS_KEY>
```

Nếu email/role chưa đúng, route trả `ADMIN_LINK_NOT_CONFIGURED`. Nếu Supabase/service-role/provider lỗi, route trả `ADMIN_LINK_UNAVAILABLE`. Khóa sai trả 404 để không tiết lộ endpoint.

## Vận hành an toàn

- Ai có URL đều có toàn quyền admin; coi URL như mật khẩu.
- Không đưa URL vào repository, prompt public, screenshot, analytics hoặc log ứng dụng.
- Đổi `ADMIN_ACCESS_KEY` và redeploy khi link có khả năng bị lộ.
- Dùng `/auth/admin` cho người cần đăng nhập có kiểm soát; link chỉ nên dùng cho automation/AI có kênh bảo mật.
- Không bật link bằng `DEMO_MODE`; production phải dùng Supabase Auth thật và `AUTH_REQUIRED=true`.
