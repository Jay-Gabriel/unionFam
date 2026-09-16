'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  MessageCircleHeart,
  Mail,
  Sparkles,
  ArrowRight,
  X,
  Volume2,
  VolumeX,
  Users,
  Feather,
  Zap,
  Flame,
  HelpCircle,
} from 'lucide-react';
import type { LostLetter, PlanetZone, EmoteOption } from './world-types';

export const EMOTE_OPTIONS: EmoteOption[] = [
  { id: 'heart', emoji: '❤️', label: 'Thương yêu' },
  { id: 'wave', emoji: '👋', label: 'Vẫy tay' },
  { id: 'sparkles', emoji: '✨', label: 'Hy vọng' },
  { id: 'dove', emoji: '🕊️', label: 'Bình yên' },
  { id: 'candle', emoji: '🕯️', label: 'Chiêm nghiệm' },
];

interface WorldUIOverlayProps {
  currentZone: PlanetZone | null;
  activeLetter: LostLetter | null;
  collectedLetterIds: string[];
  onlineCount?: number;
  onCloseLetter: () => void;
  onTriggerEmote: (emoji: string) => void;
  onVirtualInputChange: (input: { x: number; y: number; jump: boolean; sprint: boolean }) => void;
}

export function WorldUIOverlay({
  currentZone,
  activeLetter,
  collectedLetterIds,
  onlineCount = 4,
  onCloseLetter,
  onTriggerEmote,
  onVirtualInputChange,
}: WorldUIOverlayProps) {
  const router = useRouter();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);

  // Virtual Joystick touch handlers
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);

  const handleJoystickTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDraggingJoystick(true);
    handleJoystickMove(e);
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const maxRadius = 45;
    const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxRadius);
    const angle = Math.atan2(deltaY, deltaX);

    const normX = (Math.cos(angle) * distance) / maxRadius;
    const normY = (Math.sin(angle) * distance) / maxRadius;

    setJoystickPos({ x: normX * 32, y: normY * 32 });
    onVirtualInputChange({
      x: normX,
      y: normY,
      jump: false,
      sprint: isSprinting,
    });
  };

  const handleJoystickEnd = () => {
    setIsDraggingJoystick(false);
    setJoystickPos({ x: 0, y: 0 });
    onVirtualInputChange({
      x: 0,
      y: 0,
      jump: false,
      sprint: false,
    });
  };

  const handleJumpPress = () => {
    onVirtualInputChange({ x: 0, y: 0, jump: true, sprint: isSprinting });
    setTimeout(() => {
      onVirtualInputChange({ x: 0, y: 0, jump: false, sprint: isSprinting });
    }, 150);
  };

  // 1-Click Action to Connect with AI Chat from Zone
  const handleZoneAction = (zone: PlanetZone) => {
    if (zone.id === 'forest') {
      const prompt = encodeURIComponent(zone.aiPromptStarter);
      window.sessionStorage.setItem('lifelab_preloaded_prompt', zone.aiPromptStarter);
      router.push(`/app/conversations?prompt=${prompt}`);
    } else {
      router.push(zone.targetHref);
    }
  };

  // 1-Click Action from Lost Letter to AI Chat
  const handleLetterToChat = (letter: LostLetter) => {
    const prompt = `Chào Life Lab, mình vừa nhặt được bức thư "${letter.title}" trên hành tinh tâm trí:\n"${letter.preview}"\n\nCâu hỏi trăn trở: "${letter.reflectionQuestion}". Hãy cùng mình lắng nghe và gỡ rối cảm xúc này nhé.`;
    window.sessionStorage.setItem('lifelab_preloaded_prompt', prompt);
    router.push(`/app/conversations?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-3 sm:p-6 overflow-hidden">
      {/* Top Header Bar */}
      <header className="pointer-events-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/70 px-3.5 py-1.5 backdrop-blur-xl shadow-lg">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-tight">Hành Tinh Tâm Trí</span>
          <span className="text-[10px] text-calm-fog/70 border-l border-white/10 pl-2">3D Living World</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Online Players Counter */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-calm-lichen backdrop-blur-md shadow">
            <Users size={13} className="text-emerald-400" />
            <span>{onlineCount} Online</span>
          </div>

          {/* Letters Counter */}
          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md shadow">
            <Mail size={13} />
            <span>{collectedLetterIds.length}/4 Lá Thư</span>
          </div>

          {/* Help Button */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/20 transition-all"
            title="Hướng dẫn điều khiển"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </header>

      {/* Help Modal Guide */}
      <AnimatePresence>
        {isHelpOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-[#18261b] to-[#0f1712] p-6 text-white shadow-2xl">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="absolute top-4 right-4 text-calm-fog hover:text-white"
              >
                <X size={18} />
              </button>
              <h3 className="text-lg font-bold text-calm-paper-white flex items-center gap-2">
                <Compass className="text-calm-lichen" />
                Hướng dẫn du hành Hành Tinh
              </h3>
              <div className="mt-4 space-y-3 text-xs text-calm-fog leading-relaxed">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <strong className="text-white">⌨️ Trên Máy Tính:</strong>
                  <ul className="mt-1.5 space-y-1 list-disc list-inside">
                    <li>Phím <kbd className="px-1.5 py-0.5 rounded bg-white/15">W / A / S / D</kbd> hoặc Phím Mũi Tên: Di chuyển</li>
                    <li>Phím <kbd className="px-1.5 py-0.5 rounded bg-white/15">Spacebar</kbd>: Nhảy tưng bừng</li>
                    <li>Giữ phím <kbd className="px-1.5 py-0.5 rounded bg-white/15">Shift</kbd>: Chạy nhanh</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <strong className="text-white">📱 Trên Điện Thoại:</strong>
                  <p className="mt-1">Dùng Cần gạt ảo (Joystick) góc dưới trái để chạy, nút Nhảy góc dưới phải.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <strong className="text-white">💌 Nhiệm Vụ & Tương Tác:</strong>
                  <p className="mt-1">Đi khám phá 6 khu vực, nhặt 4 lá thư chưa gửi và kết nối trò chuyện sâu với AI Life Lab.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="mt-5 w-full rounded-2xl bg-calm-lichen py-2.5 text-xs font-bold text-calm-deep-moss shadow hover:bg-calm-lichen/90"
              >
                Đã hiểu, bắt đầu khám phá!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Zone Notification Banner */}
      <AnimatePresence>
        {currentZone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-auto mx-auto w-full max-w-lg"
          >
            <div className="overflow-hidden rounded-[26px] border border-white/20 bg-gradient-to-r from-slate-950/90 via-[#16271c]/95 to-slate-950/90 p-4 sm:p-5 backdrop-blur-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: currentZone.color, color: currentZone.color }}
                    />
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">{currentZone.name}</h2>
                  </div>
                  <p className="text-[11px] text-calm-lichen/90 font-medium">{currentZone.subtitle}</p>
                  <p className="text-[11px] text-calm-fog/80 line-clamp-2 leading-relaxed">{currentZone.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleZoneAction(currentZone)}
                  className="shrink-0 flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-calm-lichen to-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <span>{currentZone.actionLabel}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letter Reading Modal */}
      <AnimatePresence>
        {activeLetter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <div className="relative w-full max-w-lg rounded-[32px] border border-amber-400/30 bg-gradient-to-b from-[#241f17]/98 via-[#1a1813]/98 to-[#10100d]/98 p-6 sm:p-8 text-white shadow-[0_25px_70px_rgba(0,0,0,0.8)]">
              <button
                type="button"
                onClick={onCloseLetter}
                className="absolute top-5 right-5 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-all"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2.5 border-b border-amber-400/20 pb-4">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-md">
                  <Mail size={20} />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-amber-200">{activeLetter.title}</h3>
                  <p className="text-xs text-amber-400/70">Người gửi: {activeLetter.sender}</p>
                </div>
              </div>

              <div className="my-5 space-y-4 text-xs sm:text-sm text-amber-100/90 leading-relaxed max-h-[42vh] overflow-y-auto pr-1">
                <blockquote className="rounded-2xl border-l-4 border-amber-400 bg-amber-400/10 p-3 italic text-amber-200">
                  {activeLetter.content}
                </blockquote>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <p className="font-bold text-amber-300">💡 Câu hỏi suy ngẫm:</p>
                  <p className="mt-1 text-calm-fog">{activeLetter.reflectionQuestion}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleLetterToChat(activeLetter)}
                  className="w-full flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 py-3 text-xs font-bold text-slate-950 shadow-lg hover:bg-amber-300 active:scale-95 transition-all"
                >
                  <MessageCircleHeart size={15} />
                  <span>Ngồi Xuống Mở Lòng Với AI</span>
                </button>
                <button
                  type="button"
                  onClick={onCloseLetter}
                  className="w-full sm:w-auto rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-semibold text-calm-fog hover:text-white"
                >
                  Cất vào túi thư
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls Bar (Mobile Joystick + Emote Bar + Actions) */}
      <footer className="pointer-events-auto flex items-end justify-between gap-3 pt-4">
        {/* Virtual Touch Joystick (Visible on touch devices / mobile) */}
        <div className="relative flex items-center justify-center">
          <div
            ref={joystickBaseRef}
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onMouseDown={handleJoystickTouchStart}
            onMouseMove={isDraggingJoystick ? handleJoystickMove : undefined}
            onMouseUp={handleJoystickEnd}
            className="relative grid h-28 w-28 place-items-center rounded-full border-2 border-white/20 bg-slate-950/60 backdrop-blur-lg shadow-2xl touch-none select-none active:border-emerald-400/50"
          >
            <div
              className="h-12 w-12 rounded-full bg-gradient-to-tr from-emerald-500 to-calm-lichen shadow-lg border border-white/40 transition-transform"
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              }}
            />
          </div>
        </div>

        {/* Emote Quick Bar (Center) */}
        <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/80 p-1.5 backdrop-blur-xl shadow-2xl">
          {EMOTE_OPTIONS.map((emote) => (
            <button
              key={emote.id}
              type="button"
              onClick={() => onTriggerEmote(emote.emoji)}
              className="grid h-9 w-9 place-items-center rounded-full text-base hover:bg-white/15 active:scale-125 transition-all"
              title={emote.label}
            >
              {emote.emoji}
            </button>
          ))}
        </div>

        {/* Jump & Action Buttons (Right) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSprinting(!isSprinting)}
            className={`grid h-12 w-12 place-items-center rounded-full border text-xs font-bold shadow-xl backdrop-blur-md active:scale-90 transition-all ${
              isSprinting
                ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-amber-500/30'
                : 'border-white/20 bg-slate-950/70 text-white hover:bg-white/15'
            }`}
            title="Chạy nhanh"
          >
            <Zap size={18} />
          </button>
          <button
            type="button"
            onClick={handleJumpPress}
            className="grid h-14 w-14 place-items-center rounded-full border-2 border-emerald-400/60 bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold shadow-xl active:scale-90 transition-all"
            title="Nhảy (Space)"
          >
            <span className="text-sm">JUMP</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
