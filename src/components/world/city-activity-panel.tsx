'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, Compass, FlaskConical, Loader2,
  MessageCircleHeart, Plus, Send, Sparkles, Star, WalletCards, X,
} from 'lucide-react';
import { ChoiceIdentityGame } from '@/components/calm/choice-identity-game';
import { EmotiveStoryGame } from '@/components/calm/emotive-story-game';
import { SoulKnotGame } from '@/components/calm/soul-knot-game';
import type { QuestionItem } from '@/server/domain/questions';
import { CITY_MAIN_STORY, CITY_STORY } from './city-story';
import type { CityZone, WorldJourney } from './world-types';

type Message = { role: 'user' | 'assistant'; content: string };
type JsonRecord = Record<string, unknown>;

const panelClass = 'rounded-2xl border border-white/10 bg-white/[0.055]';
const inputClass = 'w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/60';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-3 text-xs font-black text-[#102638] shadow-lg disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]';

async function readJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<{ data?: unknown; error?: string; demoMode?: boolean }>;
}

function StoryBrief({ zone, onStart }: { zone: CityZone; onStart: () => void }) {
  const chapter = CITY_STORY[zone.id];
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-4 sm:py-8">
      <div className="text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] border border-white/15 bg-white/10 text-4xl shadow-[0_18px_50px_rgba(0,0,0,.25)]">{chapter.icon}</span>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: zone.color }}>Chương {chapter.chapter}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">{chapter.title}</h2>
        <p className="mt-2 text-xs font-bold text-white/55">{chapter.npc} · {chapter.npcRole}</p>
      </div>
      <div className={`${panelClass} mt-6 p-5 sm:p-7`}>
        <p className="text-sm leading-7 text-white/78 sm:text-base">“{chapter.opening}”</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-black/20 p-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-cyan-200">Mục tiêu</span>
            <p className="mt-1.5 text-xs leading-5 text-white/72">{chapter.objective}</p>
          </div>
          <div className="rounded-xl bg-black/20 p-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-200">Vật phẩm câu chuyện</span>
            <p className="mt-1.5 text-xs leading-5 text-white/72">{chapter.reward}</p>
          </div>
        </div>
      </div>
      <button type="button" onClick={onStart} className={`${primaryButton} mx-auto mt-5 min-w-52`}>
        Bắt đầu nhiệm vụ <ArrowRight size={14} />
      </button>
    </div>
  );
}

