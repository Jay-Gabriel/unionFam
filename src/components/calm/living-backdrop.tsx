"use client";

import React from 'react';

interface LivingBackdropProps {
  children?: React.ReactNode;
}

export function LivingBackdrop({ children }: LivingBackdropProps) {
  return (
    <div className="fixed inset-0 overflow-y-auto w-full bg-calm-forest-dusk text-calm-paper-white">
      {/* High-performance ambient atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(circle at 75% 20%, rgba(185,198,165,0.14), transparent 45%), radial-gradient(circle at 20% 80%, rgba(89,106,85,0.18), transparent 50%), linear-gradient(180deg, #263128 0%, #1d2820 68%, #111b15 100%)',
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.04]"
          style={{ backgroundImage: "url('/visuals/living-sanctuary/root-back.svg')" }}
        />
      </div>

      {/* Content Scrim & Content */}
      <div className="relative z-20 w-full h-full min-h-screen bg-calm-forest-dusk/10">
        {children}
      </div>
    </div>
  );
}
