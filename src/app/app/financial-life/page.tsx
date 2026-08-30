'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, ShieldCheck, Wallet } from 'lucide-react';

type FinancialData = {
  snapshot: { desire?: string; escape?: string; life_vision?: string; dimensions?: Record<string, { summary?: string }> };
  resources: Array<{ id: string; name: string; resource_type: string; dimension: string; description?: string | null }>;
  gaps: Array<{ id: string; title: string; current_state: string; desired_state: string; priority: number; status: string }>;
};

export default function FinancialLifePage() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch('/api/life-profile'), fetch('/api/resources'), fetch('/api/gaps')])
      .then(async ([profileResponse, resourcesResponse, gapsResponse]) => {
        const profile = profileResponse.ok ? await profileResponse.json() : { data: { snapshot: {} } };
        const resources = resourcesResponse.ok ? await resourcesResponse.json() : { data: [] };
        const gaps = gapsResponse.ok ? await gapsResponse.json() : { data: [] };
        if (!cancelled) setData({ snapshot: profile.data?.snapshot || {}, resources: resources.data || [], gaps: gaps.data || [] });
      })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu tài chính'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="grid min-h-[420px] place-items-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const financialSummary = data?.snapshot.dimensions?.what_it_takes?.summary;
  const moneyResources = data?.resources.filter((resource) => resource.resource_type === 'money') || [];
  const financialGaps = data?.gaps.filter((gap) => gap.status !== 'dismissed') || [];

  return (
    <div className="legacy-calm-page space-y-6 pb-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-2"><Wallet size={22} className="text-indigo-600" /><h2 className="text-xl font-bold text-slate-900">Financial Life (Tài chính & Nguồn lực)</h2></div>
        <p className="mt-1 text-xs leading-5 text-slate-500">Không tự phỏng đoán thu nhập hay khuyến nghị đầu tư. Trang này chỉ hiển thị điều bạn đã xác nhận và các nguồn lực bạn tự ghi lại.</p>
      </div>

      {error && <div className="rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700">{error}</div>}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card"><span className="text-xs font-medium text-slate-500">Mong muốn đã ghi nhận</span><p className="mt-2 min-h-16 text-sm font-semibold leading-6 text-slate-900">{data?.snapshot.desire || 'Chưa có dữ liệu xác nhận'}</p><Link href="/app/life-map" className="mt-3 inline-flex items-center text-[11px] font-semibold text-indigo-600">Mở Life Map <ArrowRight size={13} className="ml-1" /></Link></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card"><span className="text-xs font-medium text-slate-500">Nguồn lực tài chính đã thêm</span><p className="mt-2 text-3xl font-bold text-slate-900">{moneyResources.length}</p><p className="mt-2 text-[11px] leading-5 text-emerald-600">Chỉ số đếm bản ghi, không phải số dư tài khoản.</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card"><span className="text-xs font-medium text-slate-500">Khoảng cách cần khám phá</span><p className="mt-2 text-3xl font-bold text-slate-900">{financialGaps.length}</p><p className="mt-2 text-[11px] leading-5 text-amber-600">Các gap do bạn tạo, chưa phải kết luận của AI.</p></div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card"><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600" /><h3 className="text-base font-bold text-slate-900">Góc nhìn nguồn lực</h3></div><p className="mt-3 text-sm leading-7 text-slate-700">{financialSummary || 'Hãy trò chuyện, trả lời Question Flow hoặc thêm một nguồn lực để xây dựng góc nhìn có căn cứ.'}</p><div className="mt-5 flex flex-wrap gap-2"><Link href="/app/resources" className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white">Quản lý nguồn lực</Link><Link href="/app/conversations/new" className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">Nói chuyện với Life Lab</Link></div></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card"><h3 className="text-base font-bold text-slate-900">Gap đang mở</h3>{financialGaps.length === 0 ? <p className="mt-3 text-sm leading-6 text-slate-500">Chưa có gap nào. Khi bạn xác định khoảng cách giữa hiện tại và mong muốn, hãy ghi lại để biến thành một thử nghiệm nhỏ.</p> : <div className="mt-4 space-y-3">{financialGaps.slice(0, 5).map((gap) => <div key={gap.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-900">{gap.title}</p><span className="text-[10px] font-bold text-indigo-600">Ưu tiên {gap.priority}</span></div><p className="mt-1 text-xs leading-5 text-slate-600">{gap.current_state} → {gap.desired_state}</p></div>)}</div>}</div>
      </section>
    </div>
  );
}
