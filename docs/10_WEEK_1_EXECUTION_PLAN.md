# 10 — Week 1 Execution Plan

## 1. Mục tiêu Tuần 1

Trong 5 ngày làm việc, hoàn thành foundation đến hết User Agency loop:

- Next.js app shell và design system bám mockup khách gửi.
- Supabase schema, migrations, RLS và member/admin roles.
- Email/password + Google Auth contract.
- Onboarding và Question Engine versioned có resume/branching.
- Conversation Engine kết nối qua provider abstraction.
- Gemini structured output, context budget và failure recovery.
- Observation `pending` → accept/edit/reject → confirmed insight.
- Automated tests cho auth, RLS, question flow, conversation và agency.

Tuần 1 **không** triển khai hoàn chỉnh Life Profile Dashboard, Experiments, Reflections, Learnings hoặc Admin UI; chỉ chuẩn bị schema/boundary cần thiết. Các phần đó thuộc Tuần 2.

## 2. Input và nguyên tắc trước khi bắt đầu

### Có sẵn

- Bộ docs `00`–`10`.
- Ba ảnh khách hàng: 12 hạng mục và dashboard visual reference.
- Stack: Next.js, TypeScript, Supabase, Gemini.
- Domain/VPS có sau; deploy ngoài scope.

### Chưa có hoặc không được dùng

- Credential đã gửi trong chat được coi là **đã lộ** và không được ghi vào file/repo.
- Cần tạo Gemini key mới và đặt thủ công vào `.env.local` dưới tên `GEMINI_API_KEY`.
- Chưa có flow 89 trang/prompt thật: dùng fixture `dev-placeholder`.
- Nếu chưa có Supabase/Google credentials, dùng Supabase local + mocked OAuth/provider contract; không chặn test kỹ thuật.

### Guardrails

- Không commit `.env.local`, key, token, service-role key hoặc prompt thật.
- Không dùng service-role cho request member thông thường.
- Không làm UI-only rồi đánh dấu ticket Done; mỗi vertical slice cần DB/API/test.
- Không tự bịa methodology Life Lab.
- Không deploy, thay DNS hoặc cấu hình VPS.

## 3. Kế hoạch theo ngày

### Ngày 1 — Project foundation và UI shell (`T01–T05`)

#### Deliverables

- Khởi tạo Git repository và Next.js App Router với TypeScript strict.
- Package scripts: `dev`, `lint`, `typecheck`, `test`, `test:e2e`, `build`.
- Folder structure theo Architecture §3.
- Env validation đọc `.env.local`, chỉ expose biến `NEXT_PUBLIC_*` hợp lệ.
- Error envelope, request ID và logger redaction.
- Design tokens: màu trắng/xanh tím/pastel, typography, radius, spacing, shadow.
- Responsive app shell/sidebar/header skeleton theo mockup.
- ADR ngắn cho Auth, RLS/transactions và AI provider/streaming.
- Placeholder prompt/question flow có metadata `dev-placeholder`.

#### Verification

- Clean install chạy được từ lockfile.
- `lint`, `typecheck`, unit smoke và `build` xanh.
- Secret scan không thấy credential thật.
- Landing/app shell không tràn ngang ở 360px và 1440px.

#### Không làm

- Chưa tích hợp live Gemini.
- Chưa dựng toàn bộ dashboard widgets.
- Không đưa screenshot raster vào UI thay cho component.

### Ngày 2 — Supabase, Auth và RLS (`T06–T09`)

#### Deliverables

- Supabase local/test configuration.
- Forward-only migration cho 15 business entities và support tables trong Data Spec.
- Index, unique/check constraints, timestamps và RLS trong cùng migration.
- `user_roles` với `member/admin`; admin chỉ cấp qua secure operator flow.
- Email/password sign-up/login/logout/session refresh/profile bootstrap.
- Google OAuth initiation/callback/redirect allowlist; mock contract nếu chưa có credentials.
- Generated TypeScript database types.

#### Verification

- Recreate database từ trạng thái trống thành công.
- User A không đọc/sửa row User B bằng authenticated JWT.
- Member không tự nâng role và không gọi admin query.
- OAuth callback từ chối redirect ngoài allowlist.
- Client bundle không chứa service-role key.

#### Exit blocker

Bất kỳ cross-user leak, auth bypass hoặc secret leak nào đều chặn Ngày 3.

### Ngày 3 — Onboarding, Question Engine và persistence (`T10–T13`)

#### Deliverables

- Onboarding/consent có progress, validation và resume.
- Versioned question flow + questions + answer validator.
- Fixture 8–12 câu có text, single choice, multi choice, scale và ít nhất hai branch paths.
- Branch evaluator deterministic trả `eligible_question_ids`.
- Save answer idempotent, back/next/resume và progress calculation.
- Create/resume/rename/archive conversation.
- Message composer/list persistence không cần AI.
- Restricted prompt-config interface với dev stub.

#### Verification

