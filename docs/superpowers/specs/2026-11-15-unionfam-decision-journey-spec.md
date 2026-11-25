# UnionFam — Đặc tả MVP hành trình quyết định

Ngày: 2026-11-15 · Phiên bản: 1.0 · Trạng thái: Đề xuất để review, chưa triển khai.

## 1. Mục tiêu và phạm vi áp dụng

Giúp người dùng làm rõ một lựa chọn về công việc, tự xác nhận điều quan trọng, thử một hành động nhỏ và nhìn lại kết quả trước khi quyết định tiếp.

Đây là đặc tả sản phẩm, UX và hợp đồng kỹ thuật cho bản beta tiếp theo của `/home/jay/Desktop/unionFam`, không phải báo cáo tính năng đã hoàn thành. Không tự động commit, deploy hoặc thay đổi database khi viết tài liệu này.

### Giả định cần kiểm chứng

- Nhóm đầu tiên: người đi làm 23–35 tuổi ở Việt Nam, đang phân vân về công việc hoặc ranh giới công việc/cuộc sống.
- Tình huống vào sản phẩm: một lựa chọn cụ thể, chưa cần giải quyết toàn bộ cuộc sống.
- Người dùng muốn có bước tiếp theo phù hợp hơn là chỉ nhận một câu trả lời dài.
- Người dùng sẵn sàng quay lại nếu đã thực hiện một bước thử và cần nhìn lại.
- Các giả định này chưa phải kết quả nghiên cứu. Review spec có thể đổi nhóm mục tiêu trước khi lập kế hoạch triển khai.

### Lời hứa sản phẩm

“Làm rõ điều đang phân vân. Chọn một bước nhỏ để thử. Nhìn lại bằng trải nghiệm của chính bạn.”

Không cam kết ra quyết định thay người dùng, chẩn đoán tâm lý hoặc bảo đảm một quyết định đúng.

### Lý do chọn thay cho tự tổ chức một cuộc chat

UnionFam cung cấp sẵn cấu trúc từ lựa chọn → điều quan trọng → điều chưa biết → bước thử → ghi nhận → nhìn lại. Người dùng không phải tự viết prompt, sao chép kết quả sang ứng dụng khác và tự nối các lần quay lại.

Đây là lợi thế về công sức và tính liên tục cần đo thực tế, không phải khẳng định ChatGPT không thể làm các việc tương tự.

## 2. Quyết định phạm vi MVP

### Phải có

1. Landing nói rõ kết quả và có ví dụ minh họa.
2. Bắt đầu không bắt buộc đăng ký, sau thông báo xử lý dữ liệu ngắn gọn.
3. Trò chuyện gắn với một Thẻ Quyết Định sửa được, có xác nhận.
4. Lưu và đồng bộ hành trình bằng tài khoản thật.
5. Một bước thử đang hoạt động trên mỗi quyết định; tối đa ba quyết định chưa đóng mỗi tài khoản.
6. Ghi nhận theo ngày, điều chỉnh, tạm dừng và nhìn lại bước thử.
7. Trang Hôm nay giúp tiếp tục đúng công việc còn lại.
8. Xóa hành trình, chọn phạm vi lưu và đo sự kiện không chứa nội dung cá nhân.
9. Kiểm soát khóa, phân quyền, lỗi đồng bộ và xử lý an toàn trước khi mở beta.

### Chưa làm trong MVP

3D, voice, cộng đồng, streak, điểm thưởng, badge, billing, gửi email/push tự động, AI đa dụng, khám phá đầy đủ sáu chiều sống, nhiều bước thử chạy song song trên cùng quyết định, chia sẻ công khai.

Radio có thể giữ như tiện ích phụ nếu không gây chậm tải; không xuất hiện trong luồng bắt đầu. Life Map và Memories cũ ẩn khỏi điều hướng beta; dữ liệu cũ không bị tự ý xóa.

## 3. Tình huống chuẩn để thiết kế và nghiệm thu

Người dùng: “Tôi muốn nghỉ việc vì quá tải nhưng sợ mất thu nhập.”

Kết quả hợp lệ có thể là:

- Câu hỏi: “Tôi nên ở lại và điều chỉnh công việc hay chuẩn bị chuyển việc?”
- Điều quan trọng: sức khỏe, thu nhập tối thiểu, thời gian hồi phục — chỉ ghi xác nhận khi người dùng đồng ý.
- Điều chưa biết: quản lý có chấp nhận giảm việc ngoài giờ không?
- Bước thử: trong ba ngày làm việc tới, trao đổi một lần về giới hạn nhận việc ngoài giờ và ghi lại phản hồi.
- Dấu hiệu cần dừng: người dùng tự đặt, ví dụ tình huống làm họ thấy không an toàn.
- Nhìn lại: người dùng ghi điều đã xảy ra, điều học được và chọn tiếp tục/điều chỉnh/dừng.

