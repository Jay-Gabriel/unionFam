# UNIONFAM Life Lab MVP — Implementation Documentation

Bộ tài liệu này chuyển brief ban đầu thành đặc tả đủ chi tiết để một AI coding agent có thể triển khai MVP trong **10 ngày làm việc / 2 tuần**. Phạm vi kết thúc ở mã nguồn và bản build đã kiểm thử; **không bao gồm deploy, cấu hình domain hoặc VPS**.

## Đọc theo thứ tự

1. [Project Charter](docs/00_PROJECT_CHARTER.md) — mục tiêu, phạm vi, giả định, nguyên tắc ra quyết định.
2. [Product Requirements](docs/01_PRODUCT_REQUIREMENTS.md) — 12 hạng mục khách hàng, route map, luồng nghiệp vụ và yêu cầu chức năng.
3. [Technical Architecture](docs/02_TECHNICAL_ARCHITECTURE.md) — stack, module, bảo mật và các quyết định kiến trúc.
4. [Data & API Specification](docs/03_DATA_AND_API_SPEC.md) — data model mở rộng cho Question/Life Profile/Admin, RLS, contract API và lỗi.
5. [AI Conversation Specification](docs/04_AI_CONVERSATION_SPEC.md) — state machine, structured output, permission và context injection.
6. [Implementation Plan](docs/05_IMPLEMENTATION_PLAN.md) — backlog P0 theo ngày, dependency, checkpoint và Definition of Done.
7. [Test & Acceptance](docs/06_TEST_AND_ACCEPTANCE.md) — test matrix, UAT, tiêu chí bàn giao.
8. [AI Execution Guide](docs/07_AI_EXECUTION_GUIDE.md) — cách giao bộ tài liệu này cho AI thực thi an toàn, có kiểm chứng.
9. [Requirements Traceability](docs/08_REQUIREMENTS_TRACEABILITY.md) — đối chiếu yêu cầu khách hàng với thiết kế, ticket và test nghiệm thu.
10. [Customer Input & Gap Analysis](docs/09_CUSTOMER_INPUT_GAP_ANALYSIS.md) — những gì đã chốt từ ảnh khách gửi và phần còn thiếu được xử lý thế nào.
11. [Week 1 Execution Plan](docs/10_WEEK_1_EXECUTION_PLAN.md) — kế hoạch chi tiết Ngày 1–5, acceptance gate và prompt giao AI theo từng lượt.
12. [Week 1 Remediation & Supabase Plan](docs/11_WEEK_1_REMEDIATION_SUPABASE_PLAN.md) — kế hoạch sửa Auth/RLS/persistence thật, test security và gate trước khi đẩy migration lên Supabase.
13. [Technical RC Status](docs/12_TECHNICAL_RC_STATUS.md) — những gì đã chạy thật, kết quả kiểm chứng và các gate `PENDING_PO`.
14. [Blueprint 1 Conversation Playbook](docs/14_BLUEPRINT_1_CONVERSATION_PLAYBOOK.md) — policy hội thoại dài hạn, thang đào sâu và nhịp tạo giá trị 12 tháng.
15. [Admin Access Link](docs/15_ADMIN_ACCESS_LINK.md) — link bearer mở thẳng khu vực quản trị bằng session Supabase thật.

## Nguồn và mức độ chắc chắn

Tài liệu được lập từ:

- `/home/jay/Downloads/Unionfam_LifeLab_MVP_Plan.md`
- `/home/jay/Downloads/Giai_phap_ky_thuat_MVP_LifeLab.pdf`
- Ba ảnh yêu cầu khách hàng cung cấp ngày 28/08/2026: bảng 12 hạng mục và mockup Dashboard Life Lab.

Input mới đã chốt Google Auth, Question Engine, Life Profile Engine, dashboard cá nhân hóa, AI Reflection và Admin Dashboard. Blueprint 1 hiện đã được chuẩn hóa thành policy hội thoại server-side trong [Blueprint 1 Conversation Playbook](docs/14_BLUEPRINT_1_CONVERSATION_PLAYBOOK.md). Flow 89 trang, prompt/methodology đầy đủ, rule chấm điểm và asset thiết kế gốc vẫn cần product owner duyệt riêng; không tự suy đoán các phần đó từ fixture.

## Kết quả bàn giao mong đợi

- Web app responsive chạy được ở local và production build thành công.
- Email/Google authentication, RLS, role admin và dữ liệu tách biệt giữa người dùng.
- Question Engine chạy bằng question graph có version, lưu câu trả lời và resume được.
- Adaptive conversation có output JSON được validate.
- AI observation luôn chờ người dùng xác nhận trước khi thành insight.
- Life Profile/Life Design Map, Resources, Progress, Experiments, Reflections và Learnings hoạt động end-to-end.
- Admin xem user/session/answer/error theo quyền, có audit và không lộ prompt/secrets.
- Migration, seed dữ liệu phi nhạy cảm, test tự động, tài liệu setup và UAT evidence.
- Không đưa methodology/prompt bí mật, service-role key hoặc dữ liệu người dùng vào repository/log.

## Chạy local

```bash
npm install
cp .env.example .env.local
# điền URL + publishable/anon key; service-role/Gemini chỉ ở server
npm run dev
```

Nếu dùng Supabase local, khởi động CLI rồi chạy migration/seed:

```bash
npx supabase start
npx supabase migration up --local --yes
npm run typecheck && npm run lint && npm test
```

`AUTH_REQUIRED=false` dành cho local preview. Khi `DEV_PREVIEW_AUTH=true` (mặc định trong `.env.example`), server tự tạo một tài khoản preview nội bộ và cấp session cookie để các API conversation/onboarding/question chạy end-to-end mà không cần bật provider email/Google. Đây chỉ là tiện ích phát triển; trước production phải cấu hình Auth/provider và đặt `AUTH_REQUIRED=true`. Xem [Technical RC Status](docs/12_TECHNICAL_RC_STATUS.md) để biết các credential/input còn chờ khách.

