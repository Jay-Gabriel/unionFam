# 01 — Product Requirements

## 1. Personas và nhu cầu

### Member (P0)

Người đang muốn hiểu rõ hiện trạng, giá trị, nguồn lực và khoảng cách trong cuộc sống. Member cần một không gian riêng tư, được AI gợi mở nhưng vẫn giữ toàn quyền quyết định điều gì là đúng về mình.

### Admin/Product Owner (P0 giới hạn)

Người xem user, questionnaire progress/answers, conversation sessions và lỗi ứng dụng/AI để hỗ trợ pilot. Admin UI P0 là read-only mặc định; cập nhật prompt/config vẫn thực hiện bằng quy trình backend có kiểm soát và có version.

## 2. Luồng end-to-end chuẩn

1. Visitor xem Landing → đăng ký → đăng nhập.
2. Member hoàn tất onboarding/consent và bộ câu hỏi theo flow versioned hoặc lưu để làm tiếp.
3. Dashboard cá nhân hóa hiển thị Life Profile, conversation, experiment, insights và progress.
4. Member bắt đầu/resume conversation; Question/Conversation Engine chọn câu tiếp theo trong tập hợp hợp lệ.
5. Mỗi message của user được lưu nguyên văn vào `messages` và trích thành `user_statements` khi phù hợp.
6. AI trả structured output; UI hiển thị câu trả lời và observation đề xuất.
7. Member `accept`, `edit & accept` hoặc `reject`. Chỉ accept mới tạo confirmed insight.
8. Confirmed insight/câu trả lời cập nhật bản nháp Life Profile; member xác nhận version.
9. Resources và Gaps được quản lý từ dữ liệu do member xác nhận.
10. Member tạo experiment, trải nghiệm, ghi reflection và rút learning theo Life Lab Loop.

## 3. 12 hạng mục khách hàng và route map P0

Ảnh khách gửi là danh sách **12 hạng mục**, không phải 12 màn hình. Chúng được triển khai thành 16 route-level views dưới đây để tránh gộp nghiệp vụ không an toàn.

| # | Route đề xuất | Màn hình | Chức năng chính | Trạng thái bắt buộc |
|---:|---|---|---|---|
| 1 | `/` | Landing | Giới thiệu Life Lab, CTA “Bắt đầu”, privacy note | default |
| 2 | `/auth` | Đăng ký/Đăng nhập | email/password, Google, session, reset link | idle/loading/error/success |
| 3 | `/onboarding` | Onboarding | thông tin ban đầu, consent, giới thiệu cách hoạt động | step/progress/error |
| 4 | `/app/questions` | Question Engine | flow câu hỏi versioned, answer, branching, resume | loading/answering/saved/completed |
| 5 | `/app` | Tổng quan | dashboard cá nhân hóa như mockup | first-use/active/empty |
| 6 | `/app/conversations/[id]` | AI Conversation | adaptive conversation, permission/observation card | streaming/retry/pending-permission |
| 7 | `/app/life-map` | Life Design Map/Profile | sáu dimension, evidence, version | draft/confirmed/empty |
| 8 | `/app/experiments` | Experiments | tạo/list/filter/update trạng thái | draft/active/completed/abandoned |
| 9 | `/app/experiments/[id]` | Experiment detail | mục tiêu, thời gian, trọng tâm, progress, reflection | active/completed/reflected |
| 10 | `/app/reflections` | Reflections | lịch sử phản chiếu và AI explanation | empty/list/detail |
| 11 | `/app/learnings` | Learnings | điều đã rút ra, nguồn reflection/insight | empty/list/detail |
| 12 | `/app/life-map/history` | Life Map lịch sử | version/timeline/compare cơ bản | empty/list/detail |
| 13 | `/app/financial-life` | Financial Life | filtered profile/resources/gaps/experiments | empty/active |
| 14 | `/app/progress` | Progress | questionnaire/loop/streak/experiment progress | empty/active |
| 15 | `/app/resources` | Resources | nguồn lực, CRUD, evidence | empty/list/edit |
| 16 | `/admin` | Admin Dashboard | user/session/answer/app error/AI error | loading/list/detail/denied |