Ví dụ là nội dung minh họa, không phải khuyến nghị mặc định cho mọi người. AI không tự bịa thu nhập, mức năng lượng hoặc điều kiện gia đình.

## 4. Điều hướng và URL

| URL | Mục đích |
|---|---|
| `/` | Landing cho khách; người đã đăng nhập có nút tiếp tục rõ ràng |
| `/start` | Chọn tình huống và xác nhận thông báo dữ liệu |
| `/today` | Hôm nay, mặc định sau đăng nhập |
| `/decisions` | Danh sách quyết định, gồm bản nháp và đã đóng |
| `/decisions/:id` | Trò chuyện và Thẻ Quyết Định |
| `/decisions/:id/experiment` | Thiết kế bước thử và ghi nhận |
| `/decisions/:id/review` | Nhìn lại bước thử |
| `/settings/privacy` | Lựa chọn lưu trữ và xóa dữ liệu |

Desktop: logo, Hôm nay, Quyết định, tài khoản. Mobile: điều hướng dưới Hôm nay / Quyết định / Tài khoản; ẩn thanh này trong chat nếu làm chật vùng soạn tin, vẫn có nút quay lại rõ ràng.

Back/Forward và reload phải giữ đúng màn hình, quyết định và bản nháp đã lưu. URL không phải cơ chế phân quyền.

## 5. Đặc tả màn hình

### S01 — Landing

- Tiêu đề: “Đang mắc kẹt trước một lựa chọn?”
- Mô tả: “Cùng làm rõ điều quan trọng và chọn một bước nhỏ để thử trước khi quyết định.”
- CTA chính: “Làm rõ một lựa chọn”; phụ: “Xem một ví dụ”.
- Hiển thị một thẻ ví dụ với nhãn “Ví dụ minh họa”, không giả làm dữ liệu người dùng.
- Ba bước giải thích bằng ngôn ngữ đời thường: Làm rõ → Thử nhỏ → Nhìn lại.
- Không hiển thị đánh giá, lượng người dùng hoặc tỷ lệ thành công khi chưa có bằng chứng.
- Không yêu cầu đăng nhập trước khi xem ví dụ hoặc bắt đầu.

### S02 — Bắt đầu

- Ba lựa chọn: “Ở lại hay đổi việc?”, “Nhận thêm việc hay giữ thời gian riêng?”, “Một lựa chọn khác”.
- Ô nhập: “Điều gì đang khiến bạn phân vân?”; tối đa 2.000 ký tự, lỗi hiện cạnh ô.
- Chọn mẫu chỉ điền một gợi ý sửa được, không tự gửi tin.
- Thông báo trước lần gọi AI đầu: nội dung sẽ được gửi tới nhà cung cấp AI được nêu tên; không cần cung cấp tên thật hoặc thông tin nhận dạng.
- Checkbox chưa chọn sẵn để đồng ý xử lý nội dung cho phiên này; link chi tiết dữ liệu. Từ chối thì vẫn xem được ví dụ.
- Nêu rõ: khách dùng phiên tạm; tải lại hoặc đóng trang có thể mất bản nháp. Gợi ý đăng nhập để lưu, không chặn bắt đầu.

### S03 — Trò chuyện và Thẻ Quyết Định

- Desktop từ 1.024px: chat khoảng 60%, thẻ khoảng 40%; không ép chiều rộng gây khó đọc.
- Mobile: tab “Trò chuyện” / “Điều đã làm rõ”; giữ nguyên scroll và bản nháp khi đổi tab.
- Header: tên quyết định, trạng thái lưu, menu đổi tên/xóa, nút quay lại.
- AI hỏi tối đa một câu chính mỗi lượt; phản hồi thông thường hướng tới 60–140 từ, không coi độ dài là tiêu chí chất lượng duy nhất.
- Không ép đủ số lượt. Người dùng có thể chọn “Chỉ muốn nói thêm”, “Xem điều đã rõ”, “Tạm dừng”.
- Thẻ gồm: câu hỏi quyết định; điều quan trọng; giới hạn; các hướng cân nhắc; điều chưa biết; bước thử đề xuất.
- Các trường chưa biết hiển thị “Chưa làm rõ”, không tự điền nội dung chung chung.
- Mỗi đề xuất AI có dấu hiệu nhận biết. Nút “Đúng với tôi” và “Sửa lại” áp dụng cho phần mới đề xuất.
- Khi AI đề xuất thay đổi phần đã xác nhận: hiển thị bản đề xuất cạnh nội dung đang dùng, chỉ thay sau khi chấp nhận.
- Nút “Thiết kế bước thử” khả dụng khi đã xác nhận câu hỏi quyết định và ít nhất một điều quan trọng. Nếu chưa đủ, giải thích cần làm rõ gì; không khóa chỉ vì thiếu số lượt chat.
- Trong khi chờ AI: giữ ô nhập nháp, chặn gửi trùng, có Hủy. Hủy/ngắt mạng không xóa tin đã nhập và không tự gửi lại.
- Nút “Dừng trò chuyện” phải hoạt động ngay, kể cả khi AI đang chạy; không tạo memory hoặc bước thử chỉ vì dừng.

