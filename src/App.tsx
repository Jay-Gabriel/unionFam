import React, { useState, useEffect } from 'react';
import { parseRoute, navigateTo, RouteState } from './router/SimpleRouter';
import { LandingScreen } from './components/screens/LandingScreen';
import { StartScreen } from './components/screens/StartScreen';
import { DecisionChatScreen } from './components/screens/DecisionChatScreen';
import { ExperimentDesignScreen } from './components/screens/ExperimentDesignScreen';
import { TodayScreen } from './components/screens/TodayScreen';
import { CheckinScreen } from './components/screens/CheckinScreen';
import { ReviewScreen } from './components/screens/ReviewScreen';
import { PrivacySettingsScreen } from './components/screens/PrivacySettingsScreen';
import { MindfulRadioModal } from './components/radio/MindfulRadioModal';
import { AuthModal } from './components/auth/AuthModal';
import { IncidentReportModal } from './components/beta/IncidentReportModal';
import { BetaDashboardModal } from './components/beta/BetaDashboardModal';
import { LeafIntroOverlay } from './components/intro/LeafIntroOverlay';
import { onAuthStateChange } from './services/supabaseService';
import {
  Music,
  Home,
  CalendarCheck,
  Compass,
  ShieldCheck,
  User,
} from 'lucide-react';

interface ActiveExperimentSummary {
  action: string;
  learningQuestion: string;
  reviewDate: string;
}

