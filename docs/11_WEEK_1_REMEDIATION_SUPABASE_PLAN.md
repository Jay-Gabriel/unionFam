# 11 — Week 1 Remediation & Supabase Integration Plan

## 1. Mục tiêu

Biến bản Week 1 hiện tại từ UI/mock technical demo thành vertical slice chạy thật với Supabase:

- Supabase Auth email/password và Google OAuth dùng session được xác minh server-side.
- Role `admin` lấy từ database, không nhận từ request hoặc cookie tự khai.
- Question Engine, conversation, messages, observations và insights được persist trong PostgreSQL.
- RLS và foreign-key ownership ngăn đọc, sửa hoặc gắn dữ liệu chéo user.
- Gemini/mock provider đi qua cùng contract; structured output và question allowlist được enforce.
- User Agency decision gọi transaction/RPC thật, có idempotency và concurrency safety.
- DB integration và E2E chứng minh các invariant; không dùng JavaScript simulation làm bằng chứng RLS.

Thời lượng mục tiêu: **3 ngày remediation** trước khi bắt đầu Week 2. Không deploy app/domain/VPS. Remote `db push` chỉ được chạy sau Local Security Gate.

## 2. Baseline hiện tại

### Đã có thể giữ lại

- UI shell, routes, Dashboard và conversation/question components.
- 15 business entities và support-table draft.
- SSE event contract ban đầu.
- Zod schema strict cơ bản và deterministic mock provider.
- Migration/seed placeholder và unit-test skeleton.
- `.env.local` đã có Supabase URL + publishable/anon key.

### Blocker phải loại bỏ

- `/api/auth/session` chấp nhận credentials/role bất kỳ và phát cookie giả.
- Middleware/session chỉ kiểm tra sự tồn tại/nội dung cookie tự đặt.
- Question answers lưu trong biến memory và cho phép `guest-user`.
- Chat dùng answers/insights hard-code, không ghi messages/observations.
- Observation decision dùng fake `insight-${Date.now()}`, không gọi RPC.
- Branch evaluator trả tất cả questions; chat truyền question allowlist rỗng.
- RLS test chỉ mô phỏng bằng JavaScript.
- Chưa có Supabase SSR clients, generated DB types, Playwright hoặc DB integration suite.

## 3. Guardrails bắt buộc

- Không đọc/in/log giá trị `.env.local`; chỉ kiểm tra tên biến và trạng thái configured/placeholder.
- `.env.example` chỉ chứa placeholder, không chứa project URL/key thật.
- Không commit `.env.local`, database password, personal access token, service-role key, Gemini key hoặc OAuth secret.
- Không dùng service-role client cho request member. Member mutations dùng SSR client mang JWT user để RLS hoạt động.
- Không tin `user_id`, role, email hoặc ownership từ request body/cookie tự tạo.
- Không dùng `getSession()`/cookie presence như bằng chứng authorization; server phải xác minh user bằng Supabase Auth.
- Không sửa migration đã được remote ghi nhận. Nếu migration history trống có thể sửa initial migration; nếu đã applied phải tạo forward migration mới.
- Không chạy `supabase db reset --linked`.
- Không chạy `supabase db push` thật trước Gate G4 và xác nhận của người sở hữu project.
- Không tự bịa flow 89 trang; fixture luôn mang code `dev-placeholder`.
- Không bắt đầu Week 2 Life Profile/Dashboard persistence trước khi G5 pass.

## 4. Kế hoạch 3 ngày

## Ngày R1 — Supabase foundation, migration security và Auth thật

### R01 — Làm sạch secret/config contract

- Đổi `.env.example` về placeholder.
- Giữ `.env.local` ignored; xác minh Git history không chứa secret cũ.
- Thêm env validation: URL/publishable key bắt buộc; service-role/Gemini optional theo feature, nhưng placeholder không được coi là configured.
- Ignore/remove khỏi tracking `*.tsbuildinfo` theo quy trình Git an toàn.

Acceptance:

- Secret scan xanh.
- App từ chối khởi động với Supabase public env thiếu/sai.
- Không in giá trị key trong test/log/report.

### R02 — Supabase CLI và generated types