function OverviewActivity({ journey }: { journey: WorldJourney }) {
  return (
    <div className="space-y-4">
      <div className={`${panelClass} p-5 sm:p-6`}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">{CITY_MAIN_STORY.role}</p>
        <h3 className="mt-2 text-xl font-black sm:text-2xl">{CITY_MAIN_STORY.title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{CITY_MAIN_STORY.premise}</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400" style={{ width: `${journey.energy}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-bold text-white/55"><span>Năng lượng thành phố</span><span>{journey.energy}%</span></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {journey.quests.map((quest) => (
          <div key={quest.id} className={`${panelClass} p-4`}>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black" style={{ color: quest.accentColor, backgroundColor: `${quest.accentColor}18`, border: `1px solid ${quest.accentColor}55` }}>
                {quest.completed ? <Check size={16} /> : `${quest.progressPercent}%`}
              </span>
              <div><h4 className="text-sm font-bold">{quest.title}</h4><p className="mt-1 text-[11px] leading-5 text-white/55">{quest.description}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionInput({ question, value, onChange }: { question: QuestionItem; value: unknown; onChange: (value: unknown) => void }) {
  if (question.answerType === 'text') return <textarea className={`${inputClass} min-h-32 resize-y`} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} placeholder="Viết điều thật lòng của bạn…" />;
  if (question.answerType === 'date') return <input type="date" className={inputClass} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} />;
  if (question.answerType === 'scale') return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
      {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => <button type="button" key={number} onClick={() => onChange(number)} className={`rounded-xl border py-3 text-sm font-black ${value === number ? 'border-cyan-200 bg-cyan-300 text-[#102638]' : 'border-white/15 bg-white/5 text-white/70'}`}>{number}</button>)}
    </div>
  );
  if (question.answerType === 'multi_choice') {
    const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
    return <div className="grid gap-2 sm:grid-cols-2">{question.options.map((option) => {
      const active = selected.includes(option.value);
      return <button type="button" key={option.value} onClick={() => onChange(active ? selected.filter((item) => item !== option.value) : [...selected, option.value])} className={`rounded-xl border p-3 text-left text-xs font-bold ${active ? 'border-cyan-200 bg-cyan-300/20 text-cyan-100' : 'border-white/12 bg-white/5 text-white/65'}`}>{option.label}</button>;
    })}</div>;
  }
  return <div className="grid gap-2 sm:grid-cols-2">{question.options.map((option) => <button type="button" key={option.value} onClick={() => onChange(option.value)} className={`rounded-xl border p-3 text-left text-xs font-bold ${value === option.value ? 'border-cyan-200 bg-cyan-300/20 text-cyan-100' : 'border-white/12 bg-white/5 text-white/65'}`}>{option.label}</button>)}</div>;
}

function QuestionsActivity({ onChanged }: { onChanged: () => void }) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [eligible, setEligible] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/questions').then(async (response) => {
      const json = await readJson(response);
      if (!response.ok) throw new Error(json.error || 'Không thể mở học viện');
      const data = (json.data || {}) as JsonRecord;
      if (cancelled) return;
      setQuestions(Array.isArray(data.questions) ? data.questions as QuestionItem[] : []);
      setEligible(Array.isArray(data.eligibleQuestionIds) ? data.eligibleQuestionIds.filter((id): id is string => typeof id === 'string') : []);
      setAnswers(data.userAnswers && typeof data.userAnswers === 'object' ? data.userAnswers as Record<string, unknown> : {});
      setIndex(typeof data.resumeIndex === 'number' ? data.resumeIndex : 0);
    }).catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Không thể mở học viện'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => eligible.length ? eligible.map((id) => questions.find((item) => item.id === id)).filter(Boolean) as QuestionItem[] : questions, [eligible, questions]);
  const current = visible[index];
  const value = current ? answers[current.questionKey] : undefined;

  const save = async () => {
    if (!current || saving) return;
    if ((value === undefined || value === '' || (Array.isArray(value) && !value.length)) && current.isRequired) { setError('Hãy chọn hoặc viết một câu trả lời trước.'); return; }
    setSaving(true); setError('');
    try {
      if (value !== undefined && value !== '') {
        const response = await fetch('/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: current.id, answer: value, idempotencyKey: `world-${current.id}-${JSON.stringify(value)}`.slice(0, 128) }) });
        const json = await readJson(response);
        if (!response.ok) throw new Error(json.error || 'Không thể lưu câu trả lời');
        const data = (json.data || {}) as JsonRecord;
        if (Array.isArray(data.eligibleQuestionIds)) setEligible(data.eligibleQuestionIds.filter((id): id is string => typeof id === 'string'));
      }
      onChanged();
      setIndex((currentIndex) => Math.min(currentIndex + 1, Math.max(0, visible.length - 1)));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu câu trả lời'); }
    finally { setSaving(false); }
  };

  if (loading) return <Loading label="Đang mở các ô cửa Ban Mai…" />;
  if (!current) return <Empty text="Học viện chưa có câu hỏi phù hợp." />;
  const percent = Math.round(((index + 1) / Math.max(1, visible.length)) * 100);
  return <div className="mx-auto max-w-2xl space-y-4">
    <div className={`${panelClass} p-4`}><div className="flex justify-between text-[10px] font-black text-white/55"><span>Ô cửa {index + 1}/{visible.length}</span><span>{percent}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-300" style={{ width: `${percent}%` }} /></div></div>
    {error && <ErrorBox text={error} />}
    <div className={`${panelClass} p-5 sm:p-7`}><p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">An đang hỏi bạn</p><h3 className="mt-3 text-lg font-black leading-7 sm:text-xl">{current.title}</h3>{current.helperText && <p className="mt-2 text-xs leading-5 text-white/50">{current.helperText}</p>}<div className="mt-5"><QuestionInput question={current} value={value} onChange={(next) => setAnswers((old) => ({ ...old, [current.questionKey]: next }))} /></div></div>
    <div className="flex justify-between gap-3"><button type="button" disabled={index === 0} onClick={() => setIndex((old) => Math.max(0, old - 1))} className="rounded-xl border border-white/15 px-4 py-3 text-xs font-bold text-white/65 disabled:opacity-30"><ArrowLeft size={14} className="mr-1 inline" />Quay lại</button><button type="button" onClick={save} disabled={saving} className={primaryButton}>{saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />} {index >= visible.length - 1 ? 'Hoàn thành chương' : 'Thắp ô cửa tiếp theo'}</button></div>
  </div>;
}

async function parseChatStream(response: Response) {
  const raw = await response.text();
  let text = '';
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const event = block.split(/\r?\n/).find((line) => line.startsWith('event: '))?.slice(7).trim();
    const payload = block.split(/\r?\n/).find((line) => line.startsWith('data: '))?.slice(6);
    if (event !== 'message.delta' || !payload) continue;
    try { const data = JSON.parse(payload) as { text?: unknown }; if (typeof data.text === 'string') text += data.text; } catch { /* skip malformed event */ }
  }
  return text;
}

