'use client';

import React from 'react';
import { FolderArchive, Plus, User, Sparkles, Clock, Wrench } from 'lucide-react';

export default function ResourcesPage() {
  const resources = [
    {
      id: 'res-1',
      name: 'Vốn kinh nghiệm 5 năm Quản lý Dự án',
      type: 'skill',
      typeLabel: 'Kỹ năng',
      dimension: 'what_it_takes',
      confidence: '100%',
    },
    {
      id: 'res-2',
      name: 'Mạng lưới đối tác kinh doanh cũ',
      type: 'community',
      typeLabel: 'Mối quan hệ',
      dimension: 'what_it_takes',
      confidence: '85%',
    },
  ];

  return (
    <div className="legacy-calm-page space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderArchive size={22} className="text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-xl">Resources (Nguồn lực hiện có)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý các nguồn lực cá nhân (kỹ năng, thời gian, tài chính, mối quan hệ) hỗ trợ hành trình.
          </p>
        </div>
        <button className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all">
          <Plus size={16} />
          Thêm nguồn lực
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((res) => (
          <div key={res.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                {res.typeLabel}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Độ tin cậy: {res.confidence}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{res.name}</h3>
            <p className="text-xs text-slate-500">Dimension: {res.dimension}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
