'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Archive, ArrowRight, BookOpen, Check, Clock3, Edit3, FlaskConical, History,
  Lightbulb, Loader2, MessageCircleHeart, Plus, Save, Send, Sparkles, Star,
  Trash2, WalletCards, X,
} from 'lucide-react';

type JsonRecord = Record<string, unknown>;
type Message = { id?: string; role: 'user' | 'assistant'; content: string; created_at?: string };
type Conversation = { id: string; title: string; status?: string; last_message_at?: string; updated_at?: string };
type Observation = {
  id: string;
  dimension: string;
  content_original: string;
  content_user_edited?: string | null;
  status: 'pending' | 'accepted' | 'rejected';
};

const panelClass = 'rounded-2xl border border-white/10 bg-[#17364c]';
const inputClass = 'w-full rounded-xl border border-white/15 bg-[#0a1d2b] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/60';
const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-3 text-xs font-black text-[#102638] shadow-lg disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]';
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-4 py-3 text-xs font-bold text-white/70 disabled:opacity-40';

async function readJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<{ data?: unknown; error?: string }>;
}

function errorText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function ErrorBox({ text }: { text: string }) {
  return <div className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-xs font-bold text-rose-100">{text}</div>;
}

function Loading({ label }: { label: string }) {
  return <div className="grid min-h-52 place-items-center text-center"><div><Loader2 className="mx-auto animate-spin text-cyan-200" /><p className="mt-3 text-xs text-white/50">{label}</p></div></div>;
}

function Empty({ text }: { text: string }) {
  return <div className={`${panelClass} p-7 text-center text-sm text-white/50`}>{text}</div>;
}

async function parseChatStream(response: Response) {
  const raw = await response.text();
  let result = '';
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const event = block.split(/\r?\n/).find((line) => line.startsWith('event: '))?.slice(7).trim();
    const payload = block.split(/\r?\n/).find((line) => line.startsWith('data: '))?.slice(6);
    if (event !== 'message.delta' || !payload) continue;
    try {
      const data = JSON.parse(payload) as { text?: unknown };
      if (typeof data.text === 'string') result += data.text;
    } catch { /* ignore a malformed stream event */ }
  }
  return result;
}

const DIMENSION_LABELS: Record<string, string> = {
  my_life: 'Đời sống của tôi',
  what_matters: 'Điều quan trọng',
  my_ideal_day: 'Ngày lý tưởng',
  what_it_takes: 'Điều cần có',
  my_trade_offs: 'Điều đánh đổi',
  the_question: 'Câu hỏi tiếp theo',
};

const WORLD_CHAT_WELCOME: Message = {
  role: 'assistant',
  content: 'Mình là Mộc. Ở đây bạn không cần phải tỏ ra ổn. Điều gì đang chiếm nhiều tâm trí nhất của bạn hôm nay?',
};