function ChatActivity({ starterPrompt = '', onChanged }: { starterPrompt?: string; onChanged: () => void }) {
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Mình là Mộc. Ở đây bạn không cần phải tỏ ra ổn. Điều gì đang chiếm nhiều tâm trí nhất của bạn hôm nay?' }]);
  const [input, setInput] = useState(starterPrompt);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setInput(starterPrompt); }, [starterPrompt]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = input.trim(); if (!content || sending) return;
    setSending(true); setError(''); setInput('');
    const userMessage: Message = { role: 'user', content };
    setMessages((old) => [...old, userMessage]);
    try {
      let activeId = conversationId;
      if (!activeId) {
        const createResponse = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Cuộc trò chuyện tại Vườn Lắng Nghe' }) });
        const created = await readJson(createResponse); if (!createResponse.ok) throw new Error(created.error || 'Không thể bắt đầu trò chuyện');
        const createdData = (created.data || {}) as JsonRecord; activeId = String(createdData.id || ''); if (!activeId) throw new Error('Không thể bắt đầu trò chuyện'); setConversationId(activeId);
      }
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: activeId, content, recentMessages: [...messages, userMessage].slice(-8), idempotencyKey: `world-msg-${crypto.randomUUID()}` }) });
      if (!response.ok) { const json = await readJson(response); throw new Error(json.error || 'Life Lab chưa thể phản hồi'); }
      const reply = await parseChatStream(response);
      setMessages((old) => [...old, { role: 'assistant', content: reply || 'Mình đang lắng nghe. Bạn có thể nói thêm một chút không?' }]);
      onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Kết nối bị gián đoạn'); setInput(content); }
    finally { setSending(false); }
  };

  return <div className="mx-auto flex h-[min(64vh,680px)] max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-black/20">
    <div className="border-b border-white/10 px-4 py-3"><p className="text-xs font-black text-emerald-200">🌿 Mộc đang lắng nghe</p><p className="mt-0.5 text-[10px] text-white/40">Cuộc trò chuyện được lưu vào hành trình của bạn</p></div>
    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">{messages.map((message, index) => <div key={index} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'ml-auto bg-cyan-300 text-[#102638]' : 'bg-white/8 text-white/78'}`}>{message.content}</div>)}{sending && <div className="flex items-center gap-2 text-xs text-white/45"><Loader2 size={14} className="animate-spin" />Mộc đang suy ngẫm…</div>}</div>
    {error && <div className="px-4"><ErrorBox text={error} /></div>}
    <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3"><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Chia sẻ điều bạn đang nghĩ…" className={`${inputClass} min-h-12 flex-1 resize-none`} /><button className={`${primaryButton} self-end px-4`} disabled={sending || !input.trim()}><Send size={15} /></button></form>
  </div>;
}

