'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Compass, 
  TrendingUp, 
  Heart, 
  Share2, 
  CheckCircle2, 
  Flame,
  Calendar,
  Lock,
  Layers,
  ChevronRight
} from 'lucide-react';

export interface SynthesisMetric {
  label: string;
  score: number;
  description: string;
  color: string;
}

export interface SynthesisReportData {
  userName: string;
  archetype: string;
  frequency: string;
  totalConversations: number;
  totalReflections: number;
  streakDays: number;
  clarityIndex: number;
  metrics: SynthesisMetric[];
  insights: {
    title: string;
    summary: string;
    tag: string;
  }[];
  roadmap: {
    phase: string;
    title: string;
    status: 'completed' | 'active' | 'upcoming';
    description: string;
  }[];
}

const DEFAULT_REPORT: SynthesisReportData = {
  userName: 'Bạn',
  archetype: 'Người Kiến Tạo Đang Chữa Lành',
  frequency: '528 Hz (Tần số Tái Sinh & Tình Yêu)',
  totalConversations: 12,
  totalReflections: 18,
  streakDays: 7,
  clarityIndex: 86,
  metrics: [
    { label: 'Tĩnh Lặng Nội Tại', score: 88, description: 'Khả năng giữ tâm bình an giữa biến động.', color: 'from-emerald-500 to-teal-400' },
    { label: 'Sự Thông Suốt Mục Tiêu', score: 79, description: 'Mức độ sáng tỏ về định hướng và giá trị lõi.', color: 'from-amber-400 to-yellow-300' },
    { label: 'Kết Nối & Thấu Cảm', score: 84, description: 'Năng lực lắng nghe và mở lòng với các mối quan hệ.', color: 'from-rose-400 to-pink-300' },
    { label: 'Năng Lực Phục Hồi', score: 92, description: 'Khả năng chuyển hóa áp lực thành nội lực tĩnh tại.', color: 'from-indigo-400 to-sky-400' },
  ],
  insights: [
    {
      tag: 'Điểm Sáng Tâm Thức',
      title: 'Nhận thức sâu sắc về ranh giới cá nhân',
      summary: 'Bạn đã bắt đầu biết từ chối những kỳ vọng ngoại cảnh không còn phục vụ sự an yên bên trong.'
    },
    {
      tag: 'Nút Thắt Đang Tháo Gỡ',
      title: 'Hạ bớt tiêu chuẩn hoàn hảo không cần thiết',
      summary: 'Cho phép bản thân có những khoảng lặng và sự dang dở lành mạnh thay vì luôn gồng gánh.'
    }
  ],
  roadmap: [
    {
      phase: 'Tuần 1-2',
      title: 'Nhận diện & Lắng đọng cảm xúc',
      status: 'completed',
      description: 'Lắng nghe những tiếng thì thầm nội tại, giải tỏa áp lực tiềm thức.'
    },
    {
      phase: 'Tuần 3-4',
      title: 'Tái thiết lập ranh giới & Giá trị lõi',
      status: 'active',
      description: 'Định hình lại các ưu tiên cuộc sống, nuôi dưỡng năng lượng sáng tạo.'
    },
    {
      phase: 'Tuần 5-8',
      title: 'Hành động từ sự Tĩnh lặng (Effortless Action)',
      status: 'upcoming',
      description: 'Biến sự an yên bên trong thành sức mạnh hiện thực hóa các mục tiêu lớn.'
    }
  ]
};

