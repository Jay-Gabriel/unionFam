import React, { useEffect, useRef, useState } from 'react';
import { api, ApiError, type TurnResponse } from './api.js';
import { Logo, BottomNav, SideNav, Spinner, Typing, OrbitGraphic, MapCanvasLarge, useIsDesktop, type TabId } from './components.js';

type Phase = 'welcome' | 'consent' | 'conversation';
interface ChatMsg { role: 'assistant' | 'user' | 'safety'; text: string; choices?: string[]; disabled?: boolean }

export function App() {
  const [tab, setTab] = useState<TabId>('today');
  const [phase, setPhase] = useState<Phase>('welcome');
  const isDesktop = useIsDesktop(1024);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stateVersion, setStateVersion] = useState(0);
  const [convState, setConvState] = useState('ENTRY');
  const [memoryMode, setMemoryMode] = useState('ASK_LATER');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sending, setSending] = useState(false);
  const [closed, setClosed] = useState(false);
  const [safety, setSafety] = useState<TurnResponse['safety'] | null>(null);
  const [proposals, setProposals] = useState<TurnResponse['memory_proposal']>(null);
  const [possibleOutcome, setPossibleOutcome] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [limitNote, setLimitNote] = useState<string>('');
  const liveRef = useRef<HTMLDivElement>(null);

  // ------- Session lifecycle -------
  async function startSession(mode: string) {
    setError(null);
    try {
      const s = await api.createSession(mode);
      setSessionId(s.session_id);
      setStateVersion(s.state_version);
      setConvState(s.state);
      setMemoryMode(mode);
      setLimitNote(`Phiên này cho phép tối đa ${s.limits.turn_limit_per_session} lượt. ${s.limits.note}`);
      setPhase('conversation');
      setMessages([
        { role: 'assistant', text: 'Chào bạn. Mình là Life Lab — một không gian để bạn nhìn rõ hơn điều đang quan trọng với mình. Mình không phải chuyên gia trị liệu hay dịch vụ cấp cứu. Điều gì đang ở trong tâm trí bạn hôm nay?' },
      ]);
      // đẩy state khỏi ENTRY/CONSENT bằng một lượt khởi tạo rỗng (ui_action)
      void advance(s.session_id, s.state_version, { ui_action: { type: 'CONSENT_CONTINUE' } }, false);
    } catch (e) {
      setError(humanError(e));
    }
  }

  async function advance(
    sid: string,
    version: number,
    body: { message?: string | null; ui_action?: { type: string; value?: unknown } | null },
    showUser = true,
  ) {
    if (showUser && body.message) {
      setMessages((m) => [...m.map((x) => ({ ...x, disabled: true })), { role: 'user', text: body.message! }]);
    }
    setSending(true);
    setError(null);
    try {
      const r = await api.sendTurn(sid, { ...body, expected_state_version: version }, crypto.randomUUID());
      setStateVersion(r.state_version);
      setConvState(r.state);
      setSafety(r.safety.flow !== 'NONE' ? r.safety : null);
      setProposals(r.memory_proposal);
      setPossibleOutcome(r.possible_outcome);
      setClosed(r.closed);
      const isSafety = r.safety.flow !== 'NONE';
      setMessages((m) => [
        ...m,
        {
          role: isSafety ? 'safety' : 'assistant',
          text: r.assistant_message,
          choices: r.ui_actions.find((a) => a.options)?.options,
        },
      ]);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'STATE_VERSION_CONFLICT') {
        setError('Phiên đã thay đổi ở nơi khác. Đang tải lại...');
      } else {
        setError(humanError(e));
      }
    } finally {
      setSending(false);
    }
  }

  function send() {
    const text = input.trim();
    if (!text || !sessionId || sending || closed) return;
    setInput('');
    void advance(sessionId, stateVersion, { message: text });
  }

  function chooseChip(label: string) {
    if (!sessionId || sending || closed) return;
    setMessages((m) => m.map((x) => (x.choices ? { ...x, disabled: true } : x)));
    void advance(sessionId, stateVersion, { message: label });
  }

  function requestStop() {
    if (!sessionId || closed) return;
    void advance(sessionId, stateVersion, { message: 'dừng lại' });
  }

  function resetSession() {
    setPhase('welcome'); setMessages([]); setClosed(false); setSessionId(null);
    setSafety(null); setProposals(null); setPossibleOutcome(null);
  }

  async function decideProposal(id: string, decision: 'ALLOWED' | 'DENIED') {
    if (!sessionId) return;
    await api.decideProposal(id, { session_id: sessionId, decision, memory_mode: memoryMode });
    setProposals((p) => (p ? { proposals: p.proposals.filter((x) => x.id !== id) } : null));
  }

  useEffect(() => {
    if (liveRef.current) liveRef.current.scrollTop = liveRef.current.scrollHeight;
  }, [messages, sending]);

  // ---------------- Render ----------------
  const screenContent = (
    <>
      {tab === 'today' && phase === 'welcome' && <Welcome onStart={() => setPhase('consent')} desktop={isDesktop} onExploreTopic={(t) => { setPhase('consent'); }} />}
      {tab === 'today' && phase === 'consent' && <Consent onConfirm={startSession} />}
      {tab === 'today' && phase === 'conversation' && (
        <Conversation
          messages={messages} sending={sending} closed={closed} safety={safety}
          proposals={proposals} possibleOutcome={possibleOutcome} convState={convState}
          limitNote={limitNote} error={error} onChip={chooseChip} onDecideProposal={decideProposal}
          onNewSession={resetSession}
          onFeedback={async (f) => { if (sessionId) await api.sendFeedback(sessionId, f); }}
        />
      )}
      {tab === 'map' && <LifeMapScreen desktop={isDesktop} />}
      {tab === 'experiments' && <ExperimentsScreen active={possibleOutcome === 'LIFE_EXPERIMENT'} />}
      {tab === 'journey' && <JourneyScreen />}
    </>
  );

  const composer = (
    <>
      <div className="composer">
        <label className="sr-only" htmlFor="composer">Nhập tin nhắn</label>
        <textarea
          id="composer" value={input} placeholder="Bạn muốn chia sẻ gì?"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1} disabled={sending || !!safety}
        />
        <button className="icon-btn" onClick={send} disabled={sending || !input.trim() || !!safety} aria-label="Gửi">↑</button>
      </div>
      <div className="composer-actions">
        <button className="stop-link" onClick={requestStop}>⏸ Tạm dừng</button>
      </div>
    </>
  );

  const showComposer = tab === 'today' && phase === 'conversation' && !closed;

  // ===== DESKTOP SHELL (≥1024px): sidebar + content + optional chat panel =====
  if (isDesktop) {
    const chatInPanel = tab === 'today' && phase === 'conversation';
    return (
      <div className="shell-desktop">
        <SideNav active={tab} onChange={setTab} />
        <div className="shell-desktop__main">
          <div className="shell-desktop__content">{screenContent}</div>
          {chatInPanel && (
            <section className="chat-panel" aria-label="Cuộc trò chuyện">
              <header className="chat-panel__header">
                <span>Cuộc trò chuyện</span>
              </header>
              <div className="chat-panel__body" ref={liveRef}>
                <ConversationBody
                  messages={messages} sending={sending} closed={closed} safety={safety}
                  proposals={proposals} error={error} onChip={chooseChip}
                  onDecideProposal={decideProposal} onNewSession={resetSession}
                  onFeedback={async (f) => { if (sessionId) await api.sendFeedback(sessionId, f); }}
                />
              </div>
              {showComposer && <div className="chat-panel__composer">{composer}</div>}
            </section>
          )}
        </div>
      </div>
    );
  }

  // ===== MOBILE SHELL (<1024px): một cột + bottom nav =====
  return (
    <div className="app">
      <header className="app__header">
        <div className="brand"><Logo /> Life Lab</div>
        <div className="avatar" aria-hidden="true">🙂</div>
      </header>
      <main className="app__main" ref={liveRef}>{screenContent}</main>
      {showComposer && (
        <div className="app__composer-wrap">{composer}</div>
      )}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

// ---------------- UX01 Welcome ----------------
function Welcome({ onStart, desktop, onExploreTopic }: { onStart: () => void; desktop?: boolean; onExploreTopic?: (t: string) => void }) {
  if (desktop) {
    return (
      <>
        <div className="explore-head">
          <div>
            <h1 className="screen-title">Cuộc sống của bạn, đang mở.</h1>
            <p className="screen-sub">Chọn một điều bạn muốn nhìn rõ hơn hôm nay.</p>
          </div>
          <button className="btn btn--soft explore-head__cta" onClick={onStart}>⏱ Ghé nhanh 1 phút</button>
        </div>
        <div className="map-wrap">
          <MapCanvasLarge onPick={(t) => (onExploreTopic ? onExploreTopic(t) : onStart())} />
        </div>
        <div className="explore-cards">
          <div className="card card--peach explore-card">
            <p className="card__eyebrow">✦ Một điều để khám phá</p>
            <p className="card__title">Khi nào bạn thấy mình có quyền lựa chọn?</p>
            <button className="btn btn--primary" onClick={onStart}>Mở câu hỏi →</button>
          </div>
          <div className="card card--lilac explore-card">
            <p className="card__eyebrow">⚗ Điều đang thử</p>
            <p className="card__title">Một buổi kết thúc đúng giờ</p>
            <button className="btn btn--primary" onClick={onStart}>Xem lại trải nghiệm →</button>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <h1 className="screen-title">Hôm nay, bạn muốn mở chuyện gì?</h1>
      <p className="screen-sub">Một chút tò mò hôm nay có thể mở ra nhiều điều mới. Life Lab là công cụ phản tư — không phải con người, không phải dịch vụ cấp cứu.</p>
      <div className="card card--peach">
        <p className="card__eyebrow">⏱ Ghé nhanh</p>
        <p className="card__title">Một phiên ngắn 8–15 phút</p>
        <button className="btn btn--primary" onClick={onStart}>Bắt đầu →</button>
      </div>
    </>
  );
}

// ---------------- UX02 Consent ----------------
function Consent({ onConfirm }: { onConfirm: (mode: string) => void }) {
  const [mode, setMode] = useState<string | null>(null);
  const options = [
    { value: 'NO_MEMORY', title: 'Chỉ dùng trong phiên này', desc: 'Life Lab dùng điều bạn nói để trả lời trong phiên, nhưng không lưu cho lần sau.' },
    { value: 'ASK_LATER', title: 'Hỏi tôi sau', desc: 'Chưa quyết định; Life Lab chỉ hỏi khi có nội dung cụ thể đáng lưu.' },
    { value: 'PROPOSALS_ALLOWED', title: 'Cho phép đề xuất ghi nhớ', desc: 'Life Lab vẫn phải cho bạn xem và xác nhận từng nội dung.' },
  ];
  return (
    <>
      <h1 className="screen-title">Quyền riêng tư của bạn</h1>
      <p className="screen-sub">Bạn chọn cách Life Lab xử lý điều bạn chia sẻ. Không có lựa chọn nào được tick sẵn.</p>
      {options.map((o) => (
        <div
          key={o.value}
          className="consent-option"
          role="button"
          tabIndex={0}
          aria-pressed={mode === o.value}
          onClick={() => setMode(o.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMode(o.value); } }}
        >
          <h4>{o.title}</h4>
          <p>{o.desc}</p>
        </div>
      ))}
      <button className="btn btn--primary" disabled={!mode} onClick={() => mode && onConfirm(mode)}>Tiếp tục →</button>
    </>
  );
}

// ---------------- UX03/04/05/07/08/09/15 Conversation ----------------
type ConvProps = {
  messages: ChatMsg[]; sending: boolean; closed: boolean; safety: TurnResponse['safety'] | null;
  proposals: TurnResponse['memory_proposal']; error: string | null;
  onChip: (l: string) => void; onDecideProposal: (id: string, d: 'ALLOWED' | 'DENIED') => void; onNewSession: () => void; onFeedback: (f: string) => void;
};

function Conversation(props: ConvProps & { possibleOutcome: string | null; convState: string; limitNote: string }) {
  return (
    <>
      {props.limitNote && !props.closed && <p className="screen-sub" style={{ fontSize: 12 }}>{props.limitNote}</p>}
      <ConversationBody {...props} />
    </>
  );
}

/** Thân hội thoại dùng chung cho cả mobile và panel desktop. */
function ConversationBody(props: ConvProps) {
  const { messages, sending, closed, safety, proposals, error } = props;
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  return (
    <>
      <div className="chat" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i}>
            <div className={`msg msg--${m.role}`}>{m.text}</div>
            {m.choices && !m.disabled && (
              <div className="choices choices--row">
                {m.choices.map((c) => (
                  <button key={c} className="chip" onClick={() => props.onChip(c)} disabled={sending}>{c}</button>
                ))}
              </div>
            )}
            {m.role === 'safety' && safety?.resources && (
              <div className="card card--peach" style={{ marginTop: 10 }}>
                {safety.resources.map((r, idx) => (
                  <p key={idx} style={{ margin: '4px 0' }}><strong>{r.label}:</strong> {r.value}</p>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && <Typing />}
      </div>

      {error && <div className="error-box" role="alert">{error}</div>}

      {proposals && proposals.proposals.length > 0 && !closed && (
        <div className="card" style={{ marginTop: 12 }}>
          <p className="card__eyebrow">🔒 Bạn muốn Life Lab nhớ điều này?</p>
          {proposals.proposals.map((p) => (
            <div key={p.id} style={{ marginBottom: 14 }}>
              <strong>{p.content}</strong>
              <p style={{ color: 'var(--ink-soft)', fontSize: 13, margin: '4px 0 8px' }}>{p.reason}</p>
              <div className="btn-row">
                <button className="btn btn--soft" onClick={() => props.onDecideProposal(p.id, 'ALLOWED')}>Cho phép lưu</button>
                <button className="btn btn--soft" onClick={() => props.onDecideProposal(p.id, 'DENIED')}>Bỏ qua</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {closed && !safety && !feedbackGiven && (
        <div className="card" style={{ marginTop: 12 }}>
          <p className="card__title">Sau phiên này, bạn thấy thế nào?</p>
          <div className="choices">
            {[['CLEARER', 'Rõ hơn'], ['PARTLY_CLEARER', 'Rõ hơn một phần'], ['UNCHANGED', 'Như cũ'], ['MORE_CONFUSED', 'Rối hơn'], ['SKIPPED', 'Bỏ qua']].map(([v, l]) => (
              <button key={v} className="chip" onClick={() => { props.onFeedback(v); setFeedbackGiven(true); }}>{l}</button>
            ))}
          </div>
        </div>
      )}

      {closed && (
        <div className="card card--lilac" style={{ marginTop: 12, textAlign: 'center' }}>
          <p className="card__title">Phiên đã kết thúc</p>
          <p style={{ color: 'var(--ink-soft)' }}>Cảm ơn bạn. Bạn có thể quay lại bất cứ lúc nào.</p>
          <button className="btn btn--primary" onClick={props.onNewSession}>Mở phiên mới</button>
        </div>
      )}
    </>
  );
}

// ---------------- UX10 Life Map ----------------
function LifeMapScreen({ desktop }: { desktop?: boolean }) {
  return (
    <>
      <h1 className="screen-title">Điều đang quan trọng</h1>
      <p className="screen-sub">Bản đồ này hình thành qua cuộc trò chuyện. Bạn luôn có thể sửa hoặc lưu trữ.</p>
      <div className="card" style={desktop ? { height: 420 } : undefined}>
        {desktop ? <MapCanvasLarge /> : <OrbitGraphic />}
      </div>
      <div className="card card--peach">
        <p className="card__eyebrow">💼 Công việc</p>
        <p className="card__title">Trọng tâm bạn đã xác nhận</p>
        <p style={{ color: 'var(--ink-soft)', marginTop: -8 }}>Chủ động thời gian hơn</p>
      </div>
      <p className="empty">Chưa có nhiều nội dung — hãy mở một cuộc trò chuyện ở tab Hôm nay.</p>
    </>
  );
}

// ---------------- UX11/12 Experiments ----------------
function ExperimentsScreen({ active }: { active: boolean }) {
  return (
    <>
      <h1 className="screen-title">Một bước nhỏ ngoài đời</h1>
      <p className="screen-sub">Thử, quan sát, rồi xem điều gì hữu ích với bạn. Không chấm thành công hay thất bại.</p>
      {active ? (
        <div className="card card--peach">
          <p className="card__eyebrow">⚗ Đang thử</p>
          <p className="card__title">Một buổi kết thúc đúng giờ</p>
          <ExpRow icon="🎯" label="Muốn kiểm tra" value="Kết thúc đúng giờ có ảnh hưởng tiến độ không?" />
          <ExpRow icon="📋" label="Bước thử" value="Chọn một buổi dừng lúc 18h" />
          <ExpRow icon="🗓" label="Thời gian" value="Trong 7 ngày tới" />
          <ExpRow icon="👁" label="Điều quan sát" value="Cảm giác và tiến độ thực tế" />
          <div className="btn-row" style={{ marginTop: 14 }}>
            <button className="btn btn--primary">Ghi lại điều đã xảy ra →</button>
          </div>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button className="btn btn--ghost">Điều chỉnh</button>
            <button className="btn btn--danger">Đừng thử</button>
          </div>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 10 }}>ⓘ Bạn có thể thay đổi hoặc dừng bất cứ lúc nào.</p>
        </div>
      ) : (
        <p className="empty">Chưa có thử nghiệm nào. Một thử nghiệm chỉ bắt đầu khi bạn muốn hành động.</p>
      )}
    </>
  );
}

function ExpRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.5)' }}>
      <span aria-hidden="true">{icon}</span>
      <div>
        <strong style={{ fontSize: 14 }}>{label}</strong>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14 }}>{value}</p>
      </div>
    </div>
  );
}

// ---------------- UX13 Journey / Memory Center ----------------
function JourneyScreen() {
  return (
    <>
      <h1 className="screen-title">Những điều đã rõ hơn</h1>
      <p className="screen-sub">Mỗi trải nghiệm nhỏ đều góp phần vào hành trình của bạn.</p>
      <div className="card card--lilac">
        <p className="card__eyebrow">📄 Nhìn lại tuần của bạn</p>
        <button className="btn btn--soft">Mở bản nhìn lại →</button>
      </div>
      <div className="timeline-item">
        <div className="timeline-dot" />
        <div className="card" style={{ flex: 1, marginBottom: 0 }}>
          <span className="badge">Điều bạn xác nhận</span>
          <p style={{ fontWeight: 600, margin: '8px 0 4px' }}>Mình cần chủ động hơn, chưa chắc cần làm ít giờ.</p>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: 0 }}>Bạn đã xác nhận điều này là quan trọng với mình.</p>
        </div>
      </div>
      <div className="card">
        <p className="card__eyebrow">🔒 Những gì Life Lab đang nhớ</p>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Xem, sửa hoặc xóa các nội dung bạn đã đồng ý lưu. Chỉ hiện nội dung bạn đồng ý lưu.</p>
        <button className="btn btn--ghost">Mở Trung tâm bộ nhớ</button>
      </div>
    </>
  );
}

function humanError(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'MODEL_UNAVAILABLE': return 'Chưa thể phản hồi lúc này. Bạn thử lại nhé.';
      case 'RATE_LIMITED': return 'Bạn thao tác hơi nhanh. Chờ một chút rồi thử lại.';
      case 'VALIDATION_ERROR': return 'Nội dung chưa hợp lệ.';
      default: return 'Có lỗi xảy ra. Bạn thử lại sau nhé.';
    }
  }
  return 'Mất kết nối. Kiểm tra mạng và thử lại.';
}
