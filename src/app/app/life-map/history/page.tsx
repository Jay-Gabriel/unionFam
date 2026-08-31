'use client';

import React, { useEffect, useState } from 'react';
import { History, Loader2 } from 'lucide-react';

export default function LifeMapHistoryPage() {
  const [versions, setVersions] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/life-profile/history')
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Không thể tải lịch sử');
        setVersions(json.data || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải lịch sử'))
      .finally(() => setLoading(false));
  }, []);

  return <div className="legacy-calm-page space-y-6 pb-12">
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card"><div className="flex items-center gap-2"><History size={22} className="text-indigo-600" /><h2 className="text-xl font-bold text-slate-900">Lịch sử phiên bản bản đồ</h2></div><p className="mt-1 text-xs text-slate-500">Theo dõi sự tiến hóa trong nhận thức và thiết kế cuộc sống của bạn theo thời gian.</p></div>
    {loading && <div className="grid min-h-48 place-items-center text-slate-500"><Loader2 className="animate-spin text-indigo-600" /></div>}
    {error && <div className="rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700">{error}</div>}
    {!loading && !error && versions.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Chưa có phiên bản bản đồ nào.</div>}
    <div className="space-y-4">{versions.map((version) => <div key={version.id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-card"><div className="flex items-start gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-600">v{version.version_no}</div><div className="space-y-1"><div className="flex items-center gap-2"><h3 className="text-sm font-bold text-slate-900">Bản đồ cuộc sống · phiên bản {version.version_no}</h3>{version.is_current && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">Hiện tại</span>}</div><p className="text-xs text-slate-600">{version.status === 'draft' ? 'Bản nháp chưa xác nhận' : 'Phiên bản đã xác nhận'}</p><span className="block text-[10px] text-slate-400">{new Date(version.created_at).toLocaleString('vi-VN')}</span></div></div><details className="max-w-[45%] text-right"><summary className="cursor-pointer text-xs font-semibold text-indigo-600">Xem dữ liệu</summary><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-left text-[10px] text-slate-600">{JSON.stringify(version.snapshot, null, 2)}</pre></details></div>)}</div>
  </div>;
}
