import React, { useState, useRef } from 'react';
import { LivingBackdrop } from './components/calm/LivingBackdrop';
import { GlassPillNav } from './components/calm/GlassPillNav';
import { CalmButton } from './components/calm/CalmButton';
import { CalmCard } from './components/calm/CalmCard';
import { ThreeArchesScene } from './components/portals/ThreeArchesScene';
import { PortalContentSections } from './components/sections/PortalContentSections';
import { CosmicStoryRoad } from './components/portals/CosmicStoryRoad';
import { ExperimentModal } from './components/portals/ExperimentModal';
import { WisdomModal } from './components/portals/WisdomModal';
import { IncidentReportModal } from './components/beta/IncidentReportModal';
import { BetaDashboardModal } from './components/beta/BetaDashboardModal';
import { Sparkles, ArrowRight, Compass, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [activePortal, setActivePortal] = useState<'none' | 'story_chat' | 'experiment' | 'wisdom'>('none');
  const [ambientSound, setAmbientSound] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showBetaDashboard, setShowBetaDashboard] = useState(false);
  const contentSectionRef = useRef<HTMLDivElement | null>(null);
  const archesSectionRef = useRef<HTMLDivElement | null>(null);

  const scrollToContent = () => {
    if (contentSectionRef.current) {
      contentSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToArches = () => {
    if (archesSectionRef.current) {
      archesSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Toggle ambient audio synth (gentle natural frequency hum 174Hz / 432Hz)
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
        console.warn('AudioContext not allowed without user interaction', e);
      }
    }
  };

  // If user enters Portal 1: Display the full immersive Cosmic Golden Road experience
  if (activePortal === 'story_chat') {
    return (
      <CosmicStoryRoad
        onBackToArches={() => setActivePortal('none')}
        onGoToExperiments={() => setActivePortal('experiment')}
      />
    );
  }

  return (
    <LivingBackdrop>
      {/* Top Floating Glass Pill Navigation Bar */}
      <GlassPillNav
        onGoToHome={() => {
          setActivePortal('none');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoToPortal1={() => setActivePortal('story_chat')}
        onGoToPortal2={() => setActivePortal('experiment')}
        onGoToPortal3={() => setActivePortal('wisdom')}
        ambientSound={ambientSound}
        onToggleAudio={toggleAudio}
        onOpenIncident={() => setShowIncidentModal(true)}
        onOpenDashboard={() => setShowBetaDashboard(true)}
        activeTab={
          activePortal === 'experiment'
            ? 'portal2'
            : activePortal === 'wisdom'
            ? 'portal3'
            : 'home'
        }
      />

      {/* 1. SYLVA LIVING GREEN SANCTUARY HERO SECTION */}
      <section className="min-h-screen flex flex-col md:flex-row items-center justify-center max-w-[1400px] mx-auto px-6 pt-28 pb-16 md:py-32 gap-12 md:gap-20 relative z-20">
        
        {/* Left Column: Hero Typography & Primary Calls to Action */}
        <div className="flex-1 space-y-6 max-w-2xl text-calm-paper-white z-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-calm-deep-moss/80 border border-calm-lichen/30 text-calm-lichen text-xs font-semibold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-calm-lichen animate-pulse" />
            <span>MỘT KHÔNG GIAN ĐỂ TRỞ VỀ VỚI CHÍNH MÌNH</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-[5rem] font-light leading-[1.08] tracking-tight">
            Bước vào khoảng sống của{' '}
            <span className="font-normal italic text-calm-warm-ivory">riêng bạn.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-calm-fog/90 leading-relaxed font-light max-w-xl">
            Life Lab giúp bạn lắng nghe điều mình thật sự muốn, nhìn rõ các lựa chọn và thử nghiệm một cuộc sống phù hợp hơn — theo nhịp của chính bạn.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
            <CalmButton
              variant="primary"
              onClick={() => setActivePortal('story_chat')}
              className="w-full sm:w-auto text-base px-8 py-4 shadow-lg hover:scale-105 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-calm-pollen" />
              <span>Bắt đầu đối thoại với AI</span>
              <ArrowRight className="w-4 h-4" />
            </CalmButton>

            <CalmButton
              variant="ghost"
              onClick={scrollToArches}
              className="w-full sm:w-auto text-calm-paper-white hover:bg-white/10"
            >
              <span>Khám phá Ba Cổng Vòm</span>
            </CalmButton>
          </div>

          <div className="flex items-center gap-6 pt-2 text-xs text-calm-fog/70 font-mono">
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

        {/* Right Column: Floating Ethos Cards (Living Sanctuary Aesthetic) */}
        <div className="flex-1 w-full max-w-md space-y-5 relative z-20">
          <CalmCard variant="ivory" className="relative text-calm-ink shadow-xl">
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

          <CalmCard variant="glass" className="relative border-calm-lichen/30 text-calm-paper-white backdrop-blur-xl bg-calm-deep-moss/70 md:ml-8 shadow-xl">
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
            <span>3 cổng vòm</span>
            <span>•</span>
            <span>1 hành trình của riêng bạn</span>
          </div>
        </div>

      </section>

      {/* 2. THE THREE ARCHES LIVING SCENE */}
      <div ref={archesSectionRef} className="relative z-20 w-full border-t border-calm-lichen/15">
        <ThreeArchesScene
          onSelectPortal={portal => setActivePortal(portal)}
          onScrollToContent={scrollToContent}
        />
      </div>

      {/* 3. DETAILED CONTENT SECTIONS OF ALL 3 PORTALS */}
      <div ref={contentSectionRef} className="relative z-20 w-full border-t border-calm-lichen/15">
        <PortalContentSections
          onOpenPortalModal={portal => setActivePortal(portal)}
        />
      </div>

      {/* Portal 2: 7-Day Life Experiments & Energy Gauge Modal */}
      <ExperimentModal
        isOpen={activePortal === 'experiment'}
        onClose={() => setActivePortal('none')}
        onGoToWisdom={() => setActivePortal('wisdom')}
      />

      {/* Portal 3: Wisdom Sanctuary & Kintsugi Repair Modal */}
      <WisdomModal
        isOpen={activePortal === 'wisdom'}
        onClose={() => setActivePortal('none')}
        onBackToArches={() => setActivePortal('none')}
      />

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
