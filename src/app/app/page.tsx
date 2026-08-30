'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
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
  Loader2,
} from 'lucide-react';

const mapItems = [
  { key: 'my_life', index: '01', title: 'MY LIFE', detail: 'Cuộc đời tôi muốn sống', icon: Compass, tone: 'bg-white/10 text-calm-lichen' },
  { key: 'what_matters', index: '02', title: 'WHAT MATTERS', detail: 'Điều thực sự quan trọng', icon: Heart, tone: 'bg-white/10 text-calm-success-leaf' },
  { key: 'my_ideal_day', index: '03', title: 'MY IDEAL DAY', detail: 'Một ngày lý tưởng', icon: SunMedium, tone: 'bg-white/10 text-calm-warning-earth' },
  { key: 'what_it_takes', index: '04', title: 'WHAT IT TAKES', detail: 'Điều cần để sống như vậy', icon: Target, tone: 'bg-white/10 text-calm-pollen' },
  { key: 'my_trade_offs', index: '05', title: 'MY TRADE-OFFS', detail: 'Điều tôi chọn và từ bỏ', icon: Scale, tone: 'bg-white/10 text-calm-danger-clay' },
  { key: 'the_question', index: '06', title: 'THE QUESTION', detail: 'Câu hỏi để đi sâu hơn', icon: Lightbulb, tone: 'bg-white/10 text-calm-lichen' },
];

const loopSteps = [
  { title: 'Explore', detail: 'Khám phá', icon: Compass },
  { title: 'Choose', detail: 'Lựa chọn', icon: Target },
  { title: 'Experiment', detail: 'Thử nghiệm', icon: FlaskConical },
  { title: 'Experience', detail: 'Trải nghiệm', icon: Sprout },
  { title: 'Reflection', detail: 'Nhìn lại', icon: BookOpen },
  { title: 'Learning', detail: 'Rút ra bài học', icon: Lightbulb },
];