Conversation list, insight review, gap editing và admin user detail được triển khai dưới dạng panel/tab trong các view trên. Quên mật khẩu/OAuth callback là route kỹ thuật, không tính là view nghiệp vụ.

## 4. Functional requirements

### FR-A — Authentication và profile

- FR-A01: đăng ký/đăng nhập bằng email/password hoặc Google; lỗi không tiết lộ tài khoản quá mức cần thiết.
- FR-A02: route `/app/**` yêu cầu session hợp lệ.
- FR-A03: profile được tạo idempotent sau khi auth user được tạo.
- FR-A04: đăng xuất xoá session client và quay về login.
- FR-A05: chỉ chính user đọc/sửa profile của mình.
- FR-A06: role admin chỉ được cấp qua DB/secure operator flow; không có UI tự nâng quyền.

### FR-Q — Question Engine

- FR-Q01: câu hỏi lấy từ `question_flow_versions/questions`, không hard-code rải rác trong component.
- FR-Q02: lưu từng answer idempotent, hỗ trợ back/next/resume và hiển thị progress.
- FR-Q03: engine tính eligible questions bằng rule/branching deterministic; AI chỉ chọn `next_question_id` trong allowlist server cung cấp.
- FR-Q04: flow đang làm được pin version; publish flow mới không làm đổi thứ tự phiên cũ.
- FR-Q05: câu trả lời là dữ liệu user, không tự trở thành AI-confirmed insight.
- FR-Q06: khi chưa có flow 89 trang thật, app dùng fixture gắn nhãn `dev-placeholder`; không dùng fixture để pilot chính thức.

### FR-B — Conversation

- FR-B01: tạo/resume conversation; tiêu đề có thể tạo tự động nhưng phải sửa được.
- FR-B02: gửi message có client idempotency key để tránh nhân đôi khi retry.
- FR-B03: UI stream `assistant_message`; server chỉ đánh dấu message `complete` khi schema hợp lệ.
- FR-B04: lỗi provider/quota không làm mất user message; cho phép retry.
- FR-B05: thứ tự message xác định bằng `sequence_no`, không chỉ timestamp.
- FR-B06: không cho gửi message mới khi cùng conversation đang có generation chưa kết thúc.

### FR-C — User agency

- FR-C01: observation mới có trạng thái `pending`.
- FR-C02: pending card hiển thị nội dung, loại insight và ba lựa chọn accept/edit/reject.
- FR-C03: accept là server transaction: lock observation → tạo insight → cập nhật status/ref → commit.
- FR-C04: edit & accept giữ cả nội dung AI gốc và nội dung user đã sửa.
- FR-C05: reject không tạo insight và vẫn lưu quyết định để tránh đề xuất lặp.
- FR-C06: request lặp cùng idempotency key không tạo hai insight.

### FR-D — Life Profile / Life Design Map

- FR-D01: Life Map chỉ tổng hợp confirmed insight và chỉnh sửa trực tiếp của user.
- FR-D02: mỗi lần confirm thay đổi tạo `life_profile_versions` bất biến; draft có thể cập nhật trước confirm.
- FR-D03: mỗi dimension có `summary`, `current_state`, `desired_state`, `strengths`, `tensions` và `evidence_refs` khi phù hợp.
- FR-D04: user xem được version hiện tại và ít nhất 5 version gần nhất.
- FR-D05: AI không tự publish/confirm Life Map.
- FR-D06: sáu dimension bắt buộc: My Life, What Matters, My Ideal Day, What It Takes, My Trade-offs, The Question.
- FR-D07: Life Profile analysis có Desire, Escape, Life Vision và evidence references; nội dung AI vẫn tuân thủ user agency.

### FR-E — Resources và Gaps

