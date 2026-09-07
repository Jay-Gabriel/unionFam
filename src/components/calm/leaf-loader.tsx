'use client';

import React from 'react';

interface LeafLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'bloom' | 'card';
  label?: string;
  className?: string;
}

/**
 * Organic 3-leaf breathing & blooming loader for Life Lab
 * Inspired by the 3 leaves / sprout brand identity:
 * Hiểu mình (Understanding) · Chọn hướng (Choosing) · Trở thành (Becoming)
 */
export function LeafLoader({
  size = 'md',
  variant = 'inline',
  label,
  className = '',
}: LeafLoaderProps) {
  if (variant === 'inline') {
    const leafSizes = {
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
      lg: 'w-4 h-4',
    };

    return (
      <div className={`inline-flex items-center gap-1.5 py-0.5 ${className}`} aria-label={label || 'Đang phản hồi…'}>
        <div className="flex items-center gap-1">
          {/* Leaf 1 - Hiểu mình */}
          <span
            className={`inline-block ${leafSizes[size]} text-calm-lichen animate-leaf-wave-1`}
            title="Hiểu mình"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full -rotate-45 drop-shadow-[0_2px_6px_rgba(185,198,165,0.4)]">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.5 9 8.5 9.8.5.1 1-.3 1-.8v-6.5c-2 0-3.5-1.5-3.5-3.5 0-2.5 2-4.5 4.5-4.5 2 0 3.5 1.5 3.5 3.5 0 2-1.5 3.5-3.5 3.5V20c5.5-.5 9.5-5 9.5-10 0-4.4-3.6-8-8-8z" />
            </svg>
          </span>

          {/* Leaf 2 - Chọn hướng */}
          <span
            className={`inline-block ${leafSizes[size]} text-calm-pollen animate-leaf-wave-2`}
            title="Chọn hướng"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_2px_6px_rgba(229,196,120,0.4)]">
              <path d="M12 3C7.03 3 3 7.03 3 12c0 4.1 2.76 7.56 6.56 8.63.45.13.94-.2.94-.67v-5.46c-1.5 0-2.7-1.2-2.7-2.7 0-1.8 1.4-3.3 3.2-3.3 1.8 0 3.2 1.5 3.2 3.3 0 1.5-1.2 2.7-2.7 2.7v5.46c3.8-.97 6.56-4.53 6.56-8.63 0-4.97-4.03-9-9-9z" />
            </svg>
          </span>

          {/* Leaf 3 - Trở thành */}
          <span
            className={`inline-block ${leafSizes[size]} text-calm-warm-ivory animate-leaf-wave-3`}
            title="Trở thành"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full rotate-45 drop-shadow-[0_2px_6px_rgba(247,245,238,0.4)]">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.5 9 8.5 9.8.5.1 1-.3 1-.8v-6.5c-2 0-3.5-1.5-3.5-3.5 0-2.5 2-4.5 4.5-4.5 2 0 3.5 1.5 3.5 3.5 0 2-1.5 3.5-3.5 3.5V20c5.5-.5 9.5-5 9.5-10 0-4.4-3.6-8-8-8z" />
            </svg>
          </span>
        </div>
        {label && (
          <span className="text-[12px] font-medium tracking-wide text-calm-fog/80 ml-1.5">
            {label}
          </span>
        )}
      </div>
    );
  }

  // Bloom / Card variant for full panels & empty states
  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3.5 p-4 ${className}`} aria-label={label || 'Đang mở khoảng lặng…'}>
      <div className={`relative ${dimensions[size]} flex items-center justify-center`}>
        {/* Ambient glow backdrop */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-calm-lichen/20 via-calm-pollen/15 to-transparent blur-xl animate-pulse" />

        {/* 3 Leaves Triquetra Harmony */}
        <div className="relative w-full h-full flex items-center justify-center animate-spin-slow">
          {/* Leaf 1 (Top / Understanding) */}
          <div className="absolute -top-1 transform -translate-x-1/2 left-1/2 animate-leaf-breathe-1 text-calm-lichen">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-[0_4px_12px_rgba(185,198,165,0.45)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.5 9 8.5 9.8.5.1 1-.3 1-.8v-6.5c-2 0-3.5-1.5-3.5-3.5 0-2.5 2-4.5 4.5-4.5 2 0 3.5 1.5 3.5 3.5 0 2-1.5 3.5-3.5 3.5V20c5.5-.5 9.5-5 9.5-10 0-4.4-3.6-8-8-8z" />
            </svg>
          </div>

          {/* Leaf 2 (Bottom-Left / Choosing) */}
          <div className="absolute bottom-0 left-0 transform rotate-[120deg] animate-leaf-breathe-2 text-calm-pollen">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-[0_4px_12px_rgba(229,196,120,0.45)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.5 9 8.5 9.8.5.1 1-.3 1-.8v-6.5c-2 0-3.5-1.5-3.5-3.5 0-2.5 2-4.5 4.5-4.5 2 0 3.5 1.5 3.5 3.5 0 2-1.5 3.5-3.5 3.5V20c5.5-.5 9.5-5 9.5-10 0-4.4-3.6-8-8-8z" />
            </svg>
          </div>

          {/* Leaf 3 (Bottom-Right / Becoming) */}
          <div className="absolute bottom-0 right-0 transform -rotate-[120deg] animate-leaf-breathe-3 text-calm-warm-ivory">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-[0_4px_12px_rgba(247,245,238,0.45)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.5 9 8.5 9.8.5.1 1-.3 1-.8v-6.5c-2 0-3.5-1.5-3.5-3.5 0-2.5 2-4.5 4.5-4.5 2 0 3.5 1.5 3.5 3.5 0 2-1.5 3.5-3.5 3.5V20c5.5-.5 9.5-5 9.5-10 0-4.4-3.6-8-8-8z" />
            </svg>
          </div>

          {/* Center dew point */}
          <div className="absolute w-2 h-2 rounded-full bg-calm-warm-ivory shadow-[0_0_8px_#F7F5EE]" />
        </div>
      </div>

      {label && (
        <p className="text-xs sm:text-sm font-medium tracking-wide text-calm-warm-ivory/90 animate-pulse text-center">
          {label}
        </p>
      )}
    </div>
  );
}
