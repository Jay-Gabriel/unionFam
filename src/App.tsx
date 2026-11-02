import React, { useState } from 'react';
import { LivingBackdrop } from './components/calm/LivingBackdrop';
import { GlassPillNav } from './components/calm/GlassPillNav';
import { CalmButton } from './components/calm/CalmButton';
import { CalmCard } from './components/calm/CalmCard';
import { SanctuaryChatView } from './components/calm/SanctuaryChatView';
import { HowItWorksSection } from './components/calm/HowItWorksSection';
import { LifeMapSection } from './components/calm/LifeMapSection';
import { ExperimentsSection } from './components/calm/ExperimentsSection';
import { IncidentReportModal } from './components/beta/IncidentReportModal';
import { BetaDashboardModal } from './components/beta/BetaDashboardModal';
import { Sparkles, ArrowRight, Compass, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'chat' | 'lifemap' | 'experiments'>('home');
  const [ambientSound, setAmbientSound] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showBetaDashboard, setShowBetaDashboard] = useState(false);

  // Toggle ambient audio frequency hum (174Hz / 432Hz)
  const toggleAudio = () => {
    setAmbientSound(!ambientSound);
    if (!ambientSound && typeof window !== 'undefined') {
      try {
        const AudioContext =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(174, ctx.currentTime);
          gain.gain.setValueAtTime(0.015, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          setTimeout(() => {
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3);
            setTimeout(() => osc.stop(), 3100);
          }, 3000);
        }
      } catch (e) {
        console.warn('AudioContext not allowed without user gesture', e);
      }
    }
  };

  // If user opens the AI conversation chat view: Display the dedicated Sanctuary Chat View
  if (currentView === 'chat') {
    return (
      <SanctuaryChatView
        onBackToHome={() => setCurrentView('home')}
        onGoToExperiments={() => setCurrentView('experiments')}
      />
    );
  }

  return (
    <LivingBackdrop>
      {/* Top Floating Glass Pill Navigation Bar */}
      <GlassPillNav
        onGoToHome={() => {
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoToChat={() => setCurrentView('chat')}
        onGoToLifeMap={() => setCurrentView('lifemap')}
        onGoToExperiments={() => setCurrentView('experiments')}
        ambientSound={ambientSound}
        onToggleAudio={toggleAudio}
        onOpenIncident={() => setShowIncidentModal(true)}
        onOpenDashboard={() => setShowBetaDashboard(true)}
        activeTab={currentView}
      />

      {currentView === 'home' && (
        <>
          {/* 1. SYLVA LIVING GREEN SANCTUARY HERO SECTION */}
          <section className="min-h-screen flex flex-col md:flex-row items-center justify-center max-w-[1400px] mx-auto px-6 pt-28 pb-16 md:py-32 gap-12 md:gap-20 relative z-10">
            
            {/* Left Column: Hero Typography & Primary Actions */}
            <div className="flex-1 space-y-6 max-w-2xl text-calm-paper-white z-20">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-calm-deep-moss border border-calm-lichen/30 text-calm-lichen text-xs font-semibold tracking-widest uppercase shadow-soft">
                <span className="w-2 h-2 rounded-full bg-calm-lichen animate-pulse" />
                <span>MỘT KHÔNG GIAN ĐỂ TRỞ VỀ VỚI CHÍNH MÌNH</span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-[5.2rem] font-light leading-[1.06] tracking-tight">
                Bước vào khoảng sống của{' '}
                <span className="font-normal italic text-calm-warm-ivory">riêng bạn.</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-calm-fog/90 leading-relaxed font-light max-w-xl">
                Life Lab giúp bạn lắng nghe điều mình thật sự muốn, nhìn rõ các lựa chọn và thử nghiệm một cuộc sống phù hợp hơn — theo nhịp của chính bạn.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                <CalmButton
                  variant="primary"
                  onClick={() => setCurrentView('chat')}
                  className="w-full sm:w-auto text-base px-8 py-4 shadow-lg hover:scale-105 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-calm-pollen" />
                  <span>Bắt đầu khám phá</span>
                  <ArrowRight className="w-4 h-4" />
                </CalmButton>

                <CalmButton
                  variant="ghost"
                  onClick={() => {
                    const el = document.getElementById('how-it-works');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto text-calm-paper-white hover:bg-white/10 cursor-pointer"
                >
                  <span>Life Lab hoạt động thế nào?</span>
                </CalmButton>
              </div>

              <div className="flex items-center gap-6 pt-3 text-xs text-calm-fog/70 font-mono">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-calm-lichen" />
                  Bảo mật riêng tư 100%
                </span>
                <span>•</span>
                <span>Không phán xét</span>
                <span>•</span>
                <span>Tự do quyết định</span>
              </div>
            </div>

            {/* Right Column: Floating Ethos Cards */}
            <div className="flex-1 w-full max-w-md space-y-5 relative z-20">
              <CalmCard variant="ivory" className="relative text-calm-ink shadow-2xl">
                <div className="flex items-center gap-2 mb-2 text-calm-deep-moss text-xs font-mono font-bold tracking-wider uppercase">
                  <Compass className="w-4 h-4 text-calm-moss" />
                  <span>TRIẾT LÝ LIFE LAB</span>
                </div>
                <h3 className="text-xl font-medium mb-2.5 text-calm-forest-dusk">
                  AI gợi mở. Bạn quyết định.
                </h3>
                <p className="text-calm-muted-ink text-sm leading-relaxed">
                  Mọi phân tích do AI đề xuất đều cần bạn tự tay xác nhận trước khi trở thành dữ liệu Life Map hay Thẻ Quyết Định của riêng bạn.
                </p>
              </CalmCard>

              <CalmCard variant="glass" className="relative border-calm-lichen/30 text-calm-paper-white backdrop-blur-xl bg-calm-deep-moss/70 md:ml-8 shadow-2xl">
                <span className="text-xs font-mono uppercase tracking-widest text-calm-pollen block mb-1.5 font-semibold">
                  KHOẢNG LẶNG HÔM NAY
                </span>
                <p className="font-serif text-base sm:text-lg leading-relaxed italic text-calm-warm-ivory">
                  &quot;Điều gì đang lấy đi nhiều năng lượng nhất của bạn lúc này mà bạn chưa từng gọi tên?&quot;
                </p>
              </CalmCard>

              <div className="pt-2 flex justify-end gap-4 text-calm-fog/80 text-xs font-medium font-mono">
                <span>6 chiều sống</span>
                <span>•</span>
                <span>1 hành trình của riêng bạn</span>
              </div>
            </div>

          </section>

          {/* 2. HOW IT WORKS SECTION */}
          <HowItWorksSection onStartChat={() => setCurrentView('chat')} />

          {/* 3. 6 DIMENSIONS OF LIFE MAP */}
          <LifeMapSection onStartChatWithTopic={() => setCurrentView('chat')} />

          {/* 4. 7-DAY EXPERIMENTS SECTION */}
          <ExperimentsSection onStartChat={() => setCurrentView('chat')} />
        </>
      )}

      {currentView === 'lifemap' && (
        <div className="pt-20">
          <LifeMapSection onStartChatWithTopic={() => setCurrentView('chat')} />
        </div>
      )}

      {currentView === 'experiments' && (
        <div className="pt-20">
          <ExperimentsSection onStartChat={() => setCurrentView('chat')} />
        </div>
      )}

      {/* Limited Beta Incident Report Modal */}
      <IncidentReportModal
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
      />

      {/* Limited Beta Telemetry Dashboard Modal */}
      <BetaDashboardModal
        isOpen={showBetaDashboard}
        onClose={() => setShowBetaDashboard(false)}
      />

    </LivingBackdrop>
  );
};

export default App;
