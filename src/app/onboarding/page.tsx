'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, ArrowRight, Check } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [consented, setConsented] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch('/api/onboarding')
      .then(async (response) => {
        if (!response.ok) throw new Error('Không thể tải trạng thái onboarding');
        return response.json();
      })
      .then((json) => {
        setDisplayName(json.data?.display_name || '');
        setConsented(Boolean(json.data?.consented_at));
      })
      .catch(() => {
        // A fresh account may not have a profile row yet; consent remains explicit.
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleStartQuestionnaire = async () => {
    if (!consented || isSaving) return;
    setErrorMessage('');
    setIsSaving(true);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consented, displayName }),
      });
      if (!response.ok) throw new Error('Chưa thể lưu xác nhận của bạn');
      router.push('/app/questions');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Chưa thể bắt đầu hành trình');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="legacy-calm-page min-h-screen bg-calm-deep-moss flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-200">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chào mừng bạn đến với Life Lab</h1>
          <p className="text-xs text-slate-500">Khám phá & Thiết kế lại cuộc đời theo ý bạn</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="display-name" className="text-xs font-semibold text-slate-700">Bạn muốn được gọi là gì?</label>
          <input
            id="display-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Tên hiển thị (không bắt buộc)"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100 space-y-3 text-xs md:text-sm text-slate-700">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="text-indigo-600 flex-shrink-0 mt-0.5" size={18} />
            <p>
              <strong className="text-indigo-950 font-bold">Quyền làm chủ:</strong> Mọi phân tích hoặc đề xuất từ AI chỉ là gợi ý. Chỉ những điều bạn chủ động bấm <span className="font-bold text-indigo-700">Đồng ý</span> mới đi vào bản đồ cuộc sống của bạn.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <input
            type="checkbox"
            id="consent"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="consent" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
            Tôi đồng ý tham gia hành trình phản chiếu cùng Life Lab và hiểu rằng thông tin cá nhân của tôi được bảo mật.
          </label>
        </div>

        <button
          onClick={handleStartQuestionnaire}
          disabled={!consented || isLoading || isSaving}
          className={`w-full py-3.5 rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
            consented
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>{isSaving ? 'Đang lưu…' : 'Bắt đầu bộ câu hỏi khám phá'}</span>
          <ArrowRight size={16} />
        </button>

        {errorMessage && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-center text-xs font-semibold text-rose-700">{errorMessage}</p>}
      </div>
    </div>
  );
}
