'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Loader2, Star } from 'lucide-react';

export default function ReflectionsPage() {
  const [reflections, setReflections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/reflections').then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.error || 'Không thể tải reflections'); setReflections(json.data || []); }).catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải reflections')).finally(() => setLoading(false));
  }, []);
  return <div className="legacy-calm-page space-y-6 pb-12"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card"><div className="flex items-center gap-2"><BookOpen size={22} className="text-indigo-600" /><h2 className="text-xl font-bold text-slate-900">Reflections (Lịch sử phản chiếu)</h2></div><p className="mt-1 text-xs text-slate-500">Nhìn lại trải nghiệm thật để nhận ra điều đang thay đổi trong bạn.</p></div>{loading && <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-indigo-600" /></div>}{error && <div className="rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700">{error}</div>}{!loading && !error && reflections.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Chưa có reflection nào.</div>}<div className="space-y-4">{reflections.map((reflection) => <article key={reflection.id} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-card"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><h3 className="text-base font-bold text-slate-900">{reflection.experiment_title}</h3><span className="text-xs text-slate-400">{new Date(reflection.created_at).toLocaleDateString('vi-VN')}</span></div><p className="text-sm leading-6 text-slate-700"><b>Kết quả:</b> {reflection.result}</p><p className="text-sm leading-6 text-slate-700"><b>Cảm xúc:</b> {reflection.feeling}</p><div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 text-sm font-medium leading-6 text-indigo-950"><b className="text-indigo-700">Bài học rút ra:</b> {reflection.learning_candidate}</div>{reflection.rating && <div className="flex items-center gap-1 text-xs text-amber-600">{Array.from({ length: reflection.rating }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}</div>}</article>)}</div></div>;
}
