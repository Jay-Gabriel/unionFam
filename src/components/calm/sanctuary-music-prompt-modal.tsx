'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Sparkles, Music, Leaf } from 'lucide-react';

interface SanctuaryMusicPromptModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function SanctuaryMusicPromptModal({
  isOpen,
  onAccept,
  onDecline,
}: SanctuaryMusicPromptModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-calm-lichen/40 bg-gradient-to-b from-[#253327]/98 via-[#1c271e]/98 to-[#131d15]/98 p-6 sm:p-7 text-calm-paper-white shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
        >
          {/* Ambient light glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-calm-pollen/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-calm-lichen/20 blur-3xl" />

          <div className="relative z-10 space-y-5 text-center">
            {/* Animated Icon */}
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-calm-lichen/25 via-calm-pollen/20 to-emerald-500/20 border border-calm-lichen/40 shadow-[0_0_25px_rgba(185,198,165,0.3)]">
              <Music size={28} className="text-calm-pollen animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-calm-lichen/40 bg-calm-lichen/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-calm-lichen">
                <Leaf size={12} /> Không Gian Chữa Lành
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Hòa mình vào không gian tĩnh lặng?
              </h3>
              <p className="text-xs sm:text-[13px] text-calm-fog/90 leading-relaxed max-w-xs mx-auto">
                Life Lab đã chuẩn bị âm thanh tần số chữa lành <strong>432Hz</strong> giúp bạn lắng đọng tâm trí, giải tỏa áp lực và trò chuyện nhẹ nhõm hơn.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onDecline}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-calm-fog hover:text-white hover:bg-white/10 transition active:scale-95"
              >
                <VolumeX size={14} />
                <span>Giữ yên lặng</span>
              </button>

              <button
                type="button"
                onClick={onAccept}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-calm-lichen via-emerald-400 to-calm-pollen px-5 py-3 text-xs sm:text-sm font-bold text-black shadow-[0_0_20px_rgba(185,198,165,0.4)] hover:scale-105 active:scale-95 transition-all"
              >
                <Volume2 size={16} />
                <span>Bật âm thanh & Vào trò chuyện</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