- FR-E01: user CRUD resource với type, description, confidence và evidence.
- FR-E02: user CRUD gap với dimension, current/desired state, priority và status.
- FR-E03: AI có thể đề xuất resource/gap dưới observation; chỉ tạo bản ghi khi user xác nhận.
- FR-E04: xóa mềm để bảo toàn traceability.

### FR-F — Experiments và Reflections

- FR-F01: tạo experiment gồm hypothesis, smallest step, success signal, start/end date.
- FR-F02: trạng thái hợp lệ: `draft → active → completed|abandoned`; completed có thể thêm reflection.
- FR-F03: reflection gồm result, learning, feeling, next_action và optional rating.
- FR-F04: reflection đã lưu được inject vào context ở lượt hội thoại sau.
- FR-F05: mỗi experiment có tối đa một final reflection trong MVP; có thể chỉnh sửa bởi owner.
- FR-F06: reflection có thể sinh `learning` dạng đề xuất; member xác nhận trước khi learning trở thành record chính thức.

### FR-G — Dashboard, Progress và Admin

- FR-G01: Dashboard theo hierarchy mockup: greeting/search/profile, AI conversation, Life Design Map, current experiment, Life Lab Loop, insights, streak/focus chips.
- FR-G02: Dashboard lấy read model tổng hợp; widget hỏng không làm hỏng toàn trang.
- FR-G03: Progress/streak dựa trên event/ngày hoạt động có định nghĩa, không tạo số liệu giả.
- FR-G04: Admin xem danh sách user, session, questionnaire answers và AI/app errors; raw answer bị che mặc định cho đến khi admin mở chi tiết có audit.
- FR-G05: Admin không xem/đổi prompt secret, không impersonate user và không sửa confirmed insight trong P0.
- FR-G06: mọi lần admin mở dữ liệu user chi tiết tạo audit record.

## 5. Non-functional requirements

| ID | Yêu cầu | Ngưỡng nghiệm thu MVP |
|---|---|---|
| NFR-01 | Responsive/accessibility | Không tràn ngang 360px; keyboard usable; label/form/error rõ; contrast cơ bản WCAG AA |
| NFR-02 | Performance app | P95 API không gọi LLM < 800ms ở môi trường test; LLM hiển thị trạng thái trong < 500ms và first token mục tiêu < 5s |
| NFR-03 | Reliability | Mutation quan trọng idempotent; transaction cho accept observation/versioning |
| NFR-04 | Security | RLS deny-by-default; không có service key/prompt secret ở browser/repo/log |
| NFR-05 | Privacy | Có consent; không log raw conversation ở analytics/console; user có thể xóa conversation của mình |
| NFR-06 | Maintainability | TypeScript strict; validation shared; migration reproducible; module boundaries rõ |
| NFR-07 | Observability | Log request id, user hash, latency, provider status, token usage; không log nội dung nhạy cảm |
| NFR-08 | Cost guard | Giới hạn input/output, context budget, rate limit và thông báo quota; không gọi LLM thừa khi retry client |

## 6. Nội dung/safety

- Hiển thị rõ “AI hỗ trợ phản chiếu, không thay thế chuyên gia y tế/tâm lý/pháp lý”.
- Với nội dung tự hại/khủng hoảng: không tiếp tục methodology như bình thường; trả safety message do PO duyệt và khuyến nghị nguồn hỗ trợ phù hợp khu vực. Danh sách hotline thực tế phải được PO/legal xác minh trước pilot.
- Không suy đoán hoặc gắn nhãn bệnh lý, nhân cách, giới tính, tôn giáo hay thuộc tính nhạy cảm.
- Không đưa chain-of-thought vào DB hoặc UI.

## 7. UX rules bắt buộc

- Tách visual rõ: “Bạn đã nói” / “AI đang đề xuất” / “Bạn đã xác nhận”.
- Action destructive cần confirm; action accept/reject phải có feedback và chống double-click.
- Empty state luôn có next action.
- Khi AI lỗi, giữ nguyên draft input và message user đã gửi.
- Không dùng dark pattern để ép user xác nhận observation.
