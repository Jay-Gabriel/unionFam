'use client';

import React from 'react';
import { Leaf } from 'lucide-react';

interface LeafLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'bloom' | 'card';
  label?: string;
  className?: string;
}

/**
 * Organic 3-leaf breathing & blooming loader for Life Lab
 * Directly using Lucide's Leaf icon (same as Brand logo in sidebar):
 * - Leaf 1 (Hiểu mình - Calm Lichen)
 * - Leaf 2 (Chọn hướng - Pollen Gold)
 * - Leaf 3 (Trở thành - Warm Ivory)
 */
export function LeafLoader({
  size = 'md',
  variant = 'inline',
  label,
  className = '',
}: LeafLoaderProps) {
  if (variant === 'inline') {
    const iconSizes = {
      sm: 14,
      md: 17,
      lg: 22,
    };

    return (
      <div className={`inline-flex items-center gap-2 py-1 ${className}`} aria-label={label || 'Đang xử lý…'}>
        <div className="flex items-center gap-1.5">
          {/* Leaf 1 - Hiểu mình (Lichen) */}
          <div className="animate-leaf-wave-1 text-calm-lichen" title="Hiểu mình">
            <Leaf size={iconSizes[size]} className="-rotate-12 fill-calm-lichen/35 drop-shadow-[0_2px_8px_rgba(185,198,165,0.4)]" />
          </div>

          {/* Leaf 2 - Chọn hướng (Pollen) */}
          <div className="animate-leaf-wave-2 text-calm-pollen" title="Chọn hướng">
            <Leaf size={iconSizes[size]} className="rotate-12 fill-calm-pollen/35 drop-shadow-[0_2px_8px_rgba(229,196,120,0.4)]" />
          </div>

          {/* Leaf 3 - Trở thành (Warm Ivory) */}
          <div className="animate-leaf-wave-3 text-calm-warm-ivory" title="Trở thành">
            <Leaf size={iconSizes[size]} className="rotate-45 fill-calm-warm-ivory/35 drop-shadow-[0_2px_8px_rgba(247,245,238,0.4)]" />
          </div>
        </div>
        {label && (
          <span className="text-[12.5px] font-medium tracking-wide text-calm-warm-ivory/90 ml-1">
            {label}
          </span>
        )}
      </div>
    );
  }

  // Bloom / Card variant for full panels & empty states
  const dimensions = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const leafSizes = {
    sm: 22,
    md: 30,
    lg: 40,
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-6 ${className}`} aria-label={label || 'Đang mở khoảng lặng…'}>
      <div className={`relative ${dimensions[size]} flex items-center justify-center`}>
        {/* Soft living aura */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-calm-lichen/20 via-calm-pollen/15 to-transparent blur-2xl animate-pulse" />

        {/* 3 Leaves Triquetra Harmony */}
        <div className="relative w-full h-full flex items-center justify-center animate-spin-slow">
          {/* Leaf 1 (Top / Understanding - Calm Lichen) */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-leaf-breathe-1 text-calm-lichen">
            <Leaf
              size={leafSizes[size]}
              className="-rotate-12 fill-calm-lichen/35 drop-shadow-[0_4px_14px_rgba(185,198,165,0.55)]"
            />
          </div>

          {/* Leaf 2 (Bottom-Left / Choosing - Pollen Gold) */}
          <div className="absolute bottom-0 left-0 animate-leaf-breathe-2 text-calm-pollen">
            <Leaf
              size={leafSizes[size]}
              className="rotate-[105deg] fill-calm-pollen/35 drop-shadow-[0_4px_14px_rgba(229,196,120,0.55)]"
            />
          </div>

          {/* Leaf 3 (Bottom-Right / Becoming - Warm Ivory) */}
          <div className="absolute bottom-0 right-0 animate-leaf-breathe-3 text-calm-warm-ivory">
            <Leaf
              size={leafSizes[size]}
              className="-rotate-[135deg] fill-calm-warm-ivory/35 drop-shadow-[0_4px_14px_rgba(247,245,238,0.55)]"
            />
          </div>

          {/* Center golden dew dot (like the logo's pollen dot) */}
          <span className="absolute h-3 w-3 rounded-full bg-calm-pollen shadow-[0_0_14px_#E5C478] border border-white/60" />
        </div>
      </div>

      {label && (
        <p className="text-sm font-medium tracking-wide text-calm-warm-ivory/90 animate-pulse text-center">
          {label}
        </p>
      )}
    </div>
  );
}
