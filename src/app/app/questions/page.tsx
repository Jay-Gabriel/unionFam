'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Save, Sparkles, Loader2 } from 'lucide-react';
import { QuestionItem } from '@/server/domain/questions';

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [flowVersion, setFlowVersion] = useState('');
  const [eligibleQuestionIds, setEligibleQuestionIds] = useState<string[]>([]);
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
        if (!res.ok) throw new Error(json.error || 'Không thể tải Question Flow');
        if (json.data) {
          setQuestions(json.data.questions);
          setFlowVersion(json.data.flowVersion || 'Question Flow');
          setEligibleQuestionIds(json.data.eligibleQuestionIds || json.data.questions.map((q: QuestionItem) => q.id));
          setAnswers(json.data.userAnswers || {});
          setCurrentIndex(json.data.resumeIndex || 0);
        }
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Không thể tải Question Flow');
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestionFlow();
  }, []);

  const visibleQuestions = eligibleQuestionIds.length
    ? eligibleQuestionIds.map((id) => questions.find((question) => question.id === id)).filter(Boolean) as QuestionItem[]
    : questions;
  const currentQ = visibleQuestions[currentIndex];
  const currentAnswer = currentQ ? answers[currentQ.questionKey] : undefined;
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== ''
    && (!Array.isArray(currentAnswer) || currentAnswer.length > 0);
  const progressPercent = visibleQuestions.length > 0 ? Math.round(((currentIndex + (hasAnswer ? 1 : 0)) / visibleQuestions.length) * 100) : 0;

  const saveCurrentAnswer = async (ans: any): Promise<{ ok: boolean; nextQuestionId?: string | null; eligibleQuestionIds?: string[] }> => {
    if (!currentQ) return { ok: false };
    setIsSaving(true);
    setSaveError('');

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          answer: ans,
          idempotencyKey: `ans-${currentQ.id}-${JSON.stringify(ans)}`.slice(0, 128),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSaveError(json.error || 'Lỗi lưu câu trả lời');
        return { ok: false };
      } else {
        setAnswers((prev) => ({ ...prev, [currentQ.questionKey]: ans }));
        const nextEligible = Array.isArray(json.data?.eligibleQuestionIds) ? json.data.eligibleQuestionIds.filter((id: unknown): id is string => typeof id === 'string') : undefined;
        if (nextEligible) setEligibleQuestionIds(nextEligible);
        return { ok: true, nextQuestionId: typeof json.data?.nextQuestionId === 'string' ? json.data.nextQuestionId : null, eligibleQuestionIds: nextEligible };
      }
    } catch (e) {
      setSaveError('Lỗi kết nối');
      return { ok: false };
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (!currentQ || isSaving) return;
    const answer = answers[currentQ.questionKey];
    const answerIsEmpty = answer === undefined || answer === null || answer === '' || (Array.isArray(answer) && answer.length === 0);
    if (answerIsEmpty && currentQ.isRequired) {
      setSaveError('Hãy chia sẻ một câu trả lời trước khi tiếp tục.');
      return;
    }
    const saveResult = answerIsEmpty ? { ok: true } : await saveCurrentAnswer(answer);
    if (!saveResult.ok) return;
    const nextEligible = saveResult.eligibleQuestionIds || eligibleQuestionIds;
    if (saveResult.nextQuestionId) {
      const nextIndex = nextEligible.indexOf(saveResult.nextQuestionId);
      if (nextIndex >= 0) {
        setCurrentIndex(nextIndex);
        return;
      }
    }
    if (currentIndex < nextEligible.length - 1) {
      setCurrentIndex((prev) => Math.min(prev + 1, nextEligible.length - 1));
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
      <div className="legacy-calm-page flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
        <span className="text-xs font-semibold">Đang tải Question Flow versioned...</span>
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="legacy-calm-page max-w-2xl mx-auto space-y-6 py-6">
      {/* Progress Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5 text-indigo-600">
            <Sparkles size={16} />
            {flowVersion || 'Question Flow'}
          </span>
          <span>
            Câu {currentIndex + 1} / {visibleQuestions.length} ({progressPercent}%)
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
              onBlur={(e) => e.target.value.trim() && saveCurrentAnswer(e.target.value)}
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

          {currentQ.answerType === 'multi_choice' && (
            <div className="space-y-2.5">
              {currentQ.options?.map((opt) => {
                const selected = Array.isArray(answers[currentQ.questionKey]) && answers[currentQ.questionKey].includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(answers[currentQ.questionKey]) ? answers[currentQ.questionKey] : [];
                      if (!selected && current.length >= 3) {
                        setSaveError('Bạn có thể chọn tối đa 3 điều.');
                        return;
                      }
                      const next = selected ? current.filter((value: string) => value !== opt.value) : [...current, opt.value];
                      setAnswers({ ...answers, [currentQ.questionKey]: next });
                    }}
                    className={`w-full p-4 rounded-2xl text-left text-xs md:text-sm font-semibold border transition-all flex items-center justify-between ${selected ? 'bg-indigo-50 border-indigo-500 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <span>{opt.label}</span>
                    {selected && <CheckCircle2 size={18} className="text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.answerType === 'scale' && (
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAnswers({ ...answers, [currentQ.questionKey]: value });
                    saveCurrentAnswer(value);
                  }}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${answers[currentQ.questionKey] === value ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                >{value}</button>
              ))}
            </div>
          )}

          {currentQ.answerType === 'date' && (
            <input
              type="date"
              value={answers[currentQ.questionKey] || ''}
              onChange={(event) => setAnswers({ ...answers, [currentQ.questionKey]: event.target.value })}
              onBlur={(event) => event.target.value && saveCurrentAnswer(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:bg-white"
            />
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
              onClick={() => {
                const answer = answers[currentQ.questionKey];
                if (answer !== undefined && answer !== null && answer !== '' && (!Array.isArray(answer) || answer.length > 0)) {
                  void saveCurrentAnswer(answer);
                }
              }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Save size={14} />
              {isSaving ? 'Đang lưu...' : 'Lưu tạm'}
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all"
            >
              <span>{currentIndex === visibleQuestions.length - 1 ? 'Hoàn thành' : 'Tiếp tục'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
