import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { Send, Sparkles, Rocket } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onProvideFeedback: (feedback: 'right_on' | 'partly_right' | 'not_quite') => void;
  onOpenRepair: () => void;
  onOpenExperiment?: () => void;
  topicTitle: string;
  isAiThinking?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  onProvideFeedback,
  onOpenRepair,
  onOpenExperiment,
  topicTitle,
  isAiThinking = false,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="w-[440px] h-full bg-[#202327]/95 border-l border-stone-800/80 flex flex-col justify-between p-5 text-stone-200 z-10 shrink-0 select-text">
      {/* 1. Header Topic Button */}
      <div className="flex justify-end mb-3">
        <button className="bg-[#4a4640]/80 hover:bg-[#5a554e] border border-stone-600/70 text-stone-200 px-4 py-1.5 rounded-lg text-sm font-medium shadow-md transition-all cursor-pointer">
          {topicTitle}
        </button>
      </div>

      {/* 2. Message Conversation History */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3">
        {messages.map((msg) => {
          const isCoach = msg.sender === 'coach' || msg.sender === 'system';

          if (isCoach) {
            return (
              <div key={msg.id} className="space-y-1.5 animate-fadeIn">
                {/* Coach Header */}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#3d3224] border border-[#d4af37] flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12,2 15,10 22,12 15,14 12,22 9,14 2,12 9,10" />
                    </svg>
                  </div>
                  <span className="text-xs font-serif-title font-semibold text-stone-300">
                    Life Lab
                  </span>
                </div>

                {/* Coach Bubble */}
                <div className="parchment-bubble p-3.5 rounded-xl text-stone-200 text-sm leading-relaxed max-w-[95%]">
                  {msg.text}
                </div>
              </div>
            );
          }

          // User Bubble
          return (
            <div key={msg.id} className="flex justify-end animate-fadeIn">
              <div className="user-bubble p-3 rounded-xl text-stone-100 text-sm leading-relaxed max-w-[90%] font-medium">
                {msg.text}
              </div>
            </div>
          );
        })}

        {isAiThinking && (
          <div className="flex items-center gap-2 text-stone-400 text-xs italic py-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Life Lab đang lắng nghe và phản chiếu...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input & Action Controls Area */}
      <div className="space-y-2.5 pt-2 border-t border-stone-800/80">
        {/* User Input Field */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-[#2a2e33] border border-stone-700/80 rounded-xl px-4 py-2.5 pr-11 text-sm text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500/60 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-700/50 disabled:opacity-30 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Feedback Buttons (Right on / Partly right / Not quite) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onProvideFeedback('right_on')}
            className="retro-button py-1.5 px-2 rounded-lg text-xs font-semibold text-stone-100 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="Xác nhận AI hiểu hoàn toàn đúng"
          >
            Right on
          </button>
          <button
            onClick={() => onProvideFeedback('partly_right')}
            className="retro-button py-1.5 px-2 rounded-lg text-xs font-semibold text-stone-100 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="AI đúng một phần, cần bổ sung"
          >
            Partly right
          </button>
          <button
            onClick={() => onProvideFeedback('not_quite')}
            className="retro-button py-1.5 px-2 rounded-lg text-xs font-semibold text-stone-100 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="AI hiểu chưa đúng, cần hiệu chỉnh"
          >
            Not quite
          </button>
        </div>

        {/* Dual Actions: Repair & Life Experiment */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenRepair}
            className="bg-gradient-to-r from-[#474c52] to-[#3d4247] hover:from-[#545a61] hover:to-[#545a61] border border-stone-600/60 text-stone-200 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all hover:border-amber-400/50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>✦ Repair</span>
          </button>

          {onOpenExperiment && (
            <button
              onClick={onOpenExperiment}
              className="bg-gradient-to-r from-amber-600/80 to-amber-700/80 hover:from-amber-500 hover:to-amber-600 border border-amber-500/50 text-stone-100 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Rocket className="w-3.5 h-3.5 text-amber-200" />
              <span>Life Experiment</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
