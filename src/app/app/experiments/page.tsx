'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical, Plus, Calendar, Target, Loader2, ArrowRight } from 'lucide-react';
import { labelStatus } from '@/lib/i18n';

type Experiment = {
  id: string;
  title: string;
  status: string;
  start_date: string;
  target_date: string;
  hypothesis: string;
  smallest_step: string;
  success_signal: string;
  progress_percent: number;
};

const today = new Date().toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', hypothesis: '', smallestStep: '', successSignal: '', startDate: today, targetDate: nextWeek });

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/experiments');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Không thể tải thử nghiệm');
      setExperiments(json.data || []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể tải thử nghiệm'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createExperiment = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch('/api/experiments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Không thể tạo thử nghiệm');
      setExperiments((current) => [json.data, ...current]); setShowForm(false); setForm({ title: '', hypothesis: '', smallestStep: '', successSignal: '', startDate: today, targetDate: nextWeek });
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể tạo thử nghiệm'); }
    finally { setSaving(false); }
  };

  const transition = async (experiment: Experiment, status: string) => {
    try {
      const response = await fetch(`/api/experiments/${experiment.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, progressPercent: status === 'completed' ? 100 : experiment.progress_percent }) });
      const json = await response.json(); if (!response.ok) throw new Error(json.error || 'Không thể cập nhật trạng thái');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái'); }
  };

  return <div className="legacy-calm-page space-y-6 pb-12">
    <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card md:flex-row md:items-center"><div><div className="flex items-center gap-2"><FlaskConical size={22} className="text-indigo-600" /><h2 className="text-xl font-bold text-slate-900">Thử nghiệm nhỏ</h2></div><p className="mt-1 text-xs text-slate-500">Biến một lựa chọn thành bước thử ngắn hạn có thể quan sát.</p></div><button onClick={() => setShowForm((value) => !value)} className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200"><Plus size={16} /> Tạo thử nghiệm mới</button></div>
    {error && <div className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div>}
    {showForm && <form onSubmit={createExperiment} className="space-y-4 rounded-3xl border border-indigo-100 bg-indigo-50/60 p-6"><h3 className="text-sm font-bold text-indigo-950">Thử nghiệm mới</h3><input required placeholder="Tên thử nghiệm" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" /><div className="grid gap-3 md:grid-cols-2"><textarea required placeholder="Giả thuyết" value={form.hypothesis} onChange={(event) => setForm({ ...form, hypothesis: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" /><textarea required placeholder="Bước nhỏ nhất" value={form.smallestStep} onChange={(event) => setForm({ ...form, smallestStep: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" /></div><textarea required placeholder="Dấu hiệu thành công" value={form.successSignal} onChange={(event) => setForm({ ...form, successSignal: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" /><div className="grid gap-3 md:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Bắt đầu<input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-slate-600">Kết thúc<input required type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal" /></label></div><button disabled={saving} className="rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu thử nghiệm'}</button></form>}
    {loading && <div className="grid min-h-48 place-items-center text-slate-500"><Loader2 className="animate-spin text-indigo-600" /></div>}
    {!loading && experiments.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Chưa có thử nghiệm. Hãy bắt đầu bằng một bước nhỏ.</div>}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{experiments.map((experiment) => <div key={experiment.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card"><div className="flex items-start justify-between gap-3"><h3 className="text-base font-bold leading-tight text-slate-900">{experiment.title}</h3><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${experiment.status === 'completed' ? 'bg-indigo-100 text-indigo-700' : experiment.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{labelStatus(experiment.status)}</span></div><div className="space-y-2 text-xs text-slate-600"><p><Target size={15} className="mr-2 inline text-indigo-600" /><b>Giả thuyết:</b> {experiment.hypothesis}</p><p><Calendar size={15} className="mr-2 inline text-slate-400" /><b>Thời gian:</b> {experiment.start_date} – {experiment.target_date}</p><p><b>Bước nhỏ:</b> {experiment.smallest_step}</p></div><div><div className="mb-1 flex justify-between text-xs font-semibold text-slate-600"><span>Tiến độ</span><span>{experiment.progress_percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600" style={{ width: `${experiment.progress_percent}%` }} /></div></div><div className="flex items-center justify-between border-t border-slate-100 pt-3"><Link href={`/app/experiments/${experiment.id}`} className="flex items-center gap-1 text-xs font-semibold text-indigo-600">Chi tiết <ArrowRight size={13} /></Link>{experiment.status === 'draft' && <button onClick={() => transition(experiment, 'active')} className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white">Bắt đầu</button>}{experiment.status === 'active' && <button onClick={() => transition(experiment, 'completed')} className="rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-semibold text-white">Hoàn thành</button>}</div></div>)}</div>
  </div>;
}
