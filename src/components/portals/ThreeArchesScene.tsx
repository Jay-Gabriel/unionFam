import React from 'react';
import { Compass, Sparkles, ArrowDown, Leaf } from 'lucide-react';

interface ThreeArchesSceneProps {
  onSelectPortal: (portal: 'story_chat' | 'experiment' | 'wisdom') => void;
  onScrollToContent: () => void;
}

export const ThreeArchesScene: React.FC<ThreeArchesSceneProps> = ({
  onSelectPortal,
  onScrollToContent,
}) => {
  return (
    <div className="relative w-full min-h-[720px] flex flex-col justify-between items-center overflow-hidden select-none py-12">
      
      {/* 1. Subtle Life Lab Leaf & Compass Seal */}
      <div className="relative z-20 pt-4 text-center px-4 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-calm-deep-moss/80 border border-calm-lichen/30 backdrop-blur-md mb-4 shadow-soft">
          <Leaf className="w-3.5 h-3.5 text-calm-lichen fill-calm-lichen/20 animate-pulse" />
          <span className="font-serif text-xs font-medium tracking-widest text-calm-lichen uppercase">
            Ba Cổng Vòm Đời Sống • Living Sanctuary
          </span>
        </div>

        <h2
          className="font-serif text-3xl sm:text-5xl md:text-6xl text-calm-warm-ivory font-light leading-tight tracking-wide"
          style={{
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(198, 214, 180, 0.3)',
          }}
        >
          Hiểu điều đang diễn ra. <span className="italic font-normal text-calm-lichen">Nhìn rõ điều quan trọng.</span>
        </h2>
        <p className="font-sans text-xs sm:text-sm text-calm-fog/80 tracking-[0.2em] uppercase mt-3 font-medium">
          KHÔNG GIAN ĐỒNG HÀNH PHẢN CHIẾU & THIẾT KẾ CUỘC SỐNG
        </p>
      </div>

      {/* 2. THE 3 LIVING SANCTUARY ARCHES ASSEMBLY (With Moss-hewn Stone Pillars & Atmospheric Glow) */}
      <div className="relative z-20 w-full max-w-5xl px-4 my-8 flex items-end justify-center">
        
        {/* Container for the 3 Gates and 4 Classical Moss Pillars */}
        <div className="relative w-full max-w-4xl flex items-end justify-center">

          {/* COLUMN 1: LEFT-MOST PILLAR */}
          <div className="relative z-20 flex flex-col items-center flex-shrink-0 w-6 sm:w-9 md:w-11 h-[320px] sm:h-[400px] md:h-[440px]">
            {/* Capital */}
            <div className="w-9 sm:w-13 md:w-15 h-5 bg-gradient-to-b from-calm-deep-moss to-calm-forest-dusk border-2 border-calm-lichen/60 rounded-t-sm shadow-[0_0_12px_rgba(198,214,180,0.4)]" />
            <div className="w-7 sm:w-10 md:w-12 h-2 bg-calm-lichen/80" />
            {/* Shaft */}
            <div
              className="flex-1 w-full rounded-xs shadow-[inset_0_0_10px_rgba(0,0,0,0.5),0_0_12px_rgba(198,214,180,0.2)]"
              style={{
                background:
                  'repeating-linear-gradient(to right, #263128 0px, #3d4a3b 4px, #596a55 8px, #324034 12px, #263128 16px)',
              }}
            />
            {/* Base */}
            <div className="w-7 sm:w-10 md:w-12 h-2 bg-calm-lichen/80" />
            <div className="w-9 sm:w-13 md:w-15 h-6 bg-gradient-to-t from-stone-950 to-calm-deep-moss border-2 border-calm-lichen/60 rounded-b-sm shadow-[0_0_12px_rgba(0,0,0,0.8)]" />
          </div>

          {/* CỔNG 1 (LEFT GATE) — CON ĐƯỜNG THỨC TỈNH & AI CHAT */}
          <div
            onClick={() => onSelectPortal('story_chat')}
            className="group relative flex-1 flex flex-col justify-between items-center h-[320px] sm:h-[400px] md:h-[440px] cursor-pointer transition-transform duration-500 hover:-translate-y-2 z-10 px-1 sm:px-3"
          >
            {/* Volumetric Inner Mist */}
            <div className="absolute inset-x-2 top-2 bottom-0 rounded-t-full bg-gradient-to-t from-transparent via-calm-lichen/10 to-calm-pollen/20 pointer-events-none group-hover:via-calm-lichen/20 group-hover:to-calm-pollen/35 transition-all duration-500" />

            {/* Arch Vault Border */}
            <div className="absolute top-0 w-full aspect-[2/1] rounded-t-full border-t-[8px] border-l-[8px] border-r-[8px] border-b-0 sm:border-t-[10px] sm:border-l-[10px] sm:border-r-[10px] sm:border-b-0 border-calm-lichen/50 group-hover:border-calm-pollen transition-all duration-500 shadow-[0_0_30px_rgba(198,214,180,0.4)] group-hover:shadow-[0_0_50px_rgba(238,213,150,0.8)] pointer-events-none" />

            {/* Glowing Text Inside Arch */}
            <div className="text-center my-auto px-2 z-10 pt-8 sm:pt-12">
              <span className="inline-block text-[10px] sm:text-xs text-calm-pollen font-semibold tracking-widest uppercase mb-1 drop-shadow">
                CỔNG 1 • TRỌNG TÂM
              </span>
              <p
                className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-normal text-calm-warm-ivory leading-tight group-hover:scale-105 transition-transform duration-300"
                style={{
                  textShadow:
                    '0 3px 6px rgba(10, 20, 12, 0.9), 0 0 16px rgba(198, 214, 180, 0.7)',
                }}
              >
                Khoảng Lặng<br />Để Nhìn Lại
              </p>
              <p className="text-[11px] sm:text-xs text-calm-fog/80 mt-2 max-w-[180px] mx-auto hidden sm:block">
                Con Đường Thức Tỉnh & Đàm thoại AI Companion V8.7.5
              </p>
            </div>

            {/* Bottom Gate Label */}
            <div className="text-center pb-6 sm:pb-8 z-10">
              <span className="font-sans text-[11px] sm:text-xs tracking-[0.2em] text-calm-lichen font-semibold uppercase group-hover:text-white transition-colors bg-calm-deep-moss/70 px-3 py-1 rounded-full border border-calm-lichen/30">
                — Vào Đối Thoại —
              </span>
            </div>
          </div>

          {/* COLUMN 2: CENTER-LEFT PILLAR */}
          <div className="relative z-20 flex flex-col items-center flex-shrink-0 w-6 sm:w-9 md:w-11 h-[320px] sm:h-[400px] md:h-[440px]">
            <div className="w-9 sm:w-13 md:w-15 h-5 bg-gradient-to-b from-calm-deep-moss to-calm-forest-dusk border-2 border-calm-lichen/60 rounded-t-sm shadow-[0_0_12px_rgba(198,214,180,0.4)]" />
            <div className="w-7 sm:w-10 md:w-12 h-2 bg-calm-lichen/80" />
            <div
              className="flex-1 w-full rounded-xs shadow-[inset_0_0_10px_rgba(0,0,0,0.5),0_0_12px_rgba(198,214,180,0.2)]"
              style={{
                background:
                  'repeating-linear-gradient(to right, #263128 0px, #3d4a3b 4px, #596a55 8px, #324034 12px, #263128 16px)',
              }}
            />
            <div className="w-7 sm:w-10 md:w-12 h-2 bg-calm-lichen/80" />
            <div className="w-9 sm:w-13 md:w-15 h-6 bg-gradient-to-t from-stone-950 to-calm-deep-moss border-2 border-calm-lichen/60 rounded-b-sm shadow-[0_0_12px_rgba(0,0,0,0.8)]" />
          </div>

          {/* CỔNG 2 (CENTER GATE) — PHÒNG THÍ NGHIỆM ĐỜI SỐNG */}
          <div
            onClick={() => onSelectPortal('experiment')}
            className="group relative flex-1 flex flex-col justify-between items-center h-[320px] sm:h-[400px] md:h-[440px] cursor-pointer transition-transform duration-500 hover:-translate-y-3 z-10 px-1 sm:px-3"
          >
            {/* Volumetric Inner Glow */}
            <div className="absolute inset-x-2 top-2 bottom-0 rounded-t-full bg-gradient-to-t from-transparent via-emerald-400/10 to-teal-300/20 pointer-events-none group-hover:via-emerald-400/20 group-hover:to-teal-200/30 transition-all duration-500" />

            {/* Arch Vault Border */}
            <div className="absolute top-0 w-full aspect-[2/1] rounded-t-full border-t-[8px] border-l-[8px] border-r-[8px] border-b-0 sm:border-t-[10px] sm:border-l-[10px] sm:border-r-[10px] sm:border-b-0 border-emerald-400/50 group-hover:border-emerald-300 transition-all duration-500 shadow-[0_0_30px_rgba(52,211,153,0.35)] group-hover:shadow-[0_0_50px_rgba(52,211,153,0.7)] pointer-events-none" />

            <div className="text-center my-auto px-2 z-10 pt-8 sm:pt-12">
              <span className="inline-block text-[10px] sm:text-xs text-emerald-300 font-semibold tracking-widest uppercase mb-1 drop-shadow">
                CỔNG 2 • HÀNH ĐỘNG
              </span>
              <p
                className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-normal text-calm-warm-ivory leading-tight group-hover:scale-105 transition-transform duration-300"
                style={{
                  textShadow:
                    '0 3px 6px rgba(10, 20, 12, 0.9), 0 0 16px rgba(52, 211, 153, 0.6)',
                }}
              >
                Thử Nghiệm<br />Trong Đời Sống
              </p>
              <p className="text-[11px] sm:text-xs text-calm-fog/80 mt-2 max-w-[180px] mx-auto hidden sm:block">
                Tiếp nhận bài tập vi mô 7 ngày & Điểm danh kiểm chứng
              </p>
            </div>

            <div className="text-center pb-6 sm:pb-8 z-10">
              <span className="font-sans text-[11px] sm:text-xs tracking-[0.2em] text-emerald-300 font-semibold uppercase group-hover:text-white transition-colors bg-calm-deep-moss/70 px-3 py-1 rounded-full border border-emerald-400/30">
                — 7 Ngày Vi Mô —
              </span>
            </div>
          </div>

          {/* COLUMN 3: CENTER-RIGHT PILLAR */}
          <div className="relative z-20 flex flex-col items-center flex-shrink-0 w-6 sm:w-9 md:w-11 h-[320px] sm:h-[400px] md:h-[440px]">
            <div className="w-9 sm:w-13 md:w-15 h-5 bg-gradient-to-b from-calm-deep-moss to-calm-forest-dusk border-2 border-calm-lichen/60 rounded-t-sm shadow-[0_0_12px_rgba(198,214,180,0.4)]" />
            <div className="w-7 sm:w-10 md:w-12 h-2 bg-calm-lichen/80" />
            <div
              className="flex-1 w-full rounded-xs shadow-[inset_0_0_10px_rgba(0,0,0,0.5),0_0_12px_rgba(198,214,180,0.2)]"
              style={{
                background:
                  'repeating-linear-gradient(to right, #263128 0px, #3d4a3b 4px, #596a55 8px, #324034 12px, #263128 16px)',
              }}
            />
            <div className="w-7 sm:w-10 md:w-12 h-2 bg-calm-lichen/80" />
            <div className="w-9 sm:w-13 md:w-15 h-6 bg-gradient-to-t from-stone-950 to-calm-deep-moss border-2 border-calm-lichen/60 rounded-b-sm shadow-[0_0_12px_rgba(0,0,0,0.8)]" />
          </div>

          {/* CỔNG 3 (RIGHT GATE) — NGÂN HÀNG KÝ ỨC */}
          <div
            onClick={() => onSelectPortal('wisdom')}
            className="group relative flex-1 flex flex-col justify-between items-center h-[320px] sm:h-[400px] md:h-[440px] cursor-pointer transition-transform duration-500 hover:-translate-y-2 z-10 px-1 sm:px-3"
          >
            {/* Volumetric Inner Glow */}
            <div className="absolute inset-x-2 top-2 bottom-0 rounded-t-full bg-gradient-to-t from-transparent via-purple-400/10 to-indigo-300/20 pointer-events-none group-hover:via-purple-400/20 group-hover:to-indigo-200/30 transition-all duration-500" />

            {/* Arch Vault Border */}
            <div className="absolute top-0 w-full aspect-[2/1] rounded-t-full border-t-[8px] border-l-[8px] border-r-[8px] border-b-0 sm:border-t-[10px] sm:border-l-[10px] sm:border-r-[10px] sm:border-b-0 border-purple-400/50 group-hover:border-purple-300 transition-all duration-500 shadow-[0_0_30px_rgba(192,132,252,0.35)] group-hover:shadow-[0_0_50px_rgba(192,132,252,0.7)] pointer-events-none" />

            <div className="text-center my-auto px-2 z-10 pt-8 sm:pt-12">
              <span className="inline-block text-[10px] sm:text-xs text-purple-300 font-semibold tracking-widest uppercase mb-1 drop-shadow">
                CỔNG 3 • MINH TRIẾT
              </span>
              <p
                className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-normal text-calm-warm-ivory leading-tight group-hover:scale-105 transition-transform duration-300"
                style={{
                  textShadow:
                    '0 3px 6px rgba(10, 20, 12, 0.9), 0 0 16px rgba(192, 132, 252, 0.6)',
                }}
              >
                Học Từ<br />Trải Nghiệm Thật
              </p>
              <p className="text-[11px] sm:text-xs text-calm-fog/80 mt-2 max-w-[180px] mx-auto hidden sm:block">
                Lưu giữ đúc kết nhận thức & Kim chỉ nam dài hạn
              </p>
            </div>

            <div className="text-center pb-6 sm:pb-8 z-10">
              <span className="font-sans text-[11px] sm:text-xs tracking-[0.2em] text-purple-300 font-semibold uppercase group-hover:text-white transition-colors bg-calm-deep-moss/70 px-3 py-1 rounded-full border border-purple-400/30">
                — Ký Ức Sâu Sắc —
              </span>
            </div>
          </div>

          {/* COLUMN 4: RIGHT-MOST PILLAR */}
          <div className="relative z-20 flex flex-col items-center flex-shrink-0 w-6 sm:w-9 md:w-11 h-[320px] sm:h-[400px] md:h-[440px]">
            <div className="w-9 sm:w-13 md:w-15 h-5 bg-gradient-to-b from-calm-deep-moss to-calm-forest-dusk border-2 border-calm-lichen/60 rounded-t-sm shadow-[0_0_12px_rgba(198,214,180,0.4)]" />
            <div className="w-7 sm:w-10 md:w-12 h-2 bg-calm-lichen/80" />
            <div
              className="flex-1 w-full rounded-xs shadow-[inset_0_0_10px_rgba(0,0,0,0.5),0_0_12px_rgba(198,214,180,0.2)]"
              style={{
                background:
                  'repeating-linear-gradient(to right, #263128 0px, #3d4a3b 4px, #596a55 8px, #324034 12px, #263128 16px)',
              }}
            />
            <div className="w-7 sm:w-10 md:w-12 h-2 bg-calm-lichen/80" />
            <div className="w-9 sm:w-13 md:w-15 h-6 bg-gradient-to-t from-stone-950 to-calm-deep-moss border-2 border-calm-lichen/60 rounded-b-sm shadow-[0_0_12px_rgba(0,0,0,0.8)]" />
          </div>

        </div>

      </div>

      {/* 3. Bottom Scroll Indicator */}
      <div className="relative z-20 pb-4 text-center">
        <button
          onClick={onScrollToContent}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-calm-deep-moss/60 hover:bg-calm-moss/80 border border-calm-lichen/30 text-calm-fog text-xs font-sans transition shadow-soft cursor-pointer"
        >
          <span>Khám phá cách hoạt động & triết lý</span>
          <ArrowDown className="w-3.5 h-3.5 text-calm-lichen group-hover:translate-y-1 transition-transform" />
        </button>
      </div>

    </div>
  );
};
