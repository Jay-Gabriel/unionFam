'use client';

import React from 'react';
import { GraduationCap, CheckCircle2, Award } from 'lucide-react';

export default function LearningsPage() {
  const learnings = [
    {
      id: 'lrn-1',
      content: 'Hầu hết các tin nhắn công việc buổi tối đều có thể chờ đến sáng hôm sau mà không gây ra khủng hoảng.',
      source: 'Reflection: Tắt điện thoại sau 20:00',
      status: 'Confirmed',
      date: '24/04/2025',
    },
    {
      id: 'lrn-2',
      content: 'Năng lượng sáng tạo cao nhất vào khoảng 8h00 - 11h00 sáng.',
      source: 'AI Observation confirmed',
      status: 'Confirmed',
      date: '15/04/2025',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center gap-2">
          <GraduationCap size={22} className="text-indigo-600" />
          <h2 className="font-bold text-slate-900 text-xl">Learnings (Kho bài học cá nhân)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Tập hợp các bài học đã được bạn xác nhận qua thực tế cuộc sống.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {learnings.map((lrn) => (
          <div key={lrn.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 size={12} />
                {lrn.status}
              </span>
              <span className="text-[10px] text-slate-400">{lrn.date}</span>
            </div>
            <p className="text-xs md:text-sm font-semibold text-slate-800 leading-snug">
              &ldquo;{lrn.content}&rdquo;
            </p>
            <p className="text-[11px] text-slate-400 italic">Nguồn: {lrn.source}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
