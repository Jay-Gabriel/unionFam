/**
 * Gentle Leaf Voice Service
 * Synthesizes soft, reflective Vietnamese voice and subtle acoustic chimes
 * using native Web Speech & Web Audio APIs with zero blocking dependencies.
 */

let activeAudioCtx: AudioContext | null = null;

const isTestEnvironment = (): boolean => {
  try {
    return import.meta.env.MODE === 'test';
  } catch {
    return false;
  }
};

export const isLeafVoiceSupported = (): boolean => {
  if (typeof window === 'undefined' || isTestEnvironment()) return false;
  return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
};

export const stopLeafVoice = (): void => {
  if (typeof window === 'undefined' || isTestEnvironment()) return;
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore synthesis cancellation errors across mobile browsers
    }
  }
};

export const playSoftLeafChime = (): void => {
  if (typeof window === 'undefined' || isTestEnvironment()) return;
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  try {
    if (!activeAudioCtx || activeAudioCtx.state === 'closed') {
      activeAudioCtx = new AudioContextCtor();
    }
    if (activeAudioCtx.state === 'suspended') {
      void activeAudioCtx.resume();
    }

    const now = activeAudioCtx.currentTime;
    const osc = activeAudioCtx.createOscillator();
    const gain = activeAudioCtx.createGain();

    // Gentle 528Hz harmonic sine whisper with rapid natural decay
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, now);
    osc.frequency.exponentialRampToValueAtTime(396, now + 0.55);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.025, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.65);

    osc.connect(gain);
    gain.connect(activeAudioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  } catch {
    // Web Audio may be blocked prior to gesture; fail silently
  }
};

const cleanTextForVoice = (raw: string): string => {
  return raw
    .replace(/[*_`#>-]/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const pickGentleVietnameseVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  const viVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('vi'));
  if (viVoices.length === 0) return null;

  const preferred = viVoices.find((v) =>
    /hoai|linh|mai|my|nu|female|natural|google|microsoft/i.test(v.name)
  );
  return preferred ?? viVoices[0];
};

export interface SpeakLeafOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

export const speakGentleLeaf = (text: string, options?: SpeakLeafOptions): boolean => {
  if (!isLeafVoiceSupported()) return false;
  const cleaned = cleanTextForVoice(text);
  if (!cleaned) return false;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'vi-VN';
    // Soft, unhurried cadence matching a reflective leaf
    utterance.rate = 0.88;
    utterance.pitch = 1.04;
    utterance.volume = 0.62;

    const voices = window.speechSynthesis.getVoices?.() ?? [];
    const chosenVoice = pickGentleVietnameseVoice(voices);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };
    utterance.onend = () => {
      options?.onEnd?.();
    };
    utterance.onerror = () => {
      options?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    options?.onEnd?.();
    return false;
  }
};
