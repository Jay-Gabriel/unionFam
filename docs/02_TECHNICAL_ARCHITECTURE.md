# 02 — Technical Architecture

## 1. Stack chốt cho MVP

| Layer | Lựa chọn | Lý do |
|---|---|---|
| Web | Next.js App Router + React + TypeScript strict | Một codebase UI/server, phù hợp streaming và Server Components |
| UI | Tailwind CSS + component primitives accessible | Nhanh, nhất quán, responsive |
| Form | React Hook Form + Zod | Validation đồng nhất client/server |
| Data/Auth | Supabase PostgreSQL + Auth + RLS | Khớp brief, ownership enforce tại DB |
| Data access | Supabase SSR client + SQL/RPC cho transaction | Session cookie đúng chuẩn; transaction phức tạp đặt tại DB function |
| AI | Vercel AI SDK + Gemini adapter + Zod schema | Streaming và structured output |
| Test | Vitest, Testing Library, Playwright | Unit/component/E2E |
| Logging | Structured server logger | Request correlation, redaction |

Không khóa số version trong tài liệu. Khi kickoff, agent chọn bản stable tương thích, commit lockfile và ghi versions thật vào README kỹ thuật.

### Runtime target

- Code chạy trên **Node.js runtime tiêu chuẩn** và tạo được production build độc lập; không phụ thuộc Vercel hosting/Edge runtime.
- “Vercel AI SDK” chỉ là thư viện orchestration, không đồng nghĩa phải deploy lên Vercel.
- Supabase được cấu hình qua environment variables; managed hay self-hosted đều dùng cùng contract nếu tương thích Auth/PostgREST/RLS.
- Domain/VPS, reverse proxy, process manager, TLS, backup và production deployment nằm ngoài scope; agent không thay đổi chúng.
- Không ghi file nghiệp vụ vào local filesystem vì filesystem runtime có thể không bền vững.

Environment contract tối thiểu (chỉ tên biến, không commit giá trị thật):

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY       # server-only, chỉ dùng nếu flow thật sự cần
GEMINI_API_KEY                  # server-only
AI_MODEL                        # server-only configuration
PROMPT_CONFIG_KEY_OR_REF        # server-only encrypted key/reference
APP_BASE_URL
```

Env validator phải từ chối khởi động khi thiếu biến bắt buộc và không bao giờ serialize biến server-only sang client.

## 2. Kiến trúc logical

```text
Browser
  ├─ Public/Auth UI
  └─ App UI
       │ session cookie + validated input
       ▼
Next.js server boundary
  ├─ Server Components: read models
  ├─ Server Actions: CRUD mutations
  ├─ Route Handler /api/chat: stream + idempotency
  ├─ Domain services: agency, life-map, experiment
  └─ AI orchestration: context → prompt → schema → persistence
       │                              │
       ▼                              ▼
Supabase Auth/PostgreSQL/RLS        Gemini API
       │
       └─ prompt config is fetched server-side through restricted access
```

## 3. Module boundaries đề xuất

```text
src/
  app/                     # routes, layouts, route handlers
  features/
    auth/
    questions/
    conversations/
    insights/
    life-profile/
    resources/
    gaps/
    experiments/
    reflections/
    learnings/
    progress/
    admin/
  server/
    auth/                  # get/require current user
    db/                    # clients, generated types, repositories
    ai/                    # provider, schemas, context, prompt pipeline
    domain/                # transactional business services
    security/              # rate limit, redaction, ownership guards
  shared/
    ui/
    validation/
    errors/
supabase/
  migrations/
  seed.sql                 # only non-secret dev data
tests/
  e2e/
