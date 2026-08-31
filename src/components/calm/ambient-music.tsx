'use client';

import { Music2, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type AudioContextWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type MusicNodes = {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  padFilter: BiquadFilterNode;
  birdFilter: BiquadFilterNode;
  master: GainNode;
  compressor: DynamicsCompressorNode;
  birdTones: Array<{ oscillator: OscillatorNode; gain: GainNode }>;
};

const CHORDS = [
  [261.63, 329.63, 392.0],
  [220.0, 261.63, 329.63],
  [196.0, 246.94, 293.66],
  [174.61, 220.0, 261.63],
] as const;

const CHORD_DURATION_MS = 8_000;
const FIRST_BIRD_DELAY_MS = 2_800;
const BIRD_MIN_DELAY_MS = 7_500;
const BIRD_MAX_DELAY_MS = 14_000;

const BIRD_MELODIES = [
  [1, 1.12, 1.28, 1.18, 1.04, 0.96, 1.02],
  [1, 1.18, 1.36, 1.24, 1.08, 1.3, 1.12],
  [1.06, 1.24, 1.16, 0.98, 1.1, 1.34, 1.2],
] as const;

function audioContextConstructor() {
  if (typeof window === 'undefined') return null;
  const browserWindow = window as AudioContextWindow;
  return browserWindow.AudioContext || browserWindow.webkitAudioContext || null;
}

/**
 * A small nature soundscape generated locally with Web Audio. It combines a
 * slow, quiet pad with occasional bird-like chirps, so there is no network
 * request, API key, or large audio asset that could delay the conversation.
 * Browsers that block autoplay start it on the first tap/key press instead.
 */
export function AmbientMusic() {
  const [enabled, setEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<MusicNodes | null>(null);
  const chordIndexRef = useRef(0);
  const chordTimerRef = useRef<number | null>(null);
  const birdTimerRef = useRef<number | null>(null);
  const enabledRef = useRef(true);
  const playingRef = useRef(false);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);

  const stopMusic = useCallback(() => {
    if (chordTimerRef.current !== null) {
      window.clearInterval(chordTimerRef.current);
      chordTimerRef.current = null;
    }
    if (birdTimerRef.current !== null) {
      window.clearTimeout(birdTimerRef.current);
      birdTimerRef.current = null;
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
      for (const tone of nodes.birdTones) {
        tone.oscillator.onended = null;
        try {
          tone.oscillator.stop();
        } catch {
          // The chirp may already have completed its short envelope.
        }
        tone.oscillator.disconnect();
        tone.gain.disconnect();
      }
      nodes.padFilter.disconnect();
      nodes.birdFilter.disconnect();
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
    const padFilter = context.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(1_700, now);
    padFilter.Q.setValueAtTime(0.35, now);

    const birdFilter = context.createBiquadFilter();
    birdFilter.type = 'bandpass';
    birdFilter.frequency.setValueAtTime(2_500, now);
    birdFilter.Q.setValueAtTime(0.65, now);

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-28, now);
    compressor.knee.setValueAtTime(16, now);
    compressor.ratio.setValueAtTime(3, now);
    compressor.attack.setValueAtTime(0.12, now);
    compressor.release.setValueAtTime(0.8, now);

    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.075, now + 1.8);
    padFilter.connect(master);
    birdFilter.connect(master);
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
      gain.connect(padFilter);
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
    bassGain.gain.setValueAtTime(0.075, now);
    bass.connect(bassGain);
    bassGain.connect(padFilter);
    bass.start(now);
    oscillators.push(bass);
    gains.push(bassGain);

    const birdTones: Array<{ oscillator: OscillatorNode; gain: GainNode }> = [];
    nodesRef.current = { oscillators, gains, padFilter, birdFilter, master, compressor, birdTones };
    playingRef.current = true;
    startingRef.current = false;
    setIsPlaying(true);

    const scheduleBirdCall = (delayMs: number) => {
      birdTimerRef.current = window.setTimeout(() => {
        birdTimerRef.current = null;
        const nodes = nodesRef.current;
        const currentContext = contextRef.current;
        if (!playingRef.current || !nodes || !currentContext) return;
        if (currentContext.state !== 'running') {
          scheduleBirdCall(2_000);
          return;
        }

        const chirpStart = currentContext.currentTime + 0.04;
        const duration = 0.62 + Math.random() * 0.28;
        const baseFrequency = 1_850 + Math.random() * 850;
        const melody = BIRD_MELODIES[Math.floor(Math.random() * BIRD_MELODIES.length)];
        const frequencyCurve = new Float32Array(melody.map((multiplier) => baseFrequency * multiplier));

        const oscillator = currentContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueCurveAtTime(frequencyCurve, chirpStart, duration);
        const gain = currentContext.createGain();
        gain.gain.setValueAtTime(0.0001, chirpStart);
        gain.gain.exponentialRampToValueAtTime(0.18, chirpStart + 0.045);
        gain.gain.exponentialRampToValueAtTime(0.0001, chirpStart + duration);
        oscillator.connect(gain);
        gain.connect(nodes.birdFilter);
        const tone = { oscillator, gain };
        nodes.birdTones.push(tone);
        oscillator.onended = () => {
          const activeNodes = nodesRef.current;
          if (activeNodes) {
            const index = activeNodes.birdTones.indexOf(tone);
            if (index >= 0) activeNodes.birdTones.splice(index, 1);
          }
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(chirpStart);
        oscillator.stop(chirpStart + duration + 0.05);

        // A very quiet second harmonic gives the chirp a little air without
        // turning it into a sharp notification sound.
        const harmonic = currentContext.createOscillator();
        harmonic.type = 'triangle';
        harmonic.frequency.setValueCurveAtTime(
          new Float32Array(melody.map((multiplier) => baseFrequency * multiplier * 2)),
          chirpStart,
          duration,
        );
        const harmonicGain = currentContext.createGain();
        harmonicGain.gain.setValueAtTime(0.0001, chirpStart);
        harmonicGain.gain.exponentialRampToValueAtTime(0.035, chirpStart + 0.045);
        harmonicGain.gain.exponentialRampToValueAtTime(0.0001, chirpStart + duration);
        harmonic.connect(harmonicGain);
        harmonicGain.connect(nodes.birdFilter);
        const harmonicTone = { oscillator: harmonic, gain: harmonicGain };
        nodes.birdTones.push(harmonicTone);
        harmonic.onended = () => {
          const activeNodes = nodesRef.current;
          if (activeNodes) {
            const index = activeNodes.birdTones.indexOf(harmonicTone);
            if (index >= 0) activeNodes.birdTones.splice(index, 1);
          }
          harmonic.disconnect();
          harmonicGain.disconnect();
        };
        harmonic.start(chirpStart);
        harmonic.stop(chirpStart + duration + 0.05);

        const nextDelay = BIRD_MIN_DELAY_MS + Math.random() * (BIRD_MAX_DELAY_MS - BIRD_MIN_DELAY_MS);
        scheduleBirdCall(nextDelay);
      }, delayMs);
    };

    scheduleBirdCall(FIRST_BIRD_DELAY_MS + Math.random() * 1_500);

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

  const toggleMusic = () => {
    // If autoplay was blocked, the first click is an explicit browser
    // permission gesture. Do not toggle the preference off before retrying.
    if (enabled && !isPlaying) {
      void startMusic();
      return;
    }
    setEnabled((value) => !value);
  };

  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-pressed={enabled && isPlaying}
      aria-label={enabled && isPlaying ? 'Tắt âm thanh thiên nhiên' : 'Bật âm thanh thiên nhiên'}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-calm-deep-moss/55 px-3.5 py-2 text-[11px] font-medium text-calm-fog/80 transition hover:border-calm-lichen/30 hover:bg-calm-lichen/10 hover:text-calm-paper-white"
    >
      {enabled && isPlaying ? <Volume2 size={14} className="text-calm-lichen" /> : <VolumeX size={14} className="text-calm-fog/60" />}
      <Music2 size={13} className="text-calm-lichen/80" />
      <span>{enabled && isPlaying ? 'Thiên nhiên đang phát' : 'Bật âm thanh thiên nhiên'}</span>
    </button>
  );
}