function LifeMapActivity() {
  const [data, setData] = useState<JsonRecord | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/life-profile').then(readJson).then((json) => setData((json.data || {}) as JsonRecord)).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading label="Astra đang mở mái vòm…" />;
  const snapshot = data?.snapshot && typeof data.snapshot === 'object' ? data.snapshot as JsonRecord : {};
  const dimensions = snapshot.dimensions && typeof snapshot.dimensions === 'object' ? snapshot.dimensions as Record<string, JsonRecord> : {};
  const labels: Record<string, string> = { my_life: 'Đời sống mong muốn', what_matters: 'Điều quan trọng', my_ideal_day: 'Ngày lý tưởng', what_it_takes: 'Điều cần có', my_trade_offs: 'Điều đánh đổi', the_question: 'Câu hỏi tiếp theo' };
  if (!Object.keys(dimensions).length) return <Empty text="Bầu trời còn trống. Hãy thắp vài ô cửa ở Học Viện Ban Mai trước." />;
  return <div className="grid gap-3 sm:grid-cols-2">{Object.entries(dimensions).map(([key, dimension], index) => <div key={key} className={`${panelClass} p-5`}><div className="flex items-center gap-2 text-amber-200"><Star size={15} fill="currentColor" /><span className="text-[10px] font-black uppercase tracking-widest">Chòm sao {index + 1}</span></div><h3 className="mt-2 text-base font-black">{labels[key] || key}</h3><p className="mt-2 text-xs leading-6 text-white/60">{String(dimension.summary || dimension.current_state || dimension.desired_state || 'Chưa có tín hiệu rõ ràng.')}</p></div>)}</div>;
}

type Experiment = { id: string; title: string; hypothesis?: string; smallest_step?: string; progress_percent?: number; status?: string };
function ExperimentsActivity({ onChanged }: { onChanged: () => void }) {
  const [items, setItems] = useState<Experiment[]>([]); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', hypothesis: '', smallestStep: '', successSignal: '' });
  const load = () => fetch('/api/experiments').then(readJson).then((json) => setItems(Array.isArray(json.data) ? json.data as Experiment[] : [])).catch(() => setError('Không thể mở nhà kính'));
  useEffect(() => { void load(); }, []);
  const create = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const response = await fetch('/api/experiments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, targetDays: 7 }) }); const json = await readJson(response); if (!response.ok) throw new Error(json.error || 'Không thể gieo hạt'); setForm({ title: '', hypothesis: '', smallestStep: '', successSignal: '' }); await load(); onChanged(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể gieo hạt'); } finally { setSaving(false); } };
  return <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]"><form onSubmit={create} className={`${panelClass} space-y-3 p-5`}><h3 className="flex items-center gap-2 text-base font-black"><FlaskConical size={17} className="text-emerald-200" />Gieo thử nghiệm 7 ngày</h3>{error && <ErrorBox text={error} />}<input required className={inputClass} placeholder="Bạn muốn thử điều gì?" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><textarea required className={inputClass} placeholder="Bạn tin điều gì sẽ thay đổi?" value={form.hypothesis} onChange={(event) => setForm({ ...form, hypothesis: event.target.value })} /><textarea required className={inputClass} placeholder="Bước nhỏ nhất có thể làm hôm nay" value={form.smallestStep} onChange={(event) => setForm({ ...form, smallestStep: event.target.value })} /><input required className={inputClass} placeholder="Dấu hiệu thành công" value={form.successSignal} onChange={(event) => setForm({ ...form, successSignal: event.target.value })} /><button disabled={saving} className={`${primaryButton} w-full`}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Gieo hạt</button></form><div className="space-y-3">{items.length ? items.map((item) => <div key={item.id} className={`${panelClass} p-4`}><div className="flex justify-between gap-3"><h4 className="text-sm font-bold">{item.title}</h4><span className="text-[10px] font-black text-emerald-200">{item.progress_percent || 0}%</span></div><p className="mt-2 text-xs leading-5 text-white/50">{item.smallest_step || item.hypothesis}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald-400" style={{ width: `${item.progress_percent || 0}%` }} /></div></div>) : <Empty text="Nhà kính đang chờ hạt giống đầu tiên." />}</div></div>;
}

