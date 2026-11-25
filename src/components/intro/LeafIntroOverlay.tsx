import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { LeafMascot3D, LeafMascotMood } from '../ui/LeafMascot3D';

interface LeafIntroOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StoryBeat {
  mood: LeafMascotMood;
  accentIcon: string;
  caption: string;
  sub: string;
  durationMs: number;
}

const STORY_BEATS: StoryBeat[] = [
  {
    mood: 'welcoming',
    accentIcon: '/assets/3d/leaf-fluttering-3d.png',
    caption: 'Giữa những ngày nhiều phân vân...',
    sub: 'Khi mọi lựa chọn đều khiến bạn chùng chân lại.',
    durationMs: 2600,
  },
  {
    mood: 'caring',
    accentIcon: '/assets/3d/sparkles-3d.png',
    caption: 'Chiếc Lá ở đây để dịu dàng chăm sóc bạn.',
    sub: 'Giữ một nhịp thở bình yên, không thúc ép, không áp lực.',
    durationMs: 2900,
  },
  {
    mood: 'listening',
    accentIcon: '/assets/3d/icon-3d-clarify.png',
    caption: 'Lắng nghe không phán xét. Thấu hiểu điều quan trọng.',
    sub: 'Tách bạch tiếng lòng bạn khỏi những ồn ào bên ngoài.',
    durationMs: 2400,
  },
  {
    mood: 'celebrating',
    accentIcon: '/assets/3d/icon-3d-experiment.png',
    caption: 'UnionFam · Cùng Chiếc Lá làm rõ lựa chọn của riêng bạn.',
    sub: 'Từng bước nhỏ sáng rõ theo nhịp độ tự nhiên nhất.',
    durationMs: 2100,
  },
];

/**
 * Màn Intro tràn viền đồng màu #F7F5EF, phát video 60fps và tự tan mượt (cross-dissolve) thẳng vào không gian web.
 */
export const LeafIntroOverlay: React.FC<LeafIntroOverlayProps> = ({ isOpen, onClose }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [useFallbackStory, setUseFallbackStory] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsExiting(false);
    setBeatIndex(0);
    setProgress(0);
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, [isOpen]);

  const triggerSmoothExit = () => {
    if (import.meta.env.MODE === 'test') {
      onClose();
      return;
    }
    if (isExiting) return;
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      onClose();
    }, 480);
  };

  useEffect(() => {
    if (!isOpen || !useFallbackStory || isExiting) return;

    const currentBeat = STORY_BEATS[beatIndex];
    if (!currentBeat) {
      setProgress(100);
      triggerSmoothExit();
      return;
    }

    const startTime = Date.now();
    const totalDuration = STORY_BEATS.reduce((acc, b) => acc + b.durationMs, 0);
    const elapsedBefore = STORY_BEATS.slice(0, beatIndex).reduce((acc, b) => acc + b.durationMs, 0);

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, ((elapsedBefore + elapsed) / totalDuration) * 100);
      setProgress(pct);
    }, 60);

    const timer = window.setTimeout(() => {
      if (beatIndex < STORY_BEATS.length - 1) {
        setBeatIndex((prev) => prev + 1);
      } else {
        setProgress(100);
        triggerSmoothExit();
      }
    }, currentBeat.durationMs);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [isOpen, useFallbackStory, beatIndex, isExiting]);

  if (!isOpen) return null;

  const activeBeat = STORY_BEATS[beatIndex] || STORY_BEATS[STORY_BEATS.length - 1];

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration > 0) {
      setProgress(Math.min(100, (video.currentTime / video.duration) * 100));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video giới thiệu Chiếc Lá UnionFam"
      className={`fixed inset-0 z-[100] bg-[#F7F5EF] text-[#182D26] flex flex-col items-center justify-center transition-all duration-500 ease-out ${
        isExiting ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Minimal Floating Top-Right Controls (no heavy white popup frame) */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-20 flex items-center gap-2">
        {!useFallbackStory && (
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="min-h-[44px] px-3.5 py-2 rounded-full border border-[#BBC7BC]/80 bg-white/75 hover:bg-white backdrop-blur-md text-xs font-medium text-[#254B3D] flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Bật tiếng' : 'Tắt tiếng'}</span>
          </button>
        )}
        <button
          type="button"
          onClick={triggerSmoothExit}
          className="min-h-[44px] px-4 py-2 rounded-full border border-[#BBC7BC]/80 bg-[#E8EDE5]/85 hover:bg-[#d7e2d3] backdrop-blur-md text-xs font-semibold text-[#254B3D] flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <span>Bỏ qua</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Seamless Full-Bleed Cinema Stage */}
      <div className="w-full h-full flex items-center justify-center p-2 md:p-6">
        {!useFallbackStory ? (
          <video
            src="/assets/video/unionfam-leaf-intro.mp4"
            autoPlay
            muted={isMuted}
            playsInline
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={() => {
              setProgress(100);
              triggerSmoothExit();
            }}
            onError={() => setUseFallbackStory(true)}
            className="w-full max-w-6xl max-h-[86vh] aspect-video object-contain rounded-2xl"
          />
        ) : (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="relative flex items-center justify-center gap-4">
              <LeafMascot3D mood={activeBeat.mood} size="xl" />
              <img
                src={activeBeat.accentIcon}
                alt=""
                aria-hidden="true"
                className="hidden sm:block w-16 h-16 object-contain leaf-float drop-shadow-md"
              />
            </div>
            <div key={activeBeat.caption} className="max-w-xl mt-4 space-y-2 fade-slide-up">
              <h2 className="font-playfair text-2xl md:text-3xl font-semibold text-[#254B3D]">
                {activeBeat.caption}
              </h2>
              <p className="text-sm md:text-base text-[#182D26]/75">{activeBeat.sub}</p>
            </div>
          </div>
        )}
      </div>

      {/* Hairline 2px Bottom Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-[3px] bg-[#E8EDE5]">
        <div
          className="h-full bg-[#254B3D]/75 transition-all duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
