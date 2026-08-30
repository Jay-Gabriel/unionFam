'use client';

import React from 'react';
import {
  Compass,
  Sparkles,
  Heart,
  Sun,
  ListOrdered,
  Scale,
  HelpCircle,
  CheckCircle2,
  Clock,
  History
} from 'lucide-react';
import Link from 'next/link';

export default function LifeMapPage() {
  const dimensions = [
    {
      id: 'my_life',
      code: '1. MY LIFE',
      title: 'Cuộc đời tôi muốn sống',
      icon: Sparkles,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50/70',
      borderColor: 'border-indigo-200',
      summary: 'Một cuộc sống tự do thời gian, có chiều sâu giá trị gia đình và độc lập tài chính bền vững.',
      confirmedInsightsCount: 3,
    },
    {
      id: 'what_matters',
      code: '2. WHAT MATTERS',
      title: 'Điều thực sự quan trọng',
      icon: Heart,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50/70',
      borderColor: 'border-emerald-200',
      summary: 'Sức khỏe tinh thần của bản thân, nụ cười của con cái và những khoảnh khắc gắn kết gia đình.',
      confirmedInsightsCount: 4,
    },
    {
      id: 'my_ideal_day',
      code: '3. MY IDEAL DAY',
      title: 'Một ngày lý tưởng',
      icon: Sun,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/70',
      borderColor: 'border-amber-200',
      summary: 'Thức dậy 7h, ăn sáng cùng gia đình, 3 tiếng làm việc tập trung cao độ, chiều rèn luyện thể thao.',
      confirmedInsightsCount: 2,
    },
    {
      id: 'what_it_takes',
      code: '4. WHAT IT TAKES',
      title: 'Tôi cần gì để sống cuộc đời đó',
      icon: ListOrdered,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50/70',
      borderColor: 'border-blue-200',
      summary: 'Nguồn thu nhập tự động, kỹ năng quản trị thời gian kỷ luật và sự thấu hiểu từ người thân.',
      confirmedInsightsCount: 3,
    },
    {
      id: 'my_trade_offs',
      code: '5. MY TRADE-OFFS',
      title: 'Tôi đang lựa chọn và từ bỏ điều gì',
      icon: Scale,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50/70',
      borderColor: 'border-rose-200',
      summary: 'Sẵn sàng từ bỏ các cuộc nhậu không mục đích và sự thăng tiến danh nghĩa ở công ty cũ.',
      confirmedInsightsCount: 2,
    },
    {
      id: 'the_question',
      code: '6. THE QUESTION',
      title: 'Câu hỏi tiếp theo để khám phá',
      icon: HelpCircle,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50/70',
      borderColor: 'border-violet-200',
      summary: 'Làm thế nào để tạo ra mô hình kinh doanh nhỏ chỉ cần 15h/tuần vận hành?',
      confirmedInsightsCount: 1,
    },
  ];

  return (
    <div className="legacy-calm-page space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="text-indigo-600" size={22} />
            <h2 className="font-bold text-slate-900 text-xl">Life Design Map</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bản đồ cuộc sống được tổng hợp 100% từ những insight do chính bạn xác nhận (Version 1.2 - Confirmed)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/life-map/history"
            className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <History size={15} />
            Lịch sử phiên bản
          </Link>
          <button className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all">
            Xác nhận bản đồ mới
          </button>
        </div>
      </div>

      {/* 6 Dimension Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dimensions.map((dim) => {
          const Icon = dim.icon;
          return (
            <div
              key={dim.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex flex-col justify-between hover:shadow-lg transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full ${dim.bgColor} ${dim.color}`}>
                    {dim.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {dim.confirmedInsightsCount} insights
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-2xl ${dim.bgColor} ${dim.color} flex-shrink-0 mt-0.5`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{dim.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-medium">
                  &ldquo;{dim.summary}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Cập nhật: 2 ngày trước</span>
                <button className="font-bold text-indigo-600 hover:text-indigo-700">
                  Xem chi tiết →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