export const App: React.FC = () => {
  const [route, setRoute] = useState<RouteState>(() =>
    parseRoute(typeof window !== 'undefined' ? window.location.pathname : '/'),
  );
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined' || import.meta.env.MODE === 'test') return false;
    return (
      window.location.pathname === '/' &&
      window.sessionStorage.getItem('unionfam_intro_seen') !== '1'
    );
  });
  const [draftProblem, setDraftProblem] = useState<string>('');
  const [activeExperiment, setActiveExperiment] = useState<ActiveExperimentSummary | null>(null);

  const [showRadioModal, setShowRadioModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showBetaDashboard, setShowBetaDashboard] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChange(() => {});
    return () => unsub();
  }, []);

  const handleCloseIntro = () => {
    setShowIntro(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('unionfam_intro_seen', '1');
    }
  };

  const renderCurrentScreen = () => {
    switch (route.name) {
      case 'start':
        return (
          <StartScreen
            onSubmit={(data) => {
              setDraftProblem(data?.problemText || '');
              navigateTo('/decisions/current');
            }}
          />
        );
      case 'decision_detail':
        return (
          <DecisionChatScreen
            initialProblemText={draftProblem}
            onDesignExperiment={() => {
              navigateTo(`/decisions/${route.decisionId}/experiment`);
            }}
          />
        );
      case 'experiment_setup':
        return (
          <ExperimentDesignScreen
            onStartExperiment={(data) => {
              const days = Number(data?.durationDays || 3);
              const reviewAt = new Date(Date.now() + days * 86400000).toLocaleDateString('vi-VN');
              setActiveExperiment({
                action: data?.action || 'Trao đổi một lần về giới hạn nhận việc sau 18h',
                learningQuestion:
                  data?.learningQuestion || 'Quản lý có chấp nhận điều chỉnh việc ngoài giờ không?',
                reviewDate: reviewAt,
              });
              navigateTo('/today');
            }}
          />
        );
      case 'today':
        return (
          <TodayScreen
            activeExperiment={activeExperiment}
            onGoCheckin={() => {
              navigateTo('/decisions/current/checkin');
            }}
            onGoReview={() => {
              navigateTo('/decisions/current/review');
            }}
          />
        );
      case 'checkin':
        return (
          <CheckinScreen
            onSubmitCheckin={() => {
              navigateTo(`/decisions/${route.decisionId}/review`);
            }}
          />
        );
      case 'review':
        return (
          <ReviewScreen
            onFinishReview={() => {
              navigateTo('/today');
            }}
          />
        );
      case 'privacy':
        return (
          <PrivacySettingsScreen
            onSavePreferences={() => {}}
            onDeleteAllData={() => {
              setDraftProblem('');
              setActiveExperiment(null);
              navigateTo('/');
            }}
          />
        );
      case 'landing':
      default:
        return (
          <LandingScreen
            onStart={() => {
              navigateTo('/start');
            }}
            onReplayIntro={() => setShowIntro(true)}
          />
        );
    }
  };

  return (
    <div
      className={
        route.name === 'decision_detail'
          ? 'h-[100dvh] overflow-hidden bg-[#F7F5EF] text-[#182D26] flex flex-col font-sans'
          : 'min-h-[100dvh] bg-[#F7F5EF] text-[#182D26] flex flex-col font-sans'
      }
    >
      {/* Top Calm Navigation Header */}
      <nav className="w-full shrink-0 border-b border-[#BBC7BC] bg-[#F7F5EF]/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5 flex justify-between items-center max-w-6xl mx-auto gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => navigateTo('/')}
          className="flex items-center gap-2 text-left font-bold text-base sm:text-lg text-[#254B3D] tracking-tight shrink-0 cursor-pointer"
        >
          <img
            src="/assets/3d/leaf-herb-3d.png"
            alt="UnionFam Chiếc Lá"
            className="w-7 h-7 object-contain"
          />
          <span>UnionFam</span>
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium whitespace-nowrap">
          <button
            type="button"
            onClick={() => navigateTo('/today')}
            className={`hover:text-[#254B3D] transition shrink-0 cursor-pointer ${
              route.name === 'today' ? 'text-[#254B3D] font-bold' : 'text-[#182D26]/70'
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/decisions/current')}
            className={`hover:text-[#254B3D] transition shrink-0 cursor-pointer ${
              route.name === 'decision_detail' ? 'text-[#254B3D] font-bold' : 'text-[#182D26]/70'
            }`}
          >
            Quyết định
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/settings/privacy')}
            className={`hover:text-[#254B3D] transition shrink-0 cursor-pointer ${
              route.name === 'privacy' ? 'text-[#254B3D] font-bold' : 'text-[#182D26]/70'
            }`}
          >
            Quyền riêng tư
          </button>
          <button
            type="button"
            onClick={() => setShowRadioModal(true)}
            className="px-3 py-1.5 rounded-full border border-[#BBC7BC] bg-white/80 hover:bg-[#E8EDE5] text-[#254B3D] transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Mở Đài Radio Tâm Trí"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Âm thanh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="px-3 py-1.5 rounded-full border border-[#BBC7BC] hover:bg-[#E8EDE5] text-[#254B3D] transition shrink-0 cursor-pointer"
          >
            Tài khoản
          </button>
        </div>

        {/* Compact Mobile Top Controls */}
        <div className="flex md:hidden items-center gap-2 text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setShowRadioModal(true)}
            className="min-h-[36px] px-2.5 py-1.5 rounded-full border border-[#BBC7BC] bg-white/85 text-[#254B3D] flex items-center gap-1 cursor-pointer"
            aria-label="Mở Đài Radio Tâm Trí"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Âm thanh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="min-h-[36px] px-2.5 py-1.5 rounded-full border border-[#BBC7BC] bg-white/85 text-[#254B3D] flex items-center gap-1 cursor-pointer"
            aria-label="Tài khoản"
          >
            <User className="w-3.5 h-3.5" />
            <span>Tài khoản</span>
          </button>
        </div>
      </nav>

      {/* Main Routed Content */}
      <main
        className={
          route.name === 'decision_detail'
            ? 'flex-1 min-h-0 flex flex-col overflow-hidden'
            : 'flex-1 flex flex-col pb-20 md:pb-0'
        }
      >
        {renderCurrentScreen()}
      </main>

      {/* Pristine Calm Footer (omitted on Studio S03 to keep full viewport clean) */}
      {route.name !== 'decision_detail' && (
        <footer className="py-5 pb-24 md:pb-6 border-t border-[#BBC7BC]/40 text-center text-xs text-[#182D26]/60">
          <div className="flex flex-wrap items-center justify-center gap-3 px-4">
            <span>UnionFam · Đồng hành cùng Chiếc Lá</span>
            <span>•</span>
            <span>Bảo mật dữ liệu cá nhân</span>
            <span>•</span>
            <span>Không áp lực</span>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Navigation Bar (hidden on S03 chat studio so chat composer sits cleanly at bottom) */}
      {route.name !== 'decision_detail' && (
        <nav
          aria-label="Điều hướng di động"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F2]/95 backdrop-blur-md border-t border-[#BBC7BC] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] grid grid-cols-4 gap-1"
        >
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-medium cursor-pointer transition ${
              route.name === 'landing' ? 'bg-[#E8EDE5] text-[#254B3D] font-bold' : 'text-[#182D26]/65'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Trang chủ</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/today')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-medium cursor-pointer transition ${
              route.name === 'today' ? 'bg-[#E8EDE5] text-[#254B3D] font-bold' : 'text-[#182D26]/65'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Hôm nay</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/decisions/current')}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-medium text-[#182D26]/65 cursor-pointer transition hover:bg-[#E8EDE5]/60"
          >
            <Compass className="w-4 h-4" />
            <span>Quyết định</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/settings/privacy')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-medium cursor-pointer transition ${
              route.name === 'privacy' ? 'bg-[#E8EDE5] text-[#254B3D] font-bold' : 'text-[#182D26]/65'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Riêng tư</span>
          </button>
        </nav>
      )}

      {/* Video Intro Overlay (Linh vật Chiếc Lá chăm sóc & thấu hiểu mọi người) */}
      <LeafIntroOverlay isOpen={showIntro} onClose={handleCloseIntro} />

      {/* Modals */}
      <MindfulRadioModal isOpen={showRadioModal} onClose={() => setShowRadioModal(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <IncidentReportModal isOpen={showIncidentModal} onClose={() => setShowIncidentModal(false)} />
      <BetaDashboardModal isOpen={showBetaDashboard} onClose={() => setShowBetaDashboard(false)} />
    </div>
  );
};

export default App;