```

UI không gọi Supabase table tùy ý. Read đơn giản có thể dùng authenticated server client; mutation nghiệp vụ đi qua Server Action/domain service để giữ invariant.

## 4. Request flows quan trọng

### 4.1 Send message

1. Client gửi `conversation_id`, `content`, `idempotency_key`.
2. Server xác thực session, validate length, rate limit, kiểm tra conversation ownership.
3. Transaction tạo user message + user statement nếu key chưa tồn tại.
4. Context builder lấy relevant questionnaire answers, recent messages, confirmed insights, active Life Profile, experiments/reflections/learnings theo token budget.
5. Prompt assembler lấy prompt version active ở server và ghép context có delimiter rõ.
6. AI provider stream assistant text; structured metadata được validate khi complete.
7. Server lưu assistant message, pending observation và next stage trong transaction.
8. Client nhận event `message.delta`, `message.complete`, `observation.created` hoặc `error`.

### 4.2 Accept observation

1. Client gửi decision + optional edited content + idempotency key.
2. Server/RPC lock row và kiểm tra owner/status `pending`.
3. Tạo confirmed insight với `source_observation_id` unique.
4. Cập nhật observation `accepted`, actor/time/edited content.
5. Trả insight mới; revalidate insight/Life Map views.

### 4.3 Confirm Life Map

1. User chỉnh draft.
2. Server validate schema và ownership.
3. Transaction lấy next Life Profile version, insert immutable snapshot, đánh dấu version trước không current.
4. Trả version current mới. Không overwrite version cũ.

### 4.4 Question Engine

1. Onboarding pin published `question_flow_version` cho member/session.
2. Server đọc answers và tính tập `eligible_question_ids` bằng branching rules deterministic.
3. Nếu Conversation Engine cần chọn câu tiếp, model chỉ được trả một ID trong tập này; server fallback về thứ tự deterministic khi ID sai/thiếu.
4. `saveAnswer` validate type/options, upsert idempotent và trả progress/next question.
5. Publish flow mới không thay câu hỏi của phiên đang làm.

### 4.5 Admin Dashboard

1. Server xác thực session và role `admin`; middleware chỉ redirect UX.
2. Query dùng field allowlist, pagination, sanitized error payload và mask answer/message preview.
3. Khi admin mở chi tiết user/session/answer, server yêu cầu reason ngắn và ghi audit trước khi trả dữ liệu.
4. Admin browser không nhận service-role key, prompt body hoặc raw provider payload.

## 5. Authentication và authorization

- Dùng cookie-based Supabase SSR session cho email/password và Google OAuth; callback chỉ redirect tới URL allowlist.
- Middleware chỉ giúp UX/redirect, không thay thế RLS.
- Mọi table user-owned có `user_id uuid not null` và RLS `auth.uid() = user_id` cho select/insert/update/delete phù hợp.
- `messages` được bảo vệ qua ownership trực tiếp bằng `user_id`, không chỉ join conversation, để policy đơn giản và audit dễ.
- Admin role không bypass RLS trực tiếp từ client. Admin read đi qua server-only allowlisted service có role check và access log.
- Service-role key chỉ ở server job thực sự cần thiết. Request của user ưu tiên DB client mang JWT của user để RLS vẫn có hiệu lực.
- Prompt config không được select bởi role `authenticated`; chỉ restricted server function/config service đọc được.

## 6. Prompt/IP boundary thực tế

Mục tiêu là ngăn prompt bị gửi xuống browser, lộ trong git/log và bị user thường truy cập. Không thể cam kết developer có quyền production hoặc runtime service account “tuyệt đối không thể xem” prompt. Để tăng bảo vệ:

- PO sở hữu prompt source và publish artifact/version qua quy trình riêng.
- Lưu encrypted prompt blob hoặc secret/config store; khóa giải mã chỉ có ở server runtime.
- Repository chỉ có schema/placeholder và prompt ID, không có methodology thật.
- Log `prompt_version`, hash và token count; không log prompt body.
- Tách quyền: developer không mặc định có production secrets/DB owner access.
- Mọi thay đổi prompt có version, `created_by`, `activated_at`, checksum và rollback reference.

`prompt_configs` là bảng cấu hình bảo mật, không tính vào 15 entity nghiệp vụ. Nếu chưa có secret store ở giai đoạn local, dùng environment-injected encrypted value; tuyệt đối không seed prompt thật.

## 7. Reliability và cost controls

- Idempotency unique theo `(user_id, operation, key)` hoặc unique key ngay trên entity phù hợp.
- Timeout LLM mục tiêu 45 giây; tối đa 1 retry server cho lỗi transient trước khi đã phát token, exponential backoff ngắn.
- Không auto-retry sau khi stream đã phát nội dung; client hiển thị retry có chủ đích.
- Giới hạn message đề xuất: 4.000 ký tự; output assistant: 1.500–2.000 tokens; context hard cap theo model đã chọn.
- Context priority: safety/system → active methodology/stage → current Life Map → confirmed insights → active experiments/reflections → recent messages.
- Khi vượt budget, tóm tắt deterministic từ structured data trước; không silently cắt system/safety.
- Rate limit mặc định pilot: 20 messages/user/hour và 100/day, có config; xác nhận quota thật trước pilot.
- Circuit breaker đơn giản khi provider quota/down; không tạo observation từ output chưa hoàn tất.

## 8. Error taxonomy

| Code | HTTP | Ý nghĩa | UX |
|---|---:|---|---|
| `AUTH_REQUIRED` | 401 | Chưa đăng nhập/session hết hạn | chuyển login, giữ return URL |
| `FORBIDDEN` | 403 | Không sở hữu tài nguyên | generic error, không lộ tồn tại |
| `NOT_FOUND` | 404 | Không tìm thấy | empty/not-found |
| `VALIDATION_ERROR` | 422 | Input sai | lỗi cạnh field |
| `CONFLICT` | 409 | State/duplicate/idempotency conflict | reload state |
| `RATE_LIMITED` | 429 | Vượt giới hạn | thời gian thử lại |
| `AI_SCHEMA_INVALID` | 502 | Output AI không hợp lệ sau repair | retry, không commit observation |
| `AI_PROVIDER_UNAVAILABLE` | 503 | Provider timeout/quota/down | giữ user message, retry later |
| `INTERNAL_ERROR` | 500 | Lỗi không dự kiến | request id, không lộ stack |

## 9. Quyết định cố ý hoãn

- Không event bus/queue/microservices cho MVP.
- Không vector DB khi structured context còn đủ.
- Không generic repository framework nặng.
- Không multi-provider automatic failover; chỉ interface mỏng để đổi provider sau này.
- Không optimistic update cho accept/confirm nếu có nguy cơ hiển thị trạng thái chưa commit.