function ReflectionsActivity({ onChanged }: { onChanged: () => void }) {
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState('');
  const [form, setForm] = useState({ result: '', feeling: '', learningCandidate: '', nextAction: '', rating: 5 });
  const save = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const response = await fetch('/api/reflections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const json = await readJson(response); if (!response.ok) throw new Error(json.error || 'Không thể lưu ký ức'); setSaved(true); onChanged(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu ký ức'); } finally { setSaving(false); } };
  if (saved) return <div className="mx-auto max-w-lg text-center"><span className="text-6xl">💧</span><h3 className="mt-4 text-xl font-black">Mặt hồ đã giữ ký ức này</h3><p className="mt-2 text-sm text-white/55">Bạn có thể quay lại thành phố. Bài học vừa ghi sẽ trở thành một phần hành trình.</p><button type="button" onClick={() => { setSaved(false); setForm({ result: '', feeling: '', learningCandidate: '', nextAction: '', rating: 5 }); }} className={`${primaryButton} mt-5`}>Ghi thêm một ký ức</button></div>;
  return <form onSubmit={save} className={`${panelClass} mx-auto max-w-2xl space-y-3 p-5 sm:p-6`}><h3 className="flex items-center gap-2 text-base font-black"><BookOpen size={17} className="text-sky-200" />Viết xuống mặt hồ</h3>{error && <ErrorBox text={error} />}<textarea required className={inputClass} placeholder="Điều gì đã thực sự xảy ra?" value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value })} /><input required className={inputClass} placeholder="Bạn đã cảm thấy thế nào?" value={form.feeling} onChange={(event) => setForm({ ...form, feeling: event.target.value })} /><textarea required className={inputClass} placeholder="Bạn học được điều gì?" value={form.learningCandidate} onChange={(event) => setForm({ ...form, learningCandidate: event.target.value })} /><input required className={inputClass} placeholder="Bước tiếp theo là gì?" value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} /><div className="flex items-center gap-2"><span className="text-xs text-white/50">Mức hữu ích</span>{[1, 2, 3, 4, 5].map((rating) => <button type="button" key={rating} onClick={() => setForm({ ...form, rating })}><Star size={20} className={rating <= form.rating ? 'text-amber-300' : 'text-white/15'} fill={rating <= form.rating ? 'currentColor' : 'none'} /></button>)}</div><button disabled={saving} className={`${primaryButton} w-full`}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Gửi ký ức xuống hồ</button></form>;
}

type ResourceItem = { id: string; name: string; resource_type?: string; description?: string };
function ResourcesActivity({ onChanged }: { onChanged: () => void }) {
  const [items, setItems] = useState<ResourceItem[]>([]); const [saving, setSaving] = useState(false); const [form, setForm] = useState({ name: '', resourceType: 'skill', description: '', dimension: 'what_it_takes' });
  const load = () => fetch('/api/resources').then(readJson).then((json) => setItems(Array.isArray(json.data) ? json.data as ResourceItem[] : [])); useEffect(() => { void load(); }, []);
  const create = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); try { const response = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (!response.ok) throw new Error('Không thể cất nguồn lực'); setForm({ ...form, name: '', description: '' }); await load(); onChanged(); } finally { setSaving(false); } };
  return <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><form onSubmit={create} className={`${panelClass} space-y-3 p-5`}><h3 className="flex items-center gap-2 text-base font-black"><WalletCards size={17} className="text-amber-200" />Cất một nguồn lực</h3><input required className={inputClass} placeholder="Tên kỹ năng, người hỗ trợ hoặc công cụ" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><select className={inputClass} value={form.resourceType} onChange={(event) => setForm({ ...form, resourceType: event.target.value })}><option value="skill">Kỹ năng</option><option value="time">Thời gian</option><option value="money">Tài chính</option><option value="person">Con người</option><option value="tool">Công cụ</option><option value="community">Cộng đồng</option></select><textarea className={inputClass} placeholder="Nguồn lực này giúp bạn thế nào?" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><button disabled={saving} className={`${primaryButton} w-full`}><Plus size={14} />Đưa vào kho</button></form><div className="grid gap-3 sm:grid-cols-2">{items.length ? items.map((item) => <div key={item.id} className={`${panelClass} p-4`}><span className="text-[9px] font-black uppercase tracking-wider text-amber-200">{item.resource_type || 'nguồn lực'}</span><h4 className="mt-1 text-sm font-bold">{item.name}</h4><p className="mt-2 text-xs leading-5 text-white/45">{item.description || 'Một điểm tựa đang sẵn có.'}</p></div>) : <Empty text="Kho đang trống. Hãy ghi nhận thứ đầu tiên bạn đang có." />}</div></div>;
}

