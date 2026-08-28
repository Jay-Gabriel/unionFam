'use client';

import React from 'react';
import { History, GitCommit, Check } from 'lucide-react';

export default function LifeMapHistoryPage() {
  const versions = [
    {
      versionNo: 2,
      status: 'Current Active',
      createdDate: '26/08/2026',
      changes: 'Cập nhật mục tiêu thời gian gia đình & thử nghiệm 4 ngày/tuần',
      isCurrent: true,
    },
    {
      versionNo: 1,
      status: 'Archived Version',
      createdDate: '10/08/2026',
      changes: 'Khởi tạo Life Design Map từ câu hỏi Onboarding',
      isCurrent: false,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center gap-2">
          <History size={22} className="text-indigo-600" />
          <h2 className="font-bold text-slate-900 text-xl">Life Map Lịch sử phiên bản</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi sự tiến hóa trong nhận thức và thiết kế cuộc sống của bạn theo thời gian.
        </p>
      </div>

      <div className="space-y-4">
        {versions.map((ver) => (
          <div key={ver.versionNo} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
                v{ver.versionNo}.0
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">Life Design Snapshot v{ver.versionNo}.0</h3>
                  {ver.isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      Hiện tại
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{ver.changes}</p>
                <span className="text-[10px] text-slate-400 block">Ngày tạo: {ver.createdDate}</span>
              </div>
            </div>

            <button className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
              Xem snapshot
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
