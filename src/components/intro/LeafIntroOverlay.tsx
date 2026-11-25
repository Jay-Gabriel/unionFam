import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ArrowRight, Film } from 'lucide-react';
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
    durationMs: 1650,
  },
  {
    mood: 'caring',
    accentIcon: '/assets/3d/sparkles-3d.png',
    caption: 'Chiếc Lá ở đây để dịu dàng chăm sóc bạn.',
    sub: 'Giữ một nhịp thở bình yên, không thúc ép, không áp lực.',
    durationMs: 1850,
  },
  {
    mood: 'listening',
    accentIcon: '/assets/3d/icon-3d-clarify.png',
    caption: 'Lắng nghe không phán xét. Thấu hiểu điều quan trọng.',
    sub: 'Tách bạch tiếng lòng bạn khỏi những ồn ào bên ngoài.',
    durationMs: 1700,
  },
  {
    mood: 'celebrating',
    accentIcon: '/assets/3d/icon-3d-experiment.png',
    caption: 'UnionFam · Cùng Chiếc Lá làm rõ lựa chọn của riêng bạn.',
    sub: 'Từng bước nhỏ sáng rõ theo nhịp độ tự nhiên nhất.',
    durationMs: 1600,
  },
];

const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  const narrow = window.innerWidth < 768;
  const coarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  return narrow || coarse;
};

/**
 * Màn Intro tràn viền đồng màu #F7F5EF:
 * - Trên mobile (<768px / cảm ứng): chạy ngay Kể chuyện Chiếc Lá 3D sống động (0ms chờ tải MP4).
 * - Trên desktop: phát video MP4 60fps kèm lớp chờ 3D mượt mà và tự chuyển 3D trong 1.5s nếu mạng chậm.
 */
