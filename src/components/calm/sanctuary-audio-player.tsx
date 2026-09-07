'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Music, Sparkles } from 'lucide-react';

interface SanctuaryAudioPlayerProps {
  src?: string;
  autoPlay?: boolean;
  className?: string;
}

export function SanctuaryAudioPlayer({
  src = '/audio/frequency-432hz.mp3',
  autoPlay = true,
  className = '',
}: SanctuaryAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    // Check localStorage preference
    const savedMute = localStorage.getItem('unionfam_432hz_muted');
    if (savedMute === 'true') {
      setIsMuted(true);
    }

    const savedVol = localStorage.getItem('unionfam_432hz_volume');
    if (savedVol) {
      const v = parseFloat(savedVol);
      if (!isNaN(v) && v >= 0 && v <= 1) {
        setVolume(v);
      }
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    const startAudio = async () => {
      if (savedMute === 'true') return;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        // Autoplay blocked by browser policy, wait for user interaction
        const handleFirstInteraction = async () => {
          try {
            if (audioRef.current && !audioRef.current.paused) return;
            await audio.play();
            setIsPlaying(true);
          } catch {
            // Ignored
          } finally {
            window.removeEventListener('pointerdown', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
          }
        };
        window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
        window.addEventListener('keydown', handleFirstInteraction, { once: true });
      }
    };

    if (autoPlay) {
      void startAudio();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [src, autoPlay]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem('unionfam_432hz_muted', 'true');
    } else {
      try {
        audioRef.current.volume = isMuted ? 0 : volume;
        await audioRef.current.play();
        setIsPlaying(true);
        setIsMuted(false);
        localStorage.setItem('unionfam_432hz_muted', 'false');
      } catch (err) {
        console.warn('Audio play error:', err);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
      }
    }
    localStorage.setItem('unionfam_432hz_volume', newVol.toString());
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
      if (!isPlaying) void audioRef.current.play().then(() => setIsPlaying(true));
      localStorage.setItem('unionfam_432hz_muted', 'false');
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
      localStorage.setItem('unionfam_432hz_muted', 'true');
    }
  };

  return (
    <div
      className={`relative inline-flex items-center gap-2 rounded-full border border-calm-lichen/30 bg-gradient-to-r from-calm-lichen/15 via-[#2b392d]/90 to-calm-pollen/15 backdrop-blur-md px-3 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-300 hover:border-calm-lichen/50 ${className}`}
      onMouseEnter={() => setShowVolumeSlider(true)}
      onMouseLeave={() => setShowVolumeSlider(false)}
    >
      <button
        type="button"
        onClick={togglePlay}
        className="flex items-center gap-2 text-left focus:outline-none group"
        title={isPlaying ? 'Tạm dừng nhạc tần số 432 Hz' : 'Bật nhạc tần số 432 Hz (Thu hút may mắn & bình an)'}
        aria-label={isPlaying ? 'Tạm dừng nhạc' : 'Bật nhạc'}
      >
        {/* Animated frequency equalizer bars */}
        <div className="flex items-end gap-0.5 h-3.5 w-4 justify-center">
          <span
            className={`w-0.5 rounded-full bg-calm-pollen transition-all duration-300 ${
              isPlaying ? 'animate-[pulse_0.8s_ease-in-out_infinite] h-3.5' : 'h-1.5 opacity-60'
            }`}
          />
          <span
            className={`w-0.5 rounded-full bg-calm-lichen transition-all duration-300 ${
              isPlaying ? 'animate-[pulse_1.2s_ease-in-out_infinite_0.2s] h-2.5' : 'h-2 opacity-60'
            }`}
          />
          <span
            className={`w-0.5 rounded-full bg-calm-warm-ivory transition-all duration-300 ${
              isPlaying ? 'animate-[pulse_0.9s_ease-in-out_infinite_0.4s] h-3' : 'h-1 opacity-60'
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-calm-warm-ivory tracking-wide group-hover:text-calm-pollen transition-colors">
            432 Hz
          </span>
          <span className="hidden sm:inline text-[10px] text-calm-lichen font-medium">
            {isPlaying ? '· Đang phát lặp' : '· Tạm dừng'}
          </span>
        </div>
      </button>

      {/* Quick Mute / Volume button */}
      <button
        type="button"
        onClick={toggleMute}
        className="text-calm-warm-ivory/80 hover:text-white p-0.5 rounded-full transition-colors"
        aria-label={isMuted ? 'Bật âm' : 'Tắt âm'}
      >
        {isMuted || volume === 0 ? <VolumeX size={13} className="text-calm-fog/70" /> : <Volume2 size={13} className="text-calm-lichen" />}
      </button>

      {/* Floating Volume Slider on Hover */}
      {showVolumeSlider && (
        <div className="absolute right-0 top-full mt-2 flex items-center gap-2 rounded-2xl border border-white/15 bg-[#263128]/98 backdrop-blur-2xl px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.5)] z-50">
          <Volume2 size={13} className="text-calm-lichen shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#B9C6A5]"
            aria-label="Điều chỉnh âm lượng"
          />
          <span className="text-[10px] font-mono text-calm-warm-ivory shrink-0">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
