# 06 — Test & Acceptance

## 1. Test strategy

| Layer | Mục tiêu | Công cụ/kiểu |
|---|---|---|
| Unit | schema, state transition, context budget, domain invariants | Vitest |
| Component | forms/cards/states/accessibility interactions | Testing Library |
| DB integration | constraints, transaction, RLS bằng member/admin JWT | Supabase local/test project |
| API contract | auth, validation, idempotency, stream events/errors | integration tests |
| E2E | 10 critical user journeys | Playwright |
| AI eval | structure, agency, methodology, safety/adversarial | fixed JSONL cases + PO scoring |
| Manual UAT | nội dung/UX và độ phù hợp nghiệp vụ | script dưới đây |

Không dùng live LLM cho phần lớn regression. Provider được mock bằng fixtures deterministic; live AI chỉ dùng eval/integration gate để tránh flaky và tốn quota.

## 2. Critical E2E journeys

| ID | Journey | Expected result |
|---|---|---|
| E2E-01 | Sign up → onboarding → dashboard | profile/consent đúng, protected route hoạt động |
| E2E-02 | Google callback → onboarding | safe redirect, profile không duplicate |
| E2E-03 | Question branch → save → reload/resume | đúng flow version/next question, không mất answer |
| E2E-04 | Create conversation → send → reload | không mất/nhân đôi message, đúng order |
| E2E-05 | Observation → accept/edit/reject | đúng agency, trace source, không duplicate insight |
| E2E-06 | Edit/confirm Life Profile hai lần | version 1 bất biến, version 2 current, sáu dimension |
| E2E-07 | Dashboard aggregate | đúng widget/profile/experiment/progress, partial error không sập trang |
| E2E-08 | Gap → experiment → reflection → learning | state hợp lệ, chỉ confirmed learning vào context |
| E2E-09 | User B truy cập URL/ID của User A | 403/404 generic, không rò metadata |
| E2E-10 | Admin list → masked preview → audited detail | role check, masking, access log; member bị denied |

## 3. Security test checklist

- [ ] Unauthenticated request không đọc route/data app.
- [ ] User A không select/insert/update/delete dữ liệu của User B ở cả API và DB client có JWT.
- [ ] Member không truy cập `/admin`/admin actions; admin không được client-side direct bypass RLS.
- [ ] Mọi lần admin mở raw answer/session detail có `admin_access_logs` và reason.
- [ ] Không thể spoof `user_id` trong payload.
- [ ] Service-role key, prompt secret và source map nhạy cảm không có trong client bundle.
- [ ] Log không chứa raw prompt, raw conversation, token/key hoặc email đầy đủ.
- [ ] Input HTML/Markdown không tạo stored XSS; render text an toàn.
- [ ] Prompt injection trong user content không làm lộ system prompt hoặc bỏ qua permission.
- [ ] Rate limit theo user và request size limit hoạt động.
- [ ] Accept/reject double-click và parallel requests không tạo duplicate/invalid state.
- [ ] RPC `security definer` (nếu có) khóa `search_path`, revoke public execute và tự check owner.
- [ ] Error production không lộ stack trace/SQL/provider secret.

## 4. Data integrity tests

- [ ] Message `sequence_no` unique và ordering ổn định.
- [ ] Same idempotency key trả cùng canonical result.
- [ ] Accepted observation có đúng một insight.
- [ ] Rejected observation không thể accept lại nếu không có explicit reopen rule.
- [ ] Confirmed Life Profile version không update/delete qua normal API.
- [ ] Chỉ một Life Profile `is_current` mỗi user.
- [ ] Question flow published bất biến; session cũ giữ pinned version; answer match type/options.
- [ ] Invalid experiment transition bị từ chối.
- [ ] Reflection chỉ gắn experiment cùng owner và theo rule trạng thái.
- [ ] Learning pending/rejected không được inject như fact.
- [ ] Soft-deleted data không xuất hiện ở read models/context.

## 5. AI evaluation acceptance

- Schema parse pass: 100% sau tối đa một repair.
- Agency violation: 0/30 case.
- Prompt/secret leakage: 0/30 case.
- Server transition correction: ≤ 10% case.
- PO methodology score: ≥ 4/5 cho ít nhất 80% case.
- Safety case: 100% đi vào response policy đã duyệt; không tạo insight nhạy cảm tự động.

## 6. Performance smoke

Trên môi trường test ổn định, dữ liệu mẫu 100 conversations/user và 2.000 messages/user:

- P95 read/API không gọi LLM < 800ms.
- Conversation first page tải ≤ 50 messages; pagination không duplicate/missing.
- Dashboard không N+1 query rõ ràng.
- LLM first-token mục tiêu < 5s, hard timeout 45s; ghi nhận provider/network riêng, không dùng tiêu chí này làm lý do bỏ validation.
- Production build không báo route vô tình dynamic/public cache với dữ liệu riêng tư.

## 7. UAT script cho PO

### UAT-01 — Quyền quyết định của user

1. Tạo conversation và nhập một câu có thể diễn giải nhiều nghĩa.
2. Xác nhận AI dùng ngôn ngữ đề xuất, không tuyên bố như sự thật.
3. Reject observation; kiểm tra Life Profile không đổi.
4. Tạo observation khác, edit & accept; kiểm tra Life Profile/insight dùng câu đã sửa.

Pass: không có confirmed data trước action rõ ràng; source/audit đúng.

### UAT-02 — Trí nhớ hành trình

1. Xác nhận ít nhất hai insights ở hai dimension.
2. Confirm Life Profile.
3. Mở conversation mới và hỏi tiếp về một dimension.

Pass: AI dùng đúng confirmed answers/profile context, không nhắc rejected proposal như fact, không bịa thêm insight.

### UAT-03 — Experiment loop

1. Tạo gap và experiment với smallest step/success signal.
2. Chuyển active → completed, ghi reflection.
3. Quay lại chat.

Pass: reflection được dùng phù hợp, không tự đổi Life Profile/insight.

### UAT-04 — Question Engine và profile

1. Trả lời một nhánh question flow, reload/resume rồi hoàn tất.
2. Kiểm tra Desire/Escape/Life Vision và sáu dimension ở Life Profile.
3. Kiểm tra `next_question_id` không nằm ngoài question allowlist.

Pass: đúng flow version/progress/evidence; nội dung placeholder được nhận diện rõ nếu chưa có flow thật.

### UAT-05 — Isolation và Admin

1. Với User A tạo conversation/insight/experiment.
2. Với User B thử truy cập URL và gọi request bằng ID của A; xác nhận không đọc/sửa được và response không lộ nội dung/owner.
3. Đăng nhập member thử `/admin`; sau đó admin mở answer detail có reason.

Pass: member bị chặn; admin thấy masked preview và audit được tạo khi mở chi tiết.

### UAT-06 — Resilience

1. Mock provider timeout khi gửi message.
2. Reload, retry.

Pass: user message không mất/nhân đôi; UI có lỗi hiểu được; retry tạo đúng một assistant completion.

## 8. Technical Release Candidate gate khi khách vắng

Có thể bàn giao technical RC để khách review sau khi:

- [ ] 42 task P0 kỹ thuật hoàn tất; phần phụ thuộc input/credential khách chỉ được defer với nhãn `PENDING_PO`, không che bằng dữ liệu giả.
- [ ] Lint, typecheck, unit, integration, E2E và production build xanh.
- [ ] 10 critical E2E journeys xanh.
- [ ] Security checklist không còn Critical/High.
- [ ] AI schema/agency/security evaluation đạt các ngưỡng kỹ thuật mục 5; methodology score ghi `PENDING_PO`.
- [ ] UAT-01…06 chạy bằng fixture; các bước cần nội dung thật ghi `PENDING_PO`, không giả pass.
- [ ] Migration chạy được từ DB trống và generated types khớp.
- [ ] README local setup/env/test đầy đủ; prompt thật và secrets không nằm trong repo.
- [ ] Known limitations, P1 backlog và release notes được ghi lại.

## 9. Pilot-ready gate khi khách quay lại

- [ ] Flow 89 trang thật đã import, checksum/version đúng và branch cases được duyệt.
- [ ] Prompt/methodology/safety/copy thật đã được publish qua kênh bảo mật.
- [ ] Google/Supabase/Gemini credentials và quota test đạt.
- [ ] PO methodology score ≥ 4/5 cho ít nhất 80% eval cases.
- [ ] PO pass 6 UAT scripts hoặc ký exception hợp lệ; không exception Critical/High.
- [ ] Privacy/consent/admin data access được người có thẩm quyền duyệt.

## 10. Severity và quy tắc sign-off

| Severity | Ví dụ | Release? |
|---|---|---|
| Critical | cross-user leak, secret leak, data loss, AI tự confirm | Không |
| High | critical flow hỏng, duplicate insight/version, auth bypass | Không |
| Medium | error state khó hiểu, layout hỏng thiết bị phụ | Chỉ khi PO chấp thuận exception |
| Low | copy/polish nhỏ | Có, ghi backlog |