## Chạy bản thử không có Supabase

Nếu Vercel chưa có Supabase nhưng đã có `GEMINI_API_KEY`, thêm biến `DEMO_MODE=true` cho **Production** (và **Preview** nếu cần), sau đó tạo deployment mới. Middleware sẽ bỏ qua Auth/Supabase; Gemini vẫn trả lời trong cuộc trò chuyện và lịch sử được lưu trong `localStorage` của trình duyệt. Life Map, onboarding cloud và các dữ liệu người dùng không được lưu trên máy chủ ở chế độ này. Khi triển khai bản thật, xóa `DEMO_MODE` hoặc đặt `DEMO_MODE=false`, cấu hình lại Supabase và bật `AUTH_REQUIRED=true`.

## Bật đăng nhập Google với Supabase

Luồng OAuth đã có sẵn trong `/auth` và `/auth/callback`. Khi dùng bản thật, cấu hình các biến Vercel sau rồi tạo deployment mới:

```env
DEMO_MODE=false
AUTH_REQUIRED=true
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true
NEXT_PUBLIC_ENABLE_EMAIL_AUTH=false
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
APP_BASE_URL=https://union-fam.vercel.app
```

Trong Supabase **Authentication → Providers → Google**, bật provider và dán Google OAuth Client ID/Secret. Trong **Authentication → URL Configuration**, đặt Site URL là `https://union-fam.vercel.app` và thêm `https://union-fam.vercel.app/auth/callback**` cùng callback local `http://localhost:3000/auth/callback**`. Trong Google Cloud, tạo OAuth client loại **Web application**, thêm origin của app (`https://union-fam.vercel.app`, và `http://localhost:3000` khi phát triển), rồi thêm đúng callback URL Supabase hiển thị trong trang Google provider (thường là `https://<project-ref>.supabase.co/auth/v1/callback`). Không đưa Client Secret hoặc service-role key vào mã nguồn hay chat.

## Đăng nhập quản trị viên bằng email/mật khẩu

Admin dùng màn hình riêng tại `/auth/admin`; luồng này không hiển thị Google và không phụ thuộc `NEXT_PUBLIC_ENABLE_EMAIL_AUTH`. Sau khi Supabase xác thực email/mật khẩu, ứng dụng còn kiểm tra role `admin`; tài khoản không có role này sẽ bị đăng xuất ngay.

1. Trong Supabase **Authentication → Providers → Email**, bật đăng nhập email/password.
2. Trong **Authentication → Users**, tạo tài khoản admin bằng email và mật khẩu mạnh; bật **Auto Confirm User** hoặc xác nhận email trước lần đăng nhập đầu tiên.
3. Cấp role `admin` cho đúng user bằng một admin/operator hiện có. Nếu đây là admin đầu tiên, chạy một lần trong Supabase SQL Editor (thay email bằng email thật):

   ```sql
   insert into public.user_roles (user_id, role, granted_by)
   select id, 'admin', id
   from auth.users
   where email = 'admin@example.com'
   on conflict (user_id, role) do nothing;
   ```

4. Mở `https://union-fam.vercel.app/auth/admin` và đăng nhập. Không lưu mật khẩu trong `.env`, mã nguồn, README hoặc tin nhắn.

`NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` chỉ điều khiển nút Google cho người dùng thường. Có thể giữ `NEXT_PUBLIC_ENABLE_EMAIL_AUTH=false` nếu không muốn mở form email đăng ký cho thành viên; màn hình admin vẫn dùng được email/password. Sau khi thay biến môi trường hoặc provider trên Vercel, tạo deployment mới rồi kiểm tra cả `/auth/admin` và `/admin`.

## Link vào Admin không cần hiện màn hình đăng nhập

Nếu AI/operator cần mở thẳng bảng quản trị, có thể dùng bearer link riêng tại `/auth/admin-link`. Link này không nhận diện admin từ query tùy ý và không bật chế độ admin giả: server kiểm tra khóa bí mật, tìm đúng tài khoản đã có role `admin`, tạo token magic-link một lần qua Supabase rồi lưu **session thật** vào cookie phiên Supabase trước khi chuyển tới `/admin`.

1. Tạo một user Supabase đã xác nhận email và cấp role `admin` như phần trên.
2. Trong Vercel → **Settings → Environment Variables**, thêm cho **Production** (và Preview nếu thật sự cần):

   ```env
   ADMIN_LINK_EMAIL=admin@example.com
   ADMIN_ACCESS_KEY=<chuỗi ngẫu nhiên dài ít nhất 24 ký tự>
   ```

   Có thể tạo khóa URL-safe bằng `openssl rand -hex 32`. Không đặt hai biến này dưới tiền tố `NEXT_PUBLIC_`.
3. Redeploy. Mở:

   ```text
   https://union-fam.vercel.app/auth/admin-link?key=<ADMIN_ACCESS_KEY>
   ```

   Người mở link sẽ vào thẳng `/admin`, không qua Google hay form mật khẩu. `/auth/admin` vẫn là đường đăng nhập dự phòng.

 Link là **bearer credential**: bất kỳ ai có URL đều có quyền admin. Không gửi qua chat công khai, không nhúng vào mã nguồn, và đổi `ADMIN_ACCESS_KEY` rồi redeploy ngay nếu bị lộ. Nếu nhận `ADMIN_LINK_NOT_CONFIGURED` hoặc `ADMIN_LINK_UNAVAILABLE`, kiểm tra service-role key, email Auth đã tồn tại/xác nhận, role `admin`, Email provider và deployment mới.
