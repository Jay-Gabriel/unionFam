-- UnionFam - Migration Schema MVP Hành Trình Quyết Định
-- Ngày tạo: 2026-11-15
-- Phiên bản: 1.0

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Decisions (Bảng cha quản lý danh sách quyết định)
CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'USER_REVIEW', 'CONFIRMED', 'PAUSED', 'CLOSED')),
    current_revision INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Decision Revisions (Lưu từng phiên bản bất biến của Thẻ Quyết Định)
CREATE TABLE IF NOT EXISTS public.decision_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID REFERENCES public.decisions(id) ON DELETE CASCADE NOT NULL,
    revision INTEGER NOT NULL,
    card_json JSONB NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('user', 'ai_proposal', 'scenario_template')),
    field_confirmations JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (decision_id, revision)
);

-- 3. Decision Proposals (Đề xuất thay đổi từ AI chưa xác nhận)
CREATE TABLE IF NOT EXISTS public.decision_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID REFERENCES public.decisions(id) ON DELETE CASCADE NOT NULL,
    base_revision INTEGER NOT NULL,
    proposed_fields JSONB NOT NULL,
    source_message_ids TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Conversation Messages (Chỉ lưu khi user đã cấp quyền lưu hội thoại)
CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID REFERENCES public.decisions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    text TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    client_request_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Experiments (Quản lý bước thử của quyết định)
CREATE TABLE IF NOT EXISTS public.experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID REFERENCES public.decisions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'REVIEW_DUE', 'COMPLETED', 'PAUSED', 'CANCELLED')),
    active_version INTEGER NOT NULL DEFAULT 1,
    timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Experiment Versions (Lịch sử các phiên bản điều chỉnh hành động thử)
CREATE TABLE IF NOT EXISTS public.experiment_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE CASCADE NOT NULL,
    version INTEGER NOT NULL,
    action TEXT NOT NULL,
    learning_question TEXT NOT NULL,
    observations TEXT NOT NULL,
    stop_rule TEXT NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days IN (1, 3, 7)),
    review_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (experiment_id, version)
);

-- 7. Checkins (Nhật ký ghi nhận 1 lần/ngày theo ngày địa phương)
CREATE TABLE IF NOT EXISTS public.checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE CASCADE NOT NULL,
    experiment_version INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    local_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('TRIED', 'NOT_TRIED', 'ADJUSTED')),
    note TEXT,
    energy INTEGER CHECK (energy >= 1 AND energy <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (experiment_id, local_date)
);

-- 8. Reviews (Đúc kết và nhìn lại sau khi bước thử hoàn tất)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE CASCADE NOT NULL,
    experiment_version INTEGER NOT NULL,
    facts TEXT NOT NULL,
    learning TEXT NOT NULL,
    next_action TEXT NOT NULL CHECK (next_action IN ('continue_cycle', 'new_experiment', 'pause', 'close')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Privacy Preferences (Thiết lập phạm vi lưu trữ cá nhân)
CREATE TABLE IF NOT EXISTS public.privacy_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK (scope IN ('card_only', 'card_and_transcript', 'session_only')),
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật Row Level Security cho cả 9 bảng
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_preferences ENABLE ROW LEVEL SECURITY;

-- Các chính sách phân quyền Row Level Security (RLS) bảo đảm owner cha-con
CREATE POLICY "Users own decisions" ON public.decisions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own revisions" ON public.decision_revisions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.decisions d WHERE d.id = decision_id AND d.user_id = auth.uid()));

CREATE POLICY "Users own proposals" ON public.decision_proposals
    FOR ALL USING (EXISTS (SELECT 1 FROM public.decisions d WHERE d.id = decision_id AND d.user_id = auth.uid()));

CREATE POLICY "Users own conversation messages" ON public.conversation_messages
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own experiments" ON public.experiments
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own experiment versions" ON public.experiment_versions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.experiments e WHERE e.id = experiment_id AND e.user_id = auth.uid()));

CREATE POLICY "Users own checkins" ON public.checkins
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own reviews" ON public.reviews
    FOR ALL USING (EXISTS (SELECT 1 FROM public.experiments e WHERE e.id = experiment_id AND e.user_id = auth.uid()));

CREATE POLICY "Users own privacy preferences" ON public.privacy_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tạo Indexes tăng tốc truy vấn theo quan hệ cha-con
CREATE INDEX IF NOT EXISTS idx_decisions_user ON public.decisions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_decision ON public.decision_revisions(decision_id, revision DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_decision ON public.decision_proposals(decision_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_decision ON public.conversation_messages(decision_id, sequence ASC);
CREATE INDEX IF NOT EXISTS idx_experiments_decision ON public.experiments(decision_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exp_versions ON public.experiment_versions(experiment_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_exp ON public.checkins(experiment_id, local_date DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_exp ON public.reviews(experiment_id, created_at DESC);