const reveal = {
  hidden: { opacity: 0, y: 14 },
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

  return (
    <motion.div
      initial={false}
      animate="show"
      transition={{ staggerChildren: 0.07 }}
      className="space-y-6"
    >
      <motion.section
        variants={reveal}
        transition={{ duration: 0.55 }}
        className="relative min-h-[210px] overflow-hidden rounded-[34px] border border-white/10 bg-calm-deep-moss/80 px-6 py-7 text-calm-warm-ivory shadow-glass sm:px-9 sm:py-9"
      >
        <div className="relative z-10 max-w-[680px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-calm-lichen">
            <Leaf className="h-3.5 w-3.5" /> Buổi sáng trong khu vườn của bạn
          </div>
          <h2 className="max-w-xl text-[27px] font-medium leading-[1.18] tracking-[-0.035em] sm:text-[35px] text-calm-paper-white">
            Không cần có mọi câu trả lời. Chỉ cần một câu hỏi thật lòng.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-calm-fog/80">
            Life Lab đồng hành để bạn nhìn rõ điều mình muốn, thử một bước nhỏ và học từ chính trải nghiệm đó.
          </p>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]">
        <motion.section
          variants={reveal}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-[32px] border border-white/10 bg-[#314035]/90 shadow-glass"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-calm-lichen">
                <MessageCircleHeart className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-calm-fog/70">Một khoảng lặng</p>
                <h3 className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] text-calm-paper-white">Trò chuyện cùng Life Lab</h3>
              </div>
            </div>
            <Link
              href="/app/conversations/new"
              className="hidden items-center gap-1.5 rounded-full bg-white/15 border border-white/10 px-4 py-2 text-[11px] font-semibold text-calm-warm-ivory transition hover:bg-white/25 sm:inline-flex"
            >
              Bắt đầu mới <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-5 px-5 py-6 sm:px-7">
            {loading && <div className="flex min-h-32 items-center justify-center text-calm-fog"><Loader2 className="h-5 w-5 animate-spin" /></div>}
            {!loading && latestConversation && (
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-calm-lichen border border-white/5"><Sprout className="h-4 w-4" /></div>
                <div className="rounded-[22px] rounded-tl-md bg-white/10 border border-white/5 px-4 py-3 text-[13px] leading-6 text-calm-paper-white">
                  <p className="font-semibold">{latestConversation.title}</p>
                  <p className="mt-1 text-calm-fog/80">Phiên đang ở bước {latestConversation.current_stage}. Mở lại để tiếp tục mạch phản chiếu của bạn.</p>
                </div>
              </div>
            )}
            {!loading && !latestConversation && (
              <div className="rounded-[22px] border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-[13px] leading-6 text-calm-fog">
                Chưa có cuộc trò chuyện nào. Bạn có thể bắt đầu bằng một câu hỏi thật lòng.
              </div>
            )}
          </div>

          <div className="px-5 pb-5 sm:px-7 sm:pb-7">
            <Link
              href="/app/conversations/new"
              className="flex min-h-12 items-center justify-between rounded-full border border-white/15 bg-white/5 px-5 text-[12px] text-calm-fog/70 transition hover:bg-white/10"
            >
              <span>Chia sẻ điều đang ở trong tâm trí bạn…</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-calm-paper-white">
                <Send className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </motion.section>

        <div className="space-y-6">
          <motion.section
            variants={reveal}
            transition={{ duration: 0.5 }}
            className="rounded-[32px] border border-white/10 bg-[#314035]/90 p-5 shadow-glass sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-calm-fog/70">Bản đồ đang lớn lên</p>
                <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-calm-paper-white">Life Design Map</h3>
              </div>
              <Link href="/app/life-map" className="text-[11px] font-semibold text-calm-fog hover:text-white">
                Xem chi tiết
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {mapItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.index}
                    href="/app/life-map"
                    className="group min-h-[112px] rounded-[22px] border border-white/10 bg-white/5 p-3.5 transition duration-300 hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold tracking-[0.14em] text-calm-fog/65">{item.index}</span>
                      <span className={`grid h-8 w-8 place-items-center rounded-full ${item.tone} border border-white/5`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="mt-2 text-[9px] font-bold tracking-[0.08em] text-calm-warm-ivory">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-calm-fog/90">{snapshot?.dimensions?.[item.key]?.summary || item.detail}</p>
                  </Link>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            variants={reveal}
            transition={{ duration: 0.5 }}
            className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-glass sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-calm-paper-white shadow-sm border border-white/5">
                  <FlaskConical className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-calm-fog/70">Thử nghiệm hiện tại</p>
                  <h3 className="mt-1 text-[15px] font-semibold leading-5 text-calm-paper-white">{activeExperiment?.title || 'Chưa có thử nghiệm đang chạy'}</h3>
                </div>
              </div>
              {activeExperiment && <span className="rounded-full bg-calm-success-leaf/20 border border-calm-success-leaf/20 px-2.5 py-1 text-[9px] font-semibold text-calm-success-leaf">{activeExperiment.status === 'active' ? 'Đang diễn ra' : activeExperiment.status}</span>}
            </div>
            {activeExperiment ? <div className="mt-5 space-y-3"><div className="flex items-center justify-between text-[11px] text-calm-fog"><span>Hạn {activeExperiment.target_date}</span><span className="font-semibold text-calm-warm-ivory">{activeExperiment.progress_percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-calm-success-leaf to-calm-lichen" style={{ width: `${activeExperiment.progress_percent}%` }} /></div><div className="flex items-start gap-2 text-[11px] leading-5 text-calm-fog/90"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-calm-success-leaf" />Dữ liệu tiến độ lấy từ thử nghiệm của bạn, không phải chỉ số suy đoán.</div></div> : <Link href="/app/experiments" className="mt-5 inline-flex text-[12px] font-semibold text-calm-lichen">Tạo thử nghiệm đầu tiên <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>}
          </motion.section>
        </div>
      </div>

      <motion.section
        variants={reveal}
        transition={{ duration: 0.5 }}
        className="rounded-[32px] border border-white/10 bg-[#314035]/90 p-5 shadow-glass sm:p-7"
      >
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-calm-fog/70">Một vòng lặp có chủ đích</p>
            <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.025em] text-calm-paper-white">Life Lab Loop của bạn</h3>
          </div>
          <p className="max-w-lg text-[11px] leading-5 text-calm-fog/80">Không phải đường đua. Đây là nhịp để bạn hiểu mình qua từng lựa chọn nhỏ.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {loopSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative rounded-[22px] bg-white/5 border border-white/5 p-4">
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-calm-warm-ivory shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-semibold text-calm-fog/50">0{index + 1}</span>
                </div>
                <p className="text-[12px] font-semibold text-calm-paper-white">{step.title}</p>
                <p className="mt-1 text-[10px] text-calm-fog/70">{step.detail}</p>
              </div>
            );
          })}
        </div>
      </motion.section>

      <motion.div variants={reveal} className="grid gap-4 md:grid-cols-2">
        <Link href="/app/questions" className="group flex items-center justify-between rounded-[28px] border border-white/10 bg-[#314035]/90 p-5 transition hover:bg-[#3b4b3f] hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 border border-white/5 text-calm-lichen"><Sparkles className="h-[18px] w-[18px]" /></span>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-calm-fog/70">Tiếp tục hành trình</p><p className="mt-1 text-sm font-semibold text-calm-paper-white">Trả lời câu hỏi tiếp theo</p></div>
          </div>
          <ArrowRight className="h-4 w-4 text-calm-lichen transition group-hover:translate-x-1" />
        </Link>
        <Link href="/app/reflections" className="group flex items-center justify-between rounded-[28px] border border-white/10 bg-[#314035]/90 p-5 transition hover:bg-[#3b4b3f] hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 border border-white/5 text-calm-warning-earth"><BookOpen className="h-[18px] w-[18px]" /></span>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-calm-fog/70">Khoảng lặng cuối ngày</p><p className="mt-1 text-sm font-semibold text-calm-paper-white">Ghi lại một điều bạn nhận ra</p></div>
          </div>
          <ArrowRight className="h-4 w-4 text-calm-warning-earth transition group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
