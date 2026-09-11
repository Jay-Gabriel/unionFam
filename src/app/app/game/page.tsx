'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Sprout, Gamepad2, Compass } from 'lucide-react';
import { PlayableLifeGame } from '@/components/calm/playable-life-game';
import { SoulKnotGame } from '@/components/calm/soul-knot-game';

export default function GamePage() {
  const [activeTab, setActiveTab] = useState<'runner' | 'knot'>('runner');

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-calm-warm-ivory hover:bg-white/10 transition"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Tổng quan</span>
        </Link>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('runner')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'runner'
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-black shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                : 'text-calm-fog hover:text-white'
            }`}
          >
            <Gamepad2 size={14} />
            <span>1. Vượt Bão Tâm Trí (Chơi Ngay)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('knot')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'knot'
                ? 'bg-gradient-to-r from-calm-pollen to-[#ebd08c] text-black shadow-[0_0_15px_rgba(238,213,150,0.4)]'
                : 'text-calm-fog hover:text-white'
            }`}
          >
            <Compass size={14} />
            <span>2. La Bàn Gieo Hạt Gỡ Nút</span>
          </button>
        </div>
      </div>

      {/* Render Selected Game */}
      {activeTab === 'runner' ? <PlayableLifeGame /> : <SoulKnotGame />}
    </div>
  );
}

