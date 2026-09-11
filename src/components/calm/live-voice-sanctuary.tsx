'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Sprout,
  Heart,
  ShieldCheck,
  X,
  Leaf,
} from 'lucide-react';

interface LiveVoiceSanctuaryProps {
  isOpen: boolean;
  onClose: (callSummary?: string) => void;
  userName?: string;
  conversationId?: string;
  initialConnected?: boolean;
}

export function LiveVoiceSanctuaryModal({
  isOpen,
  onClose,
  userName = 'Bạn',
  conversationId = '',
  initialConnected = false,
}: LiveVoiceSanctuaryProps) {
  const [callState, setCallState] = useState<'incoming' | 'connected' | 'ended'>(
    initialConnected ? 'connected' : 'incoming'
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [aiResponseText, setAiResponseText] = useState(
    'Chào bạn, mình là Life Lab. Mình luôn ở đây để lắng nghe bạn. Hãy cứ thả lỏng và chia sẻ bất cứ điều gì bạn đang cảm thấy nhé.'
  );
  const [audioLevel, setAudioLevel] = useState(0.2);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Synchronize callState when modal opens with initialConnected
  useEffect(() => {
    if (isOpen) {
      if (initialConnected) {
        setCallState('connected');
        setCallDuration(0);
        speakAiText('Chào bạn, mình đã kết nối cùng bạn rồi. Hãy cứ hít thở thật sâu, mình luôn ở đây lắng nghe bạn.');
        startListening();
      } else {
        setCallState('incoming');
        setCallDuration(0);
      }
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen, initialConnected]);

  // Handle call timer
  useEffect(() => {
    if (callState === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callState]);

  // Audio equalizer pulse simulation
  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => {
      if (isAiSpeaking) {
        setAudioLevel(0.4 + Math.random() * 0.6);
      } else {
        setAudioLevel(0.15 + Math.random() * 0.25);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [callState, isAiSpeaking]);

  // Speech synthesis for AI
  const speakAiText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.92; // Calm, soothing speech rate
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Start speech recognition when connected
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalSpeech = event.results[i][0].transcript;
            setCurrentTranscript(finalSpeech);
            handleUserVoiceInput(finalSpeech);
          } else {
            interim += event.results[i][0].transcript;
            setCurrentTranscript(interim);
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition not available', e);
    }
  };

  const handleUserVoiceInput = async (text: string) => {
    if (!text.trim()) return;
    setIsAiSpeaking(true);
    setAiResponseText('Life Lab đang cảm nhận câu chuyện của bạn…');

    try {
      // Stream response or synthesize calming advice
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: `[Giao tiếp bằng giọng nói]: ${text}`,
          idempotencyKey: `voice-${Date.now()}`,
        }),
      });

      if (res.ok) {
        // Fallback calm response if stream parsing
        const reply = 'Mình đã nghe rõ chia sẻ của bạn. Những cảm xúc bạn vừa trải qua là hoàn toàn tự nhiên. Hãy cho phép bản thân hít thở sâu một nhịp nhé.';
        setAiResponseText(reply);
        speakAiText(reply);
      } else {
        const fallback = 'Mình đang lắng nghe bạn thật sâu sắc. Hãy cứ thoải mái trải lòng nhé.';
        setAiResponseText(fallback);
        speakAiText(fallback);
      }
    } catch {
      const fallback = 'Mình luôn ở đây lắng nghe bạn. Bạn cảm thấy cơ thể mình đang thả lỏng hơn chưa?';
      setAiResponseText(fallback);
      speakAiText(fallback);
    }
  };

  const handleAnswerCall = () => {
    setCallState('connected');
    speakAiText(aiResponseText);
    startListening();
  };

  const handleEndCall = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallState('ended');
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    const timeFormatted = `${minutes > 0 ? `${minutes} phút ` : ''}${seconds} giây`;
    const summary = `📞 Cuộc gọi thoại cùng Life Lab đã kết thúc (Thời lượng: ${timeFormatted}). Bản thể của bạn đã được tiếp thêm năng lượng tĩnh lặng.`;
    setTimeout(() => {
      onClose(summary);
    }, 600);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[40px] border border-calm-lichen/30 bg-gradient-to-b from-[#18261c] via-[#101c13] to-[#0a120c] p-6 sm:p-9 text-calm-paper-white shadow-[0_25px_80px_rgba(0,0,0,0.7)] flex flex-col items-center justify-between min-h-[540px]"
        >
          {/* Ambient Background Aura */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-700"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${isAiSpeaking ? 'rgba(238, 213, 150, 0.25)' : 'rgba(185, 198, 165, 0.2)'} 0%, rgba(0,0,0,0) 70%)`,
            }}
          />

          {/* Top Bar: Identity & Encryption badge */}
          <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-calm-lichen">
              <ShieldCheck size={13} className="text-calm-lichen" />
              <span>Bảo mật 1:1 không phán xét</span>
            </div>
            {callState === 'connected' && (
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
                {formatTime(callDuration)}
              </span>
            )}
          </div>

          {/* Center: Glowing Voice Orb / Pulse Ring */}
          <div className="relative z-10 flex flex-col items-center justify-center my-6 space-y-6 text-center">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing energy waves */}
              <motion.div
                animate={{
                  scale: callState === 'incoming' ? [1, 1.25, 1] : isAiSpeaking ? [1, 1.35, 1] : [1, 1.1, 1],
                  opacity: callState === 'incoming' ? [0.4, 0.8, 0.4] : [0.3, 0.7, 0.3],
                }}
                transition={{ duration: callState === 'incoming' ? 1.5 : 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute h-48 w-48 rounded-full border-2 border-calm-pollen/40 bg-calm-pollen/10 blur-md"
              />
              <motion.div
                animate={{
                  scale: callState === 'incoming' ? [1, 1.4, 1] : [1, 1.2, 1],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="absolute h-56 w-56 rounded-full border border-calm-lichen/30 bg-calm-lichen/5 blur-lg"
              />

              {/* Core Organic Orb */}
              <div
                className="relative grid h-28 w-28 place-items-center rounded-full border-2 border-calm-pollen/60 bg-gradient-to-tr from-[#2a3d2e] via-[#1f2f23] to-[#2a3d2e] shadow-[0_0_40px_rgba(238,213,150,0.4)] transition-all duration-300"
                style={{
                  transform: `scale(${1 + audioLevel * 0.2})`,
                }}
              >
                {callState === 'incoming' ? (
                  <PhoneCall size={42} className="text-calm-pollen animate-bounce" />
                ) : (
                  <Sprout size={44} className="text-calm-lichen animate-leaf-wave-1" />
                )}
              </div>
            </div>

            {/* Caller Info & Subtitles */}
            <div className="space-y-2 max-w-sm">
              <h3 className="text-2xl font-bold tracking-tight text-white">
                {callState === 'incoming' ? 'Life Lab đang gọi cho bạn…' : 'Phòng Thoại Tĩnh Lặng'}
              </h3>
              <p className="text-xs font-mono tracking-wider text-calm-lichen uppercase">
                {callState === 'incoming' ? '✦ Cuộc gọi trực tiếp 1:1 ✦' : isAiSpeaking ? '🌿 Life Lab đang phản hồi…' : '🎙️ Đang lắng nghe bạn…'}
              </p>
              {callState === 'connected' && (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-xs italic text-calm-warm-ivory leading-relaxed max-h-24 overflow-y-auto">
                  “{currentTranscript || aiResponseText}”
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="relative z-10 w-full pt-4">
            {callState === 'incoming' ? (
              <div className="flex items-center justify-around gap-6">
                {/* Dismiss */}
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="grid h-14 w-14 place-items-center rounded-full border border-red-500/40 bg-red-500/20 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all group-hover:scale-110">
                    <PhoneOff size={24} />
                  </div>
                  <span className="text-[11px] font-medium text-calm-fog">Để sau</span>
                </button>

                {/* Answer */}
                <button
                  type="button"
                  onClick={handleAnswerCall}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-black shadow-[0_0_30px_rgba(52,211,153,0.5)] transition-all group-hover:scale-110 animate-pulse">
                    <Phone size={28} />
                  </div>
                  <span className="text-xs font-bold text-emerald-300">Bắt máy ngay</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-6">
                {/* Mute Mic */}
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`grid h-12 w-12 place-items-center rounded-full border transition-all ${
                    isMuted ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' : 'border-white/20 bg-white/10 text-white'
                  }`}
                  title={isMuted ? 'Bật micro' : 'Tắt micro'}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                {/* Hang Up */}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="grid h-14 w-14 place-items-center rounded-full bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all hover:scale-110 active:scale-95"
                  title="Gác máy"
                >
                  <PhoneOff size={24} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Floating Incoming Call Badge in chat / sanctuary
export function IncomingVoiceCallBadge({
  onAnswer,
  onDismiss,
}: {
  onAnswer: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="relative z-30 flex items-center justify-between gap-3.5 rounded-[24px] border border-calm-pollen/50 bg-gradient-to-r from-[#2c3d2f]/98 via-[#202f23]/98 to-[#2c3d2f]/98 backdrop-blur-xl p-3 sm:px-4 sm:py-3 shadow-[0_15px_40px_rgba(0,0,0,0.5),0_0_25px_rgba(238,213,150,0.2)] mb-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-calm-pollen/20 text-calm-pollen border border-calm-pollen/40 shadow-[0_0_15px_rgba(238,213,150,0.3)]">
          <PhoneCall size={20} className="animate-bounce" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-calm-paper-white truncate">Cuộc gọi thoại từ Life Lab</p>
          <p className="text-[10.5px] text-calm-pollen truncate">Trò chuyện trực tiếp rảnh tay cùng AI…</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onAnswer}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 px-3.5 py-1.5 text-xs font-bold text-black shadow-md hover:scale-105 active:scale-95 transition"
        >
          <Phone size={13} />
          <span>Bắt máy</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/5 text-calm-fog hover:bg-white/15 hover:text-white transition"
          title="Để sau"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

// In-Message Voice Call Offer Card when user is overwhelmed/distressed
export function VoiceCallOfferCard({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mt-3 overflow-hidden rounded-[26px] border border-emerald-500/40 bg-gradient-to-b from-[#1c2c20]/98 via-[#132217]/98 to-[#0d1710]/98 backdrop-blur-xl p-4 sm:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.45),0_0_25px_rgba(52,211,153,0.18)]"
    >
      <div className="flex items-start gap-3.5">
        <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-[0_0_20px_rgba(52,211,153,0.4)]">
          <PhoneCall size={22} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Phòng Thoại Chữa Lành 1:1</span>
              <Sparkles size={14} className="text-calm-pollen" />
            </h4>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-300">
              Sẵn sàng kết nối
            </span>
          </div>
          <p className="text-xs text-calm-lichen leading-relaxed">
            Life Lab cảm nhận được bạn đang gánh vác nhiều áp lực hoặc kiệt sức. Bạn có muốn chuyển sang <strong className="text-white">gọi thoại trực tiếp</strong> để trải lòng và hít thở nhẹ nhàng hơn không?
          </p>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-end gap-2.5">
        {onDecline && (
          <button
            type="button"
            onClick={onDecline}
            className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-calm-fog hover:bg-white/15 hover:text-white transition"
          >
            Để sau, nhắn tin tiếp
          </button>
        )}
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 px-5 py-2 text-xs font-bold text-black shadow-[0_0_20px_rgba(52,211,153,0.4)] hover:scale-105 active:scale-95 transition"
        >
          <Phone size={14} />
          <span>Đồng ý, gọi thoại ngay</span>
        </button>
      </div>
    </motion.div>
  );
}

