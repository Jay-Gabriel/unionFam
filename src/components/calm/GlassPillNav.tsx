import React from 'react';
import { Leaf, Volume2, VolumeX, AlertTriangle, Activity, MessageCircle, Compass, FlaskConical, Home } from 'lucide-react';

interface GlassPillNavProps {
  onGoToHome: () => void;
  onGoToChat: () => void;
  onGoToLifeMap: () => void;
  onGoToExperiments: () => void;
  ambientSound: boolean;
  onToggleAudio: () => void;
  onOpenIncident: () => void;
  onOpenDashboard: () => void;
  activeTab: 'home' | 'chat' | 'lifemap' | 'experiments';
}

export function GlassPillNav({
  onGoToHome,
  onGoToChat,
  onGoToLifeMap,
  onGoToExperiments,
  ambientSound,
  onToggleAudio,
  onOpenIncident,
  onOpenDashboard,
  activeTab,
}: GlassPillNavProps) {
  return (
    <header className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1.5rem)] select-none">
      <nav className="glass-panel rounded-full px-3 py-2 flex items-center justify-between gap-1.5 sm:gap-3 shadow-soft border border-calm-lichen/20">
        
        {/* Brand / Logo with Leaf Icon */}
        <button
          onClick={onGoToHome}
          className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full hover:bg-white/10 transition cursor-pointer"
          title="Trang chủ Life Lab Sanctuary"
        >
          <div className="w-7 h-7 rounded-full bg-calm-deep-moss border border-calm-lichen/40 flex items-center justify-center text-calm-lichen">
            <Leaf className="w-4 h-4 fill-calm-lichen/20 text-calm-lichen" />
          </div>
          <span className="font-serif text-sm font-semibold tracking-wider text-calm-paper-white hidden sm:inline">
            LIFE LAB
          </span>
        </button>

        {/* Central Nav Links */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-medium">
          <button
            onClick={onGoToHome}
            className={`px-3 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'home'
                ? 'bg-calm-lichen/20 text-calm-lichen font-semibold border border-calm-lichen/30'
                : 'text-calm-fog hover:text-white hover:bg-white/10'
            }`}
          >
            <Home className="w-3.5 h-3.5 hidden sm:inline" />
            <span>Trang chủ</span>
          </button>

          <button
            onClick={onGoToChat}
            className={`px-3 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-calm-moss border-calm-lichen text-white font-semibold shadow-soft'
                : 'text-calm-fog hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-calm-pollen animate-pulse" />
            <span>Trò chuyện AI</span>
          </button>

          <button
            onClick={onGoToLifeMap}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full transition cursor-pointer hidden md:inline-flex items-center gap-1.5 ${
              activeTab === 'lifemap'
                ? 'bg-calm-lichen/20 text-calm-lichen font-semibold border border-calm-lichen/30'
                : 'text-calm-fog hover:text-white hover:bg-white/10'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Bản đồ sống</span>
          </button>

          <button
            onClick={onGoToExperiments}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full transition cursor-pointer hidden md:inline-flex items-center gap-1.5 ${
              activeTab === 'experiments'
                ? 'bg-calm-lichen/20 text-calm-lichen font-semibold border border-calm-lichen/30'
                : 'text-calm-fog hover:text-white hover:bg-white/10'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Thử nghiệm 7 ngày</span>
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="w-[1px] h-5 bg-white/15 mx-0.5" />

        {/* Utility Actions: Sound, Incident, Dashboard */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={onToggleAudio}
            title={ambientSound ? 'Tắt âm thanh tĩnh tại' : 'Bật tần số thư giãn 174Hz'}
            className="w-8 h-8 rounded-full bg-calm-forest-dusk/60 hover:bg-white/15 border border-calm-lichen/20 flex items-center justify-center text-calm-lichen transition cursor-pointer"
          >
            {ambientSound ? (
              <Volume2 className="w-3.5 h-3.5 text-calm-pollen animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-calm-fog/70" />
            )}
          </button>

          {/* Incident Report */}
          <button
            onClick={onOpenIncident}
            title="Báo cáo lỗi / Góp ý (Beta)"
            className="w-8 h-8 rounded-full bg-calm-forest-dusk/60 hover:bg-rose-950/40 border border-rose-400/30 flex items-center justify-center text-rose-300 transition cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>

          {/* Beta Dashboard */}
          <button
            onClick={onOpenDashboard}
            title="Dashboard Giám Sát Beta"
            className="w-8 h-8 rounded-full bg-calm-forest-dusk/60 hover:bg-indigo-950/40 border border-indigo-400/30 flex items-center justify-center text-indigo-300 transition cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
        </div>

      </nav>
    </header>
  );
}