- Reload giữa flow không mất answer/current position.
- Publish version mới không đổi phiên đang pin version cũ.
- Answer sai type/options trả validation error.
- Duplicate idempotency key không tạo hai answers/messages.
- Flow/signup → onboarding → questions → dashboard skeleton → message persistence chạy E2E.

### Ngày 4 — Gemini Conversation Engine (`T14–T17`)

#### Deliverables

- Provider interface và deterministic mock provider.
- Gemini provider đọc `GEMINI_API_KEY` server-only.
- Structured output Zod schema theo AI Spec, gồm `next_question_id` allowlist.
- Context builder ưu tiên safety/methodology/answers/profile/insights/messages theo token budget.
- `/api/chat` streaming events và canonical persistence.
- State transition guard; invalid model transition/question ID dùng safe fallback.
- Timeout, one repair attempt cho invalid structured output và retry semantics.

#### Verification

- Contract tests với mock provider luôn deterministic.
- Invalid JSON sau repair không tạo observation.
- Provider timeout giữ user message và cho retry không duplicate.
- Prompt injection fixture không lộ prompt/secret hoặc bypass permission.
- Nếu có **Gemini key mới hợp lệ**, chạy một live smoke request; nếu chưa có, ghi `PENDING_CREDENTIAL`, không chặn mock contract gate.

### Ngày 5 — User Agency loop (`T18–T21`)

#### Deliverables

- Pending observation card trong conversation.
- Insight review panel: accept, edit & accept, reject.
- Atomic DB function/service cho observation decision.
- Unique/idempotency/concurrency protection: một observation tạo tối đa một insight.
- Confirmed insight read model; pending/rejected không đi vào context facts.
- Loading/error/success/disabled state chống double-click.

#### Verification

- E2E đủ ba nhánh accept/edit/reject.
- Hai request accept concurrent chỉ tạo một confirmed insight.
- Edit & accept giữ original observation và dùng edited content cho insight.
- Reject không tạo insight, không đổi Life Profile draft và không được inject như fact.
- Cross-user observation decision bị chặn.
- Full Week 1 suite: lint, typecheck, unit, DB integration, E2E và production build xanh.

## 4. Week 1 acceptance gate

- [ ] `T01–T21` đạt Definition of Done.
- [ ] Clean install/build và clean database migration tái hiện được.
- [ ] Email auth chạy; Google OAuth contract hoàn chỉnh hoặc live smoke nếu đã có credentials.
- [ ] Two-member isolation và admin-role abuse tests xanh.
- [ ] Question Engine branch/resume/idempotency tests xanh.
- [ ] AI structured output/context/state/failure tests xanh.
- [ ] Agency violations = 0 trong automated fixtures.
- [ ] Không có Critical/High security defect.
- [ ] Không có secret/prompt thật trong git, client bundle, logs hoặc test artefacts.
- [ ] Screenshot/Playwright evidence cho mobile 360px và desktop 1440px.
- [ ] Week 1 handoff report ghi pass/fail, decisions, deferred inputs và Week 2 risks.

## 5. Thứ tự prompt để giao cho AI thực thi

### Lượt 1 — Ngày 1

```text
Đọc README.md và docs/00–10. Chỉ triển khai T01–T05 trong docs/10.
Không deploy và không dùng credential xuất hiện trong chat.
Kết thúc bằng exact verification commands, file list, ADR và evidence.
```

### Lượt 2 — Ngày 2

```text
Review kết quả T01–T05 rồi triển khai T06–T09.
Ưu tiên migration reproducibility, RLS deny-by-default, two-member isolation và member/admin role security.
Dừng milestone nếu phát hiện cross-user leak.
```

### Lượt 3 — Ngày 3

```text
Triển khai T10–T13 với question flow dev-placeholder có version và branching deterministic.
Không tự viết flow 89 trang của khách. Chứng minh resume, version pinning và idempotency bằng test.
```

### Lượt 4 — Ngày 4

```text
Triển khai T14–T17 bằng mock provider deterministic trước, sau đó Gemini adapter server-only.
Structured output phải validate; next_question_id phải nằm trong allowlist; invalid output không được tạo business record.
```

### Lượt 5 — Ngày 5

```text
Triển khai T18–T21. Chứng minh accept/edit/reject, concurrent requests và cross-user protection.
Sau đó chạy toàn bộ Week 1 acceptance gate và báo từng mục pass/fail, không tự hạ threshold.
```

## 6. Handoff sang Tuần 2

Chỉ bắt đầu Life Profile/Dashboard khi Week 1 gate xanh. Handoff phải gồm:

- Schema/migration version và generated types.
- Test users/fixtures không nhạy cảm.
- Question flow/prompt placeholder version/checksum.
- API/stream event contracts thực tế.
- Screenshots/traces và test report.
- Danh sách `PENDING_CREDENTIAL`/`PENDING_PO`.
- Technical debt cụ thể; không ghi “cleanup later” chung chung.

