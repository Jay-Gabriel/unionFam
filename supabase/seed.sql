-- Seed dev-placeholder Question Flow
INSERT INTO public.question_flow_versions (id, code, version_no, name, status, schema_version, checksum, published_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'dev-placeholder',
  1,
  'Bộ câu hỏi khám phá cuộc sống (Dev Fixture)',
  'published',
  1,
  'dev-checksum-001',
  NOW()
) ON CONFLICT DO NOTHING;

-- Seed Sample Questions
INSERT INTO public.questions (id, flow_version_id, question_key, title, helper_text, answer_type, options, branch_rules, ordinal, is_required)
VALUES 
(
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111111',
  'q1_life_focus',
  'Nếu bạn được tự lựa chọn cuộc đời mình, bạn muốn dành thời gian và năng lượng của mình cho điều gì?',
  'Hãy nghĩ về mong muốn chân thật nhất của bạn ở thời điểm hiện tại.',
  'text',
  '[]'::jsonb,
  '[]'::jsonb,
  1,
  true
),
(
  '22222222-2222-2222-2222-222222222202',
  '11111111-1111-1111-1111-111111111111',
  'q2_financial_freedom',
  'Điều gì trong cuộc sống mà nhiều tiền sẽ cho phép bạn làm mà hiện tại bạn chưa thể làm?',
  'Chi tiết các dự định, ước mơ hoặc mục tiêu tài chính.',
  'text',
  '[]'::jsonb,
  '[]'::jsonb,
  2,
  true
),
(
  '22222222-2222-2222-2222-222222222203',
  '11111111-1111-1111-1111-111111111111',
  'q3_work_style',
  'Bạn mong muốn mô hình công việc lý tưởng của mình là gì?',
  'Chọn đáp án phù hợp nhất',
  'single_choice',
  '[{"value": "work_4_days", "label": "Làm việc 4 ngày/tuần"}, {"value": "remote_full", "label": "Tự do địa điểm toàn thời gian"}, {"value": "entrepreneur", "label": "Kinh doanh tự do"}]'::jsonb,
  '[]'::jsonb,
  3,
  true
) ON CONFLICT DO NOTHING;
