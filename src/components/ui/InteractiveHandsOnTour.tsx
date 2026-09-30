import React, { useState } from 'react';
import {
  CheckCircle2,
  Compass,
  MapPin,
  MessageSquare,
  Sparkles,
  Rocket,
  Brain,
  X,
  ChevronUp,
  ChevronDown,
  Trophy,
} from 'lucide-react';

export interface HandsOnQuest {
  id: number;
  title: string;
  instruction: string;
  hint: string;
  isCompleted: boolean;
  icon: React.ReactNode;
}

interface InteractiveHandsOnTourProps {
  currentQuestIndex: number;
  quests: HandsOnQuest[];
  isActive: boolean;
  onClose: () => void;
  onSkip: () => void;
}

export const InteractiveHandsOnTour: React.FC<InteractiveHandsOnTourProps> = ({
  currentQuestIndex,
  quests,
  isActive,
  onClose,
  onSkip,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isActive) return null;

  const currentQuest = quests[currentQuestIndex] || quests[quests.length - 1];
  const allCompleted = quests.every((q) => q.isCompleted);

  // If Minimized on mobile: show a compact floating pill
  if (isMinimized) {
    return (
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 px-2 animate-fadeIn pointer-events-auto select-none">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-[#1f2329]/95 hover:bg-[#282d35] border border-amber-400/80 rounded-full py-1.5 px-3.5 shadow-xl backdrop-blur-md text-stone-200 flex items-center gap-2 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span>Nhiệm vụ {currentQuestIndex + 1}/{quests.length}: {currentQuest.title}</span>
          <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-13 md:top-15 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-2 md:px-4 animate-slideDown pointer-events-auto select-none">
      <div className="bg-[#1f2329]/96 border border-amber-400/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.85)] backdrop-blur-md p-2.5 md:p-3.5 text-stone-200">
        {/* Quest Top Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-stone-700/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md shrink-0">
              {allCompleted ? <Trophy className="w-3.5 h-3.5 text-amber-300 animate-bounce" /> : currentQuest.icon}
            </div>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="font-serif-title font-bold text-xs text-stone-100 whitespace-nowrap">
                {allCompleted ? '🎉 Hoàn tất!' : `Nhiệm vụ ${currentQuestIndex + 1}/${quests.length}`}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/30 shrink-0">
                Guide
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-700/50 cursor-pointer text-xs"
              title="Thu nhỏ thanh nhiệm vụ"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-700/50 cursor-pointer"
              title="Đóng hướng dẫn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quest Instruction Body */}
        <div className="py-2 space-y-1">
          <p className="text-[11px] md:text-xs text-stone-100 font-semibold leading-snug">
            👉 {currentQuest.instruction}
          </p>
          <p className="text-[10px] md:text-[11px] text-amber-300/90 font-medium">
            💡 {currentQuest.hint}
          </p>
        </div>

        {/* Quest Step Progress Pills */}
        <div className="flex items-center gap-1 pt-1">
          {quests.map((q, idx) => (
            <div
              key={q.id}
              className={`flex-1 h-1 rounded-full transition-all ${
                q.isCompleted
                  ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]'
                  : idx === currentQuestIndex
                  ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)] animate-pulse'
                  : 'bg-stone-700/60'
              }`}
              title={q.title}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
