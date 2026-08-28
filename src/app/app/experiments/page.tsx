'use client';

import React from 'react';
import { FlaskConical, Plus, Calendar, Target, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function ExperimentsPage() {
  const experiments = [
    {
      id: 'exp-1',
      title: 'Làm việc 4 ngày/tuần trong 1 tháng',
      status: 'active',
      statusLabel: 'Đang thực hiện',
      statusColor: 'bg-emerald-100 text-emerald-700',
      startDate: '01/05/2025',
      targetDate: '31/05/2025',
      goal: 'Kiểm tra xem mình có thực sự muốn làm ít hơn hay chỉ muốn công việc có ý nghĩa hơn.',
      progress: 60,
      days: 'Ngày 18 / 30',
    },
    {
      id: 'exp-2',
      title: 'Tắt điện thoại sau 20:00 mỗi tối',
      status: 'completed',
      statusLabel: 'Đã hoàn thành',
      statusColor: 'bg-indigo-100 text-indigo-700',
      startDate: '10/04/2025',
      targetDate: '24/04/2025',
      goal: 'Tăng chất lượng giấc ngủ và dành thời gian trò chuyện cùng vợ.',
      progress: 100,
      days: '14 / 14 ngày',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical size={22} className="text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-xl">Experiments (Thử nghiệm nhỏ)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Biến ý tưởng thiết kế cuộc sống thành các thử nghiệm ngắn hạn có thể đo lường.
          </p>
        </div>
        <button className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all">
          <Plus size={16} />
          Tạo thử nghiệm mới
        </button>
      </div>

      {/* Experiments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-slate-900 text-base leading-tight">{exp.title}</h3>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${exp.statusColor}`}>
                {exp.statusLabel}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Target size={15} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-semibold text-slate-800">Mục tiêu:</span> {exp.goal}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-slate-400 flex-shrink-0" />
                <p>
                  <span className="font-semibold text-slate-800">Thời gian:</span> {exp.startDate} - {exp.targetDate}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Tiến độ</span>
                <span className="text-slate-500">{exp.days}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full transition-all"
                  style={{ width: `${exp.progress}%` }}
                />
              </div>
              <div className="text-right text-[11px] font-bold text-indigo-600 mt-1">{exp.progress}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
