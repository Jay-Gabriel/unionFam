'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  Sparkles,
  Heart,
  Sun,
  ListOrdered,
  Scale,
  HelpCircle,
  CheckCircle2,
  History,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

const dimensions = [
  { id: 'my_life', code: '1. MY LIFE', title: 'Cuộc đời tôi muốn sống', icon: Sparkles, color: 'text-indigo-600', bgColor: 'bg-indigo-50/70', borderColor: 'border-indigo-200' },
  { id: 'what_matters', code: '2. WHAT MATTERS', title: 'Điều thực sự quan trọng', icon: Heart, color: 'text-emerald-600', bgColor: 'bg-emerald-50/70', borderColor: 'border-emerald-200' },
  { id: 'my_ideal_day', code: '3. MY IDEAL DAY', title: 'Một ngày lý tưởng', icon: Sun, color: 'text-amber-600', bgColor: 'bg-amber-50/70', borderColor: 'border-amber-200' },
  { id: 'what_it_takes', code: '4. WHAT IT TAKES', title: 'Tôi cần gì để sống cuộc đời đó', icon: ListOrdered, color: 'text-blue-600', bgColor: 'bg-blue-50/70', borderColor: 'border-blue-200' },
  { id: 'my_trade_offs', code: '5. MY TRADE-OFFS', title: 'Tôi đang lựa chọn và từ bỏ điều gì', icon: Scale, color: 'text-rose-600', bgColor: 'bg-rose-50/70', borderColor: 'border-rose-200' },
  { id: 'the_question', code: '6. THE QUESTION', title: 'Câu hỏi tiếp theo để khám phá', icon: HelpCircle, color: 'text-violet-600', bgColor: 'bg-violet-50/70', borderColor: 'border-violet-200' },
] as const;

type ProfileData = {
  current: { id: string; version_no: number; snapshot: Record<string, any> } | null;
  draft?: { id: string; version_no: number; snapshot: Record<string, any>; updated_at?: string } | null;
  snapshot: Record<string, any>;
  insights: Array<{ id: string; dimension: string; content: string }>;
};

export default function LifeMapPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [snapshot, setSnapshot] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/life-profile');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Không thể tải Life Profile');
      setProfile(json.data);
      setSnapshot(json.data.snapshot || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải Life Profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const insightCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (profile?.insights || []).forEach((insight) => counts.set(insight.dimension, (counts.get(insight.dimension) || 0) + 1));
    return counts;
  }, [profile]);

  const confirmProfile = async () => {
    if (!profile || saving || draftSaving) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/life-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          snapshot,
          sourceInsightIds: profile.insights.map((insight) => insight.id),
          idempotencyKey: `profile-${profile.current?.id || 'new'}-${JSON.stringify(snapshot).length}`,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Không thể xác nhận bản đồ');
      setMessage(`Đã lưu Life Design Map phiên bản ${json.data.version_no}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xác nhận bản đồ');
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    if (!profile || saving || draftSaving) return;
    setDraftSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/life-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft',
          snapshot,
          sourceInsightIds: profile.insights.map((insight) => insight.id),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Không thể lưu bản nháp');
      setMessage('Đã lưu bản nháp Life Design Map.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu bản nháp');
    } finally {
      setDraftSaving(false);
    }
  };

  const updateSnapshot = (key: string, value: string) => setSnapshot((current) => ({ ...current, [key]: value }));
  const updateDimension = (key: string, value: string) => setSnapshot((current) => ({
    ...current,
    dimensions: { ...(current.dimensions || {}), [key]: { ...(current.dimensions?.[key] || {}), summary: value } },
  }));

  if (loading) return <div className="grid min-h-[420px] place-items-center text-slate-500"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (error && !profile) return <div className="rounded-3xl bg-rose-50 p-6 text-sm font-semibold text-rose-700">{error}</div>;

  return (
    <div className="legacy-calm-page space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2"><Compass className="text-indigo-600" size={22} /><h2 className="text-xl font-bold text-slate-900">Life Design Map</h2></div>
          <p className="mt-1 text-xs text-slate-500">Bản đồ chỉ tổng hợp từ những điều bạn đã xác nhận. {profile?.draft ? 'Đang xem bản nháp chưa xác nhận' : profile?.current ? `Phiên bản ${profile.current.version_no}` : 'Chưa có phiên bản xác nhận'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/app/life-map/history" className="flex items-center gap-1.5 rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"><History size={15} /> Lịch sử</Link>
          <button onClick={() => void saveDraft()} disabled={saving || draftSaving || !profile} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">{draftSaving ? 'Đang lưu…' : 'Lưu bản nháp'}</button>
          <button onClick={() => void confirmProfile()} disabled={saving || draftSaving || !profile} className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Đang lưu…' : 'Xác nhận bản đồ mới'}</button>
        </div>
      </div>

      {message && <div className="rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{message}</div>}
      {error && <div className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        {([['desire', 'Điều bạn thật sự muốn'], ['escape', 'Điều bạn muốn rời khỏi'], ['life_vision', 'Tầm nhìn cuộc sống']] as const).map(([key, label]) => (
          <label key={key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card"><span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">{label}</span><textarea value={snapshot?.[key] || ''} onChange={(event) => updateSnapshot(key, event.target.value)} placeholder="Chưa có dữ liệu xác nhận." rows={3} className="mt-2 min-h-20 w-full resize-y rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-700 outline-none focus:border-indigo-300 focus:bg-white" /></label>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dimensions.map((dimension) => {
          const Icon = dimension.icon;
          const summary = snapshot?.dimensions?.[dimension.id]?.summary || '';
          return <div key={dimension.id} className="flex flex-col justify-between space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card transition hover:shadow-lg">
            <div className="space-y-3"><div className="flex items-center justify-between"><span className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wider ${dimension.bgColor} ${dimension.color}`}>{dimension.code}</span><span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><CheckCircle2 size={12} className="text-emerald-500" /> {insightCounts.get(dimension.id) || 0} insights</span></div><div className="flex items-start gap-3"><div className={`mt-0.5 rounded-2xl p-2.5 ${dimension.bgColor} ${dimension.color}`}><Icon size={20} /></div><h3 className="text-base font-bold leading-snug text-slate-900">{dimension.title}</h3></div><textarea value={summary} onChange={(event) => updateDimension(dimension.id, event.target.value)} placeholder="Chưa có insight được xác nhận ở chiều này." rows={4} className="min-h-24 w-full resize-y rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs font-medium leading-relaxed text-slate-600 outline-none focus:border-indigo-300 focus:bg-white" /></div><div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs"><span className="font-medium text-slate-400">Dữ liệu cá nhân</span><span className="font-bold text-indigo-600">Bạn quyết định nội dung →</span></div>
          </div>;
        })}
      </div>
    </div>
  );
}