- Nếu thiếu, chạy `npx supabase init` để tạo `supabase/config.toml`.
- Link remote project nhưng chưa push migration.
- Kiểm tra remote migration history và ghi decision: `initial-not-applied` hoặc `forward-fix-required`.
- Dùng local Supabase để chạy migration từ DB sạch.
- Generate DB types vào `src/types/database.generated.ts`.

Verification:

```bash
npx supabase start
npx supabase db reset --local
npx supabase gen types typescript --local
```

Generated types phải được app sử dụng, không chỉ tạo file cho đủ checklist.

### R03 — Supabase SSR client boundaries

Tạo module rõ ràng:

```text
src/lib/supabase/client.ts       # createBrowserClient, publishable key
src/lib/supabase/server.ts       # createServerClient, Next cookies
src/lib/supabase/middleware.ts   # refresh/validate auth session
src/server/auth/current-user.ts  # requireUser / requireAdmin
```

Rules:

- Browser client dùng publishable key.
- Server client cho member vẫn dùng publishable key + cookie JWT, không dùng service role.
- `requireUser` gọi API xác minh user server-side tương thích SDK version đã khóa.
- `requireAdmin` lấy `user_roles` bằng verified user ID; không đọc role cookie.

### R04 — Harden migration/RLS

Sửa bằng initial migration hoặc forward migration tùy R02:

1. Thêm `CHECK` cho status/role/decision/dimension/answer type quan trọng.
2. Thêm unique idempotency indexes cho answers/messages/decisions.
3. Enforce parent ownership bằng composite key/FK hoặc `WITH CHECK EXISTS`, tối thiểu:
   - messages → conversation cùng `user_id`.
   - user statements → conversation/message cùng `user_id`.
   - observations → conversation/assistant message cùng `user_id`.
   - insight → observation cùng `user_id`.
   - resource/gap → source insight cùng `user_id`.
   - experiment → gap cùng `user_id`.
   - reflection → experiment cùng `user_id`.
   - learning → reflection cùng `user_id`.
4. Member chỉ SELECT observations/confirmed insights/confirmed profile versions; mutation đi qua audited transaction/RPC.
5. Support/error/admin tables RLS deny-by-default.
6. `decide_observation_atomic`:
   - Không nhận `p_user_id`; derive `v_user_id := auth.uid()`.
   - Reject khi UID null.
   - Validate decision enum `accepted|rejected` và edited content length.
   - Lock row, check pending/owner.
   - Idempotency: cùng key trả canonical result; key khác sau decision trả conflict.
   - Revoke `PUBLIC`; grant đúng role; fixed `search_path` an toàn.

### R05 — Email/Google Supabase Auth

- Xóa `/api/auth/session` cookie giả hoặc thay bằng server actions sử dụng Supabase Auth.
- Email:
  - Sign up: `signUp`.
  - Login: `signInWithPassword`.
  - Logout: `signOut`.
- Google: `signInWithOAuth({ provider: 'google', options: { redirectTo } })`.
- Tạo `/auth/callback` để exchange code thành cookie session.
- Validate `returnUrl` bằng local path allowlist, chặn open redirect.
- Profile bootstrap idempotent bằng DB trigger hoặc server transaction rõ ràng.
- Middleware bảo vệ `/app/**`; `/admin/**` còn phải qua `requireAdmin` ở server page/action.

Gate G1:

- Email auth thật hoạt động trên Supabase local/test.
- Google contract/callback test xanh; live Google có thể `PENDING_CREDENTIAL`.
- Request `role=admin`, cookie tự tạo hoặc email đặc biệt không tạo quyền admin.
- Unauthenticated app/admin/data APIs trả redirect/401; member vào admin trả 403/redirect an toàn.

## Ngày R2 — Question, Conversation, Gemini và Agency persistence

### R06 — Question Engine database-backed

- Xóa `userAnswersStore` và fallback `guest-user`.
- `GET /api/questions` yêu cầu verified user, query published/pinned flow + existing answers.
- `POST /api/questions`:
  - Derive user từ session.
  - Query question thật và validate answer type/options.
  - Upsert answer với idempotency.
  - Trả progress + canonical `nextQuestionId`.
- Implement branch-rules evaluator cho DSL nhỏ, deterministic, reject rule malformed.
- Flow/session pin version; publish version mới không đổi flow đang làm.
- Fixture đạt 8–12 câu và bao phủ text/single/multi/scale cùng ít nhất hai branch paths.

