# 03 — Data & API Specification

## 1. Quy ước dữ liệu

- Primary key `uuid`; thời gian `timestamptz` UTC; tên DB `snake_case`.
- Mọi row của member có `user_id not null` và index bắt đầu bằng `user_id`.
- Structured snapshot dùng `jsonb` có Zod/JSON schema đồng bộ.
- Soft delete bằng `deleted_at`; audit/version/error log không hard delete qua UI.
- Question flow, prompt và Life Profile đều versioned; phiên đang chạy pin version.
- Input validate ở server; RLS là lớp authorization cuối, không tin `user_id` từ client.

## 2. Identity và role

`auth.users` do Supabase Auth quản lý. `profiles.id` tham chiếu 1:1. Email/password và Google cùng map vào một auth user; phải xử lý account-linking theo cơ chế chính thức của Supabase, không tự merge chỉ bằng email.

`user_roles(user_id, role, granted_by, granted_at)` là bảng security support. Role gồm `member/admin`; chỉ operator bảo mật cấp `admin`, không có insert/update policy cho client.

## 3. 15 entity nghiệp vụ

Input mới cần nhiều hơn giả định 11 entity ban đầu vì Question Engine, answers, Life Profile và Learnings là dữ liệu độc lập. Không ép gộp JSON chỉ để giữ con số 11.

### 3.1 `profiles`

`id` PK/FK auth.users, `display_name`, `avatar_url`, `locale`, `timezone`, `onboarding_status`, `consented_at`, timestamps.

### 3.2 `question_flow_versions`

`id`, `code`, `version_no`, `name`, `status(draft/published/retired)`, `schema_version`, `checksum`, `published_at`, timestamps.

Unique `(code, version_no)`; chỉ một published version active theo code. Flow đã published bất biến.

### 3.3 `questions`

`id`, `flow_version_id`, `question_key`, `title`, `helper_text`, `answer_type(text/single_choice/multi_choice/scale/date)`, `options jsonb`, `branch_rules jsonb`, `ordinal`, `is_required`, timestamps.

Unique `(flow_version_id, question_key)`. `branch_rules` dùng DSL nhỏ được validate, không execute JavaScript/SQL tùy ý.

### 3.4 `user_answers`

`id`, `user_id`, `flow_version_id`, `question_id`, `answer jsonb`, `idempotency_key`, `answered_at`, `updated_at`, `deleted_at`.

Unique `(user_id, flow_version_id, question_id)` và `(user_id, idempotency_key)`. Answer phải match `answer_type/options` của question.

### 3.5 `conversations`

`id`, `user_id`, `title`, `status(active/paused/completed/archived)`, `current_stage`, `prompt_version`, `question_flow_version_id`, `last_message_at`, timestamps, `deleted_at`.

### 3.6 `messages`

`id`, `user_id`, `conversation_id`, `role(user/assistant/system_tool)`, `content`, `status(pending/streaming/complete/failed)`, `sequence_no`, `idempotency_key`, `provider_message_id`, `prompt_version`, token counts, `error_code`, timestamps.

Unique `(conversation_id, sequence_no)` và `(user_id, idempotency_key)` khi key có giá trị.

### 3.7 `user_statements`

`id`, `user_id`, `conversation_id`, `message_id`, `content`, `statement_type`, `dimension`, `captured_at`, `deleted_at`.

Lưu lời user; không bị AI overwrite. Mỗi message mặc định tạo một statement nguyên văn.

### 3.8 `ai_observations`

`id`, `user_id`, `conversation_id`, `assistant_message_id`, `observation_type`, `dimension`, `content_original`, `content_user_edited`, `confidence`, `status(pending/accepted/rejected)`, `decision_at`, `decision_idempotency_key`, timestamps.

### 3.9 `confirmed_insights`

`id`, `user_id`, `source_observation_id`, `insight_type`, `dimension`, `content`, `evidence_message_ids uuid[]`, `confirmed_at`, `superseded_by_id`, `deleted_at`, timestamps.

Unique `source_observation_id`; edited content của member thắng original content.

### 3.10 `life_profile_versions`

`id`, `user_id`, `version_no`, `status(draft/confirmed)`, `snapshot jsonb`, `source_answer_ids uuid[]`, `source_insight_ids uuid[]`, `created_by(user/system_draft)`, `is_current`, timestamps.

Unique `(user_id, version_no)`; partial unique một `is_current=true` mỗi user; confirmed snapshot bất biến.

Schema snapshot tối thiểu:

```json
{
  "schema_version": 1,
  "desire": "string",
  "escape": "string",
  "life_vision": "string",
  "dimensions": {
    "my_life": { "summary": "string", "evidence_ids": ["uuid"] },
    "what_matters": { "summary": "string", "evidence_ids": ["uuid"] },
    "my_ideal_day": { "summary": "string", "evidence_ids": ["uuid"] },
    "what_it_takes": { "summary": "string", "evidence_ids": ["uuid"] },
    "my_trade_offs": { "summary": "string", "evidence_ids": ["uuid"] },
    "the_question": { "summary": "string", "evidence_ids": ["uuid"] }
  }
}
```

### 3.11 `resources`

