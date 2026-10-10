# SPEC_CONFLICTS.md — Life Lab

Ghi lại mọi mâu thuẫn giữa yêu cầu triển khai (prompt), tài liệu Master V8.7.2 và User State, kèm **vị trí**, **hai cách hiểu**, và **quyết định triển khai**. Nguyên tắc xử lý theo Master: *"Khi ví dụ khác enum, transition, schema hoặc Safety policy thì contract thắng"* và tuân thủ **Thứ tự quyền ưu tiên** công bố ở đầu Master.

Nguồn tài liệu thực tế trên máy (đã xác minh, không có bản V8.7.3):
- `LIFE LAB CONVERSATION SYSTEM V8.7.2 MASTER SPECIFICATION.docx`
- `LIFE LAB USER STATE V8.2 STRUCTURE V8.7 DATA.docx`
- Bản text trích xuất: `docs/spec/MASTER_V8.7.2.txt`, `docs/spec/USER_STATE_V8.7.txt`

---

## C01 — Phiên bản tài liệu: prompt nói V8.7.3, tài liệu thật là V8.7.2
- **Vị trí**: Prompt yêu cầu đọc `LifeLab_Master_V8.7.3_Reviewed.docx` và `LifeLab_User_State_V8.7.3_Reviewed.docx`. File thật trên máy: `...V8.7.2 MASTER...` và `...USER STATE V8.2 STRUCTURE V8.7 DATA...`.
- **Hai cách hiểu**:
  1. Tồn tại một bản V8.7.3 "reviewed" chưa được cung cấp.
  2. V8.7.2 là bản mới nhất thực sự có; "V8.7.3 reviewed" chỉ là tên dự kiến/đề xuất.
- **Quyết định**: Triển khai bám đúng **V8.7.2 Master** + **User State (cấu trúc V8.2 / dữ liệu V8.7)** là nguồn thật duy nhất có trên máy. Mọi tham chiếu "V8.7.3" được coi là alias tới nội dung V8.7.2 cho đến khi khách cung cấp bản V8.7.3 khác biệt. Ghi rõ trong README là build dựa trên V8.7.2.

## C02 — Số lượng transition: prompt nói T001–T069, Master định nghĩa T001–T063
- **Vị trí**: Prompt mục 4 và 7 nói "toàn bộ transition T001–T069". Master, mục *Canonical State Transition Table* và *Definition of Done* ("Automated tests bao phủ toàn bộ transition T001-T063") chỉ định nghĩa **T001 đến T063**. Không có T064–T069 trong tài liệu.
- **Hai cách hiểu**:
  1. Có thêm 6 transition T064–T069 ở tài liệu khác chưa cung cấp.
  2. Phạm vi canonical thật là T001–T063; "T069" là nhầm lẫn trong prompt.
- **Quyết định**: Triển khai và test đúng **T001–T063** theo bảng canonical. KHÔNG tự chế T064–T069 (vi phạm "không tự thêm transition"). Test suite đặt mục tiêu phủ T001–T063 (mỗi transition ≥1 positive, mỗi guard ≥1 negative). Nếu khách cấp T064–T069, bổ sung sau.

## C03 — Vị trí Privacy trong pseudocode vs bảng ưu tiên
- **Vị trí**:
  - *Thứ tự quyền ưu tiên* (đầu Master) và *Thứ tự ưu tiên toàn cục* (Phần 2): **(1) Crisis Safety → (2) User Stop → (3) Permission & Privacy → (4) State Machine**.
  - *Pseudocode bộ điều phối* (Phần 2) lại kiểm tra theo thứ tự: `crisis → user_stop → high_stakes → relational_dependency → enforce_privacy_and_permission`. Tức privacy được enforce **sau** high-stakes/relational boundary.
- **Hai cách hiểu**:
  1. Privacy chỉ cần enforce ngay trước khi chạy state handler (như pseudocode).
  2. Privacy là ưu tiên #3 tuyệt đối, phải enforce trước mọi boundary không-khủng-hoảng.
- **Quyết định** (theo chỉ đạo prompt: *"Ví dụ pseudocode đặt Privacy sau boundary phải được điều chỉnh theo thứ tự ưu tiên đã công bố"*): Áp dụng **bảng ưu tiên công bố**. Orchestrator kiểm tra theo thứ tự: Crisis Safety → User Stop → **Permission & Privacy guard** → High-Stakes Boundary → Relational Boundary → State Machine. Cụ thể: cờ `NO_MEMORY` và các ràng buộc quyền được nạp và cưỡng chế trước khi bất kỳ boundary/handler nào có thể đề xuất ghi dữ liệu. (High-stakes & relational vẫn ngắt flow Life Design bình thường, nhưng không bao giờ được phép ghi nhớ vượt quyền.)