function ArcadeActivity({ onChat }: { onChat: (prompt: string) => void }) {
  const [game, setGame] = useState<'choice' | 'story' | 'knot'>('choice');
  return <div className="space-y-4"><div className="flex max-w-full gap-2 overflow-x-auto pb-1">{([['choice', 'Căn Cước Lựa Chọn'], ['story', 'Chuyến Tàu 00:00'], ['knot', 'La Bàn Gieo Hạt']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setGame(id)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${game === id ? 'bg-cyan-300 text-[#102638]' : 'bg-white/8 text-white/60'}`}>{label}</button>)}</div><div className="origin-top scale-[.98]">{game === 'choice' && <ChoiceIdentityGame isModal onStartConversation={onChat} />}{game === 'story' && <EmotiveStoryGame isModal onStartConversation={onChat} />}{game === 'knot' && <SoulKnotGame isModal onStartConversation={onChat} />}</div></div>;
}

function Loading({ label }: { label: string }) { return <div className="grid min-h-52 place-items-center text-center"><div><Loader2 className="mx-auto animate-spin text-cyan-200" /><p className="mt-3 text-xs text-white/50">{label}</p></div></div>; }
function Empty({ text }: { text: string }) { return <div className={`${panelClass} p-8 text-center text-sm text-white/50`}>{text}</div>; }
function ErrorBox({ text }: { text: string }) { return <div className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-xs font-bold text-rose-100">{text}</div>; }

interface CityActivityPanelProps { zone: CityZone | null; journey: WorldJourney; onClose: () => void; onProgressChanged: () => void; }

export function CityActivityPanel({ zone, journey, onClose, onProgressChanged }: CityActivityPanelProps) {
  const [view, setView] = useState<'story' | 'activity' | 'chat'>('story');
  const [chatPrompt, setChatPrompt] = useState('');
  useEffect(() => { setView('story'); setChatPrompt(''); }, [zone?.id]);
  useEffect(() => {
    if (!zone) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);
  }, [onClose, zone]);
  if (!zone) return null;
  const chapter = CITY_STORY[zone.id];
  const openChat = (prompt: string) => { setChatPrompt(prompt); setView('chat'); };

  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-auto fixed inset-0 z-[80] bg-[#071522]/82 p-2 backdrop-blur-md sm:p-5">
    <motion.section initial={{ y: 20, scale: 0.985 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.985 }} className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[26px] border border-white/15 bg-[#102638]/96 text-white shadow-[0_30px_100px_rgba(0,0,0,.55)] sm:rounded-[32px]">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-3 py-3 sm:px-5">
        {view !== 'story' && <button type="button" onClick={() => setView('story')} className="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-white/65"><ArrowLeft size={16} /></button>}
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-xl">{chapter.icon}</span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{zone.name}</p><p className="truncate text-[10px] text-white/45">{view === 'story' ? chapter.title : view === 'chat' ? 'Đối thoại cùng Mộc' : chapter.objective}</p></div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/8"><X size={17} /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6">
        {view === 'story' && <StoryBrief zone={zone} onStart={() => setView('activity')} />}
        {view === 'chat' && <ChatActivity starterPrompt={chatPrompt} onChanged={onProgressChanged} />}
        {view === 'activity' && chapter.activity === 'overview' && <OverviewActivity journey={journey} />}
        {view === 'activity' && chapter.activity === 'questions' && <QuestionsActivity onChanged={onProgressChanged} />}
        {view === 'activity' && chapter.activity === 'chat' && <ChatActivity starterPrompt={zone.aiPromptStarter} onChanged={onProgressChanged} />}
        {view === 'activity' && chapter.activity === 'life-map' && <LifeMapActivity />}
        {view === 'activity' && chapter.activity === 'experiments' && <ExperimentsActivity onChanged={onProgressChanged} />}
        {view === 'activity' && chapter.activity === 'reflections' && <ReflectionsActivity onChanged={onProgressChanged} />}
        {view === 'activity' && chapter.activity === 'resources' && <ResourcesActivity onChanged={onProgressChanged} />}
        {view === 'activity' && chapter.activity === 'arcade' && <ArcadeActivity onChat={openChat} />}
      </div>
    </motion.section>
  </motion.div></AnimatePresence>;
}