function ObservationCard({ observation, onDecide }: {
  observation: Observation;
  onDecide: (id: string, decision: 'accepted' | 'rejected', editedContent?: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(observation.content_user_edited || observation.content_original);
  const [busy, setBusy] = useState(false);
  const decide = async (decision: 'accepted' | 'rejected', edited?: string) => {
    setBusy(true);
    try { await onDecide(observation.id, decision, edited); } finally { setBusy(false); }
  };

  if (observation.status !== 'pending') return <div className={`rounded-xl border p-3 ${observation.status === 'accepted' ? 'border-emerald-300/20 bg-emerald-300/8' : 'border-white/10 bg-white/[.03]'}`}>
    <p className="text-[9px] font-black uppercase tracking-widest text-white/42">{observation.status === 'accepted' ? 'Bạn đã xác nhận' : 'Bạn đã bỏ qua'}</p>
    <p className="mt-1 text-xs leading-5 text-white/65">{observation.content_user_edited || observation.content_original}</p>
  </div>;

  return <div className="rounded-2xl border border-violet-300/25 bg-violet-300/[.08] p-4">
    <div className="flex items-center gap-2 text-violet-200"><Lightbulb size={15} /><span className="text-[9px] font-black uppercase tracking-[.18em]">AI đề xuất · chưa phải kết luận của bạn</span></div>
    {editing
      ? <textarea value={content} onChange={(event) => setContent(event.target.value)} className={`${inputClass} mt-3 min-h-24`} />
      : <p className="mt-3 text-sm leading-6 text-white/78">{observation.content_original}</p>}
    <p className="mt-2 text-[10px] text-white/38">Gợi ý cho: {DIMENSION_LABELS[observation.dimension] || observation.dimension}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button disabled={busy} type="button" onClick={() => void decide('accepted', editing ? content.trim() : undefined)} className={primaryButton}><Check size={14} />{editing ? 'Xác nhận bản sửa' : 'Đúng với tôi'}</button>
      <button disabled={busy} type="button" onClick={() => setEditing((value) => !value)} className={secondaryButton}><Edit3 size={14} />{editing ? 'Hủy sửa' : 'Sửa rồi xác nhận'}</button>
      <button disabled={busy} type="button" onClick={() => void decide('rejected')} className={secondaryButton}><X size={14} />Không đúng</button>
    </div>
  </div>;
}

export function WorldChatActivity({ starterPrompt = '', onChanged }: { starterPrompt?: string; onChanged: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<Message[]>([WORLD_CHAT_WELCOME]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [input, setInput] = useState(starterPrompt);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const openConversation = useCallback(async (id: string) => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/conversations/${id}`);
      const json = await readJson(response);
      if (!response.ok) throw new Error(json.error || 'Không thể mở cuộc trò chuyện');
      const data = (json.data || {}) as JsonRecord;
      const loaded = Array.isArray(data.messages) ? data.messages as Message[] : [];
      setConversationId(id);
      setMessages(loaded.length ? loaded : [WORLD_CHAT_WELCOME]);
      setObservations(Array.isArray(data.observations) ? data.observations as Observation[] : []);
    } catch (reason) { setError(errorText(reason, 'Không thể mở cuộc trò chuyện')); }
    finally { setLoading(false); }
  }, []);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/conversations');
      const json = await readJson(response);
      if (!response.ok) throw new Error(json.error || 'Không thể mở ký ức trò chuyện');
      const list = Array.isArray(json.data) ? json.data as Conversation[] : [];
      setConversations(list);
      if (list[0]) await openConversation(list[0].id);
      else setLoading(false);
    } catch (reason) { setError(errorText(reason, 'Không thể mở ký ức trò chuyện')); setLoading(false); }
  }, [openConversation]);

  useEffect(() => { void loadConversations(); }, [loadConversations]);
  useEffect(() => { if (starterPrompt) setInput(starterPrompt); }, [starterPrompt]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, observations]);

  const createConversation = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Một khoảng lặng mới' }) });
      const json = await readJson(response);
      if (!response.ok) throw new Error(json.error || 'Không thể mở khoảng lặng mới');
      const conversation = json.data as Conversation;
      setConversations((old) => [conversation, ...old]);
      setConversationId(conversation.id); setMessages([WORLD_CHAT_WELCOME]); setObservations([]);
    } catch (reason) { setError(errorText(reason, 'Không thể mở khoảng lặng mới')); }
    finally { setLoading(false); }
  };

  const refreshCurrent = async (id: string) => {
    const response = await fetch(`/api/conversations/${id}`);
    const json = await readJson(response);
    if (response.ok) {
      const data = (json.data || {}) as JsonRecord;
      setObservations(Array.isArray(data.observations) ? data.observations as Observation[] : []);
    }
  };

  const decideObservation = async (id: string, decision: 'accepted' | 'rejected', editedContent?: string) => {
    setError('');
    const response = await fetch('/api/observations/decision', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observationId: id, decision, editedContent, idempotencyKey: `world-observation-${id}-${decision}` }),
    });
    const json = await readJson(response);
    if (!response.ok) { const message = json.error || 'Không thể lưu quyết định'; setError(message); throw new Error(message); }
    setObservations((old) => old.map((item) => item.id === id ? { ...item, status: decision, content_user_edited: editedContent || item.content_user_edited } : item));
    onChanged();
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = input.trim(); if (!content || sending) return;
    setSending(true); setError(''); setInput('');
    const userMessage: Message = { role: 'user', content };
    setMessages((old) => [...old, userMessage]);
    try {
      let activeId = conversationId;
      if (!activeId) {
        const response = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Cuộc trò chuyện tại Vườn Lắng Nghe' }) });
        const json = await readJson(response);
        if (!response.ok) throw new Error(json.error || 'Không thể bắt đầu trò chuyện');
        activeId = String((json.data as JsonRecord)?.id || '');
        if (!activeId) throw new Error('Không thể bắt đầu trò chuyện');
        setConversationId(activeId);
      }
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: activeId, content, recentMessages: [...messages, userMessage].slice(-8), idempotencyKey: `world-msg-${crypto.randomUUID()}` }) });
      if (!response.ok) { const json = await readJson(response); throw new Error(json.error || 'Mộc chưa thể phản hồi'); }
      const reply = await parseChatStream(response);
      setMessages((old) => [...old, { role: 'assistant', content: reply || 'Mình đang lắng nghe. Bạn có thể nói thêm một chút không?' }]);
      await refreshCurrent(activeId);
      onChanged();
    } catch (reason) { setError(errorText(reason, 'Kết nối bị gián đoạn')); setInput(content); }
    finally { setSending(false); }
  };

  return <div className="grid min-h-[66vh] gap-3 lg:grid-cols-[240px_1fr]">
    <aside className={`${panelClass} flex max-h-48 flex-col overflow-hidden lg:max-h-none`}>
      <div className="flex items-center justify-between border-b border-white/10 p-3"><div><p className="text-xs font-black">Ký ức trò chuyện</p><p className="text-[9px] text-white/38">Riêng tư · chỉ của bạn</p></div><button type="button" onClick={() => void createConversation()} className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 text-[#102638]"><Plus size={16} /></button></div>
      <div className="flex gap-2 overflow-x-auto p-2 lg:block lg:flex-1 lg:space-y-1 lg:overflow-y-auto">
        {conversations.map((item) => <button key={item.id} type="button" onClick={() => void openConversation(item.id)} className={`min-w-44 rounded-xl p-3 text-left lg:min-w-0 lg:w-full ${conversationId === item.id ? 'bg-cyan-300/15 text-cyan-100' : 'bg-white/[.04] text-white/58'}`}><p className="truncate text-xs font-bold">{item.title}</p><p className="mt-1 text-[9px] opacity-60">{item.status === 'completed' ? 'Đã khép lại' : 'Có thể tiếp tục'}</p></button>)}
      </div>
    </aside>
    <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-white/12 bg-black/20">
      <div className="border-b border-white/10 px-4 py-3"><p className="flex items-center gap-2 text-xs font-black text-emerald-200"><MessageCircleHeart size={15} /> Mộc đang lắng nghe</p><p className="mt-0.5 text-[10px] text-white/40">AI phản chiếu; bạn luôn là người xác nhận điều gì đúng với mình.</p></div>
      {loading ? <Loading label="Đang mở khoảng lặng của bạn…" /> : <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => <div key={message.id || index} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[82%] ${message.role === 'user' ? 'ml-auto bg-cyan-300 text-[#102638]' : 'bg-white/8 text-white/78'}`}><p className="mb-1 text-[8px] font-black uppercase tracking-widest opacity-55">{message.role === 'user' ? 'Bạn đã nói' : 'Mộc phản chiếu'}</p>{message.content}</div>)}
        {observations.length > 0 && <div className="space-y-2 pt-2">{observations.map((observation) => <ObservationCard key={observation.id} observation={observation} onDecide={decideObservation} />)}</div>}
        {sending && <div className="flex items-center gap-2 text-xs text-white/45"><Loader2 size={14} className="animate-spin" />Mộc đang suy ngẫm…</div>}
      </div>}
      {error && <div className="px-4 pb-2"><ErrorBox text={error} /></div>}
      <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3"><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Chia sẻ điều bạn đang nghĩ…" className={`${inputClass} min-h-12 flex-1 resize-none`} /><button aria-label="Gửi" className={`${primaryButton} self-end px-4`} disabled={sending || !input.trim()}><Send size={16} /></button></form>
    </section>
  </div>;
}

type DimensionSnapshot = { summary: string; current_state?: string; desired_state?: string; strengths?: string[]; tensions?: string[]; evidence_ids: string[] };
type LifeSnapshot = { schema_version: number; desire: string; escape: string; life_vision: string; dimensions: Record<string, DimensionSnapshot> };
type ProfileVersion = { id: string; version_no: number; status: string; snapshot: LifeSnapshot; is_current?: boolean; updated_at?: string };

function normalizeSnapshot(value: unknown): LifeSnapshot {
  const raw = value && typeof value === 'object' ? value as JsonRecord : {};
  const rawDimensions = raw.dimensions && typeof raw.dimensions === 'object' ? raw.dimensions as Record<string, JsonRecord> : {};
  const dimensions = Object.fromEntries(Object.keys(DIMENSION_LABELS).map((key) => {
    const dimension = rawDimensions[key] || {};
    return [key, {
      summary: String(dimension.summary || ''),
      current_state: String(dimension.current_state || ''),
      desired_state: String(dimension.desired_state || ''),
      strengths: Array.isArray(dimension.strengths) ? dimension.strengths.filter((item): item is string => typeof item === 'string') : [],
      tensions: Array.isArray(dimension.tensions) ? dimension.tensions.filter((item): item is string => typeof item === 'string') : [],
      evidence_ids: Array.isArray(dimension.evidence_ids) ? dimension.evidence_ids.filter((item): item is string => typeof item === 'string') : [],
    }];
  }));
  return { schema_version: 1, desire: String(raw.desire || ''), escape: String(raw.escape || ''), life_vision: String(raw.life_vision || ''), dimensions };
}

export function WorldLifeMapActivity({ onChanged, onContinue, onUnlockNext }: { onChanged: () => void; onContinue: () => void; onUnlockNext: () => void }) {
  const [snapshot, setSnapshot] = useState<LifeSnapshot>(() => normalizeSnapshot(null));
  const [history, setHistory] = useState<ProfileVersion[]>([]);
  const [sourceInsightIds, setSourceInsightIds] = useState<string[]>([]);
  const [selectedFocus, setSelectedFocus] = useState('');
  const [existingFocusDimensions, setExistingFocusDimensions] = useState<string[]>([]);
  const [tab, setTab] = useState<'map' | 'history'>('map');
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState<'draft' | 'confirm' | ''>('');
  const [notice, setNotice] = useState(''); const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [profileResponse, historyResponse, gapsResponse] = await Promise.all([fetch('/api/life-profile'), fetch('/api/life-profile/history'), fetch('/api/gaps')]);
      const [profileJson, historyJson, gapsJson] = await Promise.all([readJson(profileResponse), readJson(historyResponse), readJson(gapsResponse)]);
      if (!profileResponse.ok) throw new Error(profileJson.error || 'Không thể mở Bản đồ cuộc sống');
      const data = (profileJson.data || {}) as JsonRecord;
      setSnapshot(normalizeSnapshot(data.snapshot));
      const insights = Array.isArray(data.insights) ? data.insights as JsonRecord[] : [];
      setSourceInsightIds(insights.map((item) => String(item.id || '')).filter(Boolean));
      setHistory(historyResponse.ok && Array.isArray(historyJson.data) ? historyJson.data as ProfileVersion[] : []);
      const gaps = gapsResponse.ok && Array.isArray(gapsJson.data) ? gapsJson.data as JsonRecord[] : [];
      setExistingFocusDimensions(gaps.map((item) => String(item.dimension || '')).filter(Boolean));
    } catch (reason) { setError(errorText(reason, 'Không thể mở Bản đồ cuộc sống')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const updateDimension = (key: string, field: keyof DimensionSnapshot, value: string) => setSnapshot((old) => ({ ...old, dimensions: { ...old.dimensions, [key]: { ...old.dimensions[key], [field]: value } } }));
  const save = async (action: 'draft' | 'confirm') => {
    const focus = selectedFocus ? snapshot.dimensions[selectedFocus] : null;
    if (action === 'confirm' && (!selectedFocus || !focus?.current_state?.trim() || !focus?.desired_state?.trim())) {
      setError('Hãy chọn một chòm sao và viết rõ hiện tại cùng điều bạn mong muốn trước khi xác nhận.');
      return;
    }
    setSaving(action); setError(''); setNotice('');
    try {
      const response = await fetch('/api/life-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, snapshot, sourceInsightIds, sourceAnswerIds: [], idempotencyKey: action === 'confirm' ? `world-profile-${Date.now()}` : undefined }) });
      const json = await readJson(response);
      if (!response.ok) throw new Error(json.error || 'Không thể lưu bản đồ');
      if (action === 'confirm' && selectedFocus && focus && !existingFocusDimensions.includes(selectedFocus)) {
        const gapResponse = await fetch('/api/gaps', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dimension: selectedFocus,
            title: `Chăm sóc: ${DIMENSION_LABELS[selectedFocus] || selectedFocus}`,
            currentState: focus.current_state,
            desiredState: focus.desired_state,
            priority: 1,
          }),
        });
        const gapJson = await readJson(gapResponse);
        if (!gapResponse.ok) throw new Error(gapJson.error || 'Bản đồ đã lưu nhưng chưa thể đánh dấu vùng cần chăm sóc');
      }
      setNotice(action === 'confirm' ? 'Bạn đã xác nhận phiên bản Bản đồ cuộc sống này.' : 'Bản nháp đã được lưu. Bạn có thể quay lại sửa tiếp.');
      if (action === 'confirm') { onUnlockNext(); onChanged(); }
      await load();
    } catch (reason) { setError(errorText(reason, 'Không thể lưu bản đồ')); }
    finally { setSaving(''); }
  };

  if (loading) return <Loading label="Astra đang mở Bản đồ cuộc sống…" />;
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/20 bg-[#263d4d] p-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">Bản đồ do bạn làm chủ</p><h3 className="mt-1 text-base font-black">AI chỉ gợi ý; bạn sửa và xác nhận phiên bản cuối</h3></div><div className="flex gap-2"><button type="button" onClick={() => setTab('map')} className={tab === 'map' ? primaryButton : secondaryButton}><Star size={14} />Bản đồ</button><button type="button" onClick={() => setTab('history')} className={tab === 'history' ? primaryButton : secondaryButton}><History size={14} />Lịch sử</button></div></div>
    {error && <ErrorBox text={error} />}{notice && <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-xs font-bold text-emerald-100">{notice}</div>}
    {tab === 'history' ? <div className="space-y-3">{history.length ? history.map((version) => <div key={version.id} className={`${panelClass} flex items-center justify-between gap-3 p-4`}><div><p className="text-sm font-bold">Phiên bản {version.version_no}</p><p className="mt-1 text-[10px] text-white/42">{version.status === 'confirmed' ? 'Bạn đã xác nhận' : 'Bản nháp'} · {version.updated_at ? new Date(version.updated_at).toLocaleDateString('vi-VN') : ''}</p></div>{version.is_current && <span className="rounded-full bg-emerald-300 px-2.5 py-1 text-[9px] font-black text-[#102638]">HIỆN TẠI</span>}</div>) : <Empty text="Chưa có phiên bản nào được lưu." />}</div> : <>
      <div className="grid gap-3 lg:grid-cols-3">
        {([['desire', 'Điều tôi thật sự muốn', 'Nếu không cần làm hài lòng ai, bạn muốn điều gì?'], ['escape', 'Điều tôi muốn thoát khỏi', 'Điều gì đang rút cạn năng lượng của bạn?'], ['life_vision', 'Cuộc sống tôi chọn', 'Một bức tranh đủ thật để bạn muốn bước tới.']] as const).map(([key, label, placeholder]) => <label key={key} className={`${panelClass} p-4 text-xs font-bold text-white/75`}>{label}<textarea value={snapshot[key]} onChange={(event) => setSnapshot((old) => ({ ...old, [key]: event.target.value }))} className={`${inputClass} mt-2 min-h-28 font-normal`} placeholder={placeholder} /></label>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{Object.entries(snapshot.dimensions).map(([key, dimension], index) => <div key={key} className={`${panelClass} p-4`}><p className="text-[9px] font-black uppercase tracking-widest text-amber-200">Chòm sao {index + 1}</p><h4 className="mt-1 text-sm font-black">{DIMENSION_LABELS[key]}</h4><textarea value={dimension.summary} onChange={(event) => updateDimension(key, 'summary', event.target.value)} className={`${inputClass} mt-3 min-h-24`} placeholder="Tóm tắt điều đúng với bạn…" /><div className="mt-2 grid gap-2 sm:grid-cols-2"><textarea value={dimension.current_state || ''} onChange={(event) => updateDimension(key, 'current_state', event.target.value)} className={`${inputClass} min-h-20`} placeholder="Hiện tại…" /><textarea value={dimension.desired_state || ''} onChange={(event) => updateDimension(key, 'desired_state', event.target.value)} className={`${inputClass} min-h-20`} placeholder="Mong muốn…" /></div></div>)}</div>
      <div className={`${panelClass} p-4 sm:p-5`}><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">Chọn một vùng chăm sóc trước</p><p className="mt-1 text-xs text-white/48">Bạn không cần giải quyết cả cuộc đời cùng lúc. Chọn một chòm sao có “Hiện tại” và “Mong muốn” rõ nhất.</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{Object.keys(snapshot.dimensions).map((key) => <button key={key} type="button" onClick={() => setSelectedFocus(key)} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-bold ${selectedFocus === key ? 'border-cyan-200 bg-cyan-300/18 text-cyan-100' : 'border-white/10 bg-white/[.04] text-white/55'}`}>{selectedFocus === key && <Check size={13} className="mr-1 inline" />}{DIMENSION_LABELS[key]}</button>)}</div></div>
      <div className="sticky bottom-0 flex flex-col gap-2 rounded-2xl border border-white/12 bg-[#102638]/95 p-3 backdrop-blur sm:flex-row sm:justify-end"><button type="button" disabled={Boolean(saving)} onClick={() => void save('draft')} className={secondaryButton}>{saving === 'draft' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Lưu bản nháp</button><button type="button" disabled={Boolean(saving) || !selectedFocus} onClick={() => void save('confirm')} className={primaryButton}>{saving === 'confirm' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Xác nhận bản đồ & chòm sao</button><button type="button" onClick={onContinue} className={secondaryButton}>Đi tới thử nghiệm <ArrowRight size={14} /></button></div>
    </>}
  </div>;
}

type Experiment = { id: string; title: string; hypothesis?: string; smallest_step?: string; success_signal?: string; progress_percent?: number; status?: string };
export function WorldExperimentsActivity({ onChanged }: { onChanged: () => void }) {
  const [items, setItems] = useState<Experiment[]>([]); const [saving, setSaving] = useState(false); const [busyId, setBusyId] = useState(''); const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', hypothesis: '', smallestStep: '', successSignal: '' });
  const load = useCallback(async () => { const response = await fetch('/api/experiments'); const json = await readJson(response); if (!response.ok) throw new Error(json.error || 'Không thể mở nhà kính'); setItems(Array.isArray(json.data) ? json.data as Experiment[] : []); }, []);
  useEffect(() => { void load().catch((reason) => setError(errorText(reason, 'Không thể mở nhà kính'))); }, [load]);
  const create = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const response = await fetch('/api/experiments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, targetDays: 7 }) }); const json = await readJson(response); if (!response.ok) throw new Error(json.error || 'Không thể gieo hạt'); setForm({ title: '', hypothesis: '', smallestStep: '', successSignal: '' }); await load(); onChanged(); } catch (reason) { setError(errorText(reason, 'Không thể gieo hạt')); } finally { setSaving(false); } };
  const update = async (item: Experiment, patch: JsonRecord) => { setBusyId(item.id); setError(''); try { const response = await fetch(`/api/experiments/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...patch, idempotencyKey: `world-experiment-${item.id}-${Date.now()}` }) }); const json = await readJson(response); if (!response.ok) throw new Error(json.error || 'Không thể cập nhật thử nghiệm'); await load(); onChanged(); } catch (reason) { setError(errorText(reason, 'Không thể cập nhật thử nghiệm')); } finally { setBusyId(''); } };
  return <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
    <form onSubmit={create} className={`${panelClass} h-fit space-y-3 p-5`}><p className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Một bước nhỏ ngoài đời thật</p><h3 className="flex items-center gap-2 text-base font-black"><FlaskConical size={17} />Gieo thử nghiệm 7 ngày</h3>{error && <ErrorBox text={error} />}<input required className={inputClass} placeholder="Bạn muốn thử điều gì?" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><textarea required className={inputClass} placeholder="Bạn tin điều gì sẽ thay đổi?" value={form.hypothesis} onChange={(event) => setForm({ ...form, hypothesis: event.target.value })} /><textarea required className={inputClass} placeholder="Bước nhỏ nhất có thể làm hôm nay" value={form.smallestStep} onChange={(event) => setForm({ ...form, smallestStep: event.target.value })} /><input required className={inputClass} placeholder="Dấu hiệu để biết thử nghiệm hữu ích" value={form.successSignal} onChange={(event) => setForm({ ...form, successSignal: event.target.value })} /><button disabled={saving} className={`${primaryButton} w-full`}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Gieo hạt</button></form>
    <div className="space-y-3">{items.length ? items.map((item) => { const progress = item.progress_percent || 0; return <div key={item.id} className={`${panelClass} p-4`}><div className="flex items-start justify-between gap-3"><div><span className="text-[9px] font-black uppercase tracking-wider text-emerald-200">{item.status === 'completed' ? 'Đã hoàn thành' : item.status === 'abandoned' ? 'Đã khép lại' : item.status === 'draft' ? 'Bản nháp' : 'Đang nảy mầm'}</span><h4 className="mt-1 text-sm font-bold">{item.title}</h4></div><span className="text-xs font-black text-emerald-200">{progress}%</span></div><p className="mt-2 text-xs leading-5 text-white/48">{item.smallest_step || item.hypothesis}</p><input aria-label={`Tiến độ ${item.title}`} type="range" min="0" max="100" step="10" defaultValue={progress} disabled={busyId === item.id || item.status === 'completed'} onChange={(event) => { const value = Number(event.target.value); setItems((old) => old.map((entry) => entry.id === item.id ? { ...entry, progress_percent: value } : entry)); }} onPointerUp={(event) => void update(item, { progressPercent: Number((event.target as HTMLInputElement).value) })} className="mt-4 w-full accent-emerald-300" /><div className="mt-3 flex flex-wrap gap-2">{item.status === 'draft' && <button type="button" onClick={() => void update(item, { status: 'active', progressPercent: progress })} className={primaryButton}>Bắt đầu</button>}{item.status !== 'completed' && item.status !== 'abandoned' && <button type="button" onClick={() => void update(item, { status: 'completed', progressPercent: 100 })} className={secondaryButton}><Check size={14} />Hoàn thành & phản chiếu</button>}{item.status !== 'abandoned' && item.status !== 'completed' && <button type="button" onClick={() => void update(item, { status: 'abandoned', progressPercent: progress })} className={secondaryButton}><Archive size={14} />Khép lại</button>}</div></div>; }) : <Empty text="Nhà kính đang chờ hạt giống đầu tiên." />}</div>
  </div>;
}

type Reflection = { id: string; result: string; feeling: string; learning_candidate: string; next_action: string; rating?: number; experiment_title?: string; created_at?: string };
type Learning = { id: string; content: string; status: 'pending' | 'confirmed' | 'rejected'; created_at?: string };
export function WorldReflectionsActivity({ onChanged }: { onChanged: () => void }) {
  const [tab, setTab] = useState<'write' | 'memories' | 'learnings'>('write');
  const [reflections, setReflections] = useState<Reflection[]>([]); const [learnings, setLearnings] = useState<Learning[]>([]);
  const [saving, setSaving] = useState(false); const [busyId, setBusyId] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ result: '', feeling: '', learningCandidate: '', nextAction: '', rating: 5 });
  const load = useCallback(async () => { const [r, l] = await Promise.all([fetch('/api/reflections'), fetch('/api/learnings')]); const [rj, lj] = await Promise.all([readJson(r), readJson(l)]); if (!r.ok || !l.ok) throw new Error(rj.error || lj.error || 'Không thể mở hồ ký ức'); setReflections(Array.isArray(rj.data) ? rj.data as Reflection[] : []); setLearnings(Array.isArray(lj.data) ? lj.data as Learning[] : []); }, []);
  useEffect(() => { void load().catch((reason) => setError(errorText(reason, 'Không thể mở hồ ký ức'))); }, [load]);
  const save = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const response = await fetch('/api/reflections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const json = await readJson(response); if (!response.ok) throw new Error(json.error || 'Không thể lưu ký ức'); setForm({ result: '', feeling: '', learningCandidate: '', nextAction: '', rating: 5 }); setNotice('Mặt hồ đã giữ ký ức. Một bài học đang chờ bạn xác nhận.'); setTab('learnings'); await load(); onChanged(); } catch (reason) { setError(errorText(reason, 'Không thể lưu ký ức')); } finally { setSaving(false); } };
  const decide = async (learning: Learning, decision: 'confirmed' | 'rejected') => { setBusyId(learning.id); setError(''); try { const response = await fetch('/api/learnings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ learningId: learning.id, decision, idempotencyKey: `world-learning-${learning.id}-${decision}` }) }); const json = await readJson(response); if (!response.ok) throw new Error(json.error || 'Không thể lưu quyết định'); await load(); onChanged(); } catch (reason) { setError(errorText(reason, 'Không thể lưu quyết định')); } finally { setBusyId(''); } };
  return <div className="space-y-4"><div className="flex gap-2 overflow-x-auto">{([['write', 'Viết phản chiếu', BookOpen], ['memories', 'Ký ức', Clock3], ['learnings', 'Bài học', Sparkles]] as const).map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setTab(id)} className={tab === id ? primaryButton : secondaryButton}><Icon size={14} />{label}</button>)}</div>{error && <ErrorBox text={error} />}{notice && <div className="rounded-xl border border-sky-200/20 bg-sky-300/10 p-3 text-xs text-sky-100">{notice}</div>}
    {tab === 'write' && <form onSubmit={save} className={`${panelClass} mx-auto max-w-2xl space-y-3 p-5 sm:p-6`}><h3 className="text-base font-black">Viết xuống mặt hồ</h3><p className="text-xs leading-5 text-white/45">Đây là dữ liệu thật của bạn, không phải kết luận do AI tự tạo.</p><textarea required className={inputClass} placeholder="Điều gì đã thực sự xảy ra?" value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value })} /><input required className={inputClass} placeholder="Bạn đã cảm thấy thế nào?" value={form.feeling} onChange={(event) => setForm({ ...form, feeling: event.target.value })} /><textarea required className={inputClass} placeholder="Bạn nghĩ mình học được điều gì?" value={form.learningCandidate} onChange={(event) => setForm({ ...form, learningCandidate: event.target.value })} /><input required className={inputClass} placeholder="Bước tiếp theo là gì?" value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} /><div className="flex items-center gap-2"><span className="text-xs text-white/50">Mức hữu ích</span>{[1, 2, 3, 4, 5].map((rating) => <button type="button" key={rating} onClick={() => setForm({ ...form, rating })}><Star size={22} className={rating <= form.rating ? 'text-amber-300' : 'text-white/15'} fill={rating <= form.rating ? 'currentColor' : 'none'} /></button>)}</div><button disabled={saving} className={`${primaryButton} w-full`}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}Gửi ký ức xuống hồ</button></form>}
    {tab === 'memories' && <div className="grid gap-3 sm:grid-cols-2">{reflections.length ? reflections.map((item) => <div key={item.id} className={`${panelClass} p-4`}><p className="text-[9px] font-black uppercase tracking-widest text-sky-200">{item.experiment_title || 'Một thử nghiệm cuộc sống'}</p><h4 className="mt-2 text-sm font-bold">{item.result}</h4><p className="mt-2 text-xs leading-5 text-white/48">Cảm xúc: {item.feeling}</p><p className="mt-2 border-t border-white/8 pt-2 text-xs text-white/65">Điều bạn đã viết: {item.learning_candidate}</p></div>) : <Empty text="Mặt hồ chưa có ký ức nào." />}</div>}
    {tab === 'learnings' && <div className="space-y-3">{learnings.length ? learnings.map((item) => <div key={item.id} className={`${panelClass} p-4`}><p className={`text-[9px] font-black uppercase tracking-widest ${item.status === 'confirmed' ? 'text-emerald-200' : item.status === 'rejected' ? 'text-white/35' : 'text-amber-200'}`}>{item.status === 'confirmed' ? 'Bạn đã xác nhận' : item.status === 'rejected' ? 'Bạn đã bỏ qua' : 'Bài học đề xuất · chờ bạn quyết định'}</p><p className="mt-2 text-sm leading-6 text-white/72">{item.content}</p>{item.status === 'pending' && <div className="mt-3 flex gap-2"><button disabled={busyId === item.id} type="button" onClick={() => void decide(item, 'confirmed')} className={primaryButton}><Check size={14} />Đúng, giữ lại</button><button disabled={busyId === item.id} type="button" onClick={() => void decide(item, 'rejected')} className={secondaryButton}><X size={14} />Không giữ</button></div>}</div>) : <Empty text="Chưa có bài học nào chờ xác nhận." />}</div>}
  </div>;
}

type ResourceItem = { id: string; name: string; resource_type?: string; description?: string };
type GapItem = { id: string; title: string; current_state: string; desired_state: string; priority?: number; status?: string };
export function WorldResourcesActivity({ onChanged }: { onChanged: () => void }) {
  const [tab, setTab] = useState<'resources' | 'gaps' | 'money'>('resources'); const [items, setItems] = useState<ResourceItem[]>([]); const [gaps, setGaps] = useState<GapItem[]>([]);
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [resourceForm, setResourceForm] = useState({ name: '', resourceType: 'skill', description: '', dimension: 'what_it_takes' });
  const [gapForm, setGapForm] = useState({ title: '', currentState: '', desiredState: '', priority: 3, dimension: 'what_it_takes' });
  const load = useCallback(async () => { const [r, g] = await Promise.all([fetch('/api/resources'), fetch('/api/gaps')]); const [rj, gj] = await Promise.all([readJson(r), readJson(g)]); if (!r.ok || !g.ok) throw new Error(rj.error || gj.error || 'Không thể mở Kho Nguồn Lực'); setItems(Array.isArray(rj.data) ? rj.data as ResourceItem[] : []); setGaps(Array.isArray(gj.data) ? gj.data as GapItem[] : []); }, []);
  useEffect(() => { void load().catch((reason) => setError(errorText(reason, 'Không thể mở Kho Nguồn Lực'))); }, [load]);
  const createResource = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const response = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resourceForm) }); const json = await readJson(response); if (!response.ok) throw new Error(json.error || 'Không thể cất nguồn lực'); setResourceForm({ ...resourceForm, name: '', description: '' }); await load(); onChanged(); } catch (reason) { setError(errorText(reason, 'Không thể cất nguồn lực')); } finally { setSaving(false); } };
  const createGap = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const response = await fetch('/api/gaps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gapForm) }); const json = await readJson(response); if (!response.ok) throw new Error(json.error || 'Không thể ghi khoảng cách'); setGapForm({ ...gapForm, title: '', currentState: '', desiredState: '' }); await load(); onChanged(); } catch (reason) { setError(errorText(reason, 'Không thể ghi khoảng cách')); } finally { setSaving(false); } };
  const remove = async (kind: 'resources' | 'gaps', id: string) => { if (!window.confirm('Bạn muốn bỏ mục này khỏi hành trình?')) return; const response = await fetch(`/api/${kind}/${id}`, { method: 'DELETE' }); if (!response.ok) { const json = await readJson(response); setError(json.error || 'Không thể xóa mục này'); return; } await load(); onChanged(); };
  const moneyItems = items.filter((item) => item.resource_type === 'money');
  return <div className="space-y-4"><div className="flex gap-2 overflow-x-auto">{([['resources', 'Nguồn lực', WalletCards], ['gaps', 'Khoảng cách', Sparkles], ['money', 'Góc tài chính', WalletCards]] as const).map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setTab(id)} className={tab === id ? primaryButton : secondaryButton}><Icon size={14} />{label}</button>)}</div>{error && <ErrorBox text={error} />}
    {tab === 'resources' && <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><form onSubmit={createResource} className={`${panelClass} h-fit space-y-3 p-5`}><h3 className="text-base font-black">Cất một điểm tựa bạn đang có</h3><input required className={inputClass} placeholder="Tên kỹ năng, người hỗ trợ hoặc công cụ" value={resourceForm.name} onChange={(event) => setResourceForm({ ...resourceForm, name: event.target.value })} /><select className={inputClass} value={resourceForm.resourceType} onChange={(event) => setResourceForm({ ...resourceForm, resourceType: event.target.value })}><option value="skill">Kỹ năng</option><option value="time">Thời gian</option><option value="money">Tài chính</option><option value="person">Con người</option><option value="tool">Công cụ</option><option value="community">Cộng đồng</option></select><textarea className={inputClass} placeholder="Nguồn lực này giúp bạn thế nào?" value={resourceForm.description} onChange={(event) => setResourceForm({ ...resourceForm, description: event.target.value })} /><button disabled={saving} className={`${primaryButton} w-full`}><Plus size={14} />Đưa vào kho</button></form><div className="grid gap-3 sm:grid-cols-2">{items.length ? items.map((item) => <div key={item.id} className={`${panelClass} p-4`}><div className="flex justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-wider text-amber-200">{item.resource_type || 'nguồn lực'}</span><button aria-label="Xóa nguồn lực" type="button" onClick={() => void remove('resources', item.id)} className="text-white/35 hover:text-rose-200"><Trash2 size={15} /></button></div><h4 className="mt-1 text-sm font-bold">{item.name}</h4><p className="mt-2 text-xs leading-5 text-white/45">{item.description || 'Một điểm tựa đang sẵn có.'}</p></div>) : <Empty text="Kho đang trống. Hãy ghi nhận thứ đầu tiên bạn đang có." />}</div></div>}
    {tab === 'gaps' && <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><form onSubmit={createGap} className={`${panelClass} h-fit space-y-3 p-5`}><h3 className="text-base font-black">Ghi một khoảng cách cần chăm sóc</h3><input required className={inputClass} placeholder="Tên vùng bạn muốn thay đổi" value={gapForm.title} onChange={(event) => setGapForm({ ...gapForm, title: event.target.value })} /><textarea required className={inputClass} placeholder="Hiện tại đang thế nào?" value={gapForm.currentState} onChange={(event) => setGapForm({ ...gapForm, currentState: event.target.value })} /><textarea required className={inputClass} placeholder="Bạn muốn tiến tới đâu?" value={gapForm.desiredState} onChange={(event) => setGapForm({ ...gapForm, desiredState: event.target.value })} /><button disabled={saving} className={`${primaryButton} w-full`}><Plus size={14} />Ghi vào bản đồ</button></form><div className="space-y-3">{gaps.length ? gaps.map((gap) => <div key={gap.id} className={`${panelClass} p-4`}><div className="flex justify-between gap-2"><div><span className="text-[9px] font-black uppercase tracking-wider text-cyan-200">Ưu tiên {gap.priority || 3} · {gap.status || 'open'}</span><h4 className="mt-1 text-sm font-bold">{gap.title}</h4></div><button aria-label="Xóa khoảng cách" type="button" onClick={() => void remove('gaps', gap.id)} className="text-white/35 hover:text-rose-200"><Trash2 size={15} /></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-black/15 p-3"><p className="text-[9px] text-white/35">HIỆN TẠI</p><p className="mt-1 text-xs text-white/62">{gap.current_state}</p></div><div className="rounded-xl bg-black/15 p-3"><p className="text-[9px] text-white/35">MONG MUỐN</p><p className="mt-1 text-xs text-white/62">{gap.desired_state}</p></div></div></div>) : <Empty text="Chưa có khoảng cách nào cần chăm sóc." />}</div></div>}
    {tab === 'money' && <div className="mx-auto max-w-3xl space-y-4"><div className={`${panelClass} p-5`}><p className="text-[10px] font-black uppercase tracking-widest text-amber-200">Góc nhìn tài chính an toàn</p><h3 className="mt-2 text-lg font-black">Chỉ phản ánh điều bạn đã tự xác nhận</h3><p className="mt-2 text-xs leading-5 text-white/50">Không đoán thu nhập, không chẩn đoán, không khuyên đầu tư. Khu vực này giúp bạn thấy những nguồn lực tài chính đã tự ghi và khoảng cách liên quan đến cuộc sống.</p></div>{moneyItems.length ? moneyItems.map((item) => <div key={item.id} className={`${panelClass} p-4`}><h4 className="text-sm font-bold">{item.name}</h4><p className="mt-2 text-xs text-white/50">{item.description || 'Nguồn lực tài chính do bạn ghi nhận.'}</p></div>) : <Empty text="Bạn chưa tự ghi nhận nguồn lực tài chính nào. Đây không phải yêu cầu bắt buộc." />}</div>}
  </div>;
}

type ProgressData = {
  streak: number;
  answers: number;
  conversations: number;
  experiments: number;
  questionnaireProgress: number;
  activeDays: number;
  activeExperimentProgress?: number;
  completedExperiments?: number;
};

export function WorldProgressSnapshot() {
  const [data, setData] = useState<ProgressData | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/progress').then(async (response) => {
      const json = await readJson(response);
      if (!cancelled && response.ok && json.data) setData(json.data as ProgressData);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  if (!data) return null;
  const questionnaire = Math.max(0, Math.min(100, data.questionnaireProgress || 0));
  const experiment = Math.max(0, Math.min(100, data.activeExperimentProgress || 0));
  return <div className={`${panelClass} p-5`}>
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-200">Nhật ký hành trình</p><h4 className="mt-2 text-base font-black">Tiến bộ thật, không chấm điểm con người</h4></div><span className="rounded-full bg-violet-300/12 px-3 py-1 text-[10px] font-black text-violet-100">{data.activeDays} ngày kết nối</span></div>
    <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white/[.05] p-3"><b className="text-lg text-cyan-200">{data.conversations}</b><p className="text-[9px] text-white/40">đối thoại</p></div><div className="rounded-xl bg-white/[.05] p-3"><b className="text-lg text-amber-200">{data.answers}</b><p className="text-[9px] text-white/40">câu phản tư</p></div><div className="rounded-xl bg-white/[.05] p-3"><b className="text-lg text-emerald-200">{data.completedExperiments || 0}</b><p className="text-[9px] text-white/40">thử nghiệm xong</p></div></div>
    <div className="mt-4 space-y-3 text-[10px] font-bold text-white/55"><div><div className="mb-1 flex justify-between"><span>Hiểu mình</span><span>{questionnaire}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${questionnaire}%` }} /></div></div><div><div className="mb-1 flex justify-between"><span>Thử một thay đổi thật</span><span>{experiment}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-emerald-300" style={{ width: `${experiment}%` }} /></div></div></div>
  </div>;
}
