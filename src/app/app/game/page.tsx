'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Sprout } from 'lucide-react';
import { SoulKnotGame } from '@/components/calm/soul-knot-game';

export default function GamePage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-calm-warm-ivory hover:bg-white/10 transition"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Tổng quan</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-calm-pollen/40 bg-calm-pollen/15 px-3.5 py-1 text-[11px] font-bold text-calm-pollen shadow-[0_0_12px_rgba(238,213,150,0.2)]">
          <Sparkles size={13} />
          <span>Game Tương Tác Tâm Trí Life Lab</span>
        </div>
      </div>

      <SoulKnotGame />
    </div>
  );
}
