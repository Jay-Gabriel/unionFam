-- Keep the development fixture aligned with Blueprint 1's canonical opening.
-- Customer-owned methodology content remains versioned separately.
UPDATE public.questions
SET title = 'Hãy tưởng tượng bạn đang sống một cuộc đời do chính mình lựa chọn. Trong một ngày bình thường, bạn muốn dành thời gian và năng lượng của mình cho những điều gì?'
WHERE question_key = 'q1_life_focus'
  AND flow_version_id IN (
    SELECT id
    FROM public.question_flow_versions
    WHERE code = 'dev-placeholder'
  );
