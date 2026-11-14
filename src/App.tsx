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
import { onAuthStateChange } from './services/supabaseService';
import { Compass, ShieldCheck, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [route, setRoute] = useState<RouteState>(() =>
    parseRoute(typeof window !== 'undefined' ? window.location.pathname : '/')
  );
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

  const renderCurrentScreen = () => {
    switch (route.name) {
      case 'start':
        return (
          <StartScreen
            onSubmit={(data) => {
              navigateTo('/decisions/current');
            }}
          />
        );
      case 'decision_detail':
        return (
          <DecisionChatScreen
            onDesignExperiment={() => {
              navigateTo(`/decisions/${route.decisionId}/experiment`);
            }}
          />
        );
      case 'experiment_setup':
        return (
          <ExperimentDesignScreen
            onStartExperiment={() => {
              navigateTo('/today');
            }}
          />
        );
      case 'today':
        return (
          <TodayScreen
            onGoCheckin={() => {
              navigateTo('/decisions/current/experiment');
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
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#182D26] flex flex-col font-sans">
      {/* Top Calm Navigation Header */}
      <nav className="w-full border-b border-[#BBC7BC] bg-[#F7F5EF]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex justify-between items-center max-w-6xl mx-auto">
        <button
          onClick={() => navigateTo('/')}
          className="flex items-center gap-2 text-left font-bold text-lg text-[#254B3D] tracking-tight"
        >
          <Compass className="w-5 h-5 text-[#254B3D]" />
          <span>UnionFam</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => navigateTo('/today')}
            className={`hover:text-[#254B3D] transition ${route.name === 'today' ? 'text-[#254B3D] font-bold' : 'text-[#182D26]/70'}`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => navigateTo('/decisions/current')}
            className={`hover:text-[#254B3D] transition ${route.name === 'decision_detail' ? 'text-[#254B3D] font-bold' : 'text-[#182D26]/70'}`}
          >
            Quyết định
          </button>
          <button
            onClick={() => navigateTo('/settings/privacy')}
            className={`hover:text-[#254B3D] transition ${route.name === 'privacy' ? 'text-[#254B3D] font-bold' : 'text-[#182D26]/70'}`}
          >
            Quyền riêng tư
          </button>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-3.5 py-1.5 rounded-full border border-[#BBC7BC] hover:bg-[#E8EDE5] text-[#254B3D] transition"
          >
            Tài khoản
          </button>
        </div>
      </nav>

      {/* Main Routed Content */}
      <main className="flex-1 flex flex-col">
        {renderCurrentScreen()}
      </main>

      {/* Pristine Calm Footer */}
      <footer className="py-6 border-t border-[#BBC7BC]/40 text-center text-xs text-[#182D26]/60">
        <div className="flex items-center justify-center gap-3">
          <span>UnionFam · MVP Hành Trình Quyết Định</span>
          <span>•</span>
          <span>Bảo mật dữ liệu cá nhân</span>
          <span>•</span>
          <span>Không áp lực</span>
        </div>
      </footer>

      {/* Modals */}
      <MindfulRadioModal isOpen={showRadioModal} onClose={() => setShowRadioModal(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <IncidentReportModal isOpen={showIncidentModal} onClose={() => setShowIncidentModal(false)} />
      <BetaDashboardModal isOpen={showBetaDashboard} onClose={() => setShowBetaDashboard(false)} />
    </div>
  );
};

export default App;