export function LifeSynthesisReport({ 
  data = DEFAULT_REPORT, 
  onUpgradeClick 
}: { 
  data?: SynthesisReportData;
  onUpgradeClick?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const text = `🌿 Báo Cáo Tổng Kết Hành Trình Tâm Thức - Life Lab
✨ Bản Thể: ${data.archetype} (${data.frequency})
📊 Chỉ số Sáng Rõ Tâm Trí: ${data.clarityIndex}/100
🔥 Chuỗi nuôi dưỡng: ${data.streakDays} ngày liên tục
🌱 Cùng khám phá hành trình tĩnh lặng tại Life Lab!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] p-8 md:p-10 bg-gradient-to-br from-[#12241b] via-[#1a3327] to-[#0f2118] border border-[#eed596]/20 shadow-2xl text-white">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#eed596]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eed596]/15 border border-[#eed596]/30 text-[#eed596] text-xs font-medium tracking-wide">
              <Sparkles size={13} />
              <span>BÁO CÁO TỔNG KẾT NỘI TÂM & TIẾN TRÌNH</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white">
              Bản Đồ Chuyển Hoá & Sáng Rõ Tâm Trí
            </h1>
            <p className="text-sm text-[#b9c6a5] max-w-xl leading-relaxed">
              Tổng hợp từ các phiên đối thoại, chuỗi tự vấn và phản tư trong không gian Sanctuary của bạn.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[160px]">
            <span className="text-xs uppercase tracking-widest text-[#eed596] font-semibold">Chỉ số Sáng Rõ</span>
            <div className="text-4xl font-serif font-bold text-white mt-1">
              {data.clarityIndex}<span className="text-xl text-[#eed596]">/100</span>
            </div>
            <span className="text-[11px] text-[#b9c6a5] mt-1">Trạng thái: Rất Sâu Sắc</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#b9c6a5]">
              <Flame size={14} className="text-amber-400" />
              <span>Nuôi dưỡng</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">{data.streakDays} ngày</div>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#b9c6a5]">
              <Layers size={14} className="text-emerald-400" />
              <span>Đối thoại</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">{data.totalConversations} phiên</div>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#b9c6a5]">
              <Compass size={14} className="text-sky-400" />
              <span>Phản tư</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">{data.totalReflections} lần</div>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#b9c6a5]">
              <Heart size={14} className="text-rose-400" />
              <span>Tần số sóng</span>
            </div>
            <div className="text-xs font-semibold text-[#eed596] mt-1 truncate">{data.frequency.split(' ')[0]} Hz</div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Analytics */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-[#1c2a20] dark:text-white flex items-center gap-2">
          <TrendingUp size={18} className="text-[#eed596]" />
          4 Trục Năng Lượng & Độ Vững Vàng Nội Tại
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {data.metrics.map((metric, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 rounded-2xl bg-white dark:bg-[#15261d] border border-stone-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-stone-800 dark:text-stone-100 text-sm">{metric.label}</span>
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-[#eed596]">{metric.score}%</span>
              </div>
              <div className="h-2 w-full bg-stone-100 dark:bg-black/30 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${metric.color} transition-all duration-1000`} 
                  style={{ width: `${metric.score}%` }}
                />
              </div>
              <p className="text-xs text-stone-500 dark:text-[#b9c6a5] leading-relaxed">
                {metric.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Deep Insights Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-[#1c2a20] dark:text-white flex items-center gap-2">
          <Sparkles size={18} className="text-[#eed596]" />
          Góc Nhìn Khai Phóng Tâm Thức (Key Insights)
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {data.insights.map((insight, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-2xl bg-gradient-to-br from-stone-50 to-emerald-50/30 dark:from-[#13241b] dark:to-[#172c21] border border-stone-200 dark:border-white/10 space-y-2"
            >
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eed596]/20 text-amber-800 dark:text-[#eed596] border border-[#eed596]/30">
                {insight.tag}
              </span>
              <h3 className="font-serif font-bold text-stone-900 dark:text-white text-base">
                {insight.title}
              </h3>
              <p className="text-xs text-stone-600 dark:text-[#b9c6a5] leading-relaxed">
                {insight.summary}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 30-Day Growth Roadmap */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-[#1c2a20] dark:text-white flex items-center gap-2">
          <Calendar size={18} className="text-[#eed596]" />
          Lộ Trình Tái Tạo Năng Lượng (Transformation Roadmap)
        </h2>

        <div className="space-y-3">
          {data.roadmap.map((step, idx) => (
            <div 
              key={idx}
              className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                step.status === 'completed'
                  ? 'bg-emerald-50/60 dark:bg-[#122b1e] border-emerald-200 dark:border-emerald-700/40 text-stone-800 dark:text-stone-100'
                  : step.status === 'active'
                  ? 'bg-amber-50/40 dark:bg-[#1f2e1a] border-amber-300 dark:border-[#eed596]/40 text-stone-900 dark:text-white shadow-md'
                  : 'bg-stone-50/40 dark:bg-[#0f1d15] border-stone-200 dark:border-white/5 opacity-75'
              }`}
            >
              <div className="mt-0.5">
                {step.status === 'completed' ? (
                  <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                ) : step.status === 'active' ? (
                  <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-600" />
                )}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold uppercase text-emerald-700 dark:text-[#eed596]">
                    {step.phase}
                  </span>
                  <span className="text-xs text-stone-400">•</span>
                  <span className="font-bold text-sm">{step.title}</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-[#b9c6a5] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monetization & High-Value Conversion Sanctuary Card */}
      <div className="relative overflow-hidden rounded-[28px] p-8 bg-gradient-to-r from-[#1c2e22] via-[#243d2c] to-[#1a2d21] border border-[#eed596]/30 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eed596]/20 text-[#eed596] text-xs font-semibold">
              <Lock size={12} />
              <span>GÓI ĐỒNG HÀNH CHUYÊN SÂU 1:1</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-white">
              Mở Khóa Toàn Diện Bản Đồ Tâm Thức & Khai Vấn 1:1
            </h3>
            <p className="text-xs text-[#b9c6a5] max-w-lg leading-relaxed">
              Nhận bản phân tích tâm lý độc quyền 30 trang, audio thiền dẫn cá nhân hoá theo tần số sóng não của bạn, và 2 buổi khai vấn tĩnh lặng cùng Chuyên gia Thấu Cảm.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={onUpgradeClick}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#eed596] to-[#dfbf75] text-[#12241b] font-bold text-sm shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Nâng Cấp Sanctuary Pro</span>
              <ChevronRight size={16} />
            </button>
            <button
              onClick={handleCopySummary}
              className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={14} />
              <span>{copied ? 'Đã sao chép!' : 'Chia sẻ báo cáo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
