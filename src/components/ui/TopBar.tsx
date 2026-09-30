import React from 'react';
import { ClarityScoreState } from '../../types';
import { BookOpen } from 'lucide-react';

interface TopBarProps {
  sessionTitle: string;
  clarityState: ClarityScoreState;
  onOpenGuide: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ sessionTitle, clarityState, onOpenGuide }) => {
  return (
    <header className="h-14 bg-[#1f2226] border-b border-stone-800/80 px-3 md:px-6 flex items-center justify-between text-stone-200 select-none z-20 shrink-0">
      {/* Left: Brand & Logo */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#3d3224] border border-[#d4af37] flex items-center justify-center shadow-md">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="12,6 15,12 12,18 9,12" fill="#ef4444" stroke="#d4af37" />
          </svg>
        </div>
        <span className="font-serif-title font-semibold text-base md:text-lg tracking-wide text-stone-100">
          Life Lab
        </span>
      </div>

      {/* Center: Session Title & Guide Button */}
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden max-w-[45%] md:max-w-none">
        <span className="font-serif-title text-xs md:text-base text-stone-300 tracking-wider truncate hidden sm:inline">
          {sessionTitle}
        </span>
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 px-2.5 md:px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">Hướng dẫn</span>
        </button>
      </div>

      {/* Right: Clarity Score Gems */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <span className="font-serif-title text-xs md:text-sm text-stone-300 hidden sm:inline">Clarity:</span>
        <div className="flex items-center gap-1 md:gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-stone-700/50">
          {/* Gem 1: Ruby */}
          <div
            title="Giai đoạn 1: Khởi đầu nhận thức (Đã mở)"
            className="w-3.5 h-4.5 md:w-4 md:h-5 rounded-xs bg-gradient-to-b from-red-500 to-red-800 border border-red-400/80 shadow-[0_0_8px_rgba(239,68,68,0.7)] transform rotate-12 cursor-help"
          />
          {/* Gem 2: Bronze / Amber */}
          <div
            title="Giai đoạn 2: Khám phá mâu thuẫn (Đã mở)"
            className="w-3.5 h-4.5 md:w-4 md:h-5 rounded-xs bg-gradient-to-b from-amber-600 to-amber-900 border border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)] transform -rotate-6 cursor-help"
          />
          {/* Gem 3: Crystal / Sapphire */}
          <div
            title="Giai đoạn 3: Xác định trọng tâm (Đã mở)"
            className="w-3.5 h-4.5 md:w-4 md:h-5 rounded-xs bg-gradient-to-b from-sky-400 to-blue-700 border border-sky-300/80 shadow-[0_0_8px_rgba(56,189,248,0.6)] transform rotate-6 cursor-help"
          />
          {/* Gem 4: Empty / Locked */}
          <div
            title="Giai đoạn 4: Thử nghiệm thực tế (Chưa mở)"
            className="w-3.5 h-4.5 md:w-4 md:h-5 rounded-xs bg-stone-800/80 border border-stone-700/40 cursor-help"
          />
          {/* Gem 5: Empty / Locked */}
          <div
            title="Giai đoạn 5: Định hình lối sống (Chưa mở)"
            className="w-3.5 h-4.5 md:w-4 md:h-5 rounded-xs bg-stone-800/80 border border-stone-700/40 cursor-help"
          />
        </div>
      </div>
    </header>
  );
};