Gate G2:

- Restart app không mất answers.
- User A/B không thấy hoặc overwrite answers của nhau.
- Back/next/resume/version pin/idempotency/branch tests xanh.
- Unauthenticated `/api/questions` trả 401, không dùng shared guest store.

### R07 — Conversation and message persistence

- Tạo/resume conversation bằng DB; conversation ID phải UUID thuộc verified user.
- Send message transaction:
  1. Validate content/length/idempotency.
  2. Check conversation ownership.
  3. Insert user message và verbatim user statement.
  4. Load canonical context từ DB.
- Sequence number phải concurrency-safe; không dùng `MAX + 1` ngoài lock/transaction.
- Retry cùng idempotency key không tạo duplicate message.

### R08 — Context, question allowlist và Gemini

- Context lấy relevant answers, confirmed insights, current profile draft/snapshot, active experiments/reflections và recent messages từ DB.
- Có block delimiters và coi user content là data, không phải instruction.
- Token/character budget có hard cap và priority rõ; không chỉ `slice(-6)`.
- Server tính `eligibleQuestionIds`; `/api/chat` không được truyền `[]` nếu model trả next question.
- Rule: `nextQuestionId != null` và allowlist rỗng ⇒ schema invalid hoặc deterministic fallback, không tự accept.
- Provider error không bị gộp thành schema error; taxonomy gồm provider unavailable/timeout/quota/schema invalid.
- Mock provider deterministic khi Gemini placeholder; live smoke chỉ khi key mới hợp lệ.

### R09 — Persist AI completion và robust SSE

- Sau structured validation, transaction insert:
  - assistant message.
  - pending observation nếu có.
  - next conversation stage.
  - sanitized AI run metadata.
- Không phát `observation.created` với ID sinh `Date.now()`; dùng UUID canonical từ DB.
- Nếu persistence fail, không phát completion giả.
- SSE client dùng buffer qua nhiều chunks; không discard partial `event/data` frames.
- Disconnect/reload lấy canonical messages từ DB.

### R10 — Agency route dùng RPC thật

- Xóa production use của fake `processObservationDecision`.
- `/api/observations/decision`:
  - Verified session.
  - Zod validate decision/edited content/idempotency UUID/key.
  - Gọi `decide_observation_atomic` bằng user-scoped SSR Supabase client.
  - Map DB errors thành 401/403/404/409/422, không trả 500 chung cho expected conflict.
- UI chỉ đổi state sau response canonical; double-click disabled và duplicate request được replay.

Gate G3:

- Send → persist/reload → assistant/observation canonical hoạt động.
- Accept/edit/reject đều thay đổi DB đúng invariant.
- Hai accept concurrent tạo tối đa một insight.
- Pending/rejected observation không vào context như fact.
- Cross-user conversation/observation IDs bị chặn.

## Ngày R3 — Test thật, hardening và remote migration gate

### R11 — DB integration tests

Test trên Supabase local với hai member JWT và một admin:

- CRUD own rows; cross-user select/insert/update/delete denied.
- Cross-owner foreign-key injection denied.
- Direct member insert/update observations/confirmed insights/profile confirmed denied.
- RPC auth null/cross-user/invalid decision/idempotency/concurrency.
- Support/admin/error tables denied cho member.
- Admin role không thể tự cấp.

Không mock SQL/RLS logic bằng JavaScript. Tests phải thực sự gọi PostgREST/RPC với JWT khác nhau.

### R12 — API/component tests

- Auth validation/open redirect/session expiry.
- Question type/options/branch/version/idempotency.
- Chat input size/rate/allowlist/provider errors/persistence failure.
- SSE parser với frame bị split/coalesced.
- Agency expected conflicts và edited content.

### R13 — Playwright critical E2E

Tối thiểu:

1. Sign up/login → onboarding → questions → reload/resume.
2. Conversation send → stream → reload retains messages.
3. Observation accept/edit/reject.
4. User B không truy cập resource ID của User A.
5. Member không vào admin; request/cookie role forgery thất bại.
6. Provider timeout → retry không duplicate user message.

Thêm `test:e2e` vào package scripts và lưu screenshot/trace khi fail.

