import React from 'react';
import {
  Leaf,
  Volume2,
  VolumeX,
  AlertTriangle,
  Activity,
  Compass,
  FlaskConical,
  Home,
  BookmarkCheck,
  Radio
} from 'lucide-react';
import { UserProfileButton } from '../auth/UserProfileButton';

interface GlassPillNavProps {
  onGoToHome: () => void;
  onGoToChat: () => void;
  onGoToLifeMap: () => void;
  onGoToExperiments: () => void;
  onGoToMemories: () => void;
  onOpenRadio: () => void;
  onOpenAuthModal: () => void;
  onOpenIncident: () => void;
  onOpenDashboard: () => void;
  activeTab: 'home' | 'chat' | 'lifemap' | 'experiments' | 'memories';
  isRadioPlaying?: boolean;
}

export function GlassPillNav({
  onGoToHome,
  onGoToChat,
  onGoToLifeMap,
  onGoToExperiments,
  onGoToMemories,
  onOpenRadio,
  onOpenAuthModal,
  onOpenIncident,
  onOpenDashboard,
  activeTab,
  isRadioPlaying = false,
}: GlassPillNavProps) {
  return (
    <header className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 max-w-[98vw] select-none">
      <nav className="glass-panel rounded-full px-3 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2.5 shadow-soft border border-calm-lichen/20 bg-calm-forest-dusk/90 backdrop-blur-xl flex-nowrap whitespace-nowrap">
        
        {/* Brand / Logo with Leaf Icon */}
        <button
          onClick={onGoToHome}
          className="flex items-center gap-2 pl-1 pr-2 sm:pr-2.5 py-1 rounded-full hover:bg-white/10 transition cursor-pointer shrink-0 whitespace-nowrap"
          title="Trang chủ UnionFam · Life Lab"
        >
          <div className="w-7 h-7 rounded-full bg-calm-deep-moss border border-calm-lichen/40 flex items-center justify-center text-calm-lichen shrink-0">
            <Leaf className="w-4 h-4 fill-calm-lichen/20 text-calm-lichen" />
          </div>
          <span className="font-serif text-xs sm:text-sm font-semibold tracking-wider text-calm-paper-white hidden md:inline whitespace-nowrap">
            UNIONFAM
          </span>
        </button>

        {/* Central Nav Links */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-medium shrink-0 flex-nowrap">
          <button
            onClick={onGoToHome}
            className={`px-3 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'home'
                ? 'bg-calm-lichen/20 text-calm-lichen font-semibold border border-calm-lichen/30'
                : 'text-calm-fog hover:text-white hover:bg-white/10'
            }`}
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Trang chủ</span>
          </button>

          <button
            onClick={onGoToChat}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-calm-moss border border-calm-lichen text-white font-semibold shadow-soft'
                : 'text-calm-fog hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-calm-pollen animate-pulse shrink-0" />
            <span className="whitespace-nowrap">Trò chuyện AI</span>
          </button>

          <button
            onClick={onGoToLifeMap}
            className={`px-3 py-1.5 rounded-full transition cursor-pointer hidden sm:inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'lifemap'
                ? 'bg-calm-lichen/20 text-calm-lichen font-semibold border border-calm-lichen/30'
                : 'text-calm-fog hover:text-white hover:bg-white/10'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Bản đồ sống</span>
          </button>

          <button
            onClick={onGoToExperiments}
            className={`px-3 py-1.5 rounded-full transition cursor-pointer hidden md:inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'experiments'
                ? 'bg-calm-lichen/20 text-calm-lichen font-semibold border border-calm-lichen/30'
                : 'text-calm-fog hover:text-white hover:bg-white/10'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Thử nghiệm 7 ngày</span>
          </button>

          <button
            onClick={onGoToMemories}
            className={`px-3 py-1.5 rounded-full transition cursor-pointer hidden lg:inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'memories'
                ? 'bg-calm-lichen/20 text-calm-lichen font-semibold border border-calm-lichen/30'
                : 'text-calm-fog hover:text-white hover:bg-white/10'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Đúc kết</span>
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="w-[1px] h-4 bg-white/20 mx-0.5 shrink-0" />

        {/* Action Widgets */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
          {/* Mindful Radio Button */}
          <button
            onClick={onOpenRadio}
            title="Mở Đài Radio Tâm Trí (Mindful Radio)"
            className={`px-2.5 py-1.5 rounded-full border text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-soft shrink-0 whitespace-nowrap ${
              isRadioPlaying
                ? 'bg-calm-pollen/20 border-calm-pollen/50 text-calm-pollen animate-pulse'
                : 'bg-white/5 border-calm-lichen/20 text-calm-fog hover:text-white hover:bg-white/10'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-calm-pollen shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Radio</span>
          </button>

          {/* Google OAuth & User Profile Button */}
          <UserProfileButton onOpenAuthModal={onOpenAuthModal} />

          {/* Incident Report (Beta) */}
          <button
            onClick={onOpenIncident}
            title="Báo cáo lỗi / Góp ý (Beta)"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-calm-forest-dusk/60 hover:bg-rose-950/40 border border-rose-400/30 flex items-center justify-center text-rose-300 transition cursor-pointer shrink-0"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>

          {/* Beta Dashboard */}
          <button
            onClick={onOpenDashboard}
            title="Dashboard Giám Sát Beta"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-calm-forest-dusk/60 hover:bg-indigo-950/40 border border-indigo-400/30 flex items-center justify-center text-indigo-300 transition cursor-pointer shrink-0"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
        </div>

      </nav>
    </header>
  );
}
