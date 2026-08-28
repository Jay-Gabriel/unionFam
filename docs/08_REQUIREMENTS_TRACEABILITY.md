# 08 — Requirements Traceability Matrix

Ma trận dùng 12 hạng mục trong ảnh khách gửi làm baseline mới. Mỗi hạng mục phải có thiết kế, ticket và evidence; không đánh đồng “hạng mục” với số màn hình.

## 1. Truy vết 12 hạng mục khách hàng

| # | Hạng mục khách yêu cầu | Thiết kế/route | Tickets | Acceptance evidence |
|---:|---|---|---|---|
| 1 | Landing Page, CTA “Bắt đầu” | Product view 1 | T03, T12 | render/CTA/responsive test |
| 2 | Đăng ký/Đăng nhập Email/Google, session, account | Product FR-A; `/auth` | T08–T09 | E2E-01, E2E-02 |
| 3 | Onboarding, thông tin ban đầu/cách hoạt động | Product view 3 | T10 | E2E-01 |
| 4 | Question Engine theo flow 89 trang | Product FR-Q; Data §3.2–3.4 | T05, T10–T11, T38 | E2E-03, UAT-04; content gap phải được ghi |
| 5 | Conversation Engine chọn câu tiếp | AI §2–5 | T14–T21 | E2E-04/05; allowlist/transition tests |
| 6 | Gemini API, prompt, token management | Architecture §7; AI §3–7 | T13–T17, T35, T38 | schema/eval/quota/log tests |
| 7 | Life Profile Engine: Desire/Escape, Life Vision, dimensions | Product FR-D; Data §3.10 | T22–T25 | E2E-06, UAT-02/04 |
| 8 | Kết quả Life Profile, dashboard cá nhân hóa | Product FR-G; mockup direction | T24, T26–T29 | E2E-07 + visual/responsive review |
| 9 | AI Reflection giải thích/phản chiếu | Product FR-F; Data §3.14–3.15 | T18–T21, T31–T33 | E2E-05/08 + UAT-01/03 |
| 10 | Database lưu user/answers/conversation/profile | Data §2–8 | T06–T09 | clean migration, data integrity, RLS |
| 11 | Admin Dashboard xem user/session/answers/errors | Product FR-G04–06; Data §4–6 | T06–T09, T34–T35 | E2E-10 + UAT-05 + audit test |
| 12 | Deploy + testing | Deploy loại theo chỉ đạo; testing giữ P0 | T17, T21, T25, T29, T33, T35–T42 | full release gate; không có DNS/VPS task |

## 2. Yêu cầu nền từ brief kỹ thuật

| Req | Yêu cầu | Thiết kế | Evidence |
|---|---|---|---|
| BR-01 | User statement tách AI observation | Data §3.7–3.9 | E2E-05 |
| BR-02 | User xác nhận trước khi thành insight | AI §4 | agency violations = 0 |
| BR-03 | Dynamic context | AI §5 | UAT-02/context tests |
| BR-04 | Prompt/methodology tách source | Architecture §6 | repo/bundle/log scan |
| BR-05 | Supabase RLS | Data §5 | two-member JWT tests |
| BR-06 | Experiment/Reflection/Learning loop | Product FR-F | E2E-08, UAT-03 |
| BR-07 | Không deploy/domain/VPS | Charter §4 | no infrastructure mutation |

## 3. Coverage route-level views

| View group | Customer items | Test chính |
|---|---|---|
| Landing/Auth/Onboarding | 1–3 | E2E-01/02 |
| Questions/Conversation | 4–6 | E2E-03/04/05 |
| Life Profile/Dashboard/History | 7–8 | E2E-06/07 |
| Experiments/Reflections/Learnings | 9 | E2E-08 |
| Financial Life/Progress/Resources | 7–8 | CRUD/read-model tests |
| Admin | 11 | E2E-10 |

## 4. Sign-off record

| Gate | Người xác nhận | Ngày | Kết quả | Evidence/exception |
|---|---|---|---|---|
| Scope/input baseline | PO hoặc decision log khi PO vắng |  |  |  |
| Foundation/Question/RLS M1 | Technical reviewer |  |  |  |
| Conversation/Agency M2 | PO + Technical reviewer |  |  |  |
| Life Lab loop M3 | PO |  |  |  |
| Admin/Security/Release M4 | PO + Technical reviewer |  |  |  |

Critical/High không được exception để pilot. Flow `dev-placeholder` có thể nghiệm thu kỹ thuật nhưng **không đủ điều kiện nghiệm thu methodology/pilot chính thức**.

