'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, FlaskConical, Loader2, Save } from 'lucide-react';
import { labelStatus } from '@/lib/i18n';

export default function ExperimentDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({ result: '', learningCandidate: '', feeling: '', nextAction: '', rating: 5 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/experiments/${params.id}`); const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Không thể tải thử nghiệm');
      setData(json.data);
      if (json.data.reflection) setForm({ result: json.data.reflection.result, learningCandidate: json.data.reflection.learning_candidate, feeling: json.data.reflection.feeling, nextAction: json.data.reflection.next_action, rating: json.data.reflection.rating || 5 });
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể tải thử nghiệm'); }
    finally { setLoading(false); }
  }, [params.id]);
  useEffect(() => { void load(); }, [load]);

  const saveReflection = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch('/api/reflections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ experimentId: params.id, ...form }) });
      const json = await response.json(); if (!response.ok) throw new Error(json.error || 'Không thể lưu phần ghi nhận');
      setMessage('Phần ghi nhận đã được lưu; bài học đang chờ bạn xác nhận.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể lưu phần ghi nhận'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="grid min-h-[420px] place-items-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (error && !data) return <div className="rounded-3xl bg-rose-50 p-6 text-sm font-semibold text-rose-700">{error}</div>;
  const experiment = data.experiment;
  return <div className="legacy-calm-page space-y-6 pb-12"><Link href="/app/experiments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600"><ArrowLeft size={14} /> Tất cả thử nghiệm</Link><section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><FlaskConical size={22} className="text-indigo-600" /><h1 className="text-xl font-bold text-slate-900">{experiment.title}</h1></div><p className="mt-2 text-sm leading-6 text-slate-600">{experiment.hypothesis}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700">{labelStatus(experiment.status)}</span></div><div className="grid gap-3 text-xs text-slate-600 md:grid-cols-3"><p><b>Bước nhỏ:</b> {experiment.smallest_step}</p><p><b>Dấu hiệu thành công:</b> {experiment.success_signal}</p><p><Calendar size={14} className="mr-1 inline" />{experiment.start_date} – {experiment.target_date}</p></div><div><div className="mb-1 flex justify-between text-xs font-semibold"><span>Tiến độ</span><span>{experiment.progress_percent}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${experiment.progress_percent}%` }} /></div></div></section>{message && <div className="rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{message}</div>}{error && <div className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div>}{experiment.status === 'completed' ? <form onSubmit={saveReflection} className="space-y-4 rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6"><h2 className="text-base font-bold text-indigo-950">Ghi nhận của bạn</h2><textarea required value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value })} placeholder="Điều gì đã xảy ra?" className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm" /><textarea required value={form.learningCandidate} onChange={(event) => setForm({ ...form, learningCandidate: event.target.value })} placeholder="Bạn rút ra điều gì?" className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm" /><div className="grid gap-3 md:grid-cols-2"><textarea required value={form.feeling} onChange={(event) => setForm({ ...form, feeling: event.target.value })} placeholder="Bạn cảm thấy thế nào?" className="min-h-20 rounded-2xl border border-slate-200 bg-white p-3 text-sm" /><textarea required value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} placeholder="Bước tiếp theo?" className="min-h-20 rounded-2xl border border-slate-200 bg-white p-3 text-sm" /></div><label className="block text-xs font-semibold text-slate-600">Mức độ hữu ích: <select value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })} className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal">{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label><button disabled={saving} className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white disabled:opacity-50"><Save size={14} />{saving ? 'Đang lưu…' : 'Lưu ghi nhận'}</button></form> : <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Hoàn thành thử nghiệm để mở phần ghi nhận.</div>}</div>;
}
