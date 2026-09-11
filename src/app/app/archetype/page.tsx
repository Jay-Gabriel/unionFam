'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, Compass, Shield, Zap, Download } from 'lucide-react';
import { ARCHETYPES, LifeArchetypeCardModal } from '@/components/calm/life-archetype-card';

export default function ArchetypeSharePage() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') || 'creator';
  const [modalOpen, setModalOpen] = useState(() => searchParams.get('modal') === 'true');

  const archetype = ARCHETYPES[typeParam] || ARCHETYPES.creator;

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 text-calm-paper-white">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[36px] border border-calm-lichen/30 bg-gradient-to-b from-[#1b2b20]/90 to-[#0e1711]/90 p-8 sm:p-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-calm-pollen/40 bg-calm-pollen/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-calm-pollen mb-4">
          <Sparkles size={14} /> Khám Phá Bản Thể · Life Lab
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          Căn Cước Tâm Lý & Bản Đồ Tâm Hồn
        </h1>
        <p className="mx-auto max-w-2xl text-sm sm:text-base text-calm-fog leading-relaxed mb-8">
          Mỗi người mang trong mình một nguyên mẫu độc bản với những điểm mù tiềm thức và siêu năng lực chờ được đánh thức.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-calm-pollen via-[#f7e4b5] to-calm-pollen px-7 py-3.5 text-sm font-bold text-calm-deep-moss shadow-[0_6px_25px_rgba(238,213,150,0.4)] transition hover:scale-105 active:scale-95"
          >
            <Sparkles size={16} />
            <span>Mở & Tải Thẻ Căn Cước Tâm Lý 9:16</span>
          </button>
          <Link
            href="/app/conversations/new"
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition"
          >
            <span>Trò chuyện cùng AI LifeLab</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Grid of All Archetypes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">4 Nguyên Mẫu Tâm Lý Khởi Đầu</h2>
          <span className="text-xs text-calm-lichen">Khám phá và nhận diện bản thân</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(ARCHETYPES).map(([key, arch]) => (
            <div
              key={key}
              onClick={() => setModalOpen(true)}
              className="cursor-pointer group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] hover:border-calm-pollen/50 hover:bg-white/[0.08] p-6 transition-all duration-300 shadow-glass"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="rounded-full bg-calm-pollen/15 border border-calm-pollen/30 px-3 py-1 text-[10px] font-bold text-calm-pollen">
                  {arch.subtitle}
                </span>
                <span className="text-xs text-calm-fog group-hover:text-calm-pollen transition">Xem thẻ 9:16 →</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-calm-pollen transition mb-1">{arch.name}</h3>
              <p className="text-xs text-calm-fog italic mb-4">“{arch.quote}”</p>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-calm-lichen">
                <span>⚡ {arch.energyFrequency}</span>
                <span className="font-semibold text-white">Tải ảnh Story</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LifeArchetypeCardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        archetypeKey={typeParam}
      />
    </div>
  );
}
