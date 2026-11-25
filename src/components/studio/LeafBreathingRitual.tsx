import React, { useEffect, useState } from 'react';
import { Wind, X } from 'lucide-react';
import { LeafMascot3D } from '../ui/LeafMascot3D';

interface LeafBreathingRitualProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale';

const PHASE_COPY: Record<BreathPhase, { title: string; guide: string; scale: string }> = {
  inhale: {
    title: 'Hít vào thật êm...',
    guide: 'Để lồng ngực mở rộng và đón nhận không khí mát lành (4 giây)',
    scale: 'scale-110',
  },
  hold: {
    title: 'Giữ nhẹ nhàng...',
    guide: 'Cảm nhận sự tĩnh lặng đang lắng xuống giữa các suy nghĩ (4 giây)',
    scale: 'scale-110',
  },
  exhale: {
    title: 'Thở ra chậm rãi...',
    guide: 'Thả lỏng vai và gửi bớt áp lực ra ngoài cùng Chiếc Lá (4 giây)',
    scale: 'scale-95',
  },
};

/**
 * Nghi thức Thở cùng Chiếc Lá 15 giây — điểm neo cảm xúc tĩnh tâm khác biệt hoàn toàn với ChatGPT.
 */
export const LeafBreathingRitual: React.FC<LeafBreathingRitualProps> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);

  useEffect(() => {
    if (!isOpen) return;
    setPhase('inhale');
    setSecondsLeft(4);

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        setPhase((currentPhase) => {
          if (currentPhase === 'inhale') return 'hold';
          if (currentPhase === 'hold') return 'exhale';
          return 'inhale';
        });
        return 4;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const current = PHASE_COPY[phase];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thở cùng Chiếc Lá"
      className="fixed inset-0 z-50 bg-[#182D26]/65 backdrop-blur-md flex items-center justify-center p-4 fade-slide-up"
    >
      <div className="relative w-full max-w-md bg-[#F7F5EF] border border-[#BBC7BC] rounded-3xl p-6 md:p-8 text-center shadow-2xl space-y-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng nhịp thở"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#E8EDE5] hover:bg-[#d7e2d3] flex items-center justify-center text-[#254B3D] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8EDE5] text-[#254B3D] text-xs font-semibold">
          <Wind className="w-3.5 h-3.5" />
          <span>Nhịp thở Chiếc Lá (4 - 4 - 4)</span>
        </div>

        <div className="py-2 flex flex-col items-center justify-center">
          <div className={`transition-transform duration-[3800ms] ease-in-out ${current.scale}`}>
            <LeafMascot3D mood="caring" size="lg" auraIntensity={phase === 'inhale' ? 10 : 7} />
          </div>
          <div className="mt-3 text-3xl font-playfair font-bold text-[#254B3D] tabular-nums">
            {secondsLeft}s
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-[#254B3D]">{current.title}</h3>
          <p className="text-xs text-[#182D26]/75 leading-relaxed">{current.guide}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[44px] py-3 rounded-full bg-[#254B3D] hover:bg-[#182D26] text-[#F7F5EF] text-sm font-medium transition cursor-pointer shadow-sm"
        >
          Mình đã dịu lại, tiếp tục nhé
        </button>
      </div>
    </div>
  );
};
