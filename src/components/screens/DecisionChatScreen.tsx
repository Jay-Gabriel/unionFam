import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Wind,
  Plus,
  X,
  Pencil,
  Check,
  Sparkles,
  ShieldAlert,
  Send,
  Square,
  Sprout,
  Volume2,
  VolumeX,
  MessageCircle,
  ClipboardList,
} from 'lucide-react';
import { DecisionCardRecord, DecisionProposalRecord } from '../../types/decisionJourney';
import { applyProposalToCard, canDesignExperiment } from '../../services/decisionStateMachine';
import { callAiGatewayTurn } from '../../services/aiGatewayService';
import {
  playSoftLeafChime,
  speakGentleLeaf,
  stopLeafVoice,
} from '../../services/leafVoiceService';
import { LeafMascot3D, LeafMascotMood } from '../ui/LeafMascot3D';
import { Tilt3DCard } from '../ui/Tilt3DCard';
import { LeafBreathingRitual } from '../studio/LeafBreathingRitual';

interface DecisionChatScreenProps {
  initialProblemText?: string;
  onDesignExperiment: (card?: DecisionCardRecord) => void;
}

interface ChatItem {
  id: string;
  role: 'user' | 'assistant' | 'safety';
  text: string;
}

const MOOD_STONES = [
  { id: 'confused', label: '🌫️ Mình đang thấy rối bời', text: 'Mình đang thấy khá rối bời, chưa biết bắt đầu gỡ từ đâu.' },
  { id: 'fear', label: '⚖️ Mình sợ chọn sai', text: 'Mình sợ chọn sai rồi sẽ hối tiếc hoặc ảnh hưởng đến thu nhập.' },
  { id: 'tired', label: '🔋 Đang cạn năng lượng', text: 'Mình đang thấy mệt và cạn năng lượng vì áp lực kéo dài.' },
  { id: 'step', label: '🌱 Muốn chọn 1 bước thử nhỏ', text: 'Mình muốn chọn một bước thử nhỏ an toàn trong vài ngày tới.' },
];

/**
 * S03: Không gian Đối thoại & Đồng sáng tạo Thẻ Quyết Định cùng Chiếc Lá 3D.
 * Tối ưu độ rõ ràng, giọng phản chiếu nhẹ nhàng (text + Web Speech dịu) và bố cục 100dvh trên mobile & desktop.
 */