## C04 — focus_confirmation_status: hai bộ giá trị khác nhau
- **Vị trí**:
  - *Từ điển enum* + quyết định N03: `DRAFT, PENDING_CONFIRMATION, CONFIRMED, REVISED`.
  - *Bộ dữ liệu phiên tối thiểu* (Phần 2) + *User State mục 14 ngầm*: `focus_confirmation_status: OPEN | HYPOTHESIS | CONFIRMED | REVISED`.
- **Hai cách hiểu**:
  1. Dùng DRAFT/PENDING_CONFIRMATION cho logic, OPEN/HYPOTHESIS chỉ là nhãn hiển thị.
  2. Hai bảng mâu thuẫn thật.
- **Quyết định**: Dùng bộ **canonical ở N03**: `DRAFT, PENDING_CONFIRMATION, CONFIRMED, REVISED` làm enum backend/DB (vì N03 là "quyết định chuẩn hóa V8.7.2" — ưu tiên cao hơn bảng field minh họa). Map alias: `OPEN→DRAFT`, `HYPOTHESIS→PENDING_CONFIRMATION`. Ghi mapping trong code enum.

## C05 — memory_mode: ASK_LATER/PROPOSALS_ALLOWED/NO_MEMORY vs 'ALLOWED'
- **Vị trí**: Quyết định N01 + Memory Contract: ba giá trị `NO_MEMORY, ASK_LATER, PROPOSALS_ALLOWED`. User State mục 14 lại ghi `memory_mode: ASK_LATER, ALLOWED, NO_MEMORY` và mục 9.2 dùng `ALLOWED`.
- **Hai cách hiểu**:
  1. `ALLOWED` là memory_mode hợp lệ.
  2. `ALLOWED` là alias cũ, không bao giờ nghĩa auto-write (N01 nói rõ: *"ALLOWED cũ chỉ là alias migration và không bao giờ có nghĩa auto write"*).
- **Quyết định**: `memory_mode` chỉ nhận **NO_MEMORY | ASK_LATER | PROPOSALS_ALLOWED**. `ALLOWED` trong User State ánh xạ sang `PROPOSALS_ALLOWED` ở tầng mode, còn `ALLOWED` là giá trị của **permission_status cho từng item** (khác namespace, theo N02). Enum tách biệt rõ.

## C06 — verification_status: 8 giá trị (Master Data) vs 4 giá trị (User State MVP)
- **Vị trí**: Phần 3 Data: `PROPOSED, UNVERIFIED, PARTIAL, CONFIRMED, REJECTED, SUPERSEDED, EXPIRED, NO_LONGER_CURRENT`. User State mục 14 MVP field: `UNVERIFIED, CONFIRMED, PARTIAL, REJECTED`.
- **Hai cách hiểu**: MVP thu gọn 4 giá trị / hệ thống đủ 8 giá trị.
- **Quyết định**: DB enum lưu đủ **8 giá trị** (contract Data thắng). MVP runtime chủ yếu dùng 4 giá trị cốt lõi; 4 giá trị còn lại (PROPOSED/SUPERSEDED/EXPIRED/NO_LONGER_CURRENT) dùng cho lifecycle & migration. Không mất khả năng mở rộng.

## C07 — "T001-T069" trong todo nội bộ
- Nhắc lại: mọi nhãn T001–T069 ở kế hoạch nội bộ được hiểu là **T001–T063** theo C02. Không có hệ quả triển khai khác.

## C08 — Streaming phản hồi vs validate-before-show
- **Vị trí**: UX "Composer states / STREAMING": *"Show response progressively only if safety and validation architecture permits; otherwise show loading."* Nhưng Quality Guard yêu cầu validate output (grounding, transition, question budget...) **trước** khi gửi user; AI acceptance: *"Model invalid JSON cannot reach UI."*
- **Hai cách hiểu**: Cho phép stream token / Phải validate xong mới hiển thị.
- **Quyết định**: MVP **không stream**; dùng loading indicator rồi hiển thị message đã qua Quality Guard. An toàn hơn và thỏa AC010. Có thể thêm streaming có kiểm soát ở bản sau.

---

## Nguyên tắc chung khi gặp mâu thuẫn mới
1. Ưu tiên theo thứ tự công bố: Crisis Safety > User Stop > Permission/Privacy > State Machine > Schemas > Techniques > Examples.
2. "Quyết định chuẩn hóa V8.7.2" (N01–N03) thắng bảng minh họa khi xung đột enum.
3. Không tự thêm transition/permission để lách mâu thuẫn.
4. Vấn đề safety/privacy chưa giải quyết → **chặn chức năng liên quan** và ghi vào mục REMAINING trong README/báo cáo.
