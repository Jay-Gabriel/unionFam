'use client';

import React from 'react';
import { TrendingUp, Flame, CheckCircle2 } from 'lucide-react';

export default function ProgressPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center gap-2">
          <TrendingUp size={22} className="text-indigo-600" />
          <h2 className="font-bold text-slate-900 text-xl">Progress (Tiến độ hành trình)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Tổng hợp chuỗi hoạt động, tần suất phản chiếu và tiến độ các thử nghiệm.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Chuỗi tương tác (Streak)</h3>
          <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
            <Flame className="text-orange-500" size={32} />
            <div>
              <div className="text-xl font-extrabold text-slate-900">12 Ngày Liên Tục</div>
              <p className="text-xs text-orange-700">Giữ nhịp tương tác và phản chiếu hàng ngày thành công!</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Tỷ lệ hoàn thành Loop</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-semibold">
              <span>Questionnaire Progress</span>
              <span>100%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full" />
            </div>

            <div className="flex justify-between font-semibold pt-2">
              <span>Experiment Active Progress</span>
              <span>60%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 w-[60%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
