import React from 'react';
import { Compass, Sparkles, ArrowDown } from 'lucide-react';

interface ThreeArchesSceneProps {
  onSelectPortal: (portal: 'story_chat' | 'experiment' | 'wisdom') => void;
  onScrollToContent: () => void;
}

export const ThreeArchesScene: React.FC<ThreeArchesSceneProps> = ({
  onSelectPortal,
  onScrollToContent,
}) => {
  return (
    <div className="relative w-full h-screen min-h-[720px] flex flex-col justify-between items-center overflow-hidden select-none">
      
      {/* 1. Subtle Life Lab Compass Logo Seal (Top Left, no navbar) */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-stone-950/70 border-2 border-amber-300/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.6)]">
          <Compass className="w-6 h-6 text-amber-300 animate-spin-slow" />
        </div>
        <div>
          <span className="font-cinzel tracking-[0.3em] text-xs font-bold text-amber-100 block drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            LIFE LAB
          </span>
          <span className="text-[10px] text-amber-200 tracking-widest uppercase font-serif drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Sanctuary V8.7
          </span>
        </div>
      </div>

      {/* 2. Top Royalty Banner Title: Script Style "Hiểu điều đang diễn ra" */}
      <div className="relative z-20 pt-8 md:pt-12 text-center px-4 max-w-4xl">
        <h1
          className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-[68px] text-[#fff685] font-normal leading-tight tracking-wide"
          style={{
            textShadow: '0 3px 12px rgba(10, 8, 25, 0.75), 0 0 25px rgba(255, 235, 120, 0.95), 0 0 50px rgba(245, 158, 11, 0.6)',
          }}
        >
          Hiểu điều đang diễn ra. Nhìn rõ điều quan trọng.
        </h1>
        <p
          className="font-cinzel text-xs sm:text-sm md:text-base text-amber-100 tracking-[0.3em] uppercase mt-2 md:mt-3 font-semibold"
          style={{
            textShadow: '0 2px 6px rgba(0, 0, 0, 0.85), 0 0 12px rgba(255, 215, 80, 0.6)',
          }}
        >
          HỆ THỐNG ĐỒNG HÀNH PHẢN CHIẾU CHO NGƯỜI ĐI LÀM • LIFE LAB BETA
        </p>
      </div>

      {/* 3. THE 3 CLASSICAL IONIC / ROMAN ARCHES ASSEMBLY (With 4 3D Fluted Columns & Volumetric Inner Glow) */}
      <div className="relative z-20 w-full max-w-6xl px-4 my-auto flex items-end justify-center pb-2 md:pb-6">
        
        {/* Container for the 3 Gates and 4 Classical Pillars */}
        <div className="relative w-full max-w-5xl flex items-end justify-center">

          {/* COLUMN 1: LEFT-MOST PILLAR */}
          <div className="relative z-20 flex flex-col items-center flex-shrink-0 w-7 sm:w-10 md:w-12 h-[340px] sm:h-[420px] md:h-[460px]">
            {/* Capital (Đầu cột mạ vàng đen) */}
            <div className="w-10 sm:w-14 md:w-16 h-5 bg-gradient-to-b from-stone-900 to-stone-800 border-2 border-amber-300 rounded-t-sm shadow-[0_0_15px_rgba(255,215,80,0.6)]" />
            <div className="w-8 sm:w-11 md:w-13 h-2 bg-amber-400/90" />
            {/* Shaft (Thân cột cẩm thạch trắng có rãnh khía 3D) */}
            <div
              className="flex-1 w-full rounded-xs shadow-[inset_0_0_10px_rgba(0,0,0,0.35),0_0_15px_rgba(255,255,255,0.4)]"
              style={{
                background:
                  'repeating-linear-gradient(to right, #b5aea4 0px, #f2efe9 4px, #ffffff 8px, #d5cebf 12px, #b5aea4 16px)',
              }}
            />
            {/* Base (Chân cột hoa cương đen viền vàng) */}
            <div className="w-8 sm:w-11 md:w-13 h-2 bg-amber-400/90" />
            <div className="w-10 sm:w-14 md:w-16 h-6 bg-gradient-to-t from-stone-950 to-stone-800 border-2 border-amber-300/80 rounded-b-sm shadow-[0_0_15px_rgba(0,0,0,0.8)]" />
          </div>

          {/* CỔNG 1 (LEFT GATE) */}
          <div
            onClick={() => onSelectPortal('story_chat')}
            className="group relative flex-1 flex flex-col justify-between items-center h-[340px] sm:h-[420px] md:h-[460px] cursor-pointer transition-transform duration-500 hover:-translate-y-2 z-10 px-1 sm:px-3"
          >
            {/* Soft Golden Volumetric Inner Glow */}
            <div className="absolute inset-x-2 top-2 bottom-0 rounded-t-full bg-gradient-to-t from-transparent via-amber-300/10 to-amber-200/25 pointer-events-none group-hover:from-amber-400/15 group-hover:via-amber-300/25 group-hover:to-amber-100/35 transition-all duration-500" />

            {/* The Semi-circular Arch Vault at Top (ONLY top, left, right borders - NO BOTTOM BORDER) */}
            <div className="absolute top-0 w-full aspect-[2/1] rounded-t-full border-t-[8px] border-l-[8px] border-r-[8px] border-b-0 sm:border-t-[10px] sm:border-l-[10px] sm:border-r-[10px] sm:border-b-0 border-[#ba74be] group-hover:border-[#ffd65c] transition-all duration-500 shadow-[0_0_35px_rgba(186,116,190,0.7)] group-hover:shadow-[0_0_60px_rgba(255,214,92,0.95)] pointer-events-none" />

            {/* Glowing Golden Text Inside Arch (Super Crisp with Dark Under-shadow) */}
            <div className="text-center my-auto px-2 z-10 pt-8 sm:pt-12">
              <p
                className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-extrabold text-[#fff47a] leading-tight group-hover:scale-105 transition-transform duration-300"
                style={{
                  textShadow:
                    '0 3px 6px rgba(10, 8, 25, 0.85), 0 0 16px rgba(255, 230, 110, 0.9), 0 0 35px rgba(255, 215, 80, 0.6)',
                }}
              >
                Khoảng Lặng<br />Để Nhìn Lại
              </p>
            </div>

            {/* Bottom Gate Label (Crisp & High Contrast) */}
            <div className="text-center pb-6 sm:pb-8 z-10">
              <span
                className="font-cinzel text-xs sm:text-sm md:text-base tracking-[0.25em] text-[#fff275] font-extrabold uppercase group-hover:text-white transition-colors"
                style={{
                  textShadow: '0 2px 5px rgba(0, 0, 0, 0.9), 0 0 10px rgba(255, 215, 80, 0.8)',
                }}
              >
                — Phiên Đầu Tiên —
              </span>
            </div>
          </div>

          {/* COLUMN 2: CENTER-LEFT PILLAR */}
          <div className="relative z-20 flex flex-col items-center flex-shrink-0 w-7 sm:w-10 md:w-12 h-[340px] sm:h-[420px] md:h-[460px]">
            <div className="w-10 sm:w-14 md:w-16 h-5 bg-gradient-to-b from-stone-900 to-stone-800 border-2 border-amber-300 rounded-t-sm shadow-[0_0_15px_rgba(255,215,80,0.6)]" />
            <div className="w-8 sm:w-11 md:w-13 h-2 bg-amber-400/90" />
            <div
              className="flex-1 w-full rounded-xs shadow-[inset_0_0_10px_rgba(0,0,0,0.35),0_0_15px_rgba(255,255,255,0.4)]"
              style={{
                background:
                  'repeating-linear-gradient(to right, #b5aea4 0px, #f2efe9 4px, #ffffff 8px, #d5cebf 12px, #b5aea4 16px)',
              }}
            />
            <div className="w-8 sm:w-11 md:w-13 h-2 bg-amber-400/90" />
            <div className="w-10 sm:w-14 md:w-16 h-6 bg-gradient-to-t from-stone-950 to-stone-800 border-2 border-amber-300/80 rounded-b-sm shadow-[0_0_15px_rgba(0,0,0,0.8)]" />
          </div>

          {/* CỔNG 2 (CENTER GATE) */}
          <div
            onClick={() => onSelectPortal('experiment')}
            className="group relative flex-1 flex flex-col justify-between items-center h-[340px] sm:h-[420px] md:h-[460px] cursor-pointer transition-transform duration-500 hover:-translate-y-3 z-10 px-1 sm:px-3"
          >
            {/* Soft Golden Volumetric Inner Glow */}
            <div className="absolute inset-x-2 top-2 bottom-0 rounded-t-full bg-gradient-to-t from-transparent via-amber-300/12 to-amber-200/30 pointer-events-none group-hover:from-amber-400/20 group-hover:via-amber-300/30 group-hover:to-amber-100/40 transition-all duration-500" />

            {/* Top Vault Arch (No Bottom Border) */}
            <div className="absolute top-0 w-full aspect-[2/1] rounded-t-full border-t-[8px] border-l-[8px] border-r-[8px] border-b-0 sm:border-t-[10px] sm:border-l-[10px] sm:border-r-[10px] sm:border-b-0 border-[#ba74be] group-hover:border-[#ffd65c] transition-all duration-500 shadow-[0_0_35px_rgba(186,116,190,0.7)] group-hover:shadow-[0_0_60px_rgba(255,214,92,0.95)] pointer-events-none" />

            <div className="text-center my-auto px-2 z-10 pt-8 sm:pt-12">
              <p
                className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-extrabold text-[#fff47a] leading-tight group-hover:scale-105 transition-transform duration-300"
                style={{
                  textShadow:
                    '0 3px 6px rgba(10, 8, 25, 0.85), 0 0 16px rgba(255, 230, 110, 0.9), 0 0 35px rgba(255, 215, 80, 0.6)',
                }}
              >
                Thử Nghiệm<br />Trong Đời Sống
              </p>
            </div>

            <div className="text-center pb-6 sm:pb-8 z-10">
              <span
                className="font-cinzel text-xs sm:text-sm md:text-base tracking-[0.25em] text-[#fff275] font-extrabold uppercase group-hover:text-white transition-colors"
                style={{
                  textShadow: '0 2px 5px rgba(0, 0, 0, 0.9), 0 0 10px rgba(255, 215, 80, 0.8)',
                }}
              >
                — Bước Thử Nhỏ —
              </span>
            </div>
          </div>

          {/* COLUMN 3: CENTER-RIGHT PILLAR */}
          <div className="relative z-20 flex flex-col items-center flex-shrink-0 w-7 sm:w-10 md:w-12 h-[340px] sm:h-[420px] md:h-[460px]">
            <div className="w-10 sm:w-14 md:w-16 h-5 bg-gradient-to-b from-stone-900 to-stone-800 border-2 border-amber-300 rounded-t-sm shadow-[0_0_15px_rgba(255,215,80,0.6)]" />
            <div className="w-8 sm:w-11 md:w-13 h-2 bg-amber-400/90" />
            <div
              className="flex-1 w-full rounded-xs shadow-[inset_0_0_10px_rgba(0,0,0,0.35),0_0_15px_rgba(255,255,255,0.4)]"
              style={{
                background:
                  'repeating-linear-gradient(to right, #b5aea4 0px, #f2efe9 4px, #ffffff 8px, #d5cebf 12px, #b5aea4 16px)',
              }}
            />
            <div className="w-8 sm:w-11 md:w-13 h-2 bg-amber-400/90" />
            <div className="w-10 sm:w-14 md:w-16 h-6 bg-gradient-to-t from-stone-950 to-stone-800 border-2 border-amber-300/80 rounded-b-sm shadow-[0_0_15px_rgba(0,0,0,0.8)]" />
          </div>

          {/* CỔNG 3 (RIGHT GATE) */}
          <div
            onClick={() => onSelectPortal('wisdom')}
            className="group relative flex-1 flex flex-col justify-between items-center h-[340px] sm:h-[420px] md:h-[460px] cursor-pointer transition-transform duration-500 hover:-translate-y-2 z-10 px-1 sm:px-3"
          >
            {/* Soft Golden Volumetric Inner Glow */}
            <div className="absolute inset-x-2 top-2 bottom-0 rounded-t-full bg-gradient-to-t from-transparent via-amber-300/10 to-amber-200/25 pointer-events-none group-hover:from-amber-400/15 group-hover:via-amber-300/25 group-hover:to-amber-100/35 transition-all duration-500" />

            {/* Top Vault Arch (No Bottom Border) */}
            <div className="absolute top-0 w-full aspect-[2/1] rounded-t-full border-t-[8px] border-l-[8px] border-r-[8px] border-b-0 sm:border-t-[10px] sm:border-l-[10px] sm:border-r-[10px] sm:border-b-0 border-[#ba74be] group-hover:border-[#ffd65c] transition-all duration-500 shadow-[0_0_35px_rgba(186,116,190,0.7)] group-hover:shadow-[0_0_60px_rgba(255,214,92,0.95)] pointer-events-none" />

            <div className="text-center my-auto px-2 z-10 pt-8 sm:pt-12">
              <p
                className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-extrabold text-[#fff47a] leading-tight group-hover:scale-105 transition-transform duration-300"
                style={{
                  textShadow:
                    '0 3px 6px rgba(10, 8, 25, 0.85), 0 0 16px rgba(255, 230, 110, 0.9), 0 0 35px rgba(255, 215, 80, 0.6)',
                }}
              >
                Học Từ<br />Trải Nghiệm Thật
              </p>
            </div>

            <div className="text-center pb-6 sm:pb-8 z-10">
              <span
                className="font-cinzel text-xs sm:text-sm md:text-base tracking-[0.25em] text-[#fff275] font-extrabold uppercase group-hover:text-white transition-colors"
                style={{
                  textShadow: '0 2px 5px rgba(0, 0, 0, 0.9), 0 0 10px rgba(255, 215, 80, 0.8)',
                }}
              >
                — Đúc Kết Cá Nhân —
              </span>
            </div>
          </div>

          {/* COLUMN 4: RIGHT-MOST PILLAR */}
          <div className="relative z-20 flex flex-col items-center flex-shrink-0 w-7 sm:w-10 md:w-12 h-[340px] sm:h-[420px] md:h-[460px]">
            <div className="w-10 sm:w-14 md:w-16 h-5 bg-gradient-to-b from-stone-900 to-stone-800 border-2 border-amber-300 rounded-t-sm shadow-[0_0_15px_rgba(255,215,80,0.6)]" />
            <div className="w-8 sm:w-11 md:w-13 h-2 bg-amber-400/90" />
            <div
              className="flex-1 w-full rounded-xs shadow-[inset_0_0_10px_rgba(0,0,0,0.35),0_0_15px_rgba(255,255,255,0.4)]"
              style={{
                background:
                  'repeating-linear-gradient(to right, #b5aea4 0px, #f2efe9 4px, #ffffff 8px, #d5cebf 12px, #b5aea4 16px)',
              }}
            />
            <div className="w-8 sm:w-11 md:w-13 h-2 bg-amber-400/90" />
            <div className="w-10 sm:w-14 md:w-16 h-6 bg-gradient-to-t from-stone-950 to-stone-800 border-2 border-amber-300/80 rounded-b-sm shadow-[0_0_15px_rgba(0,0,0,0.8)]" />
          </div>

        </div>

      </div>

      {/* 4. THE 3 WHITE NEON BRANCHING LINES (Harmonic S-Curves matching Screenshot 21-24-42) */}
      <div className="absolute bottom-0 w-full max-w-5xl h-72 pointer-events-none z-20 flex justify-center">
        <svg className="w-full h-full" viewBox="0 0 1000 350" preserveAspectRatio="none">
          <defs>
            <filter id="superNeonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Shoreline Neon Trim Left (C-Curve on water shore) */}
          <path
            d="M 450,290 C 340,285 160,250 140,25"
            fill="none"
            stroke="#ffffff"
            strokeWidth="7"
            filter="url(#superNeonGlow)"
            className="drop-shadow-[0_0_18px_#ffffff]"
          />

          {/* Outer Shoreline Neon Trim Right (C-Curve on water shore) */}
          <path
            d="M 550,290 C 660,285 840,250 860,25"
            fill="none"
            stroke="#ffffff"
            strokeWidth="7"
            filter="url(#superNeonGlow)"
            className="drop-shadow-[0_0_18px_#ffffff]"
          />

          {/* Main Highway Neon Trunk at Bottom */}
          <path
            d="M 465,350 L 465,285 C 465,210 230,225 210,15"
            fill="none"
            stroke="#ffffff"
            strokeWidth="9"
            filter="url(#superNeonGlow)"
            className="drop-shadow-[0_0_22px_#ffffff]"
          />

          {/* Center Branch -> Gate 2 */}
          <path
            d="M 500,350 L 500,285 C 500,200 500,110 500,15"
            fill="none"
            stroke="#ffffff"
            strokeWidth="11"
            filter="url(#superNeonGlow)"
            className="drop-shadow-[0_0_26px_#ffffff]"
          />

          {/* Right Branch -> Gate 3 */}
          <path
            d="M 535,350 L 535,285 C 535,210 770,225 790,15"
            fill="none"
            stroke="#ffffff"
            strokeWidth="9"
            filter="url(#superNeonGlow)"
            className="drop-shadow-[0_0_22px_#ffffff]"
          />
        </svg>
      </div>

      {/* 5. FLOATING NARRATIVE GLASS CARD (Super Clean & Legible) */}
      <div className="absolute bottom-6 left-6 z-30 max-w-xs sm:max-w-md p-4 sm:p-5 rounded-2xl bg-stone-950/90 border border-amber-300/30 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] text-stone-100 animate-fadeIn">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300 font-bold">
            Life Lab Beta · First Session
          </span>
        </div>
        <p className="font-serif text-xs sm:text-sm text-stone-200 leading-relaxed italic drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          "Chúng ta không cần giải quyết toàn bộ cuộc sống hôm nay. Bạn có thể bắt đầu từ một điều đang chiếm nhiều suy nghĩ hoặc năng lượng nhất lúc này."
        </p>
      </div>

      {/* 6. Bottom Center Scroll Prompt */}
      <div
        onClick={onScrollToContent}
        className="relative z-30 pb-4 flex flex-col items-center gap-1 cursor-pointer group text-amber-200/90 hover:text-white transition-colors"
      >
        <span className="font-cinzel text-[11px] tracking-[0.3em] uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          Cuộn Xuống Khám Phá Chi Tiết
        </span>
        <ArrowDown className="w-4 h-4 animate-bounce text-amber-300 group-hover:text-amber-100" />
      </div>

    </div>
  );
};
