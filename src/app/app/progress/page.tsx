'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, MessageCircle, TrendingUp, Sparkles, BookOpen, Layers } from 'lucide-react';
import { LeafLoader } from '@/components/calm/leaf-loader';
import { LifeSynthesisReport } from '@/components/calm/life-synthesis-report';

type ProgressData = {
  streak: number;
  answers: number;
  conversations: number;
  experiments: number;
  questionnaireProgress: number;
  activeDays: number;
  activeExperimentProgress?: number;
  completedExperiments?: number;
};

const DEFAULT_PROGRESS: ProgressData = {
  streak: 7,
  answers: 18,
  conversations: 12,
  experiments: 3,
  questionnaireProgress: 100,
  activeDays: 7,
  activeExperimentProgress: 60,
  completedExperiments: 2,
};

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData>(DEFAULT_PROGRESS);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'synthesis' | 'metrics'>('synthesis');

  useEffect(() => {
    fetch('/api/progress')
      .then(async (response) => {
        const json = await response.json();
        if (response.ok && json.data) {
          setData(json.data);
        }
      })
      .catch(() => undefined);
  }, []);

  const questionnaireProgress = Math.max(0, Math.min(100, data?.questionnaireProgress || 0));
  const experimentProgress = Math.max(0, Math.min(100, data?.activeExperimentProgress || 0));

  const synthesisData = {
    userName: 'Bạn',
    archetype: 'Người Kiến Tạo Đang Chữa Lành',
    frequency: '528 Hz (Tái Sinh & Tình Yêu)',
    totalConversations: data?.conversations || 12,
    totalReflections: data?.answers || 18,
    streakDays: data?.streak || 7,
    clarityIndex: Math.min(96, Math.max(65, ((data?.streak || 5) * 4) + ((data?.conversations || 3) * 5))),
    metrics: [
      { label: 'Tĩnh Lặng Nội Tại', score: 88, description: 'Khả năng neo giữ sự bình thản giữa các biến động công việc.', color: 'from-emerald-500 to-teal-400' },
      { label: 'Sự Thông Suốt Mục Tiêu', score: 82, description: 'Mức độ sáng tỏ về giá trị cốt lõi và định hướng tương lai.', color: 'from-amber-400 to-yellow-300' },
      { label: 'Kết Nối & Thấu Cảm', score: 85, description: 'Năng lực lắng nghe sâu sắc và kiến tạo mối quan hệ chân thật.', color: 'from-rose-400 to-pink-300' },
      { label: 'Nội Lực Phục Hồi', score: 90, description: 'Khả năng tự hồi phục sau những giai đoạn quá tải năng lượng.', color: 'from-indigo-400 to-sky-400' },
    ],
    insights: [
      {
        tag: 'Điểm Sáng Tâm Thức',
        title: 'Nhận diện & Tôn trọng Ranh Giới Cá Nhân',
        summary: 'Bạn đã bắt đầu biết từ chối những kỳ vọng ngoại cảnh không còn phục vụ sự an yên bên trong.'
      },
      {
        tag: 'Nút Thắt Đang Chuyển Hoá',
        title: 'Thả lỏng Sự Cầu Toàn Cực Đoan',
        summary: 'Cho phép bản thân có những khoảng nghỉ và đón nhận sự bất toàn lành mạnh.'
      }
    ],
    roadmap: [
      {
        phase: 'Tuần 1-2',
        title: 'Lắng đọng & Giải tỏa áp lực tiềm thức',
        status: 'completed' as const,
        description: 'Nhận diện các mẫu hình căng thẳng và thiết lập thói quen tĩnh lặng mỗi sáng.'
      },
      {
        phase: 'Tuần 3-4',
        title: 'Định hình Giá trị lõi & Tái cấu trúc ưu tiên',
        status: 'active' as const,
        description: 'Tập trung vào 20% hoạt động mang lại 80% sự bình an và thành tựu chân thật.'
      },
      {
        phase: 'Tuần 5-8',
        title: 'Hành động từ Trạng thái Thuận Dòng (Flow State)',
        status: 'upcoming' as const,
        description: 'Hiện thực hóa các dự án lớn từ nền tảng nội lực vững vàng, không kiệt sức.'
      }
    ]
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="text-[#eed596]" size={26} />
            Hành Trình & Báo Cáo Chuyển Hoá
          </h1>
          <p className="text-xs text-stone-500 dark:text-[#b9c6a5] mt-1">
            Không gian ghi nhận sự trưởng thành tâm thức mà không tạo áp lực điểm số.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('synthesis')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'synthesis'
                ? 'bg-gradient-to-r from-[#eed596] to-[#dfbf75] text-[#12241b] shadow-md'
                : 'text-stone-600 dark:text-[#b9c6a5] hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Báo Cáo Tổng Hợp</span>
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'bg-gradient-to-r from-[#eed596] to-[#dfbf75] text-[#12241b] shadow-md'
                : 'text-stone-600 dark:text-[#b9c6a5] hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>Chỉ Số Chi Tiết</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-medium text-rose-300">
          {error}
        </div>
      )}

      {/* Synthesis View */}
      {activeTab === 'synthesis' && (
        <LifeSynthesisReport data={synthesisData} />
      )}

      {/* Detailed Metrics View */}
      {activeTab === 'metrics' && data && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#172a20] p-6 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-white text-base">Chuỗi Nuôi Dưỡng Thói Quen</h3>
            <div className="flex items-center gap-4 rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20">
              <Flame className="text-amber-400" size={36} />
              <div>
                <div className="text-2xl font-extrabold text-white">{data.streak} ngày liên tiếp</div>
                <p className="text-xs text-[#eed596]/90 mt-0.5">Mỗi ngày ghé thăm là một lần tưới tắm tâm hồn.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-black/20 border border-white/5 p-3.5">
                <MessageCircle className="mx-auto mb-1 text-emerald-400" size={18} />
                <b className="text-white text-sm">{data.conversations}</b>
                <p className="mt-1 text-[#b9c6a5]">cuộc đối thoại</p>
              </div>
              <div className="rounded-2xl bg-black/20 border border-white/5 p-3.5">
                <BookOpen className="mx-auto mb-1 text-amber-400" size={18} />
                <b className="text-white text-sm">{data.answers}</b>
                <p className="mt-1 text-[#b9c6a5]">câu phản tư</p>
              </div>
              <div className="rounded-2xl bg-black/20 border border-white/5 p-3.5">
                <Sparkles className="mx-auto mb-1 text-sky-400" size={18} />
                <b className="text-white text-sm">{data.activeDays}</b>
                <p className="mt-1 text-[#b9c6a5]">ngày kết nối</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#172a20] p-6 shadow-xl space-y-5">
            <h3 className="font-serif font-bold text-white text-base">Tiến Độ Bản Đồ Cuộc Sống</h3>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-white mb-1.5">
                  <span>Bộ Câu Hỏi Thấu Hiểu Bản Thân</span>
                  <span className="text-[#eed596]">{questionnaireProgress}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-black/30">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${questionnaireProgress}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-white mb-1.5">
                  <span>Thử Nghiệm Thói Quen Mới</span>
                  <span className="text-[#eed596]">{experimentProgress}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-black/30">
                  <div className="h-full rounded-full bg-[#eed596]" style={{ width: `${experimentProgress}%` }} />
                </div>
              </div>
            </div>

            <p className="text-xs leading-5 text-[#b9c6a5]">
              {data.experiments
                ? `${data.experiments} thử nghiệm đã khởi tạo · ${data.completedExperiments || 0} đã hoàn thành trọn vẹn.`
                : 'Chưa có thử nghiệm nào được tạo.'}
            </p>

            <Link
              href="/app/experiments"
              className="inline-flex items-center text-xs font-semibold text-[#eed596] hover:underline gap-1 pt-1"
            >
              Xem danh sách thử nghiệm <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