export const LeafIntroOverlay: React.FC<LeafIntroOverlayProps> = ({ isOpen, onClose }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [useLive3DStory, setUseLive3DStory] = useState<boolean>(() => isMobileViewport());
  const [videoReady, setVideoReady] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const exitTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsExiting(false);
    setBeatIndex(0);
    setProgress(0);
    setVideoReady(false);
    setUseLive3DStory(isMobileViewport());
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
    }, 420);
  };

  // Watchdog 1500ms cho bản desktop MP4: nếu mạng chậm hoặc autoplay bị chặn -> chuyển ngay sang 3D Story
  useEffect(() => {
    if (!isOpen || useLive3DStory || isExiting) return;

    const el = videoRef.current;
    if (el && typeof el.play === 'function') {
      try {
        const playPromise = el.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            setUseLive3DStory(true);
          });
        }
      } catch {
        setUseLive3DStory(true);
      }
    }

    if (videoReady) return;
    const watchdog = window.setTimeout(() => {
      if (!videoReady) {
        setUseLive3DStory(true);
      }
    }, 1500);

    return () => window.clearTimeout(watchdog);
  }, [isOpen, useLive3DStory, videoReady, isExiting]);

  // Chế độ Kể chuyện Chiếc Lá 3D (nhanh gọn 0ms delay trên mobile & fallback desktop)
  useEffect(() => {
    if (!isOpen || !useLive3DStory || isExiting) return;

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
  }, [isOpen, useLive3DStory, beatIndex, isExiting]);

  if (!isOpen) return null;

  const activeBeat = STORY_BEATS[beatIndex] || STORY_BEATS[STORY_BEATS.length - 1];

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.currentTime > 0 && !videoReady) {
      setVideoReady(true);
    }
    if (video.duration > 0) {
      setProgress(Math.min(100, (video.currentTime / video.duration) * 100));
    }
  };

  const handleAdvanceBeat = () => {
    if (beatIndex < STORY_BEATS.length - 1) {
      setBeatIndex((prev) => prev + 1);
    } else {
      setProgress(100);
      triggerSmoothExit();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video giới thiệu Chiếc Lá UnionFam"
      className={`fixed inset-0 z-[100] bg-[#F7F5EF] text-[#182D26] flex flex-col items-center justify-center transition-all duration-400 ease-out ${
        isExiting ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Top-Right Safe Controls */}
      <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
        {!useLive3DStory ? (
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="min-h-[42px] px-3 py-2 rounded-full border border-[#BBC7BC]/80 bg-white/80 hover:bg-white backdrop-blur-md text-xs font-medium text-[#254B3D] flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Bật tiếng' : 'Tắt tiếng'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setVideoReady(false);
              setUseLive3DStory(false);
            }}
            className="hidden sm:flex min-h-[42px] px-3 py-2 rounded-full border border-[#BBC7BC]/80 bg-white/80 hover:bg-white backdrop-blur-md text-xs font-medium text-[#254B3D] items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Xem bản video</span>
          </button>
        )}
        <button
          type="button"
          onClick={triggerSmoothExit}
          className="min-h-[42px] px-4 py-2 rounded-full border border-[#BBC7BC]/80 bg-[#E8EDE5]/90 hover:bg-[#d7e2d3] backdrop-blur-md text-xs font-semibold text-[#254B3D] flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <span>Bỏ qua</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cinema Stage */}
      <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 relative">
        {!useLive3DStory ? (
          <>
            {!videoReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none px-6 text-center">
                <LeafMascot3D mood="welcoming" size="lg" />
                <p className="text-xs sm:text-sm text-[#254B3D]/75 font-medium">
                  Chiếc Lá đang bước ra cùng bạn...
                </p>
              </div>
            )}
            <video
              ref={videoRef}
              src="/assets/video/unionfam-leaf-intro.mp4"
              autoPlay
              muted={isMuted}
              playsInline
              preload="auto"
              onCanPlay={() => setVideoReady(true)}
              onPlaying={() => setVideoReady(true)}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={() => {
                setProgress(100);
                triggerSmoothExit();
              }}
              onError={() => setUseLive3DStory(true)}
              className={`w-full max-w-6xl max-h-[84vh] aspect-video object-contain rounded-2xl transition-opacity duration-300 ${
                videoReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="w-full max-w-md sm:max-w-3xl flex flex-col items-center justify-center px-3 py-8 text-center">
            <div className="relative flex items-center justify-center gap-4">
              <LeafMascot3D mood={activeBeat.mood} size="xl" />
              <img
                src={activeBeat.accentIcon}
                alt=""
                aria-hidden="true"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain leaf-float drop-shadow-md"
              />
            </div>

            <button
              type="button"
              onClick={handleAdvanceBeat}
              className="mt-5 max-w-xl space-y-2 focus:outline-none cursor-pointer group"
            >
              <div key={activeBeat.caption} className="fade-slide-up space-y-2">
                <h2 className="font-playfair text-2xl sm:text-3xl font-semibold text-[#254B3D] leading-snug">
                  {activeBeat.caption}
                </h2>
                <p className="text-sm sm:text-base text-[#182D26]/75 leading-relaxed">
                  {activeBeat.sub}
                </p>
              </div>

              <div className="pt-3 flex items-center justify-center gap-2">
                {STORY_BEATS.map((b, idx) => (
                  <span
                    key={b.caption}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === beatIndex
                        ? 'w-6 bg-[#254B3D]'
                        : idx < beatIndex
                          ? 'w-2 bg-[#596A55]'
                          : 'w-2 bg-[#BBC7BC]'
                    }`}
                  />
                ))}
              </div>
              <span className="inline-block pt-1 text-[11px] text-[#596A55]/85 group-hover:text-[#254B3D]">
                Kéo nhẹ để xoay Chiếc Lá 3D · Chạm chữ để qua nhanh
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Hairline Bottom Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-[3px] bg-[#E8EDE5] pb-[env(safe-area-inset-bottom)]">
        <div
          className="h-[3px] bg-[#254B3D]/75 transition-all duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
