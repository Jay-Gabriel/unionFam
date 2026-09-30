import React from 'react';
import { Square, RefreshCw, Brain, Settings } from 'lucide-react';

interface BottomBarProps {
  onStop: () => void;
  onChangeTopic: () => void;
  onOpenMemoryCenter: () => void;
  onOpenSettings: () => void;
  noMemoryMode: boolean;
  onToggleNoMemory: (val: boolean) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  onStop,
  onChangeTopic,
  onOpenMemoryCenter,
  onOpenSettings,
  noMemoryMode,
  onToggleNoMemory,
}) => {
  return (
    <footer className="h-12 bg-[#1f2226] border-t border-stone-800/80 px-3 md:px-6 flex items-center justify-between text-stone-300 text-xs font-medium select-none z-20 shrink-0">
      {/* Left Action Buttons */}
      <div className="flex items-center gap-3 md:gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={onStop}
          className="flex items-center gap-1 md:gap-1.5 hover:text-red-400 transition-colors cursor-pointer group py-1"
          title="Stop session"
        >
          <Square className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform text-stone-400 group-hover:text-red-400" />
          <span className="hidden xs:inline">Stop</span>
        </button>

        <button
          onClick={onChangeTopic}
          className="flex items-center gap-1 md:gap-1.5 hover:text-amber-300 transition-colors cursor-pointer group py-1"
          title="Change Topic"
        >
          <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
          <span className="hidden xs:inline">Topic</span>
        </button>

        <button
          onClick={onOpenMemoryCenter}
          className="flex items-center gap-1 md:gap-1.5 hover:text-amber-300 transition-colors cursor-pointer group py-1"
          title="Memory Center"
        >
          <Brain className="w-4 h-4 group-hover:scale-110 transition-transform text-amber-400" />
          <span>Memory</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1 md:gap-1.5 hover:text-amber-300 transition-colors cursor-pointer group py-1"
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
          <span className="hidden xs:inline">Settings</span>
        </button>
      </div>

      {/* Right No Memory Toggle */}
      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
        <span className={`text-[11px] md:text-xs ${noMemoryMode ? 'text-amber-400 font-semibold' : 'text-stone-400'}`}>
          <span className="hidden sm:inline">No Memory</span>
          <span className="sm:hidden">Incognito</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={noMemoryMode}
          onClick={() => onToggleNoMemory(!noMemoryMode)}
          className={`w-9 h-4.5 md:w-10 md:h-5 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
            noMemoryMode ? 'bg-amber-600' : 'bg-stone-700'
          }`}
        >
          <span
            className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform shadow-md ${
              noMemoryMode ? 'transform translate-x-4.5 md:translate-x-5' : ''
            }`}
          />
        </button>
      </div>
    </footer>
  );
};
