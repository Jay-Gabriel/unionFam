'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Flame,
  FlaskConical,
  Heart,
  Leaf,
  Lightbulb,
  MessageCircleHeart,
  Scale,
  Send,
  Sparkles,
  Sprout,
  SunMedium,
  Target,
  Trees,
} from 'lucide-react';
import { LeafLoader } from '@/components/calm/leaf-loader';
import { labelStage, labelStatus } from '@/lib/i18n';

const mapItems = [
  { key: 'my_life', index: '01', title: 'ĐỜI SỐNG MONG MUỐN', detail: 'Cuộc đời tôi muốn sống', icon: Compass, tone: 'bg-calm-lichen/15 text-calm-lichen' },
  { key: 'what_matters', index: '02', title: 'ĐIỀU QUAN TRỌNG', detail: 'Điều thực sự quan trọng', icon: Heart, tone: 'bg-calm-success-leaf/15 text-calm-success-leaf' },
  { key: 'my_ideal_day', index: '03', title: 'NGÀY LÝ TƯỞNG', detail: 'Một ngày lý tưởng', icon: SunMedium, tone: 'bg-calm-warning-earth/15 text-calm-warning-earth' },
  { key: 'what_it_takes', index: '04', title: 'ĐIỀU CẦN CÓ', detail: 'Điều cần để sống như vậy', icon: Target, tone: 'bg-calm-pollen/15 text-calm-pollen' },
  { key: 'my_trade_offs', index: '05', title: 'ĐIỀU ĐÁNH ĐỔI', detail: 'Điều tôi chọn và từ bỏ', icon: Scale, tone: 'bg-calm-danger-clay/15 text-calm-danger-clay' },
  { key: 'the_question', index: '06', title: 'CÂU HỎI TIẾP THEO', detail: 'Câu hỏi để đi sâu hơn', icon: Lightbulb, tone: 'bg-calm-lichen/15 text-calm-lichen' },
];

const loopSteps = [
  { title: 'Khám phá', detail: 'Nhìn rõ điều mình muốn', icon: Compass, tag: 'Gieo hạt' },
  { title: 'Lựa chọn', detail: 'Chọn hướng phù hợp', icon: Target, tag: 'Nảy mầm' },
  { title: 'Thử nghiệm', detail: 'Thử một bước nhỏ', icon: FlaskConical, tag: 'Vươn chồi' },
  { title: 'Trải nghiệm', detail: 'Sống và quan sát', icon: Sprout, tag: 'Hứng nắng' },
  { title: 'Nhìn lại', detail: 'Ghi nhận điều đã xảy ra', icon: BookOpen, tag: 'Kết quả' },
  { title: 'Bài học', detail: 'Rút ra điều cho mình', icon: Trees, tag: 'Trưởng thành' },
];

const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

type DashboardState = {
  profile: { snapshot?: { dimensions?: Record<string, { summary?: string }> }; insights?: Array<{ id: string }> } | null;
  experiments: Array<{ id: string; title: string; status: string; progress_percent: number; target_date: string; observation_focus?: unknown }>;
  conversations: Array<{ id: string; title: string; status: string; current_stage: string; last_message_at: string }>;
  progress: { streak: number; questionnaireProgress: number; answers: number; conversations: number; experiments: number };
};