### S04 — Thiết kế bước thử

Form có sáu trường:

1. “Bạn muốn biết thêm điều gì?” — bắt buộc, tối đa 300 ký tự.
2. “Bạn sẽ thử làm gì?” — bắt buộc, tối đa 500 ký tự, sửa được.
3. “Thử trong bao lâu?” — chọn 1, 3 hoặc 7 ngày; mặc định 3 ngày, đổi được.
4. “Bạn sẽ ghi nhận điều gì?” — bắt buộc, tối đa 300 ký tự.
5. “Khi nào nên dừng hoặc điều chỉnh?” — bắt buộc, tối đa 300 ký tự.
6. “Ngày nhìn lại” — mặc định theo thời lượng, xác định theo múi giờ người dùng.

- AI được đề xuất form, không tự kích hoạt.
- CTA: “Bắt đầu bước thử”; phải ghi rõ hành động này lưu gì.
- Hành động khó đảo ngược, y tế/pháp lý/tài chính hoặc gây nguy hiểm không được tự động coi là thử nghiệm an toàn. Dừng luồng đề xuất nếu cần, giải thích giới hạn và gợi ý tìm hỗ trợ phù hợp; không hứa bộ lọc đảm bảo an toàn tuyệt đối.
- Không bắt buộc tạo bước thử để được lưu điều đã rõ.

### S05 — Hôm nay

Ưu tiên nội dung: bước thử cần nhìn lại → bước thử đang chạy → quyết định đang làm rõ → trạng thái trống.

- Mỗi mục hiển thị một việc tiếp theo và một CTA chính.
- Bước thử đang chạy: hành động, câu hỏi muốn kiểm chứng, ngày dự kiến nhìn lại, “Ghi nhận hôm nay”.
- Chưa bắt đầu: “Bạn đang phân vân điều gì?” và “Bắt đầu một quyết định”.
- Không có dữ liệu mẫu của người dùng, điểm số cuộc sống hoặc tiến độ giả.
- Không ghi nhận thì hiển thị “Chưa ghi nhận”, không gọi là thất bại hoặc mất chuỗi.
- Khi tắt AI hoặc hết hạn mức, vẫn đọc/sửa thẻ, ghi nhận và nhìn lại được.

### S06 — Ghi nhận

- “Bạn đã thử chưa?”: Đã thử / Chưa thử / Đã điều chỉnh.
- “Điều gì đã xảy ra?”: ghi chú tối đa 1.000 ký tự, không bắt buộc khi chọn Chưa thử.
- Năng lượng 1–10 là tùy chọn, không suy diễn thành chẩn đoán.
- Một ghi nhận mỗi bước thử mỗi ngày địa phương; người dùng sửa được, gửi trùng không tạo hai bản.
- Có “Tạm dừng bước thử”, “Điều chỉnh”, không dùng xác nhận gây áp lực.
- Chỉnh hành động đang chạy phải lưu phiên bản; ghi nhận cũ giữ ngữ cảnh hành động lúc đó.

### S07 — Nhìn lại

- Hiển thị hành động đã thử và dòng thời gian ghi nhận thực tế, gồm cả ngày chưa ghi nhận.
- Ba câu hỏi: “Điều gì đã xảy ra?”, “Bạn hiểu thêm điều gì?”, “Bạn muốn làm gì tiếp?”.
- AI tóm tắt chỉ khi người dùng yêu cầu, trích nguồn theo ghi nhận; không tạo sự kiện chưa xảy ra.
- Lựa chọn tiếp: tiếp tục có ngày nhìn lại mới / thiết kế bước khác / tạm dừng / kết thúc quyết định.
- Kết thúc không bắt buộc chọn phương án cuối cùng; “Tôi chưa muốn quyết định” là kết quả hợp lệ.
- Lưu review không tự đánh dấu mọi trường AI là được xác nhận.

### S08 — Quyền riêng tư

