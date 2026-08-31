# 12 — Technical RC status

Ngày cập nhật: 31/08/2026

## Đã hoàn tất trong repository

Đây là technical MVP/RC chạy end-to-end trên Supabase, không bao gồm deploy:

- App shell Life Lab, landing sanctuary và lazy Three.js progressive enhancement với poster/CSS fallback.
- Auth boundary, onboarding/consent, logout và callback redirect an toàn.
- Question Engine versioned: published flow, answer validation, branching, resume/progress và idempotency.
- Conversation persistence: tạo/reload session, sequence message chống race, SSE response, retry sau provider failure.
- Gemini adapter: structured JSON/Zod, allowlist `nextQuestionId`, context budget, safety/permission gate, timeout và deterministic provider khi chưa cấu hình key.
- User Agency: observation ở trạng thái `pending`; accept/edit/reject atomic qua RPC, đúng một confirmed insight và evidence message.
- Life Profile draft/confirm/version history; sáu dimension, Desire/Escape/Life Vision và source ownership.
- Resources, Gaps, Financial Life, Progress, Experiments, Reflections và Learnings có API/UI persist thật.
- Admin overview + user detail: service-role chỉ ở server, field allowlist, masked email, bắt buộc reason và access audit.
- Rate limit MVP, error/AI run log best-effort, migration forward-only, seed trung tính và generated database types.

## Đã kiểm chứng

Các lệnh sau đã chạy xanh ở local:

```bash
npm run lint
npm run typecheck
npm test
set -a; source .env.local; set +a; npm test -- --run tests/integration
npx supabase migration up --local --yes
npx supabase db lint --local
npm run build
```

Integration test dùng hai member JWT/admin JWT; domain RPC test kiểm tra concurrent Life Profile idempotency và evidence ownership. Không đọc hoặc commit giá trị secret từ `.env.local`.

## Những phần chưa thể tuyên bố đã nghiệm thu

Các mục sau cần input/quyền từ phía khách hoặc operator, nên vẫn là `PENDING_PO`:

1. Flow/methodology 89 trang, prompt/safety copy và rule đánh giá thật chưa được bàn giao; seed hiện mang mã `dev-placeholder`.
2. Google OAuth production client ID/secret và redirect allowlist của domain thật.
3. Gemini production key, model/quota và bộ case đánh giá nội dung.
4. Admin operator cần được cấp role `admin` qua kênh bảo mật.
5. Playwright browser/UAT trên domain thật; repository hiện có unit + Supabase integration gate, chưa giả vờ ghi E2E pass.

## Kích hoạt production sau khi khách bàn giao

1. Điền biến môi trường server trong `.env.local`/VPS theo `.env.example`; không đưa service-role/Gemini key vào client.
2. Chạy migration forward-only trên project Supabase đã được duyệt và kiểm tra RLS.
3. Cấu hình Google provider trong Supabase Auth, cập nhật `APP_BASE_URL`/redirect allowlist.
4. Đặt `AUTH_REQUIRED=true`; chỉ bật `NEXT_PUBLIC_ENABLE_EMAIL_AUTH`/`NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` sau khi provider đã được kiểm tra.
5. Import flow thật qua pipeline version/checksum riêng, chạy AI eval + UAT rồi mới pilot.

## Giới hạn có chủ đích

- Rate limit hiện là process-local; khi chạy nhiều instance cần thay bằng Redis/Upstash.
- Three.js là decorative layer; mobile, reduced-motion, save-data, WebGL lỗi hoặc thiết bị yếu dùng poster/static path.
- Admin P0 read-only; không có impersonation hay chỉnh prompt/confirmed insight từ browser.

## Local preview không cần provider đăng nhập

Đặt `AUTH_REQUIRED=false` và `DEV_PREVIEW_AUTH=true`. Request đầu tiên tới API sẽ bootstrap tài khoản `preview@lifelab.test` bằng service-role ở server, đăng nhập qua cookie HttpOnly và dùng cùng session cho conversation, onboarding, question và các màn hình persist khác. Tắt cơ chế này bằng `DEV_PREVIEW_AUTH=false`; không bật nó trên môi trường public/staging. Tài khoản preview chỉ phục vụ kiểm thử, không phải luồng đăng nhập sản phẩm.