export default function DashboardOverviewPage() {
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [profileResponse, experimentResponse, conversationResponse, progressResponse] = await Promise.all([
          fetch('/api/life-profile'),
          fetch('/api/experiments'),
          fetch('/api/conversations'),
          fetch('/api/progress'),
        ]);
        const [profile, experiments, conversations, progress] = await Promise.all([
          profileResponse.ok ? profileResponse.json() : { data: null },
          experimentResponse.ok ? experimentResponse.json() : { data: [] },
          conversationResponse.ok ? conversationResponse.json() : { data: [] },
          progressResponse.ok ? progressResponse.json() : { data: {} },
        ]);
        if (!cancelled) {
          setDashboard({
            profile: profile.data || null,
            experiments: experiments.data || [],
            conversations: conversations.data || [],
            progress: {
              streak: progress.data?.streak || 0,
              questionnaireProgress: progress.data?.questionnaireProgress || 0,
              answers: progress.data?.answers || 0,
              conversations: progress.data?.conversations || 0,
              experiments: progress.data?.experiments || 0,
            },
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const activeExperiment = dashboard?.experiments.find((experiment) => experiment.status === 'active') || dashboard?.experiments[0];
  const latestConversation = dashboard?.conversations[0];
  const snapshot = dashboard?.profile?.snapshot;
  const streak = dashboard?.progress?.streak || 0;
  const totalAnswers = dashboard?.progress?.answers || 0;

  return (
    <motion.div
      initial={false}
      animate="show"
      transition={{ staggerChildren: 0.08 }}
      className="space-y-7"
    >
      {/* Living Sanctuary Hero Banner */}
      <motion.section
        variants={reveal}
        transition={{ duration: 0.6 }}
        className="sanctuary-card relative min-h-[220px] overflow-hidden p-7 text-calm-warm-ivory sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
      >
        {/* Ambient background bloom aura */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-calm-lichen/25 via-calm-pollen/15 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-gradient-to-tr from-calm-fern/30 via-transparent to-transparent blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-[680px]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-calm-lichen/30 bg-calm-lichen/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-calm-lichen shadow-[0_0_12px_rgba(185,198,165,0.2)]">
              <Leaf className="h-3.5 w-3.5 animate-pulse text-calm-lichen" />
              <span>Khu vườn tĩnh lặng của bạn</span>
            </div>
            <h2 className="max-w-xl text-[28px] font-medium leading-[1.2] tracking-[-0.03em] text-calm-paper-white sm:text-[36px]">
              Không cần có mọi câu trả lời. Chỉ cần một câu hỏi thật lòng.
            </h2>
            <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-calm-fog/90">
              Life Lab là không gian an toàn để bạn lắng nghe chính mình, thử nghiệm từng bước nhỏ và nuôi dưỡng hạt mầm cuộc sống mong muốn.
            </p>
          </div>

          {/* Living Sanctuary Stats & Sprout Badge */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-md shadow-inner">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-calm-pollen/15 text-calm-pollen shadow-[0_0_12px_rgba(229,196,120,0.3)]">
                <Flame className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-calm-fog/70">Nhịp duy trì</p>
                <p className="text-[16px] font-bold text-calm-paper-white">{streak > 0 ? `${streak} ngày liên tiếp` : 'Bắt đầu hôm nay'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-md shadow-inner">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-calm-lichen/15 text-calm-lichen shadow-[0_0_12px_rgba(185,198,165,0.3)]">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-calm-fog/70">Hạt giống thấu hiểu</p>
                <p className="text-[16px] font-bold text-calm-paper-white">{totalAnswers} câu hỏi đã mở</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Main Sanctuary Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]">
        {/* Left Column: AI Conversation Sanctuary */}
        <motion.section
          variants={reveal}
          transition={{ duration: 0.5 }}
          className="sanctuary-card overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-calm-lichen/15 text-calm-lichen border border-calm-lichen/20 shadow-[0_0_12px_rgba(185,198,165,0.2)]">
                <MessageCircleHeart className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-calm-fog/70">Một khoảng lặng</p>
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-calm-paper-white">Trò chuyện cùng Life Lab</h3>
              </div>
            </div>
            <Link
              href="/app/conversations/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-calm-lichen/20 to-calm-pollen/20 border border-white/15 px-4 py-2 text-[11px] font-semibold text-calm-warm-ivory transition hover:border-calm-lichen/40 hover:scale-105 active:scale-95"
            >
              Bắt đầu mới <ArrowRight className="h-3.5 w-3.5 text-calm-lichen" />
            </Link>
          </div>

          <div className="space-y-4 px-6 py-6">
            {loading && (
              <div className="flex min-h-32 items-center justify-center">
                <LeafLoader variant="bloom" size="md" label="Đang cảm nhận không gian của bạn…" />
              </div>
            )}
            {!loading && latestConversation && (
              <Link
                href={`/app/conversations/${latestConversation.id}`}
                className="group flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all hover:bg-white/[0.08] hover:border-calm-lichen/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-calm-lichen/15 text-calm-lichen border border-calm-lichen/20 group-hover:scale-105 transition-transform">
                  <Sprout className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-calm-paper-white group-hover:text-calm-warm-ivory text-sm truncate">{latestConversation.title}</p>
                    <span className="rounded-full bg-calm-lichen/10 px-2 py-0.5 text-[9px] font-medium text-calm-lichen border border-calm-lichen/20">
                      {labelStage(latestConversation.current_stage)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-calm-fog/80 line-clamp-2">
                    Mở lại phiên đối thoại để tiếp tục mạch phản chiếu cùng người bạn đồng hành AI.
                  </p>
                </div>
              </Link>
            )}
            {!loading && !latestConversation && (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center text-[13px] leading-relaxed text-calm-fog">
                <p className="text-calm-paper-white font-medium mb-1">Chưa có cuộc trò chuyện nào</p>
                Bạn có thể bắt đầu bằng một câu hỏi thật lòng về điều đang băn khoăn.
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <Link
              href="/app/conversations/new"
              className="flex min-h-12 items-center justify-between rounded-full border border-white/15 bg-white/[0.05] px-5 text-[12px] text-calm-fog/80 transition-all hover:border-calm-lichen/30 hover:bg-white/[0.08] hover:text-calm-paper-white"
            >
              <span>Chia sẻ điều đang ở trong tâm trí bạn hôm nay…</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-calm-lichen/20 text-calm-lichen border border-calm-lichen/30 shadow-[0_0_8px_rgba(185,198,165,0.3)]">
                <Send className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </motion.section>

        {/* Right Column: Life Map & Micro-Experiments */}
        <div className="space-y-6">
          <motion.section
            variants={reveal}
            transition={{ duration: 0.5 }}
            className="sanctuary-card p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-calm-pollen/15 text-calm-pollen border border-calm-pollen/20">
                  <Compass className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-calm-fog/70">Bản đồ đang lớn lên</p>
                  <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-calm-paper-white">Bản đồ cuộc sống</h3>
                </div>
              </div>
              <Link href="/app/life-map" className="text-[11px] font-semibold text-calm-lichen hover:text-calm-warm-ivory transition-colors">
                Xem toàn cảnh →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {mapItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.index}
                    href="/app/life-map"
                    className="group relative min-h-[110px] rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-calm-lichen/30 hover:bg-white/[0.08] hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold tracking-[0.14em] text-calm-fog/60">{item.index}</span>
                      <span className={`grid h-7 w-7 place-items-center rounded-lg ${item.tone} border border-white/5 transition-transform group-hover:scale-110`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] font-bold tracking-[0.06em] text-calm-warm-ivory group-hover:text-calm-pollen transition-colors">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-calm-fog/85">{snapshot?.dimensions?.[item.key]?.summary || item.detail}</p>
                  </Link>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            variants={reveal}
            transition={{ duration: 0.5 }}
            className="sanctuary-card p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-calm-lichen/15 text-calm-lichen border border-calm-lichen/20 shadow-[0_0_12px_rgba(185,198,165,0.2)]">
                  <FlaskConical className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-calm-fog/70">Thử nghiệm hiện tại</p>
                  <h3 className="mt-0.5 text-[15px] font-semibold leading-snug text-calm-paper-white">{activeExperiment?.title || 'Chưa có thử nghiệm đang chạy'}</h3>
                </div>
              </div>
              {activeExperiment && (
                <span className="rounded-full bg-calm-success-leaf/15 border border-calm-success-leaf/25 px-2.5 py-1 text-[9px] font-semibold text-calm-success-leaf shadow-[0_0_8px_rgba(159,197,167,0.2)]">
                  {labelStatus(activeExperiment.status)}
                </span>
              )}
            </div>
            {activeExperiment ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-calm-fog">
                  <span>Hạn {activeExperiment.target_date}</span>
                  <span className="font-semibold text-calm-pollen">{activeExperiment.progress_percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-calm-lichen via-calm-pollen to-calm-success-leaf transition-all duration-500" style={{ width: `${activeExperiment.progress_percent}%` }} />
                </div>
                <div className="flex items-start gap-2 text-[11px] leading-5 text-calm-fog/90">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-calm-success-leaf" />
                  Dữ liệu tiến độ lấy từ thử nghiệm thực tế của bạn.
                </div>
              </div>
            ) : (
              <Link href="/app/experiments" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-calm-lichen hover:text-calm-warm-ivory transition-colors">
                Tạo thử nghiệm đầu tiên <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </motion.section>
        </div>
      </div>

      {/* Life Lab Living Loop Section */}
      <motion.section
        variants={reveal}
        transition={{ duration: 0.5 }}
        className="sanctuary-card p-6 sm:p-7"
      >
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-calm-fog/70">Một vòng lặp có chủ đích</p>
            <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.025em] text-calm-paper-white">Vòng lặp tiến hóa Life Lab</h3>
          </div>
          <p className="max-w-lg text-[11px] leading-5 text-calm-fog/80">Không phải đường đua. Đây là nhịp để bạn hiểu mình qua từng lựa chọn nhỏ.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {loopSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="group relative rounded-2xl bg-white/[0.04] border border-white/10 p-4 transition-all duration-300 hover:bg-white/[0.08] hover:border-calm-lichen/30 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-calm-lichen/15 text-calm-lichen border border-calm-lichen/20 group-hover:scale-110 transition-transform">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] font-semibold text-calm-pollen/80 bg-calm-pollen/10 px-2 py-0.5 rounded-full border border-calm-pollen/20">{step.tag}</span>
                </div>
                <p className="text-[12px] font-semibold text-calm-paper-white group-hover:text-calm-warm-ivory">{step.title}</p>
                <p className="mt-1 text-[10px] text-calm-fog/70 leading-4">{step.detail}</p>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Action Gateway Navigation */}
      <motion.div variants={reveal} className="grid gap-4 md:grid-cols-2">
        <Link href="/app/questions" className="sanctuary-card group flex items-center justify-between p-5 transition-all hover:border-calm-lichen/40">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-calm-lichen/15 border border-calm-lichen/25 text-calm-lichen shadow-[0_0_12px_rgba(185,198,165,0.25)] group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-calm-fog/70">Tiếp tục hành trình</p>
              <p className="mt-1 text-sm font-semibold text-calm-paper-white group-hover:text-calm-warm-ivory">Trả lời câu hỏi tiếp theo</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-calm-lichen transition-transform group-hover:translate-x-1.5" />
        </Link>
        <Link href="/app/reflections" className="sanctuary-card group flex items-center justify-between p-5 transition-all hover:border-calm-pollen/40">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-calm-pollen/15 border border-calm-pollen/25 text-calm-pollen shadow-[0_0_12px_rgba(229,196,120,0.25)] group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-calm-fog/70">Khoảng lặng cuối ngày</p>
              <p className="mt-1 text-sm font-semibold text-calm-paper-white group-hover:text-calm-warm-ivory">Ghi lại một điều bạn nhận ra</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-calm-pollen transition-transform group-hover:translate-x-1.5" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
