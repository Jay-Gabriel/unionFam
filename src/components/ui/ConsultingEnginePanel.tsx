import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ClarityScoreState } from '../../types';
import {
  Send,
  Sparkles,
  Rocket,
  Check,
  CheckCircle2,
  Calendar,
  Flame,
  ShieldCheck,
  Compass,
  ArrowRight,
  KeyRound,
  Zap,
} from 'lucide-react';

interface ConsultingEnginePanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onProvideFeedback: (feedback: 'right_on' | 'partly_right' | 'not_quite') => void;
  onOpenRepair: () => void;
  onOpenKeyModal?: () => void;
  hasGeminiKey: boolean;
  topicTitle: string;
  isAiThinking?: boolean;
  currentExperiment: {
    title: string;
    desc: string;
    days: boolean[];
    energy: number;
    insight: string;
    gap: string;
  };
  onToggleExperimentDay: (index: number) => void;
  onChangeEnergy: (energy: number) => void;
  activeStep: 'chat' | 'experiment';
  onChangeActiveStep: (step: 'chat' | 'experiment') => void;
  onCloseMobile?: () => void;
}

export const ConsultingEnginePanel: React.FC<ConsultingEnginePanelProps> = ({
  messages,
  onSendMessage,
  onProvideFeedback,
  onOpenRepair,
  onOpenKeyModal,
  hasGeminiKey,
  topicTitle,
  isAiThinking = false,
  currentExperiment,
  onToggleExperimentDay,
  onChangeEnergy,
  activeStep,
  onChangeActiveStep,
  onCloseMobile,
}) => {
  const [inputText, setInputText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isAiThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const checkedDaysCount = currentExperiment.days.filter(Boolean).length;
  const progressPct = Math.round((checkedDaysCount / 7) * 100);

  return (
    <div className="w-full md:w-[470px] h-full bg-[#1b1f24]/98 border-l border-stone-800 flex flex-col justify-between p-3 md:p-4 text-stone-200 z-10 shrink-0 select-text overflow-hidden">
      {/* 1. Header with Tab Navigation & Mobile Back button */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-800 gap-2 shrink-0">
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden flex items-center gap-1 bg-[#14161a] hover:bg-stone-800 border border-stone-700 text-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <span>🗺️ Bản đồ</span>
          </button>
        )}
        <div className="flex items-center gap-1 bg-[#14161a] p-1 rounded-xl border border-stone-700/60 flex-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onChangeActiveStep('chat')}
            className={`flex-1 px-2 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
              activeStep === 'chat'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            💬 1. Đối Thoại
          </button>
          <button
            onClick={() => onChangeActiveStep('experiment')}
            className={`flex-1 px-2 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
              activeStep === 'experiment'
                ? 'bg-emerald-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Rocket className="w-3 md:w-3.5 h-3 md:h-3.5" />
            <span>2. Thử Nghiệm ({checkedDaysCount}/7)</span>
          </button>
        </div>

        {/* UnionFam Blueprint 7.0 AI Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] md:text-[11px] font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span>Active</span>
        </div>
      </div>

      {/* 2. Main Content Views (Chat vs Experiment) */}
      {activeStep === 'chat' ? (
        <div className="flex-1 flex flex-col overflow-hidden my-2">
          {/* Quick Blueprint 7.0 Question Catalog */}
          <div className="p-2 bg-[#14171c] rounded-xl border border-stone-800 mb-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-1.5 flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>Gợi ý chủ đề khai vấn (Blueprint V7):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onSendMessage('Tôi muốn một ngày bình thường được dành năng lượng cho điều mình thực sự yêu thích.')}
                className="bg-[#242930] hover:bg-[#2e343d] border border-stone-700 text-stone-200 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
              >
                🌅 Q1: Một ngày lý tưởng
              </button>
              <button
                onClick={() => onSendMessage('Tôi đang kiếm được tiền nhưng muốn tiền phục vụ sự tự do thay vì áp lực.')}
                className="bg-[#242930] hover:bg-[#2e343d] border border-stone-700 text-stone-200 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
              >
                💰 Q2: Tiền bạc & Tự do
              </button>
              <button
                onClick={() => onSendMessage('Làm sao để biết tôi đang chọn nghề vì mình hay vì kỳ vọng của gia đình?')}
                className="bg-[#242930] hover:bg-[#2e343d] border border-stone-700 text-stone-200 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
              >
                👨‍👩‍👧 Q5: Kỳ vọng gia đình
              </button>
              <button
                onClick={() => onSendMessage('Tôi muốn bắt đầu 1 thử nghiệm 7 ngày nhỏ và an toàn.')}
                className="bg-[#242930] hover:bg-[#2e343d] border border-stone-700 text-stone-200 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
              >
                🧪 Q10: Thử nghiệm 7 ngày
              </button>
            </div>
          </div>

          {/* Conversation History */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 mb-2">
            {messages.map((msg) => {
              const isCoach = msg.sender === 'coach' || msg.sender === 'system';

              if (isCoach) {
                return (
                  <div key={msg.id} className="space-y-1 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#3d3224] border border-[#d4af37] flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12,2 15,10 22,12 15,14 12,22 9,14 2,12 9,10" />
                        </svg>
                      </div>
                      <span className="text-[11px] font-serif-title font-semibold text-amber-300">
                        {hasGeminiKey ? 'Gemini 2.5 AI · Life Lab V7' : 'Life Lab AI · Blueprint V7.0'}
                      </span>
                    </div>
                    <div className="parchment-bubble p-3 rounded-xl text-stone-200 text-xs leading-relaxed max-w-[95%]">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex justify-end animate-fadeIn">
                  <div className="user-bubble p-2.5 rounded-xl text-stone-100 text-xs leading-relaxed max-w-[88%] font-medium">
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isAiThinking && (
              <div className="flex items-center gap-2 text-stone-400 text-xs italic py-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{hasGeminiKey ? 'Gemini AI đang tư duy và phản chiếu...' : 'Life Lab AI đang lắng nghe và phản chiếu...'}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2B. LIFE EXPERIMENT DASHBOARD (7-DAY LAB) */
        <div className="flex-1 overflow-y-auto my-2 space-y-3 select-text pr-1 animate-fadeIn">
          {/* Experiment Card */}
          <div className="bg-[#14171c] border border-emerald-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Rocket className="w-3.5 h-3.5" />
                <span>THỬ NGHIỆM CUỘC SỐNG 7 NGÀY</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
                Tiến độ: {checkedDaysCount}/7 ({progressPct}%)
              </span>
            </div>

            <div>
              <h4 className="font-serif-title font-bold text-sm text-stone-100">
                {currentExperiment.title}
              </h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                {currentExperiment.desc}
              </p>
            </div>

            {/* 7 Checkboxes */}
            <div className="grid grid-cols-7 gap-1 pt-1">
              {currentExperiment.days.map((checked, idx) => (
                <button
                  key={idx}
                  onClick={() => onToggleExperimentDay(idx)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    checked
                      ? 'bg-emerald-500 text-stone-950 shadow-md scale-105'
                      : 'bg-[#21262d] text-stone-400 hover:bg-[#2c333c] border border-stone-700'
                  }`}
                >
                  <span>{checked ? '✓' : idx + 1}</span>
                  <span className="text-[9px] font-normal">N{idx + 1}</span>
                </button>
              ))}
            </div>

            {/* Energy Slider */}
            <div className="bg-[#1b1f24] p-3 rounded-xl border border-stone-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 font-medium flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mức năng lượng tự chủ (Q6):</span>
                </span>
                <span className="font-bold text-emerald-400 text-xs">
                  {currentExperiment.energy} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={currentExperiment.energy}
                onChange={(e) => onChangeEnergy(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Insights & The Gap Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#14171c] border border-amber-500/30 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>ĐÚC KẾT BÀI HỌC</span>
              </span>
              <p className="text-[11px] text-stone-300 leading-relaxed italic">
                {currentExperiment.insight}
              </p>
            </div>

            <div className="bg-[#14171c] border border-sky-500/30 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3" />
                <span>KHOẢNG CÁCH (THE GAP)</span>
              </span>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                {currentExperiment.gap}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Input & Action Verification Controls */}
      <div className="space-y-2 pt-2 border-t border-stone-800">
        {/* User Input Field */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Chia sẻ băn khoăn hoặc câu trả lời của bạn..."
            className="w-full bg-[#14171c] border border-stone-700/80 rounded-xl px-3.5 py-2 pr-10 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500/60 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-700/50 disabled:opacity-30 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* 3 Verification Buttons (Right on / Partly right / Not quite) */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onProvideFeedback('right_on')}
            className="retro-button py-1.5 px-2 rounded-lg text-xs font-semibold text-stone-100 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="Xác nhận AI hiểu đúng hoàn toàn"
          >
            Right on
          </button>
          <button
            onClick={() => onProvideFeedback('partly_right')}
            className="retro-button py-1.5 px-2 rounded-lg text-xs font-semibold text-stone-100 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="AI đúng 1 phần, chia sẻ thêm"
          >
            Partly right
          </button>
          <button
            onClick={() => onProvideFeedback('not_quite')}
            className="retro-button py-1.5 px-2 rounded-lg text-xs font-semibold text-stone-100 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="AI hiểu chưa đúng"
          >
            Not quite
          </button>
        </div>

        {/* Repair Action */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onOpenRepair}
            className="flex-1 bg-gradient-to-r from-[#3d4248] to-[#31363c] hover:from-[#4a5057] hover:to-[#4a5057] border border-stone-600/60 text-stone-200 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>✦ Repair (Hiệu chỉnh diễn giải)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
