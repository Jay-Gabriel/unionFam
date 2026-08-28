# 07 — AI Execution Guide

## 1. Cách giao việc cho AI coding agent

Đưa agent vào repo và yêu cầu đọc tài liệu theo thứ tự trong root README, bao gồm ma trận truy vết `docs/08`. Không yêu cầu agent “làm toàn bộ app” trong một lần. Mỗi lượt chỉ giao một milestone hoặc 2–4 ticket có cùng vertical slice.

Prompt khởi động đề xuất:

```text
Bạn là implementation agent cho UNIONFAM Life Lab MVP.
Đọc toàn bộ README.md và docs/00 đến docs/10 trước khi sửa code.
Triển khai đúng P0; deploy/domain/VPS ngoài phạm vi.
Trước mỗi milestone: kiểm tra repo hiện tại, nêu ticket IDs, dependency và acceptance criteria.
Sau mỗi ticket: chạy test phù hợp, typecheck/lint/build; cung cấp evidence.
Không tự bịa methodology/prompt thật, không commit secrets, không nới lỏng RLS để test pass.
Nếu docs mâu thuẫn, ưu tiên: user agency & security > Data/API spec > Product requirements > schedule.
Bắt đầu với milestone M0 và dừng ở checkpoint để review.
```

## 2. Thứ tự thực thi bắt buộc

1. M0 Scope lock/foundation.
2. M1 DB/Auth/RLS/Question Engine; không làm AI chat trước khi isolation test xanh.
3. M2 conversation + user agency; không làm Life Map dựa trên unconfirmed observation.
4. M3 Life Map → resources/gaps → experiments/reflections.
5. M4 hardening, eval, UAT và handoff.

## 3. Contract cho mỗi lượt agent

Agent phải trả:

```text
Tickets: Txx, Tyy
Changed: files/migrations/modules
Decisions: assumptions/ADR
Verification: exact commands + pass/fail summary
Evidence: test names, screenshot/trace path if relevant
Remaining: explicit blockers/TODO tied to ticket
Risks: security/data/migration impact
```

Không chấp nhận báo cáo chỉ nói “đã hoàn tất” mà không có command/evidence.

## 4. Guardrails chống lệch scope

- Không đổi Supabase/Gemini/Next.js chỉ vì agent thích stack khác; muốn đổi phải viết ADR và được PO chấp thuận.
- Không thêm ORM, queue, vector DB, microservice hoặc state library nếu nhu cầu hiện tại chưa chứng minh.
- Admin Dashboard P0 chỉ đọc user/session/answers/errors qua server allowlist, masking và audit; không tạo prompt editor/impersonation.
- Không dùng service-role client cho request user thông thường.
- Không hard-code fake success hoặc bỏ test/RLS để demo.
- Không lưu chain-of-thought. Chỉ lưu structured output đã định nghĩa.
- Không deploy hay thay đổi domain/VPS.
- Không sửa confirmed version/audit row in-place để “đơn giản hóa”.
- Không tự sáng tác hoặc gọi placeholder là “flow 89 trang của khách”; mọi fixture phải gắn nhãn `dev-placeholder`.

## 5. Quy trình xử lý thiếu thông tin

1. Tra Project Charter `A-*` và dùng default nếu PO đã cho phép.
2. Nếu ảnh hưởng user agency, bảo mật, methodology hoặc data migration: dừng ticket đó, ghi một câu hỏi cụ thể và tiếp tục ticket độc lập khác.
3. Nếu chỉ là UI polish/copy nhỏ: dùng design system/copy trung tính và ghi assumption.
4. Không dùng output tự do của LLM thay cho nghiệp vụ chưa được quyết định.

## 6. Review checklist cho human/AI reviewer

- Code có thực thi đúng invariant hay chỉ che bằng UI?
- Auth và ownership được check tại server/DB chưa?
- Có concurrency/idempotency test cho mutation quan trọng chưa?
- Structured AI output có validate trước persistence chưa?
- Rejected/pending observation có bị đưa vào context như fact không?
- Prompt/secrets/raw sensitive data có vào repo, client bundle hay log không?
- Migration từ DB trống và rollback-by-forward-fix có khả thi không?
- Error/empty/loading/retry state có thể thao tác thực tế không?
- Docs/API/types/test có đồng bộ với code không?

## 7. Checkpoint prompts

### Sau M1

```text
Chứng minh RLS bằng test có hai member users và một admin (không dùng service role để chứng minh member isolation), liệt kê policy của 15 bảng nghiệp vụ cùng các bảng security support và chạy lại migration từ DB trống. Không tiếp tục AI chat nếu có cross-user leak hoặc admin bypass thiếu audit.
```

### Sau M2

```text
Demo bằng test ba nhánh accept, edit_accept, reject và hai request concurrent. Chỉ ra câu lệnh/transaction đảm bảo một observation tạo tối đa một confirmed insight.
```

### Trước release candidate

```text
Chạy toàn bộ release acceptance gate trong docs/06. Báo từng mục pass/fail, không tự hạ severity hoặc đổi threshold. Liệt kê mọi exception cần PO ký.
```

## 8. Artefacts phải có khi bàn giao

- Source code và lockfile.
- `.env.example` chỉ có tên biến/giá trị giả.
- Migration + seed phi nhạy cảm + generated DB types.
- Test suite và fixtures/mock AI deterministic.
- AI eval dataset đã khử dữ liệu cá nhân và report kết quả.
- README setup local, commands, architecture summary.
- UAT evidence, known limitations, release notes, P1 backlog.
- Prompt version/checksum reference; prompt bí mật nằm ngoài repository.
