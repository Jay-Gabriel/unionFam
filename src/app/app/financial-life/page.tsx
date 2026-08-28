'use client';

import React from 'react';
import { Wallet, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function FinancialLifePage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center gap-2">
          <Wallet size={22} className="text-indigo-600" />
          <h2 className="font-bold text-slate-900 text-xl">Financial Life (Tài chính & Nguồn lực)</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Góc nhìn tích hợp giữa mục tiêu tài chính tự do và thiết kế cuộc sống cân bằng.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-2">
          <span className="text-xs text-slate-500 font-medium">Mục tiêu thu nhập tự do</span>
          <div className="text-2xl font-bold text-slate-900">50.000.000 VNĐ/tháng</div>
          <p className="text-[11px] text-emerald-600 font-semibold">Đủ để cover 100% chi phí gia đình cơ bản</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-2">
          <span className="text-xs text-slate-500 font-medium">Khoảng cách tài chính (Gap)</span>
          <div className="text-2xl font-bold text-slate-900">20.000.000 VNĐ/tháng</div>
          <p className="text-[11px] text-amber-600 font-semibold">Cần tạo từ dòng tiền thử nghiệm kinh doanh</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-2">
          <span className="text-xs text-slate-500 font-medium">Quỹ dự phòng an toàn</span>
          <div className="text-2xl font-bold text-slate-900">12 tháng chi phí</div>
          <p className="text-[11px] text-indigo-600 font-semibold">Cho phép tự tin thử nghiệm 4 ngày/tuần</p>
        </div>
      </div>
    </div>
  );
}