- Tách hai lựa chọn: lưu thẻ/bước thử/ghi nhận để tiếp tục hành trình; lưu nguyên văn hội thoại. Mặc định chưa chọn cho hành trình mới.
- Giải thích “không lưu hội thoại” vẫn gửi nội dung phiên hiện tại cho nhà cung cấp AI để phản hồi; không hứa zero retention của nhà cung cấp nếu chưa xác minh.
- Người dùng có thể lưu thẻ mà không lưu hội thoại. Nếu không lưu gì, chỉ hoạt động trong bộ nhớ phiên.
- Xóa một quyết định phải xóa nội dung liên quan, bản đề xuất AI và dữ liệu ngữ cảnh được tạo từ quyết định đó; không tự khôi phục từ cache.
- Yêu cầu xóa cần xác nhận rõ; UI chỉ báo hoàn tất khi backend xác nhận. Gửi lỗi phải cho thử lại.
- Chính sách phải công bố thời hạn lưu, nhà cung cấp, cách xử lý bản sao lưu và giới hạn xóa bên thứ ba trước beta. Không hứa xóa ngay khỏi backup.

## 6. Hướng thiết kế và khả năng tiếp cận

- Giữ bản sắc xanh rêu + nền giấy; nền đọc nội dung dùng màu đặc, hạn chế kính mờ phía sau đoạn văn.
- Token đề xuất để làm prototype: nền sáng `#F7F5EF`, chữ `#182D26`, thương hiệu `#254B3D`, nền phụ `#E8EDE5`, viền `#BBC7BC`. Mọi cặp màu phải đo tương phản trước nghiệm thu.
- Font chính hỗ trợ tiếng Việt, ưu tiên Be Vietnam Pro với system sans fallback; một font chính, tối đa ba trọng lượng. Tự host nếu chọn font ngoài.
- Body tối thiểu 16px, line-height 1.5–1.7; metadata không dưới 12px. Nội dung đọc giới hạn khoảng 65 ký tự mỗi dòng.
- Khoảng cách theo thang 4/8/12/16/24/32/48; bề rộng nội dung tối đa 1.200px.
- Mỗi vùng nhiệm vụ có một CTA chính; không dùng toàn bộ nút cùng độ nổi bật.
- Kích thước chạm tối thiểu 44×44px; focus nhìn thấy; điều khiển tương tác dùng button/link đúng ngữ nghĩa.
- Đạt WCAG 2.2 AA trong phạm vi màn hình beta: tương phản chữ thường ≥4.5:1; trạng thái không chỉ dựa vào màu; label thật, thứ tự tab hợp lý.
- Dialog có tên, giữ focus bên trong, trả focus khi đóng; Escape đóng trừ tác vụ không thể hủy đã giải thích.
- Thông báo lưu/lỗi dùng vùng live phù hợp, không đọc lại toàn bộ hội thoại khi AI trả lời.
- Giảm motion theo thiết lập hệ thống; không confetti tự động, không nền chuyển động trong vùng làm việc.
- Test ở 360, 390, 768, 1.280 và 1.440px; không tràn ngang, ô nhập không bị bàn phím/điều hướng che, hoạt động khi zoom 200%.

## 7. Trạng thái và quy tắc dữ liệu

### Vòng đời

- Giữ enum thẻ hiện tại: DRAFT → USER_REVIEW → CONFIRMED; PAUSED và CLOSED do người dùng chọn. Không dùng status thẻ để suy ra consent hoặc trạng thái bước thử.
- Bước thử: DRAFT → ACTIVE → REVIEW_DUE → COMPLETED; ACTIVE/REVIEW_DUE có thể sang PAUSED hoặc CANCELLED. Ngày đến hạn do server tính; không cần mở app để biết đã đến hạn.
- Sau review, tiếp tục cùng hành động tạo chu kỳ mới với ngày nhìn lại mới; điều chỉnh hành động tạo phiên bản mới. Không sửa ngược lịch sử.
- Tối đa một bước thử ACTIVE/REVIEW_DUE cho một quyết định. PAUSED phải được xử lý rõ trước khi kích hoạt bước khác.
- AI chỉ tạo proposal, không xác nhận, kích hoạt, đóng hoặc cấp quyền lưu thay người dùng.

### Mô hình tối thiểu

| Entity | Trường và ràng buộc chính |
|---|---|
| decisions | UUID, user_id, title, status, current_revision, created_at, updated_at |
| decision_revisions | decision_id, revision, card_json hợp schema, nguồn AI/user, field_confirmations; unique decision_id+revision |
| decision_proposals | decision_id, base_revision, proposed_fields, source_message_ids, trạng thái pending/accepted/rejected |
| conversation_messages | UUID, decision_id, user_id, role, text, sequence, client_request_id; chỉ lưu nếu có quyền |
| experiments | UUID, decision_id, user_id, status, active_version, timezone |
| experiment_versions | experiment_id, version, action, learning_question, observations, stop_rule, duration_days, review_at |
| checkins | UUID, experiment_id, experiment_version, user_id, local_date, status, note, energy nullable; unique experiment_id+local_date |
| reviews | UUID, experiment_id, experiment_version, facts, learning, next_action, created_at |
| privacy_preferences | user_id, scope, version, updated_at; quyết định có snapshot quyền lưu riêng |

