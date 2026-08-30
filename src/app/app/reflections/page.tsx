'use client';

import React from 'react';
import { BookOpen, Calendar, Smile, Star } from 'lucide-react';

export default function ReflectionsPage() {
  const reflections = [
    {
      id: 'ref-1',
      experimentTitle: 'Tắt điện thoại sau 20:00 mỗi tối',
      date: '24/04/2025',
      result: 'Hoàn thành 12/14 ngày. Cảm giác vô cùng thư thái, ngủ ngon hơn.',
      feeling: 'Hạnh phúc và kiểm soát tốt thời gian cá nhân.',
      learning: 'Hầu hết các tin nhắn công việc buổi tối đều có thể chờ đến sáng hôm sau.',
      rating: 5,
    },
  ];

  return (
    <div className="legacy-calm-page space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-indigo-600" />
          <h2 className="font-bold text-slate-900 text-xl">Reflections (Lịch sử phản chiếu)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Nhìn lại các thử nghiệm đã trải qua để trích xuất bài học và cảm xúc thật của chính bạn.
        </p>
      </div>

      <div className="space-y-4">
        {reflections.map((ref) => (
          <div key={ref.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{ref.experimentTitle}</h3>
              <span className="text-xs text-slate-400 font-medium">{ref.date}</span>
            </div>

            <div className="space-y-2 text-xs md:text-sm text-slate-700">
              <p><span className="font-bold text-slate-900">Kết quả:</span> {ref.result}</p>
              <p><span className="font-bold text-slate-900">Cảm xúc:</span> {ref.feeling}</p>
              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 font-medium text-indigo-950">
                <span className="font-bold text-indigo-700">Bài học rút ra:</span> &ldquo;{ref.learning}&rdquo;
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
