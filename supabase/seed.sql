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

-- Additional branchable dev-placeholder questions (not customer methodology).
INSERT INTO public.questions (id, flow_version_id, question_key, title, helper_text, answer_type, options, branch_rules, ordinal, is_required)
VALUES
(
  '22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111',
  'q4_ideal_day', 'Một ngày lý tưởng của bạn sẽ có nhịp điệu như thế nào?',
  'Mô tả một ngày đủ cụ thể để bạn có thể hình dung mình đang sống trong đó.',
  'text', '[]'::jsonb, '[]'::jsonb, 4, true
),
(
  '22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111',
  'q5_values', 'Điều gì đang quan trọng nhất với bạn trong giai đoạn này?',
  'Chọn tối đa ba điều bạn muốn giữ làm điểm tựa.',
  'multi_choice', '[{"value":"family","label":"Gia đình và người thân"},{"value":"freedom","label":"Tự do lựa chọn"},{"value":"health","label":"Sức khỏe và năng lượng"},{"value":"craft","label":"Làm tốt điều mình tin"},{"value":"community","label":"Đóng góp cho cộng đồng"}]'::jsonb, '[]'::jsonb, 5, true
),
(
  '22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111111',
  'q6_energy', 'Bạn đang có bao nhiêu năng lượng để thay đổi một điều nhỏ?',
  '1 là gần như cạn năng lượng, 10 là sẵn sàng bắt đầu ngay.',
  'scale', '[]'::jsonb, '[]'::jsonb, 6, true
),
(
  '22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111111',
  'q7_business_experiment', 'Nếu thử một ý tưởng kinh doanh nhỏ, bạn muốn kiểm chứng điều gì trước?',
  'Câu hỏi này mở ra khi bạn chọn hướng kinh doanh tự do.',
  'text', '[]'::jsonb, '[{"questionKey":"q3_work_style","operator":"equals","value":"entrepreneur","action":"include"}]'::jsonb, 7, false
),
(
  '22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111111',
  'q8_time_boundary', 'Bạn muốn dành lại khoảng thời gian nào cho chính mình?',
  'Có thể là một khung giờ, một ngày trong tuần hoặc một mốc bắt đầu.',
  'date', '[]'::jsonb, '[{"questionKey":"q3_work_style","operator":"equals","value":"work_4_days","action":"include"}]'::jsonb, 8, false
),
(
  '22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111111',
  'q9_tradeoff', 'Để tiến gần hơn tới nhịp sống đó, bạn sẵn sàng thử buông điều gì?',
  'Không cần cam kết vĩnh viễn; chỉ cần một lựa chọn có thể thử trong thời gian ngắn.',
  'text', '[]'::jsonb, '[]'::jsonb, 9, true
),
(
  '22222222-2222-2222-2222-222222222210', '11111111-1111-1111-1111-111111111111',
  'q10_next_step', 'Một bước nhỏ an toàn bạn có thể thử trong bảy ngày tới là gì?',
  'Hãy chọn điều có thể quan sát được, không cần hoàn hảo.',
  'text', '[]'::jsonb, '[]'::jsonb, 10, true
)
ON CONFLICT DO NOTHING;

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
