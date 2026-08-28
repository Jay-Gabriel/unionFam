# 05 — Implementation Plan (10 ngày làm việc)

## 1. Chiến lược giao hàng

Triển khai theo vertical slice, mỗi slice có UI + server + DB + test. P0 được đóng băng cuối Ngày 1. P1 chỉ làm khi toàn bộ P0 đã xanh.

Giả định năng lực: một AI coding agent chính và một người technical review/nghiệm thu. Khi PO vắng, agent dùng defaults đã ghi, hoàn tất technical RC và đánh dấu các gate methodology/pilot là `PENDING_PO`; không tuyên bố đạt nghiệp vụ độc quyền của khách.

## 2. Milestones

| Milestone | Hạn | Exit criteria |
|---|---:|---|
| M0 — Scope lock | Cuối D1 | A-01…A-12 được ghi nhận; dùng default khi khách vắng; project build/test chạy |
| M1 — Foundation | Cuối D3 | email/Google auth + schema + RLS + Question Engine; isolation test xanh |
| M2 — Agency loop | Cuối D5 | chat structured output + question selection + accept/edit/reject end-to-end |
| M3 — Life Lab loop | Cuối D8 | Life Profile/dashboard/resources/experiment/reflection/learning end-to-end |
| M4 — Technical RC | Cuối D10 | automated tests + fixture UAT xanh, build/docs/handoff đủ; pilot gates ghi `PENDING_PO` |

## 3. Backlog theo ngày

### Ngày 1 — Foundation và scope lock

- `T01` Khởi tạo Next.js TypeScript strict, lint/format/test/build scripts.
- `T02` Tạo folder boundaries, error envelope, env validation và logger redaction.
- `T03` Chốt 12-module route map, 16 view wireframe và design tokens dựa trên mockup khách gửi.
- `T04` Ghi Architecture Decision Records ngắn cho auth, DB transaction, AI streaming.
- `T05` Ghi decision defaults; tạo placeholder question flow/prompt có nhãn rõ, sẵn cơ chế thay bằng nội dung khách.

Done: clean install chạy; landing/app shell render; CI-equivalent local command xanh; không có secret trong repo.

### Ngày 2 — Database, Auth, RLS

- `T06` Migration 15 business entities + indexes + constraints + support/security tables.
- `T07` RLS deny-by-default và policy ownership.
- `T08` Email/password + Google Auth, OAuth callback allowlist, logout/session/profile bootstrap, member/admin roles.
- `T09` Two-member + admin RLS/access integration test và generated DB types.

Done: User A không thể select/update row User B bằng authenticated DB client; protected routes đúng.

### Ngày 3 — Question Engine và app shell

- `T10` Onboarding/consent, Question Engine UI, progress/resume.
- `T11` Question graph/version/branch evaluator, validated idempotent answers; create/resume conversation.
- `T12` App shell/sidebar theo mockup, Dashboard skeleton, message composer/list và retry states.
- `T13` Prompt config interface/restricted loader với non-secret dev stub.

Done: signup/Google → onboarding → answer/resume placeholder flow → dashboard → persist/reload message chạy không cần AI.

### Ngày 4 — AI structured conversation

- `T14` Zod schema + provider adapter + state transition guard.
- `T15` Context builder có relevant answers/token budget; eligible-question allowlist; prompt assembler có delimiter.
- `T16` `/api/chat` streaming, persist completion, failure recovery.
- `T17` Unit/contract tests cho schema, context priority, invalid transition, provider failure.

Done: mock provider deterministic tạo response hợp lệ; nếu có Gemini test credential thì live smoke cũng xanh; invalid JSON không ghi observation.

### Ngày 5 — User agency vertical slice

- `T18` Pending observation card và insight review screen.
- `T19` Transaction/RPC accept, edit & accept, reject với idempotency.
- `T20` Confirmed insight list/read model; rejected observation không đi vào context facts.
- `T21` E2E permission loop và concurrency/double-click test.

Done: demo được ba nhánh accept/edit/reject; không có đường nào AI tự tạo confirmed insight.

### Ngày 6 — Life Profile Engine

- `T22` Life Profile draft với Desire/Escape/Life Vision, sáu dimensions đúng mockup và evidence.
- `T23` Confirm/version transaction, conflict handling, Life Map history.
- `T24` Tích hợp current confirmed Life Profile vào Dashboard/context.
- `T25` Unit/E2E version immutability test.

Done: confirm tạo version mới, version cũ không đổi, cross-user access bị chặn.

### Ngày 7 — Dashboard, Resources và Progress

- `T26` Dashboard read model/widgets: conversation, six-dimension profile, experiment, loop, insights/focus.
- `T27` Resources + Gap editing + Financial Life filtered view.
- `T28` Progress/streak calculation từ activity events; evidence/reference links.
- `T29` Empty/loading/error/responsive/a11y pass cho các screen đã có.

Done: resource/gap từ insight hoặc user input đều rõ nguồn; CRUD và RLS test xanh.

### Ngày 8 — Experiments, Reflections và Learnings

