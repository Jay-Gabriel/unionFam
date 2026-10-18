import React, { useState, useRef } from 'react';
import { SacredWaterCanvas } from './components/canvas/SacredWaterCanvas';
import { ThreeArchesScene } from './components/portals/ThreeArchesScene';
import { PortalContentSections } from './components/sections/PortalContentSections';
import { CosmicStoryRoad } from './components/portals/CosmicStoryRoad';
import { ExperimentModal } from './components/portals/ExperimentModal';
import { WisdomModal } from './components/portals/WisdomModal';
import { Volume2, VolumeX } from 'lucide-react';
import { AuthButton } from './components/auth/AuthButton';

export const App: React.FC = () => {
  const [activePortal, setActivePortal] = useState<'none' | 'story_chat' | 'experiment' | 'wisdom'>('none');
  const [ambientSound, setAmbientSound] = useState(false);
  const contentSectionRef = useRef<HTMLDivElement | null>(null);

  const scrollToContent = () => {
    if (contentSectionRef.current) {
      contentSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Toggle ambient audio synth (gentle frequency hum)
  const toggleAudio = () => {
    setAmbientSound(!ambientSound);
    if (!ambientSound && typeof window !== 'undefined') {
      try {
        const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
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
        console.warn('AudioContext not allowed without user gesture interaction', e);
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
    <div className="relative w-full min-h-screen bg-[#080612] text-stone-100 font-sans selection:bg-amber-400 selection:text-stone-950">
      
      {/* Dynamic Water & Golden Star Dust Canvas in Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <SacredWaterCanvas />
      </div>

      {/* Top Floating Controls: Ambient Sound & Google Auth */}
      <div className="fixed top-6 right-6 z-40 flex items-center gap-3">
        <AuthButton />
        <button
          onClick={toggleAudio}
          title={ambientSound ? 'Tắt âm thanh tĩnh tại' : 'Bật tần số thư giãn 174Hz'}
          className="w-10 h-10 rounded-full bg-stone-900/50 hover:bg-stone-800/80 border border-amber-300/40 backdrop-blur-md flex items-center justify-center text-amber-200 transition shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:scale-105"
        >
          {ambientSound ? <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" /> : <VolumeX className="w-4 h-4 text-amber-200/60" />}
        </button>
      </div>

      {/* Hero Section: The 3 Arches Scene */}
      <div className="relative z-10 w-full min-h-screen">
        <ThreeArchesScene
          onSelectPortal={portal => setActivePortal(portal)}
          onScrollToContent={scrollToContent}
        />
      </div>

      {/* Detailed Content Sections of All 3 Portals */}
      <div ref={contentSectionRef} className="relative z-20 w-full">
        <PortalContentSections
          onOpenPortalModal={portal => setActivePortal(portal)}
        />
      </div>

      {/* Portal 2: 7-Day Life Experiments & Energy Gauge */}
      <ExperimentModal
        isOpen={activePortal === 'experiment'}
        onClose={() => setActivePortal('none')}
        onGoToWisdom={() => setActivePortal('wisdom')}
      />

      {/* Portal 3: Wisdom Sanctuary & Kintsugi Repair */}
      <WisdomModal
        isOpen={activePortal === 'wisdom'}
        onClose={() => setActivePortal('none')}
        onBackToArches={() => setActivePortal('none')}
      />

    </div>
  );
};

export default App;