- Mọi quan hệ con phải đảm bảo owner khớp parent; không chỉ kiểm tra user_id ở một bảng con độc lập.
- Dùng UUID, không dùng Date.now làm định danh hoặc thứ tự duy nhất. Timestamp UTC; lưu múi giờ IANA để tính ngày địa phương.
- Lưu tin theo sequence do server cấp, không dựa vào thứ tự upsert/timestamp trùng.
- Nếu không lưu transcript, proposal không giữ bản sao raw text; chỉ tham chiếu ngữ cảnh phiên và phần tóm tắt đã được cho phép lưu.
- Không đưa dữ liệu tài khoản A sang B qua fallback. Đăng xuất/đổi tài khoản hủy request cũ và xóa state/cache nhạy cảm trước khi render tài khoản tiếp.

## 8. Kiến trúc và hợp đồng API

Giữ React + TypeScript + Vite. Dùng Supabase Auth/Postgres/RLS và Edge Functions làm lớp xử lý AI/nghiệp vụ. Đây là kiến trúc đề xuất cho MVP, không giả định backend cũ còn tồn tại.

- Frontend chỉ có Supabase publishable/anon key; không có provider secret hoặc service-role key trong bundle/localStorage.
- Edge Functions xác minh JWT, kiểm tra owner và schema; không tin user_id từ payload. Không dùng cờ localStorage làm quyền quản trị.
- Giữ RLS cho mọi bảng dữ liệu cá nhân; bổ sung policy kiểm tra quyền parent, index và migration có version.
- Không cần xây Express server thứ hai cho phạm vi này.

Các endpoint logic dưới đây được ánh xạ vào Edge Functions; đường dẫn triển khai thực tế cần thống nhất trong contract trước khi code:

| Endpoint logic | Hành vi |
|---|---|
| POST /guest/session | Tạo token khách giới hạn, TTL 30 phút; không lưu raw transcript phía ứng dụng |
| POST /ai/turn | Nhận request_id, decision_id hoặc guest token, expected_revision, message, context có giới hạn; trả reply, proposal, safety_status |
| GET/POST /decisions | Liệt kê/tạo quyết định của user |
| GET/PATCH/DELETE /decisions/:id | Đọc/sửa/xóa; PATCH có expected_revision |
| POST /decisions/:id/proposals/:proposalId/accept | Áp dụng các trường user chọn, kiểm tra base_revision |
| POST /decisions/:id/experiments | Tạo/kích hoạt bước thử trong transaction |
| PATCH /experiments/:id | Tạm dừng/điều chỉnh/tiếp tục với revision |
| PUT /experiments/:id/checkins/:localDate | Upsert đúng một ghi nhận/ngày |
| POST /experiments/:id/reviews | Lưu nhìn lại và next_action trong transaction |
| PATCH /privacy | Cập nhật quyền lưu; không tự suy ra quyền cho dữ liệu cũ |

- Response lỗi chuẩn: code, thông báo an toàn, request_id, retryable. 401 hết phiên; 403 không có quyền; 409 xung đột revision; 422 lỗi nhập; 429 hạn mức; 503 provider không dùng được.
- 409: giữ bản nháp, tải phiên bản mới và cho người dùng chọn; không tự ghi đè.
- Mutations có idempotency key và transaction cho các ghi liên quan. Chặn trùng ở database, không chỉ disable nút.
- UI chỉ báo “Đã lưu” sau xác nhận server; phân biệt “Chỉ trong phiên”, “Đang lưu”, “Đã lưu”, “Chưa lưu được”.
- Trong MVP không có hàng đợi offline bền vững chứa dữ liệu nhạy cảm. Mất mạng thì giữ bản nháp trong bộ nhớ và cho thử lại; cảnh báo trước rời trang.

### AI và hạn mức

- Một provider mặc định, model cấu hình ở server; không hardcode danh sách model suy đoán.
- Timeout lượt trả lời 20 giây; tối đa một retry lỗi mạng/5xx trong tổng thời gian này. Không âm thầm chuyển nội dung sang nhà cung cấp khác.
- Extraction dùng context đã cho phép và trả JSON validate ở server. Output hỏng không ghi đè thẻ; giữ bản hợp lệ cũ và cho thử lại.
- Response và proposal gắn request_id, decision_id, base_revision. Response đến muộn sau đổi trang/reset không được cập nhật state mới.
- Hạn mức beta đề xuất: khách tối đa 10 lượt/token và 20 lượt/ngày/IP; tài khoản 50 lượt/ngày, burst 5 lượt/phút. Tính cả summarize/extraction vào ngân sách chi phí; không chạy extraction riêng sau mọi tin nhắn.
- Guest rate limit và budget cưỡng chế ở gateway/shared store. Lưu dấu IP dạng HMAC xoay vòng tối đa 24 giờ, không đưa IP thô vào analytics. Không dựa riêng vào token khách để chống lạm dụng.
- Giới hạn context 12 tin gần nhất cùng thẻ đã xác nhận; tối đa 12.000 ký tự. Không nạp lại nội dung đã xóa hoặc chưa được cho phép lưu.
- Có kill switch server cho AI/guest access và trần chi phí ngày do chủ dự án cấu hình; trần chưa cấu hình thì không mở public guest AI.

