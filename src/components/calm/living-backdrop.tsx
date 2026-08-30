"use client";

import React from 'react';
import Image from 'next/image';
import { SanctuaryCanvas } from '@/components/sanctuary-3d/sanctuary-canvas';

interface LivingBackdropProps {
  children?: React.ReactNode;
}

export function LivingBackdrop({ children }: LivingBackdropProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-calm-forest-dusk text-calm-paper-white">
      {/* Three.js Environment with Fallback */}
      <SanctuaryCanvas 
        variant="landing-dusk" 
        fallbackSrc="/visuals/living-sanctuary/hero-poster.svg" 
      />

      {/* Butterfly Focal Point (Maintained via DOM for crispness / placement) */}
      <div className="absolute top-1/4 left-1/4 z-10 pointer-events-none motion-safe:animate-butterfly hidden md:block">
        <Image 
          src="/visuals/living-sanctuary/butterfly.svg" 
          alt="" 
          width={40} 
          height={40} 
          className="opacity-60 drop-shadow-lg"
        />
      </div>

      {/* Content Scrim & Content */}
      <div className="relative z-20 w-full h-full min-h-screen bg-calm-forest-dusk/10">
        {children}
      </div>
    </div>
  );
}