- `T30` Experiment list/create/edit và transition guard.
- `T31` Experiment detail + reflection form/upsert + Reflections view.
- `T32` Learning candidate/confirmation, Learnings view; inject confirmed learning vào context.
- `T33` E2E gap → experiment → experience → reflection → learning → resume chat.

Done: vòng học hỏi hoàn chỉnh, invalid state transition trả 409.

### Ngày 9 — Admin Dashboard, hardening và release test

- `T34` Admin Dashboard: users/sessions/answers/app+AI errors, masking, pagination, access audit.
- `T35` Rate/token limits; security test: IDOR/admin/RLS, prompt injection, secret/bundle/log scan.
- `T36` Performance/dashboard query, indexes, duplicate request/concurrency.
- `T37` Cross-browser responsive/a11y; visual alignment với mockup; error/empty states.
- `T38` Chạy AI/question-branch evaluation và sửa lỗi P0.

Done: không còn severity Critical/High; toàn bộ automated suite xanh; evaluation đạt gate.

### Ngày 10 — UAT, fix và handoff

- `T39` Technical reviewer chạy fixture UAT; PO UAT chạy nếu có mặt, nếu không ghi `PENDING_PO`.
- `T40` Fix P0/UAT blocker, rerun regression.
- `T41` Hoàn thiện README setup, env contract, migrations, seed giả, test commands, known limitations.
- `T42` Tạo release candidate tag/commit theo quy trình repo (không deploy).

Done: technical M4 đạt; methodology, legal/privacy content và pilot sign-off không được giả pass khi PO vắng.

## 4. Dependency graph

```text
T01–T05
  └─ T06–T09
      ├─ T10–T13
      │   └─ T14–T17
      │       └─ T18–T21
      │           ├─ T22–T25
      │           └─ T26–T29
      │                └─ T30–T33
      └────────────────────┴─ T34–T38 ─ T39–T42
```

## 5. Priority và cắt scope nếu trễ

Không cắt các phần liên quan auth, RLS, user agency, data integrity hoặc test critical path.

Thứ tự có thể cắt/giảm để giữ deadline:

1. Animation/polish và auto-generated conversation title.
2. Life Map history UI đầy đủ (vẫn phải giữ version trong DB).
3. Filter nâng cao ở experiments.
4. Edit resource/gap inline; chuyển sang modal/form đơn giản.
5. P1 export PDF, admin mutation/prompt editor và analytics nâng cao.

## 6. Daily quality gate

Cuối mỗi ngày agent phải cung cấp:

- Commit/change summary gắn ticket IDs.
- `lint`, `typecheck`, unit/integration tests và production build result.
- Migration/RLS test result nếu có DB change.
- Screenshots hoặc Playwright trace cho luồng UI mới.
- Known failures, nguyên nhân và kế hoạch xử lý ngày tiếp theo.
- Không báo “done” nếu chỉ mock UI mà chưa nối persistence/authorization theo ticket.

## 7. Definition of Ready cho một ticket

- Có mục tiêu và acceptance criteria đo được.
- Biết entity/API/screen bị ảnh hưởng.
- Có input/copy/methodology cần thiết hoặc mock được phê duyệt.
- Dependency đã hoàn tất.
- Không mở rộng ngoài P0.

## 8. Definition of Done

Một ticket chỉ Done khi:

- Code và migration (nếu có) hoàn chỉnh, không chứa secret/TODO P0.
- Input được validate ở trust boundary; auth/ownership/RLS phù hợp.
- Happy path và error/empty/loading state hoạt động.
- Test ở mức thích hợp được thêm và xanh.
- Typecheck/lint/build xanh.
- Tài liệu/contract được cập nhật nếu hành vi thay đổi.
- Reviewer có evidence tái hiện được.

## 9. Risk register

| Risk | Xác suất/Tác động | Mitigation | Trigger/Owner |
|---|---|---|---|
| Prompt/methodology giao trễ | Cao/Cao | stub schema từ D1, PO deadline D3, eval tách khỏi plumbing | D3 chưa có / PO |
| AI output không ổn định | Cao/Cao | structured output, repair 1 lần, eval set, server guard | parse pass <100% / Tech |
| Free-tier quota thay đổi/hết | Vừa/Cao | limits, metrics, manual retry, test credential riêng | 429/quota / PO+Tech |
| RLS cấu hình sai | Vừa/Critical | deny default, two-user tests, JWT client test | bất kỳ cross-read / Tech |
| 16 views quá nhiều để polish | Cao/Vừa | shared shell/widgets; subview bằng tab/panel; cắt animation/P1 | M2 chậm >1 ngày / PO |
| Chưa có flow 89 trang thật | Cao/Cao | versioned engine + placeholder rõ nhãn; thay content không sửa code | trước pilot / PO |
| Scope creep | Cao/Cao | freeze D1, change log, P1 backlog | request mới / PO |
| Context vượt token | Vừa/Vừa | priority budget, structured snapshot | >80% cap / Tech |
| Prompt/IP leakage | Vừa/Cao | server-only encrypted config, redacted logs, secret scan | secret in bundle/log / Tech |
| Nội dung safety chưa được duyệt | Vừa/Cao | safety fallback conservative, block pilot signoff | D9 chưa duyệt / PO |