## 9. Quyền riêng tư, khách và di chuyển dữ liệu cũ

- Khách chỉ giữ nội dung trong bộ nhớ phiên; không ghi raw transcript vào telemetry, log hoặc localStorage. Gateway chỉ xử lý tạm và phải kiểm tra cấu hình log thực tế.
- Sau đăng nhập, hỏi “Bạn muốn lưu phần nào của phiên vừa rồi?”; chỉ chuyển dữ liệu được chọn, đúng một lần bằng import_request_id. Không tự nhận mọi cache cũ là của tài khoản vừa đăng nhập.
- Khi bật lưu nguyên văn, chỉ áp dụng cho các tin tiếp theo trừ khi user chọn rõ lưu phần trước đó. Khi tắt, hỏi riêng có muốn xóa lịch sử đã lưu không.
- Thu hồi quyền lưu hội thoại không xóa thẻ/bước thử đã cho phép lưu riêng; mọi ngữ cảnh trích từ transcript phải được kiểm tra để không giữ lại phần không được phép.
- Cache cũ trong `unionfam_messages_cache`, `unionfam_memories_cache`, thẻ và thử nghiệm cũ: hiển thị quy trình import riêng, nói rõ dữ liệu nằm trên thiết bị và chưa xác định chủ sở hữu. Cho xem/chọn/xóa; không tự tải lên cloud.
- Khóa Groq đã nhúng phải thu hồi và thay mới. Gỡ cơ chế Supabase Key Auth, biến VITE secret và cấu hình key tùy chỉnh trên UI; xóa các key cấu hình cũ khỏi trình duyệt khi nâng phiên bản.
- Rà soát cả bundle/dist đã phát hành; xóa khỏi source không làm khóa cũ trở lại an toàn.

## 10. An toàn hội thoại

- Luồng nguy cơ tự hại/nguy hiểm cần bộ kịch bản riêng được chuyên gia phù hợp review trước beta; không chỉ kiểm tra regex và đóng chat máy móc.
- Khi có nguy cơ: ẩn đề xuất thử nghiệm, không tạo nội dung dài hoặc ép ra quyết định; hiển thị phản hồi hỗ trợ ngắn và hướng tìm hỗ trợ thực tế phù hợp.
- Nguồn hỗ trợ theo quốc gia phải có nguồn, ngày xác minh và người chịu trách nhiệm; không hardcode số chưa kiểm chứng. Không cấu hình thì dùng hướng dẫn chung, không bịa thông tin.
- Không tự lưu nội dung khủng hoảng thành memory dài hạn. Yêu cầu dừng ngắt AI và xử lý phản hồi đến muộn.
- Không giới thiệu sản phẩm như dịch vụ trị liệu hoặc thay thế chuyên gia.
- Chưa qua review an toàn thì chỉ thử prototype với kịch bản kiểm soát, chưa mời người dùng thật tâm sự nhạy cảm.

## 11. Đo lường để trả lời “tại sao dùng UnionFam?”

Sự kiện không chứa nội dung chat/ghi chú, email hoặc thông tin nhận dạng. User phân tích bằng ID giả danh; quyết định/bước thử dùng ID opaque. Có consent analytics riêng; từ chối không ảnh hưởng chức năng. Log bảo mật tối thiểu được giải thích riêng.

| Event | Thời điểm và dữ liệu tối thiểu |
|---|---|
| journey_started | Bắt đầu tình huống; scenario_id, guest/auth |
| first_value_confirmed | Lần đầu xác nhận câu hỏi và ít nhất một tiêu chí; thời gian từ bắt đầu |
| decision_saved | Server xác nhận lưu thẻ; không chứa card_json |
| experiment_started | Server kích hoạt; duration_days |
| checkin_saved | Server lưu ghi nhận; không chứa nội dung/năng lượng |
| review_completed | Server lưu review; loại next_action |
| journey_paused | User tạm dừng; không bắt buộc lý do |
| sync_failed / ai_failed | Mã lỗi, latency, request_id đã lọc |

Mỗi sự kiện có event_id chống đếm trùng. Guest/auth nối cohort chỉ khi được đồng ý; không coi các lượt khách rời trang là có thể theo dõi quay lại chắc chắn.

Các chỉ số:

- Activation = người xác nhận giá trị đầu tiên / người đã bắt đầu, cùng cohort và cửa sổ 7 ngày.
- Time to first value = từ bắt đầu đến lần xác nhận đầu tiên; hiển thị median và cỡ mẫu.
- Experiment adoption = người kích hoạt bước thử / người xác nhận giá trị đầu tiên.
- Meaningful return = người có check-in hoặc review ở ngày địa phương khác ngày bắt đầu / người kích hoạt bước thử đã đủ 7 ngày quan sát.
- Review completion = bước thử có review / bước thử đã đến hạn ít nhất 3 ngày, loại bỏ bước đã hủy trước hạn.
- Không dùng thời gian ở app hoặc số tin nhắn làm thành công chính. Không coi người tạm dừng là thất bại mặc định.
- Dashboard trống hiển thị “Chưa đủ dữ liệu”; số mẫu phải ghi rõ Demo. Gỡ toàn bộ KPI cố định đang giả làm số đo.

### Thử nghiệm sản phẩm

Giai đoạn 1: 5–8 người đúng nhóm, quan sát trực tiếp, nhiệm vụ không cần chỉ dẫn từng nút. Mục tiêu đề xuất: ít nhất 4/5 người đầu hiểu giá trị, tự xác nhận thẻ và tìm được bước tiếp theo; mọi lỗi cản trở đều được ghi lại. Đây là ngưỡng quyết định thiết kế, không phải bằng chứng thống kê.

Giai đoạn 2: 15–20 người, theo dõi 7–10 ngày. Phỏng vấn người quay lại và không quay lại. Chưa tự đặt tỷ lệ retention thành công khi chưa có baseline; quyết định mở rộng dựa trên cả kết quả và nguyên nhân.

So sánh định tính: 6–8 người thử UnionFam và cách họ thường dùng ChatGPT với hai tình huống tương đương, đảo thứ tự giữa người tham gia. Đánh giá công sức tổ chức, khả năng tìm lại, thực hiện và nhìn lại bước thử. Không tuyên bố hơn đối thủ dựa trên một demo hoặc chấm văn phong.

## 12. Tiêu chí nghiệm thu bắt buộc

| ID | Kịch bản | Kết quả phải đạt |
|---|---|---|
| AC01 | Khách bắt đầu lần đầu | Xem ví dụ không cần auth; gọi AI chỉ sau đồng ý xử lý |
| AC02 | Chọn tình huống | Điền gợi ý sửa được; không tự gửi |
| AC03 | AI đưa proposal | Chưa xác nhận không trở thành dữ liệu đã xác nhận |
| AC04 | AI sửa phần đã xác nhận | Bản cũ giữ nguyên cho đến khi user chấp nhận |
| AC05 | Provider lỗi/JSON hỏng | Thông báo đúng, không bịa thành công, không làm mất bản hợp lệ |
| AC06 | Hủy/dừng/đổi quyết định khi AI đang chạy | Response muộn không cập nhật nhầm hoặc tạo hành động |
| AC07 | Tạo bước thử hai lần | Chỉ một bước hoạt động, API idempotent |
| AC08 | Ghi nhận rồi reload/đăng nhập thiết bị khác | Dữ liệu đã lưu xuất hiện đúng owner và đúng ngày |
| AC09 | Mạng mất khi lưu | Hiện chưa lưu, giữ nháp phiên, không báo đã đồng bộ |
| AC10 | A logout → B login → B chưa có dữ liệu | Không hiển thị/import dữ liệu A; thử API ID của A bị từ chối |
| AC11 | Hai tab cùng sửa một revision | Tab cũ nhận 409, không ghi đè âm thầm |
| AC12 | Xóa quyết định | Xóa quan hệ/context, không trở lại qua cache hay AI |
| AC13 | Không cho lưu transcript | Không có raw transcript trong DB ứng dụng/log/analytics |
| AC14 | Khách đăng nhập và chọn import | Chỉ import phần được chọn đúng một lần |
| AC15 | Chỉnh bước thử đã có ghi nhận | Lịch sử giữ phiên bản hành động cũ |
| AC16 | Mobile/bàn phím/zoom/keyboard | Không che CTA/input, không tràn ngang, hoàn thành được bằng bàn phím |
| AC17 | Không có sự kiện đo lường | Dashboard không hiện KPI giả; có cỡ mẫu khi tính tỷ lệ |
| AC18 | Quá quota/provider tắt | Chặn ở server; vẫn đọc, sửa, check-in được |
| AC19 | Quét source và bundle phát hành | Không có secret; khóa nhúng cũ đã thu hồi |
| AC20 | Kịch bản an toàn được review | Không khuyến khích hành động nguy hiểm; nguồn hỗ trợ có xác minh |
| AC21 | Người không tạo bước thử | Vẫn lưu điều đã rõ và kết thúc/tạm dừng được |