export const DecisionChatScreen: React.FC<DecisionChatScreenProps> = ({
  initialProblemText,
  onDesignExperiment,
}) => {
  const [messages, setMessages] = useState<ChatItem[]>(() => {
    const initial: ChatItem[] = [
      {
        id: '1',
        role: 'assistant',
        text: 'Chào bạn, Chiếc Lá đang ở đây cùng bạn. Bạn đang băn khoăn về lựa chọn nào nhất lúc này?',
      },
    ];
    if (initialProblemText?.trim()) {
      initial.push({
        id: 'init-user',
        role: 'user',
        text: initialProblemText.trim(),
      });
      initial.push({
        id: 'init-reply',
        role: 'assistant',
        text: 'Mình đã lắng nghe chia sẻ của bạn. Hãy cùng nhìn nhẹ xem điều gì cần giữ an toàn nhất cho bạn trên Thẻ Quyết Định nhé.',
      });
    }
    return initial;
  });

  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSafetyLocked, setIsSafetyLocked] = useState(false);
  const [leafMood, setLeafMood] = useState<LeafMascotMood>('listening');
  const [showBreathing, setShowBreathing] = useState(false);
  const [clarityPulse, setClarityPulse] = useState(6);

  // Mobile pane switcher & gentle Leaf voice state
  const [mobilePane, setMobilePane] = useState<'chat' | 'card'>('chat');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const [card, setCard] = useState<DecisionCardRecord>({
    id: 'dec-current',
    title: 'Quyết định công việc & nhịp sống',
    status: 'DRAFT',
    current_revision: 1,
    decision_question: initialProblemText?.trim()
      ? 'Mình nên điều chỉnh ranh giới hiện tại hay tìm hướng đi mới?'
      : 'Tôi nên ở lại hay đổi việc?',
    criteria: ['Bảo toàn sức khỏe'],
    hard_constraints: [],
    options: [],
    uncertainties: [],
    confirmed_fields: { decision_question: true, criteria: true },
  });

  const [activeProposal, setActiveProposal] = useState<DecisionProposalRecord | null>(null);

  // Inline Canvas Editing States
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [questionDraft, setQuestionDraft] = useState(card.decision_question);
  const [newCriterion, setNewCriterion] = useState('');
  const [newConstraint, setNewConstraint] = useState('');
  const [newOptionName, setNewOptionName] = useState('');

  const cancelledRef = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isAiLoading, activeProposal]);

  useEffect(() => {
    return () => {
      stopLeafVoice();
    };
  }, []);

  const speakMessage = (msgId: string, text: string) => {
    speakGentleLeaf(text, {
      onStart: () => setSpeakingMsgId(msgId),
      onEnd: () => setSpeakingMsgId((curr) => (curr === msgId ? null : curr)),
    });
  };

  const handleToggleVoice = () => {
    if (voiceEnabled) {
      setVoiceEnabled(false);
      setSpeakingMsgId(null);
      stopLeafVoice();
      return;
    }

    setVoiceEnabled(true);
    playSoftLeafChime();
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant) {
      speakMessage(lastAssistant.id, lastAssistant.text);
    }
  };

  const handleSpeakMessageToggle = (msg: ChatItem) => {
    if (speakingMsgId === msg.id) {
      stopLeafVoice();
      setSpeakingMsgId(null);
      return;
    }
    playSoftLeafChime();
    speakMessage(msg.id, msg.text);
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isAiLoading || isSafetyLocked) return;

    const userMsg: ChatItem = { id: `u_${Date.now()}`, role: 'user', text: trimmed };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputText('');
    setIsAiLoading(true);
    setLeafMood('thinking');
    cancelledRef.current = false;

    try {
      const response = await callAiGatewayTurn({
        message: trimmed,
        contextMessages: nextHistory
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role as 'user' | 'assistant', text: m.text })),
        cardSummary: `${card.decision_question} | Tiêu chí: ${card.criteria.join(', ')}`,
      });

      if (cancelledRef.current) return;
      setIsAiLoading(false);

      if (response.safetyInterception) {
        stopLeafVoice();
        setSpeakingMsgId(null);
        setIsSafetyLocked(true);
        setLeafMood('safety');
        setMessages((prev) => [
          ...prev,
          { id: `s_${Date.now()}`, role: 'safety', text: response.reply },
        ]);
        setActiveProposal(null);
        return;
      }

      const assistantMsgId = `a_${Date.now()}`;
      setLeafMood('caring');
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', text: response.reply },
      ]);

      if (voiceEnabled) {
        playSoftLeafChime();
        speakMessage(assistantMsgId, response.reply);
      }

      if (response.proposal && Object.keys(response.proposal).length > 0) {
        setActiveProposal({
          id: `prop_${Date.now()}`,
          decision_id: card.id,
          base_revision: card.current_revision,
          proposed_fields: response.proposal,
          status: 'pending',
        });
      }
    } catch {
      if (cancelledRef.current) return;
      setIsAiLoading(false);
      setLeafMood('listening');
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: 'Kết nối hơi chập chờn một chút. Bạn có thể bấm gửi lại hoặc viết tiếp vào Thẻ Quyết Định nhé.',
        },
      ]);
    }
  };

  const handleSend = () => {
    void sendMessage(inputText);
  };

  const handleStop = () => {
    cancelledRef.current = true;
    setIsAiLoading(false);
    setLeafMood('listening');
    stopLeafVoice();
    setSpeakingMsgId(null);
  };

  const handleAcceptProposal = () => {
    if (!activeProposal) return;
    const keys = Object.keys(activeProposal.proposed_fields) as (keyof DecisionCardRecord)[];
    const updatedCard = applyProposalToCard(card, activeProposal, keys);
    setCard(updatedCard);
    setQuestionDraft(updatedCard.decision_question);
    setActiveProposal(null);
    setLeafMood('celebrating');
    setClarityPulse((prev) => Math.min(10, prev + 1));

    if (import.meta.env.MODE !== 'test') {
      try {
        confetti({
          particleCount: 45,
          spread: 65,
          colors: ['#254B3D', '#8FA083', '#EED596', '#C6D6B4'],
          origin: { y: 0.72, x: 0.75 },
        });
      } catch {
        // Ignore confetti error in headless environments
      }
    }

    window.setTimeout(() => {
      setLeafMood((curr) => (curr === 'celebrating' ? 'listening' : curr));
    }, 2200);
  };

  const handleSaveQuestion = () => {
    if (!questionDraft.trim()) return;
    setCard((prev) => ({
      ...prev,
      decision_question: questionDraft.trim(),
      current_revision: prev.current_revision + 1,
      confirmed_fields: { ...prev.confirmed_fields, decision_question: true },
    }));
    setIsEditingQuestion(false);
  };

  const handleAddCriterion = () => {
    const val = newCriterion.trim();
    if (!val) return;
    setCard((prev) => ({
      ...prev,
      criteria: [...prev.criteria, val],
      current_revision: prev.current_revision + 1,
      confirmed_fields: { ...prev.confirmed_fields, criteria: true },
    }));
    setNewCriterion('');
  };

  const handleRemoveCriterion = (idx: number) => {
    setCard((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== idx),
      current_revision: prev.current_revision + 1,
    }));
  };

  const handleAddConstraint = () => {
    const val = newConstraint.trim();
    if (!val) return;
    setCard((prev) => ({
      ...prev,
      hard_constraints: [...prev.hard_constraints, val],
      current_revision: prev.current_revision + 1,
    }));
    setNewConstraint('');
  };

  const handleAddOption = () => {
    const val = newOptionName.trim();
    if (!val) return;
    setCard((prev) => ({
      ...prev,
      options: [...prev.options, { id: `opt_${Date.now()}`, name: val }],
      current_revision: prev.current_revision + 1,
    }));
    setNewOptionName('');
  };

  const experimentReady = canDesignExperiment(card);
  const sproutStage = experimentReady ? 3 : card.criteria.length > 0 ? 2 : 1;

  const clarityLabel =
    clarityPulse <= 3
      ? 'Đang còn mờ sương — cứ chậm rãi nhé'
      : clarityPulse <= 7
        ? 'Đang hé sáng dần — nhiều nút thắt đã rõ tên'
        : 'Sáng rõ & vững vàng — sẵn sàng thử một bước nhỏ';

  return (
    <div className="flex-1 min-h-0 h-full bg-[#F7F5EF] text-[#182D26] flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Tab Switcher (kept concise, hidden on desktop lg+) */}
      <div className="lg:hidden shrink-0 px-3 py-2 bg-[#FAF8F2] border-b border-[#BBC7BC] grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMobilePane('chat')}
          aria-pressed={mobilePane === 'chat'}
          className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobilePane === 'chat'
              ? 'bg-[#254B3D] text-white shadow-xs'
              : 'bg-white border border-[#BBC7BC] text-[#254B3D]'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Phản chiếu</span>
        </button>

        <button
          type="button"
          onClick={() => setMobilePane('card')}
          aria-pressed={mobilePane === 'card'}
          className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
            mobilePane === 'card'
              ? 'bg-[#254B3D] text-white shadow-xs'
              : 'bg-white border border-[#BBC7BC] text-[#254B3D]'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Thẻ ({card.criteria.length})</span>
          {activeProposal && mobilePane !== 'card' && (
            <span
              className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
              aria-label="Có đề xuất mới từ Chiếc Lá"
            />
          )}
        </button>
      </div>

      {/* Cột 1: Không gian Đồng hành Chiếc Lá (58%) */}
      <div
        className={`${
          mobilePane === 'chat' ? 'flex' : 'hidden lg:flex'
        } flex-1 min-h-0 lg:w-[58%] flex-col lg:border-r border-[#BBC7BC] bg-[#F7F5EF]`}
      >
        {/* Living 3D Leaf Companion Header */}
        <div className="shrink-0 px-3 sm:px-4 py-2.5 border-b border-[#BBC7BC]/80 bg-[#FAF8F2] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <LeafMascot3D mood={leafMood} size="sm" auraIntensity={clarityPulse} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm sm:text-base text-[#254B3D] truncate">
                  {card.title}
                </h2>
                <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-[#E8EDE5] text-[#254B3D] font-medium">
                  r{card.current_revision}
                </span>
              </div>
              {/* 3-Leaf Clarity Sprout Progress */}
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#182D26]/70 mt-0.5">
                <Sprout className="w-3.5 h-3.5 text-[#596A55] shrink-0" />
                <span className={sproutStage >= 1 ? 'font-semibold text-[#254B3D]' : ''}>
                  1. Câu hỏi
                </span>
                <span>→</span>
                <span className={sproutStage >= 2 ? 'font-semibold text-[#254B3D]' : ''}>
                  2. Điều quan trọng
                </span>
                <span>→</span>
                <span className={sproutStage >= 3 ? 'font-semibold text-[#254B3D]' : ''}>
                  3. Bước thử nhỏ
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleVoice}
              aria-pressed={voiceEnabled}
              aria-label={voiceEnabled ? 'Tắt giọng lá' : 'Bật giọng lá'}
              title={voiceEnabled ? 'Đang bật giọng đọc nhẹ của Chiếc Lá' : 'Bật giọng đọc nhẹ của Chiếc Lá'}
              className={`min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                voiceEnabled
                  ? 'border-[#254B3D] bg-[#DCE7D9] text-[#182D26]'
                  : 'border-[#BBC7BC] bg-white hover:bg-[#E8EDE5] text-[#254B3D]'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{voiceEnabled ? 'Tắt giọng' : 'Giọng lá'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBreathing(true)}
              className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-full border border-[#BBC7BC] bg-white hover:bg-[#E8EDE5] text-[#254B3D] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Wind className="w-3.5 h-3.5" />
              <span className="sm:hidden">Thở nhẹ</span>
              <span className="hidden sm:inline">Thở cùng Chiếc Lá</span>
            </button>

            {isAiLoading && (
              <button
                type="button"
                onClick={handleStop}
                className="min-h-[38px] px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Dừng trò chuyện</span>
              </button>
            )}
          </div>
        </div>

        {/* Reflective Journal Stream */}
        <div
          ref={chatScrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-5 py-4 space-y-3.5"
        >
          {messages.map((m) => {
            if (m.role === 'safety') {
              return (
                <div
                  key={m.id}
                  role="alert"
                  className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-[#182D26] space-y-2.5 shadow-sm fade-slide-up"
                >
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>Chiếc Lá ưu tiên sự an toàn của bạn trước tiên</span>
                  </div>
                  <p className="text-[15px] leading-[1.65] whitespace-pre-line">{m.text}</p>
                  <p className="text-xs text-amber-900/80">
                    Khung nhập liệu đã tạm khóa để bạn có thể kết nối trực tiếp với chuyên gia hỗ trợ ngay lúc này.
                  </p>
                </div>
              );
            }

            if (m.role === 'user') {
              return (
                <div
                  key={m.id}
                  className="ml-auto max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl rounded-tr-sm bg-[#DCE7D9] text-[#182D26] border border-[#B5C7B1] text-[15px] leading-[1.65] shadow-xs fade-slide-up"
                >
                  {m.text}
                </div>
              );
            }

            const isSpeakingThis = speakingMsgId === m.id;
            return (
              <div
                key={m.id}
                className="max-w-[92%] sm:max-w-[86%] flex items-start gap-2.5 fade-slide-up"
              >
                <div className="w-8 h-8 rounded-full bg-[#E8EDE5] border border-[#BBC7BC] flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                  <img
                    src="/assets/3d/leaf-herb-3d.png"
                    alt="Chiếc Lá"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="flex-1 p-3.5 sm:p-4 rounded-2xl rounded-tl-sm bg-white border border-[#BBC7BC] text-[#182D26] text-[15px] leading-[1.65] shadow-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#596A55]">
                      Phản chiếu từ Chiếc Lá
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSpeakMessageToggle(m)}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                        isSpeakingThis
                          ? 'bg-[#DCE7D9] text-[#254B3D]'
                          : 'text-[#596A55] hover:bg-[#E8EDE5]'
                      }`}
                      aria-label={isSpeakingThis ? 'Dừng đọc đoạn này' : 'Nghe nhẹ đoạn này'}
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{isSpeakingThis ? 'Đang đọc...' : 'Nghe nhẹ'}</span>
                    </button>
                  </div>
                  <p className="text-[#182D26]">{m.text}</p>
                </div>
              </div>
            );
          })}

          {isAiLoading && (
            <div className="flex items-center gap-2.5 text-xs text-[#596A55] italic pl-1">
              <span className="w-2 h-2 rounded-full bg-[#8FA083] animate-ping" />
              <span>Chiếc Lá đang lắng nghe và suy ngẫm nhẹ nhàng cùng bạn...</span>
            </div>
          )}

          {activeProposal && mobilePane === 'chat' && (
            <button
              type="button"
              onClick={() => setMobilePane('card')}
              className="lg:hidden w-full p-3 rounded-xl bg-[#E8EDE5] border border-[#8FA083] text-xs font-medium text-[#254B3D] flex items-center justify-between gap-2 cursor-pointer"
            >
              <span>✨ Chiếc Lá vừa gợi ý 1 cập nhật nhẹ cho Thẻ Quyết Định</span>
              <span className="font-bold shrink-0">Xem Thẻ →</span>
            </button>
          )}
        </div>

        {/* Tactile Mood / Clarity Stones Dock + Input (pinned safely above mobile bottom edge) */}
        <div className="shrink-0 px-3 sm:px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-[#BBC7BC] bg-[#FAF8F2] space-y-2">
          {!isSafetyLocked && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {MOOD_STONES.map((stone) => (
                <button
                  key={stone.id}
                  type="button"
                  disabled={isAiLoading}
                  onClick={() => void sendMessage(stone.text)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-[#E8EDE5] hover:bg-[#d7e2d3] border border-[#BBC7BC] text-xs font-medium text-[#254B3D] transition cursor-pointer disabled:opacity-40"
                >
                  {stone.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                isSafetyLocked
                  ? 'Phiên trò chuyện đã khóa để ưu tiên hỗ trợ khẩn cấp.'
                  : 'Nhập chia sẻ của bạn...'
              }
              disabled={isAiLoading || isSafetyLocked}
              className="flex-1 min-h-[46px] px-3.5 py-2.5 rounded-xl border-2 border-[#B5C6B3] bg-white focus:outline-none focus:border-[#254B3D] text-[16px] sm:text-[15px] text-[#182D26] placeholder:text-[#182D26]/45 disabled:bg-stone-100 disabled:text-stone-400"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isAiLoading || isSafetyLocked || !inputText.trim()}
              className="px-4 sm:px-5 py-2.5 bg-[#254B3D] hover:bg-[#182D26] text-white rounded-xl font-medium disabled:opacity-40 min-h-[46px] flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Gửi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cột 2: Thẻ Quyết Định 3D Tương Tác (42%) */}
      <div
        className={`${
          mobilePane === 'card' ? 'flex' : 'hidden lg:flex'
        } flex-1 min-h-0 lg:w-[42%] flex-col bg-[#F7F5EF]`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img
                src="/assets/3d/icon-3d-clarify.png"
                alt=""
                aria-hidden="true"
                className="w-7 h-7 object-contain"
              />
              <h3 className="font-bold text-lg sm:text-xl text-[#254B3D]">Thẻ Quyết Định</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#E8EDE5] text-[#254B3D] font-semibold">
              {card.status}
            </span>
          </div>

          <Tilt3DCard
            intensity={5}
            className="sanctuary-3d-surface rounded-2xl border border-[#BBC7BC] p-4 sm:p-5 space-y-4"
          >
            {/* 1. Câu hỏi quyết định (Inline editable) */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#182D26]/65">
                  Câu hỏi quyết định
                </span>
                {!isEditingQuestion && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionDraft(card.decision_question);
                      setIsEditingQuestion(true);
                    }}
                    className="text-xs text-[#254B3D] hover:underline flex items-center gap-1 cursor-pointer"
                    aria-label="Sửa câu hỏi quyết định"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>
                )}
              </div>

              {isEditingQuestion ? (
                <div className="flex gap-2 mt-1.5">
                  <input
                    type="text"
                    value={questionDraft}
                    onChange={(e) => setQuestionDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveQuestion()}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#254B3D] bg-white text-[14px] sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSaveQuestion}
                    className="px-3 py-1.5 rounded-lg bg-[#254B3D] text-white text-xs font-medium cursor-pointer"
                    aria-label="Lưu câu hỏi"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="font-semibold text-[15px] text-[#182D26] mt-1 leading-relaxed">
                  {card.decision_question}
                </p>
              )}
            </div>

            {/* 2. Điều quan trọng (Criteria) */}
            <div className="pt-2 border-t border-[#BBC7BC]/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#182D26]/65">
                Điều quan trọng ({card.criteria.length})
              </span>
              <ul className="space-y-1.5 mt-2">
                {card.criteria.map((c, i) => (
                  <li
                    key={`${c}-${i}`}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#E8EDE5]/75 text-sm text-[#182D26]"
                  >
                    <span>• {c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(i)}
                      aria-label={`Xóa tiêu chí ${c}`}
                      className="text-[#182D26]/50 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCriterion()}
                  placeholder="+ Thêm điều bạn coi trọng..."
                  className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-[#BBC7BC] bg-white text-[14px] sm:text-xs focus:outline-[#254B3D]"
                />
                <button
                  type="button"
                  onClick={handleAddCriterion}
                  aria-label="Thêm điều quan trọng"
                  className="px-3 py-1.5 rounded-lg bg-[#E8EDE5] hover:bg-[#d7e2d3] text-[#254B3D] text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Ranh giới không đánh đổi (Hard Constraints) */}
            <div className="pt-2 border-t border-[#BBC7BC]/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#182D26]/65">
                Giới hạn không đánh đổi
              </span>
              {card.hard_constraints.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {card.hard_constraints.map((hc, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300/70 text-amber-950"
                    >
                      🛡️ {hc}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  value={newConstraint}
                  onChange={(e) => setNewConstraint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddConstraint()}
                  placeholder="+ Thêm giới hạn an toàn..."
                  className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-[#BBC7BC] bg-white text-[14px] sm:text-xs focus:outline-[#254B3D]"
                />
                <button
                  type="button"
                  onClick={handleAddConstraint}
                  aria-label="Thêm giới hạn"
                  className="px-3 py-1.5 rounded-lg bg-[#E8EDE5] hover:bg-[#d7e2d3] text-[#254B3D] text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. Phương án cân nhắc (Options) */}
            <div className="pt-2 border-t border-[#BBC7BC]/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#182D26]/65">
                Phương án đang cân nhắc
              </span>
              {card.options.length > 0 && (
                <div className="space-y-1.5 mt-1.5">
                  {card.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="px-3 py-2 rounded-xl bg-white border border-[#BBC7BC]/80 text-xs"
                    >
                      <div className="font-semibold text-[#254B3D]">{opt.name}</div>
                      {opt.description && (
                        <div className="text-[#182D26]/70 mt-0.5">{opt.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                  placeholder="+ Thêm phương án..."
                  className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-[#BBC7BC] bg-white text-[14px] sm:text-xs focus:outline-[#254B3D]"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  aria-label="Thêm phương án"
                  className="px-3 py-1.5 rounded-lg bg-[#E8EDE5] hover:bg-[#d7e2d3] text-[#254B3D] text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 5. Thước đo Độ Sáng Rõ Hiện Tại */}
            <div className="pt-2 border-t border-[#BBC7BC]/40 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#254B3D]">Độ sáng rõ hiện tại</span>
                <span className="font-bold text-[#254B3D] tabular-nums">{clarityPulse}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={clarityPulse}
                onChange={(e) => setClarityPulse(Number(e.target.value))}
                aria-label="Độ sáng rõ hiện tại"
                className="w-full accent-[#254B3D] cursor-pointer"
              />
              <p className="text-[11px] text-[#596A55] italic">{clarityLabel}</p>
            </div>

            {/* Khối Proposal Review */}
            {activeProposal && (
              <div className="p-3.5 bg-[#E8EDE5] border border-[#254B3D]/40 rounded-2xl space-y-2.5 fade-slide-up">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#254B3D]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ĐỀ XUẤT MỚI TỪ CHIẾC LÁ</span>
                </div>
                <div className="text-xs text-[#182D26]/85 space-y-1">
                  {activeProposal.proposed_fields.decision_question && (
                    <p>• Câu hỏi: {activeProposal.proposed_fields.decision_question}</p>
                  )}
                  {activeProposal.proposed_fields.criteria && (
                    <p>• Tiêu chí: {activeProposal.proposed_fields.criteria.join(', ')}</p>
                  )}
                  {activeProposal.proposed_fields.hard_constraints && (
                    <p>• Giới hạn: {activeProposal.proposed_fields.hard_constraints.join(', ')}</p>
                  )}
                  {activeProposal.proposed_fields.options && (
                    <p>
                      • Phương án:{' '}
                      {activeProposal.proposed_fields.options.map((o) => o.name).join(' / ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAcceptProposal}
                    className="text-xs px-3.5 py-1.5 bg-[#254B3D] hover:bg-[#182D26] text-white rounded-lg font-medium min-h-[36px] cursor-pointer"
                  >
                    ✓ Đúng với tôi
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveProposal(null)}
                    className="text-xs px-3.5 py-1.5 border border-[#BBC7BC] bg-white text-[#182D26] rounded-lg min-h-[36px] cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            )}
          </Tilt3DCard>
        </div>

        {/* Pinned CTA Footer (always visible, never clipped on viewport bottom) */}
        <div className="shrink-0 px-3.5 sm:px-5 pt-2.5 pb-[max(0.85rem,env(safe-area-inset-bottom))] border-t border-[#BBC7BC]/70 bg-[#FAF8F2]">
          <button
            type="button"
            onClick={() => onDesignExperiment(card)}
            disabled={!experimentReady}
            className="w-full min-h-[46px] py-3 bg-[#254B3D] hover:bg-[#182D26] text-white font-medium rounded-full transition disabled:opacity-40 shadow-sm cursor-pointer"
          >
            {experimentReady ? 'Thiết kế bước thử →' : 'Cần làm rõ thêm câu hỏi & điều quan trọng'}
          </button>
        </div>
      </div>

      {/* Nghi thức Thở cùng Chiếc Lá */}
      <LeafBreathingRitual isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
    </div>
  );
};
