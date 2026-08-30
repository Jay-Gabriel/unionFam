'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, Loader2, MessageCircle, TrendingUp } from 'lucide-react';

type ProgressData = { streak: number; answers: number; conversations: number; experiments: number; questionnaireProgress: number; activeDays: number; activeExperimentProgress?: number; completedExperiments?: number };

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/progress').then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.error || 'Không thể tải tiến độ'); setData(json.data); }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể tải tiến độ')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid min-h-[420px] place-items-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!data) return <div className="legacy-calm-page rounded-3xl bg-rose-50 p-6 text-sm font-semibold text-rose-700">{error || 'Không có dữ liệu tiến độ.'}</div>;
  const questionnaireProgress = Math.max(0, Math.min(100, data.questionnaireProgress || 0));
  const experimentProgress = Math.max(0, Math.min(100, data.activeExperimentProgress || 0));

  return <div className="legacy-calm-page space-y-6 pb-12">
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card"><div className="flex items-center gap-2"><TrendingUp size={22} className="text-indigo-600" /><h2 className="text-xl font-bold text-slate-900">Progress (Tiến độ hành trình)</h2></div><p className="mt-1 text-xs leading-5 text-slate-500">Tổng hợp hoạt động đã lưu. Life Lab không chấm điểm con người và không biến tiến độ thành áp lực.</p></div>
    {error && <div className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div>}
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4"><h3 className="font-bold text-slate-900 text-base">Chuỗi tương tác</h3><div className="flex items-center gap-4 rounded-2xl bg-orange-50 p-4 border border-orange-100"><Flame className="text-orange-500" size={32} /><div><div className="text-xl font-extrabold text-slate-900">{data.streak} ngày</div><p className="text-xs text-orange-700">Số ngày liên tiếp có hoạt động được ghi nhận.</p></div></div><div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-2xl bg-slate-50 p-3"><MessageCircle className="mx-auto mb-1 text-indigo-600" size={16} /><b>{data.conversations}</b><p className="mt-1 text-slate-500">cuộc trò chuyện</p></div><div className="rounded-2xl bg-slate-50 p-3"><b>{data.answers}</b><p className="mt-1 text-slate-500">câu trả lời</p></div><div className="rounded-2xl bg-slate-50 p-3"><b>{data.activeDays}</b><p className="mt-1 text-slate-500">ngày hoạt động</p></div></div></div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-5"><h3 className="font-bold text-slate-900 text-base">Tỷ lệ hoàn thành Loop</h3><div className="space-y-2 text-xs"><div className="flex justify-between font-semibold"><span>Questionnaire</span><span>{questionnaireProgress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${questionnaireProgress}%` }} /></div><div className="flex justify-between pt-3 font-semibold"><span>Thử nghiệm đang chạy</span><span>{experimentProgress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${experimentProgress}%` }} /></div></div><p className="text-xs leading-5 text-slate-500">{data.experiments ? `${data.experiments} thử nghiệm đã tạo · ${data.completedExperiments || 0} đã hoàn thành.` : 'Chưa có thử nghiệm.'}</p><Link href="/app/experiments" className="inline-flex items-center text-xs font-semibold text-indigo-600">Xem thử nghiệm <ArrowRight size={13} className="ml-1" /></Link></div>
    </div>
  </div>;
}