Bộ kiểm thử cần có: unit cho transitions/schema/revision/date; integration cho auth/RLS/transaction/idempotency/privacy; E2E cho hành trình guest→save→checkin→review và đổi tài khoản; kiểm tra accessibility tự động kết hợp thủ công. Provider dùng mock xác định trong CI; integration provider thật báo riêng, không thay thế bằng mock rồi tuyên bố đã kiểm chứng.

Mục tiêu hiệu năng đề xuất để đo trên bản build: LCP ≤2,5 giây trên mobile cấu hình công bố; không chặn UI khi chờ AI; phản hồi xác nhận lưu thông thường p95 ≤2 giây trong môi trường beta; AI quá 20 giây phải chuyển trạng thái lỗi có thể thử lại. Ghi rõ thiết bị, network, cỡ mẫu và phương pháp; chưa đo thì không ghi PASS.

## 13. Ánh xạ code hiện tại

| File/khu vực | Hướng xử lý |
|---|---|
| src/App.tsx | Tách routes/layout, bỏ điều hướng chỉ dựa trên state |
| src/components/calm/SanctuaryChatView.tsx | Tách chat, proposal review, card, loading/cancel và hooks dữ liệu |
| src/components/decision/* | Giữ mô hình thẻ, bổ sung xác nhận trường và bảo vệ revision |
| src/services/geminiService.ts | Gỡ key/call provider trực tiếp; frontend gọi gateway |
| src/services/decisionService.ts | Giữ logic thuần phù hợp; extraction/validation và quyền ghi về server |
| src/lib/supabaseClient.ts | Chỉ cấu hình public client + Auth; bỏ key auth và secret |
| src/services/supabaseService.ts | Xử lý error rõ ràng, owner, revision; bỏ fallback cache chéo tài khoản |
| src/services/experimentService.ts | Thay local-only bằng dữ liệu user/experiment/version/checkin |
| src/components/calm/LifeMapSection.tsx | Ẩn khỏi beta, không tiếp tục mở rộng nội dung tĩnh |
| src/services/betaTelemetryService.ts | Thay KPI cố định bằng event thật và empty state |
| src/config/betaFlags.ts | Áp dụng flag nhất quán; giới hạn/kill switch do server quyết định |
| src/lib/supabase_schema.sql | Chuyển thay đổi DB thành migrations có version; không coi file cũ là đủ cho schema mới |
| README và docs/lifelab/* | Ghi rõ tài liệu lịch sử; cập nhật lệnh và báo cáo theo bản thực tế |

Không xóa component/tài liệu cũ hàng loạt trong đợt đầu. Spec này không tuyên bố tương thích toàn bộ master V8.x; điểm khác biệt về consent, guest session và hành trình phải được review khi lập kế hoạch.

## 14. Thứ tự giao hàng và điều kiện mở beta

1. Prototype S01–S07 có dữ liệu minh họa được đánh dấu; kiểm tra hiểu và thao tác với 5–8 người. Chưa dùng dữ liệu nhạy cảm thật.
2. Sửa khóa/auth/owner/privacy; hoàn thiện migrations, gateway và kiểm thử phân quyền trước khi kết nối prototype với dữ liệu thật.
3. Giao một lát cắt hoàn chỉnh: bắt đầu → thẻ được xác nhận → lưu → bước thử → ghi nhận → nhìn lại. Không chia giao hàng thành chỉ làm hết UI rồi mới xét dữ liệu.
4. Hoàn thiện responsive, accessibility, trạng thái lỗi và telemetry; chạy toàn bộ acceptance liên quan, ghi PASS/FAIL/SKIPPED trung thực.
5. Beta mời giới hạn 15–20 người sau khi đạt gate; chỉ mở rộng khi có bằng chứng và khả năng hỗ trợ sự cố.

Gate bắt buộc: không còn secret cũ hoạt động; kiểm thử chéo user PASS; xóa/consent PASS; không KPI giả; luồng chính PASS trên mobile; thông tin xử lý dữ liệu được công bố; kịch bản an toàn và nguồn hỗ trợ được review; owner triển khai/hỗ trợ và ngân sách AI được xác định.

Không ước lượng lịch giao trước khi lập implementation plan và kiểm tra hạ tầng Supabase/deployment thực tế.

## 15. Những quyết định cần review trước implementation plan

- Có chấp nhận nhóm đầu là người đi làm đang phân vân về công việc không?
- Có chấp nhận ẩn Life Map đầy đủ/Radio khỏi luồng chính và tập trung vào một hành trình không?
- Nhà cung cấp AI, chính sách lưu dữ liệu, người review an toàn và ngân sách vận hành cụ thể là gì?
- Schema/endpoint/privacy trong spec cần đối chiếu cấu hình Supabase thật; không suy ra trạng thái production từ source.

Đầu ra sau review: implementation plan theo lát cắt, migration/rollback, contract API cuối, test matrix và checklist phát hành. Viết spec này chưa phải phê duyệt triển khai hoặc phát hành.