`id`, `user_id`, `dimension`, `resource_type(person/skill/time/money/community/tool/other)`, `name`, `description`, `confidence`, `source_insight_id`, timestamps, `deleted_at`.

### 3.12 `gaps`

`id`, `user_id`, `dimension`, `title`, `current_state`, `desired_state`, `priority 1..5`, `status(open/in_progress/closed/dismissed)`, `source_insight_id`, timestamps, `deleted_at`.

### 3.13 `experiments`

`id`, `user_id`, `gap_id`, `title`, `hypothesis`, `smallest_step`, `success_signal`, `observation_focus jsonb`, `start_date`, `target_date`, `progress_percent 0..100`, `status(draft/active/completed/abandoned)`, timestamps, `deleted_at`.

### 3.14 `reflections`

`id`, `user_id`, `experiment_id`, `result`, `learning_candidate`, `feeling`, `next_action`, `rating 1..5`, timestamps. Unique `(experiment_id)` trong MVP.

### 3.15 `learning_records`

`id`, `user_id`, `source_reflection_id`, `content`, `status(pending/confirmed/rejected)`, `confirmed_at`, timestamps, `deleted_at`.

AI có thể tạo `pending`; chỉ member confirm mới đưa learning vào Life Profile/context như fact.

## 4. Bảng kỹ thuật hỗ trợ

- `user_roles`: quyền member/admin.
- `prompt_configs`: encrypted content/ref, version, checksum, status; deny authenticated.
- `idempotency_records`: cho mutation không dùng unique trực tiếp.
- `ai_run_logs`: request id, user hash, provider/model, latency, token counts, status/error; không raw prompt/message.
- `application_errors`: request id, error code, sanitized detail, route, user hash, timestamp.
- `admin_access_logs`: admin id, target user/resource, action, reason, timestamp; append-only.
- `activity_events`: event type/date/metadata tối thiểu để tính streak/progress; không dùng cho surveillance/marketing.

## 5. RLS và admin access

| Nhóm | Member | Admin |
|---|---|---|
| 15 bảng nghiệp vụ | CRUD row của chính mình theo invariant | Không truy cập trực tiếp từ browser; đọc qua admin server service có audit |
| question flow/questions published | read | read |
| draft question/prompt config | deny | deny trong P0 UI |
| user_roles | đọc role của mình | admin service read |
| error/access logs | deny | admin service read sanitized; access log append |

Admin Dashboard không dùng service-role data dump xuống browser. Server action kiểm tra `is_admin(auth.uid())`, chọn field allowlist, mask answer/conversation preview mặc định và ghi `admin_access_logs` khi mở chi tiết.

RLS test bắt buộc dùng hai member JWT và một admin JWT; service-role test không chứng minh RLS.

## 6. API/Action contracts

Response JSON chuẩn:

```json
{
  "data": {},
  "error": null,
  "meta": { "request_id": "uuid" }
}
```

Error dùng `{code,message,field_errors?}`; không lộ stack/SQL/provider secret.

| Surface | Input/output chính | Invariant |
|---|---|---|
| `GET /auth/callback` | OAuth code → safe redirect | allowlist redirect URL |
| action `saveAnswer` | `{question_id,answer,idempotency_key}` | pinned flow, validate answer/ownership |
| action `getNextQuestion` | current answers → eligible question | deterministic branch; no arbitrary AI id |
| `POST /api/chat` | `{conversation_id,content,idempotency_key}` | SSE, auth/rate/context/schema |
| conversation actions | create/rename/archive/resume | owner only |
| `decideObservation` | decision/edit/key | atomic, max one insight |
| `saveLifeProfileDraft` | snapshot/base version | evidence/ownership/conflict check |
| `confirmLifeProfile` | snapshot/base version/key | immutable new version |
| resource/gap actions | validated CRUD | owner, soft delete |
| experiment actions | create/update/transition | state allowlist |
| `upsertReflection` | reflection input | completed experiment owner |
| `decideLearning` | accept/edit/reject/key | same agency invariant |
| admin query actions | filter/pagination/detail reason | admin role, allowlist, mask, audit |

Chat stream events: `message.started`, `message.delta`, `message.completed`, `observation.created`, `error`. Client không tạo business record từ delta.

## 7. Transaction bắt buộc

- Save/replace answer và progress consistency.
- Accept/edit/reject observation → confirmed insight.
- Confirm Life Profile và đổi current version.
- Experiment transition/reflection/learning decision.
- Persist AI completion: assistant message + stage + observation + error metadata.
- Admin detailed access log phải commit trước/đồng thời khi trả dữ liệu.

Dùng PostgreSQL function `security invoker` khi cần multi-statement. Với `security definer`, phải khóa `search_path`, revoke public execute, check role/owner trong function và có test abuse.

## 8. Migration và seed

- Migration forward-only, deterministic; table/index/function/RLS policy trong cùng change set.
- Seed dev chứa question flow ngắn gắn nhãn `dev-placeholder`, không giả danh flow 89 trang thật.
- Không seed prompt/methodology thật, dữ liệu khách hoặc API key.
- Generate TypeScript DB types và kiểm tra schema drift trong build.

