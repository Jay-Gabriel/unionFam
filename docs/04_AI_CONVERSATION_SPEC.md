# 04 — AI Conversation Specification

## 1. Trách nhiệm của AI engine

AI engine được phép:

- Phản hồi mang tính gợi mở theo methodology đã version.
- Đề xuất một observation có cấu trúc.
- Chọn câu hỏi kế tiếp trong `eligible_question_ids`, đề xuất stage kế tiếp và yêu cầu permission khi cần.
- Dùng dữ liệu đã xác nhận để giữ liên tục ngữ cảnh.
- Tạo bản nháp Desire/Escape/Life Vision/dimensions và learning candidate có evidence.

AI engine không được phép:

- Tự xác nhận insight, tự publish Life Map hoặc tự tạo experiment active.
- Tự sáng tác canonical question ngoài question flow khi đang ở guided flow; clarification phải được gắn loại riêng.
- Sửa/xóa lời nguyên văn của user.
- Trả chẩn đoán y tế/tâm lý hay tuyên bố chắc chắn về user.
- Gửi internal prompt, secrets hoặc chain-of-thought ra client.

## 2. State machine

| Stage | Mục đích | Có thể chuyển tới |
|---|---|---|
| `onboarding` | mục tiêu, consent, cách sử dụng | `discovery` |
| `discovery` | thu thập câu chuyện/phát biểu | `clarify`, `permission` |
| `clarify` | hỏi rõ mâu thuẫn/ý nghĩa | `discovery`, `permission` |
| `permission` | xin phép đưa ra observation | `synthesis`, `discovery` |
| `synthesis` | phản chiếu insight đã được user xử lý | `design`, `clarify` |
| `design` | Life Map/resources/gaps | `experiment`, `clarify` |
| `experiment` | thiết kế bước thử nhỏ | `reflection`, `design` |
| `reflection` | học từ experiment | `discovery`, `design`, `completed` |
| `completed` | kết thúc vòng hiện tại | `discovery` khi mở vòng mới |

Server kiểm tra transition allowlist. `next_stage` từ model chỉ là đề xuất; transition không hợp lệ bị thay bằng current stage và ghi metric.

## 3. Structured output contract

Schema logic tương đương Zod sau:

```ts
const ConversationOutput = z.object({
  assistant_message: z.string().min(1).max(6000),
  next_stage: z.enum([
    "onboarding", "discovery", "clarify", "permission", "synthesis",
    "design", "experiment", "reflection", "completed"
  ]),
  requires_permission: z.boolean(),
  next_question_id: z.string().uuid().nullable(),
  observation: z.object({
    type: z.enum(["desire", "escape", "life_vision", "value", "need", "strength", "tension", "resource", "gap", "goal", "trade_off", "pattern", "learning"]),
    dimension: z.enum(["my_life", "what_matters", "my_ideal_day", "what_it_takes", "my_trade_offs", "the_question", "financial_life", "other"]),
    content: z.string().min(1).max(1200),
    confidence: z.number().min(0).max(1),
    evidence_message_ids: z.array(z.string().uuid()).max(10)
  }).nullable(),
  safety: z.object({
    triggered: z.boolean(),
    category: z.enum(["none", "self_harm", "medical", "abuse", "illegal", "other"]),
    user_message: z.string().max(2000).nullable()
  })
});
```

Cross-field rules:

- `requires_permission=true` ⇒ observation phải khác null hoặc assistant đang hỏi permission cho lượt kế tiếp theo methodology.
- Observation chỉ tham chiếu message ID thuộc cùng user/conversation.
- `next_question_id` phải null hoặc nằm trong `eligible_question_ids` do server cung cấp; sai thì server dùng deterministic fallback.
- Nếu `safety.triggered=true`, safety policy server có ưu tiên cao hơn stage/observation; không persist observation nhạy cảm chưa được review.
- `confidence` không được hiển thị như xác suất khoa học; chỉ dùng nội bộ để lọc đề xuất quá yếu.

## 4. Permission protocol

