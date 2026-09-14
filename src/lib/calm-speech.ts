'use client';

/**
 * Calm & Expressive Vietnamese Speech Synthesis Engine for Life Lab.
 * Optimized for natural, warm, soothing cadence.
 */

let currentUtterance: SpeechSynthesisUtterance | null = null;

function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/[*_#`~>\[\]()]/g, '') // remove markdown symbols
    .replace(/https?:\/\/\S+/g, '') // remove urls
    .replace(/\s+/g, ' ')
    .trim();
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  } catch {
    // ignore
  }
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return window.speechSynthesis.speaking;
}

export function speakVietnamese(
  text: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
    rate?: number;
    pitch?: number;
  }
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return;

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = 'vi-VN';
  utterance.rate = options?.rate ?? 0.93; // slightly slower for calm, soothing tone
  utterance.pitch = options?.pitch ?? 1.0; // natural warm pitch

  const voices = window.speechSynthesis.getVoices();
  const vietnameseVoice =
    voices.find((v) => v.lang.includes('vi') || v.lang.includes('VI')) ||
    voices.find((v) => v.name.toLowerCase().includes('vietnam') || v.name.toLowerCase().includes('vietnamese'));

  if (vietnameseVoice) {
    utterance.voice = vietnameseVoice;
  }

  utterance.onstart = () => {
    options?.onStart?.();
  };

  utterance.onend = () => {
    currentUtterance = null;
    options?.onEnd?.();
  };

  utterance.onerror = (event) => {
    currentUtterance = null;
    if (event.error !== 'canceled' && event.error !== 'interrupted') {
      options?.onError?.(event);
    } else {
      options?.onEnd?.();
    }
  };

  currentUtterance = utterance;

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    options?.onError?.(err);
  }
}
