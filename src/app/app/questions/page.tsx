'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Save, Sparkles, Loader2 } from 'lucide-react';
import { QuestionItem } from '@/server/domain/questions';

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    async function loadQuestionFlow() {
      try {
        const res = await fetch('/api/questions');
        const json = await res.json();
        if (json.data) {
          setQuestions(json.data.questions);
          setAnswers(json.data.userAnswers || {});
          setCurrentIndex(json.data.resumeIndex || 0);
        }
      } catch (e) {
        console.error('Failed to load question flow', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestionFlow();
  }, []);

  const currentQ = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const saveCurrentAnswer = async (ans: any) => {
    if (!currentQ) return;
    setIsSaving(true);
    setSaveError('');

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          answer: ans,
          idempotencyKey: `ans-${currentQ.id}-${Date.now()}`,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSaveError(json.error || 'Lỗi lưu câu trả lời');
      } else {
        setAnswers((prev) => ({ ...prev, [currentQ.questionKey]: ans }));
      }
    } catch (e) {
      setSaveError('Lỗi kết nối');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.push('/app');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
        <span className="text-xs font-semibold">Đang tải Question Flow versioned...</span>
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      {/* Progress Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5 text-indigo-600">
            <Sparkles size={16} />
            Question Flow: dev-placeholder (v1.0)
          </span>
          <span>
            Câu {currentIndex + 1} / {questions.length} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {saveError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
          {saveError}
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-card space-y-6">
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 px-2.5 py-1 rounded-full bg-indigo-50">
            Question #{currentIndex + 1}
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
            {currentQ.title}
          </h2>
          {currentQ.helperText && (
            <p className="text-xs text-slate-500">{currentQ.helperText}</p>
          )}
        </div>

        {/* Input Controls */}
        <div className="pt-2">
          {currentQ.answerType === 'text' && (
            <textarea
              rows={4}
              value={answers[currentQ.questionKey] || ''}
              onChange={(e) => {
                const val = e.target.value;
                setAnswers({ ...answers, [currentQ.questionKey]: val });
              }}
              onBlur={(e) => saveCurrentAnswer(e.target.value)}
              placeholder="Nhập câu trả lời của bạn..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
            />
          )}

          {currentQ.answerType === 'single_choice' && (
            <div className="space-y-2.5">
              {currentQ.options?.map((opt) => {
                const isSelected = answers[currentQ.questionKey] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setAnswers({ ...answers, [currentQ.questionKey]: opt.value });
                      saveCurrentAnswer(opt.value);
                    }}
                    className={`w-full p-4 rounded-2xl text-left text-xs md:text-sm font-semibold border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <CheckCircle2 size={18} className="text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              currentIndex === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => saveCurrentAnswer(answers[currentQ.questionKey])}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Save size={14} />
              {isSaving ? 'Đang lưu...' : 'Lưu tạm'}
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all"
            >
              <span>{currentIndex === questions.length - 1 ? 'Hoàn thành' : 'Tiếp tục'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