### R14 — Full local gate

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npx supabase db reset --local
```

Gate G4 — Local Security Gate:

- Tất cả command exit 0.
- 0 Critical/High.
- Secret scan xanh.
- Migration từ DB trống và generated types khớp.
- HTTP exploit cũ thất bại:
  - arbitrary email/password không login.
  - request `role=admin` không có tác dụng.
  - forged cookies không mở `/admin` hoặc data APIs.
  - unauthenticated `/api/questions` trả 401.

### R15 — Remote dry-run và apply gate

Sau G4:

1. Xác minh linked project đúng bằng project list/migration list.
2. Chạy `npx supabase db push --dry-run` và lưu output review.
3. Human xác nhận target project + migration plan.
4. Chỉ sau xác nhận mới chạy `npx supabase db push`.
5. Generate types từ linked schema và rerun smoke tests.

Gate G5 — Week 1 Complete:

- Remote schema đúng migration; không drift.
- Email Auth + database persistence smoke xanh.
- Google/Gemini live có thể ghi `PENDING_CREDENTIAL`, nhưng mock/contract test phải xanh.
- T01–T21 có evidence thật; không còn mock persistence/auth trong production path.
- Commit sạch, không commit `.env.local` hoặc generated local state.

## 5. Ticket dependency

```text
R01 ─ R02 ─ R03 ─ R05
       └── R04 ─────┐
                    ├─ R06 ─ R07 ─ R08 ─ R09 ─ R10
                    └──────────────────────────────┐
                                                   ├─ R11 ─ R12 ─ R13 ─ R14 ─ R15
```

Không làm R06–R10 bằng service-role để “đi nhanh”. Không chạy R15 trước R11–R14.

## 6. Definition of Done cho từng remediation ticket

- Production code dùng implementation thật, không memory/fake IDs/hard-code context.
- Trust boundary có Zod validation và verified user.
- RLS/ownership invariant có DB integration test.
- Happy/error/loading/retry/idempotency path hoạt động.
- Lint/typecheck/unit/integration/build xanh.
- Docs/env contract/generated types đồng bộ.
- Có exact commands và evidence; không báo Done dựa trên UI demo.

## 7. Prompt giao cho AI thực thi

```text
Bạn đang sửa Week 1 của UNIONFAM Life Lab.

Đọc README.md, docs/00–11 và code hiện tại. Thực thi docs/11 theo thứ tự R01→R15.
Mỗi lượt chỉ làm một gate:
- Lượt 1: R01–R05, dừng tại G1.
- Lượt 2: R06–R10, dừng tại G3.
- Lượt 3: R11–R14, dừng tại G4.
- R15 chỉ dry-run; không db push thật nếu chưa có human confirmation.

Yêu cầu bắt buộc:
- Không in/đọc lại giá trị secrets trong .env.local.
- Không dùng cookie giả, role từ request, hard-coded user, guest fallback hoặc memory persistence.
- Không dùng service-role cho member requests.
- RLS tests phải gọi Supabase local bằng JWT thật, không mô phỏng JavaScript.
- Question branching và nextQuestionId phải dùng server allowlist.
- User Agency phải dùng DB RPC/transaction thật, có concurrency/idempotency test.
- Không bắt đầu Week 2.

Sau mỗi gate báo:
Tickets, files, migrations, decisions, exact verification commands,
pass/fail evidence, remaining blockers và security impact.
Không tự hạ threshold và không gọi PENDING_CREDENTIAL là PASS live integration.
```

## 8. Review checklist sau khi AI báo hoàn tất

- [ ] `/api/auth/session` giả đã biến mất.
- [ ] Không còn `lifelab_session`/`lifelab_user_role` tự phát.
- [ ] Không còn `guest-user`, `member-user-001`, `admin-user-001` trong production path.
- [ ] Không còn `userAnswersStore` hoặc fake `insight-${Date.now()}`.
- [ ] Supabase clients dùng publishable key + verified user cookies đúng boundary.
- [ ] `/api/chat` query/persist DB thật và dùng eligible question IDs thật.
- [ ] Observation decision gọi RPC thật.
- [ ] Restart server không mất answers/messages/decisions.
- [ ] Two-user/admin DB tests và Playwright exploit tests xanh.
- [ ] `.env.example` chỉ placeholder; worktree/Git history không có secret.
- [ ] `db push --dry-run` đã review; chưa push thật nếu chưa xác nhận.

