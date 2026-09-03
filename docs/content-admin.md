# Tài khoản biên tập kịch bản AI

Tính năng này tạo một tài khoản `content_admin` riêng cho việc quản lý kịch bản của Life Lab. Tài khoản này không được xem danh sách người dùng, hội thoại hay dữ liệu vận hành; chỉ quản lý thư viện kịch bản AI.

## Bật trên Supabase

Chạy migration mới trong thư mục `supabase/migrations`:

```bash
npx supabase link --project-ref <SUPABASE_PROJECT_REF>
npx supabase db push
```

Migration tạo bảng `ai_script_documents`, RLS và hàm publish an toàn. Biến môi trường server bắt buộc:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (hoặc publishable key tương ứng)
- `SUPABASE_SERVICE_ROLE_KEY` — chỉ lưu ở server/Vercel, tuyệt đối không dùng `NEXT_PUBLIC_`
- `GEMINI_API_KEY`

Sau khi thêm/sửa biến trên Vercel, cần redeploy production.

## Tạo tài khoản quản trị viên (đăng nhập trực tiếp)

Tài khoản quản trị viên đăng nhập bằng email và mật khẩu tại `/auth/admin`, không đi qua Google. Supabase vẫn là nơi xác thực; ứng dụng chỉ cho vào `/admin` khi tài khoản có role `admin`.

1. Bật **Authentication → Providers → Email** trong Supabase.
2. Tạo user tại **Authentication → Users** bằng email và mật khẩu mạnh; xác nhận email hoặc bật auto-confirm.
3. Cấp role `admin` cho user bằng admin/operator hiện có. Với admin đầu tiên, chạy lệnh một lần trong SQL Editor (thay email thật):

   ```sql
   insert into public.user_roles (user_id, role, granted_by)
   select id, 'admin', id
   from auth.users
   where email = 'admin@example.com'
   on conflict (user_id, role) do nothing;
   ```

4. Mở `/auth/admin` để đăng nhập. Không đặt mật khẩu trong mã nguồn hay biến môi trường.

## Tạo tài khoản biên tập

1. Tài khoản muốn làm biên tập viên đăng nhập Google (hoặc email/password nếu đã bật) vào Life Lab ít nhất một lần để tạo user trong Supabase Auth.
2. Admin mở `/admin`, tìm tài khoản đó và bấm **Cấp quyền biên tập**.
3. Tài khoản biên tập tải lại ứng dụng, mở avatar → **Thư viện kịch bản AI** hoặc truy cập `/content-admin`.

Admin vẫn có toàn quyền và cũng truy cập được thư viện này. Khi không còn cần quyền, admin bấm **Gỡ quyền biên tập** trong cùng bảng người dùng.

## Quy trình kịch bản

- Tạo bản nháp bằng cách dán nội dung hoặc tải `.docx`, `.txt`, `.md` (tối đa 2 MB; nội dung tối đa 60.000 ký tự).
- Có thể sửa tiêu đề, mô tả và nội dung khi bản nháp chưa publish.
- **Đăng áp dụng** sẽ archive bản publish cũ cùng `script_key` và đưa bản mới vào hiệu lực.
- **Lưu trữ** gỡ bản khỏi hiệu lực.
- Chat chỉ nạp các bản `published` (tối đa 8 tài liệu và khoảng 18.000 ký tự mỗi lượt), vì vậy bản nháp không ảnh hưởng người dùng.

Nếu API trả `AUTH_REQUIRED`, tài khoản chưa đăng nhập. Nếu trả `CONTENT_ADMIN_REQUIRED`, admin chưa cấp đúng role; nếu trả lỗi cấu hình, kiểm tra migration và `SUPABASE_SERVICE_ROLE_KEY` trên môi trường đang chạy.
