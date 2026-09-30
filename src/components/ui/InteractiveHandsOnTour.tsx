import React from 'react';
import {
  CheckCircle2,
  Compass,
  MapPin,
  MessageSquare,
  Sparkles,
  Rocket,
  Brain,
  X,
  ChevronRight,
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
  if (!isActive) return null;

  const currentQuest = quests[currentQuestIndex] || quests[quests.length - 1];
  const allCompleted = quests.every((q) => q.isCompleted);

  return (
    <div className="fixed top-14 md:top-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-2 md:px-4 animate-slideDown pointer-events-auto select-none">
      <div className="bg-[#1f2329]/95 border-2 border-amber-400/80 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-md p-3 md:p-4 text-stone-200">
        {/* Quest Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-700/60">
          <div className="flex items-center gap-2 md:gap-2.5">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md shrink-0">
              {allCompleted ? <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-300 animate-bounce" /> : currentQuest.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="font-serif-title font-bold text-xs md:text-sm text-stone-100">
                  {allCompleted ? '🎉 Làm chủ Life Lab!' : `Nhiệm vụ ${currentQuestIndex + 1}/${quests.length}`}
                </span>
                <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider px-1.5 md:px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/30">
                  Guide
                </span>
              </div>
              <p className="text-[10px] md:text-[11px] text-stone-400 truncate max-w-[200px] sm:max-w-none">
                {allCompleted ? 'Bạn đã sẵn sàng cho hành trình thấu hiểu bản thân.' : currentQuest.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSkip}
              className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-1 rounded cursor-pointer"
            >
              Bỏ qua
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-700/50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quest Instruction Body */}
        <div className="py-3 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-stone-100 font-semibold leading-relaxed">
              👉 {currentQuest.instruction}
            </p>
            <p className="text-[11px] text-amber-300/90 font-medium">
              💡 {currentQuest.hint}
            </p>
          </div>

          {currentQuest.isCompleted && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shrink-0 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã hoàn thành!</span>
            </div>
          )}
        </div>

        {/* Quest Step Pills */}
        <div className="flex items-center gap-1.5 pt-1">
          {quests.map((q, idx) => (
            <div
              key={q.id}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                q.isCompleted
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                  : idx === currentQuestIndex
                  ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] animate-pulse'
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
