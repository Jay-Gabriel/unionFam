'use client';

import { Music2, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type AudioContextWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type MusicNodes = {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  filter: BiquadFilterNode;
  master: GainNode;
  compressor: DynamicsCompressorNode;
};

const CHORDS = [
  [261.63, 329.63, 392.0],
  [220.0, 261.63, 329.63],
  [196.0, 246.94, 293.66],
  [174.61, 220.0, 261.63],
] as const;

const CHORD_DURATION_MS = 8_000;

function audioContextConstructor() {
  if (typeof window === 'undefined') return null;
  const browserWindow = window as AudioContextWindow;
  return browserWindow.AudioContext || browserWindow.webkitAudioContext || null;
}

/**
 * A tiny ambient pad generated locally with Web Audio. It adds a quiet musical
 * bed without another network request, an API key, or a large audio asset.
 * Browsers that block autoplay start it on the first tap/key press instead.
 */
export function AmbientMusic() {
  const [enabled, setEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<MusicNodes | null>(null);
  const chordIndexRef = useRef(0);
  const chordTimerRef = useRef<number | null>(null);
  const enabledRef = useRef(true);
  const playingRef = useRef(false);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);

  const stopMusic = useCallback(() => {
    if (chordTimerRef.current !== null) {
      window.clearInterval(chordTimerRef.current);
      chordTimerRef.current = null;
    }

    const nodes = nodesRef.current;
    if (nodes) {
      for (const oscillator of nodes.oscillators) {
        oscillator.onended = null;
        try {
          oscillator.stop();
        } catch {
          // The oscillator may already have completed its release.
        }
        oscillator.disconnect();
      }
      for (const gain of nodes.gains) gain.disconnect();
      nodes.filter.disconnect();
      nodes.master.disconnect();
      nodes.compressor.disconnect();
      nodesRef.current = null;
    }

    playingRef.current = false;
    startingRef.current = false;
    if (mountedRef.current) setIsPlaying(false);
  }, []);

  const startMusic = useCallback(async () => {
    if (!mountedRef.current || !enabledRef.current || playingRef.current || startingRef.current) return;
    const AudioContextCtor = audioContextConstructor();
    if (!AudioContextCtor) return;
    startingRef.current = true;

    const context = contextRef.current || new AudioContextCtor();
    contextRef.current = context;
    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch {
        // Autoplay policy will be retried by the next user interaction.
        startingRef.current = false;
        return;
      }
    }
    if (!mountedRef.current || !enabledRef.current || playingRef.current) {
      startingRef.current = false;
      return;
    }

    const now = context.currentTime;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2_400, now);
    filter.Q.setValueAtTime(0.35, now);

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-28, now);
    compressor.knee.setValueAtTime(16, now);
    compressor.ratio.setValueAtTime(3, now);
    compressor.attack.setValueAtTime(0.12, now);
    compressor.release.setValueAtTime(0.8, now);

    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.042, now + 2.5);
    filter.connect(master);
    master.connect(compressor);
    compressor.connect(context.destination);

    const firstChord = CHORDS[chordIndexRef.current];
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    firstChord.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 1 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime(index === 0 ? -3 : index === 2 ? 4 : 0, now);

      const gain = context.createGain();
      gain.gain.setValueAtTime(index === 0 ? 0.16 : 0.12, now);
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start(now);
      oscillators.push(oscillator);
      gains.push(gain);
    });

    // A soft root tone gives the pad a sense of movement without sounding like
    // a beat or competing with the conversation text.
    const bass = context.createOscillator();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(firstChord[0] / 2, now);
    const bassGain = context.createGain();
    bassGain.gain.setValueAtTime(0.09, now);
    bass.connect(bassGain);
    bassGain.connect(filter);
    bass.start(now);
    oscillators.push(bass);
    gains.push(bassGain);

    nodesRef.current = { oscillators, gains, filter, master, compressor };
    playingRef.current = true;
    startingRef.current = false;
    setIsPlaying(true);

    chordTimerRef.current = window.setInterval(() => {
      const nodes = nodesRef.current;
      const currentContext = contextRef.current;
      if (!nodes || !currentContext || currentContext.state !== 'running') return;

      chordIndexRef.current = (chordIndexRef.current + 1) % CHORDS.length;
      const chord = CHORDS[chordIndexRef.current];
      const transitionAt = currentContext.currentTime + 0.15;
      nodes.oscillators.slice(0, 3).forEach((oscillator, index) => {
        oscillator.frequency.cancelScheduledValues(transitionAt);
        oscillator.frequency.exponentialRampToValueAtTime(chord[index], transitionAt + 3.2);
      });
      const bassOscillator = nodes.oscillators[3];
      bassOscillator.frequency.cancelScheduledValues(transitionAt);
      bassOscillator.frequency.exponentialRampToValueAtTime(chord[0] / 2, transitionAt + 3.2);
    }, CHORD_DURATION_MS);
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;
    if (enabled) {
      void startMusic();
    } else {
      stopMusic();
    }
  }, [enabled, startMusic, stopMusic]);

  useEffect(() => {
    mountedRef.current = true;
    const unlock = () => {
      if (enabledRef.current) void startMusic();
    };
    // The first tap or key press is the browser-approved moment to resume
    // audio. We still attempt to start on mount for browsers that allow it.
    void startMusic();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });

    return () => {
      mountedRef.current = false;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      stopMusic();
      void contextRef.current?.close().catch(() => undefined);
      contextRef.current = null;
    };
  }, [startMusic, stopMusic]);

  const toggleMusic = () => setEnabled((value) => !value);

  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-pressed={enabled && isPlaying}
      aria-label={enabled && isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-calm-deep-moss/55 px-3.5 py-2 text-[11px] font-medium text-calm-fog/80 transition hover:border-calm-lichen/30 hover:bg-calm-lichen/10 hover:text-calm-paper-white"
    >
      {enabled && isPlaying ? <Volume2 size={14} className="text-calm-lichen" /> : <VolumeX size={14} className="text-calm-fog/60" />}
      <Music2 size={13} className="text-calm-lichen/80" />
      <span>{enabled && isPlaying ? 'Nhạc nền đang mở' : 'Bật nhạc nền'}</span>
    </button>
  );
}