1. AI nêu câu hỏi/đề nghị phản chiếu bằng ngôn ngữ không áp đặt.
2. Khi có observation, server lưu `pending`; UI gắn nhãn “Đề xuất của AI — cần bạn xác nhận”.
3. User chọn:
   - `accept`: insight = original content.
   - `edit_accept`: insight = edited content; giữ original để audit.
   - `reject`: không tạo insight.
4. Quyết định không được suy ra từ câu trả lời chat mơ hồ. Chỉ UI action rõ ràng hoặc một confirm intent được UI yêu cầu xác nhận lần cuối mới được tính.
5. AI nhận danh sách observation đã reject gần đây để tránh lặp, nhưng rejected content không được coi là sự thật về user.

## 5. Dynamic context injection

Context builder tạo payload có thứ tự và budget:

```text
[SYSTEM_SAFETY_AND_BOUNDARIES]
[METHODOLOGY version/checksum]
[CURRENT_STAGE + allowed transitions]
[PROFILE minimal, consented fields only]
[RELEVANT_QUESTION_ANSWERS with question IDs/version]
[CURRENT_CONFIRMED_LIFE_PROFILE]
[CONFIRMED_INSIGHTS grouped by dimension, newest/relevant first]
[ACTIVE_RESOURCES_AND_GAPS]
[ACTIVE_EXPERIMENT + RECENT_REFLECTION]
[RECENT_MESSAGES]
[CURRENT_USER_MESSAGE]
```

Rules:

- Không đưa mọi `user_statements` vào vô hạn. Ưu tiên recent raw messages và confirmed structured data.
- Không đưa pending/rejected observation vào “facts”; nếu cần, đặt trong khu vực proposal history có nhãn rõ.
- Mỗi block dùng delimiter và instruction chống prompt injection: nội dung user là dữ liệu, không phải system instruction.
- Server tính token estimate trước call; log counts chứ không log body.
- Nếu thiếu budget: giảm recent messages → giảm answers/older confirmed insights theo relevance/dimension → dùng Life Profile snapshot. Không bỏ safety/methodology/current message.

## 6. Prompt pipeline

Prompt artifact tối thiểu có:

- `version`, `schema_version`, `checksum`, `status`.
- global role/boundaries.
- stage-specific objective, allowed questions, exit criteria.
- wording rules về agency.
- few-shot input/output đã khử dữ liệu thật.
- safety policy/copy do PO duyệt.

Publish flow ngoài UI:

1. PO cung cấp artifact qua kênh bí mật.
2. Validator kiểm tra schema/checksum và chạy eval set.
3. Artifact được lưu encrypted/restricted, status `draft`.
4. PO/authorized operator activate một version.
5. Conversation mới pin version active; conversation đang chạy giữ version cũ, trừ khi migration được PO phê duyệt.

## 7. Failure handling

- JSON invalid: một repair attempt với schema, không gửi raw invalid output cho client; nếu vẫn lỗi trả `AI_SCHEMA_INVALID`.
- Provider timeout/quota: user message giữ `complete`; assistant placeholder `failed`; retry dùng cùng request lineage, không nhân đôi user statement.
- Stream disconnect: server hoàn tất hoặc cancel theo khả năng provider; client reload canonical messages từ DB.
- Context record lỗi/missing: không gọi AI với context nửa đúng; trả recoverable error và request id.
- Duplicate submit: return/replay canonical result theo idempotency key.

## 8. Evaluation set trước pilot

Tối thiểu 30 case do PO duyệt:

- 8 case discovery/clarification bình thường.
- 6 case permission và accept/edit/reject.
- 4 case mâu thuẫn giữa statement mới và insight cũ.
- 4 case question branching/resume và Life Profile context.
- 4 case experiment/reflection.
- 4 safety/prompt injection/adversarial.

Pass gates:

- 100% parse đúng schema sau tối đa một repair.
- 100% không tự confirm insight trong test.
- ≥ 90% transition hợp lệ trước server correction.
- 0 prompt/secret leakage trong adversarial set.
- Nội dung/methodology quality do PO chấm ≥ 4/5 trên ≥ 80% case.
