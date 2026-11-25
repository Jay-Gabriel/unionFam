import React from 'react';
import type { LeafMascotMood } from './LeafMascot3D';

interface LeafMascotSvg3DProps {
  mood?: LeafMascotMood;
  className?: string;
}

/**
 * Phiên bản SVG 3D-shaded bầu bĩnh, tròn mềm của Linh vật Chiếc Lá.
 */
export const LeafMascotSvg3D: React.FC<LeafMascotSvg3DProps> = ({
  mood = 'welcoming',
  className = 'w-full h-full',
}) => {
  const isCelebrating = mood === 'celebrating';
  const isCaringOrSafety = mood === 'caring' || mood === 'safety';
  const isThinkingOrListening = mood === 'thinking' || mood === 'listening';

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Linh vật Chiếc Lá UnionFam"
    >
      <defs>
        <radialGradient id="leafBodyGrad" cx="36%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#A9CA94" />
          <stop offset="52%" stopColor="#5F8D64" />
          <stop offset="100%" stopColor="#254B3D" />
        </radialGradient>
        <linearGradient id="leafGlossGrad" x1="20%" y1="12%" x2="78%" y2="75%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.46" />
          <stop offset="45%" stopColor="#E8EDE5" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="orbGlowGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFDF2" />
          <stop offset="45%" stopColor="#EED596" />
          <stop offset="100%" stopColor="#C4996C" />
        </radialGradient>
        <radialGradient id="orbHaloGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EED596" stopOpacity="0.68" />
          <stop offset="100%" stopColor="#EED596" stopOpacity="0" />
        </radialGradient>
        <filter id="leafSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#254B3D" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Soft ground shadow */}
      <ellipse cx="100" cy="182" rx="46" ry="8" fill="#254B3D" opacity="0.13" />

      {/* Curved organic stem */}
      <path
        d="M99 152 C98 166, 91 174, 82 178"
        fill="none"
        stroke="#3A6347"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M99 152 C98 165, 92 173, 84 177"
        fill="none"
        stroke="#8FA083"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Plump Organic Rounded 3D Leaf Body */}
      <g filter="url(#leafSoftShadow)">
        <path
          d="M100 28 C144 34, 170 72, 162 118 C154 148, 128 160, 100 158 C72 160, 46 148, 38 118 C30 72, 56 34, 100 28 Z"
          fill="url(#leafBodyGrad)"
        />
        <path
          d="M100 32 C128 38, 150 66, 146 100 C126 84, 86 72, 52 90 C48 58, 70 36, 100 32 Z"
          fill="url(#leafGlossGrad)"
        />
        <path
          d="M100 42 C100 78, 100 118, 100 153"
          fill="none"
          stroke="#C6D6B4"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M100 76 C84 68, 70 66, 58 70 M100 79 C116 71, 130 69, 142 73 M100 109 C82 102, 66 102, 53 108 M100 112 C118 105, 134 105, 147 111"
          fill="none"
          stroke="#C6D6B4"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.34"
        />
      </g>

      {/* Expressive Face */}
      {isCelebrating ? (
        <g stroke="#182D26" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M72 94 Q80 85 88 94" />
          <path d="M112 94 Q120 85 128 94" />
        </g>
      ) : (
        <g>
          <ellipse cx="80" cy="93" rx="6.4" ry={isThinkingOrListening ? 7.2 : 6.9} fill="#182D26" />
          <ellipse cx="120" cy="93" rx="6.4" ry={isThinkingOrListening ? 7.2 : 6.9} fill="#182D26" />
          <circle cx="82.2" cy="90.4" r="2.3" fill="#FFFFFF" />
          <circle cx="122.2" cy="90.4" r="2.3" fill="#FFFFFF" />
          <circle cx="78.5" cy="95.2" r="1.1" fill="#FFFFFF" opacity="0.7" />
          <circle cx="118.5" cy="95.2" r="1.1" fill="#FFFFFF" opacity="0.7" />
        </g>
      )}

      {/* Soft rosy cheeks */}
      <ellipse cx="67" cy="103" rx="7.5" ry="4.4" fill="#E8A598" opacity="0.58" />
      <ellipse cx="133" cy="103" rx="7.5" ry="4.4" fill="#E8A598" opacity="0.58" />

      {/* Gentle empathetic smile */}
      <path
        d={
          isCaringOrSafety
            ? 'M91 106 Q100 113 109 106'
            : isThinkingOrListening
              ? 'M94 107 Q100 110 106 106'
              : 'M89 105 Q100 116 111 105'
        }
        fill="none"
        stroke="#182D26"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Caring Golden Lantern / Dewdrop Orb */}
      <g transform={isCaringOrSafety ? 'translate(100, 130)' : 'translate(150, 62)'}>
        <circle cx="0" cy="0" r="20" fill="url(#orbHaloGrad)" />
        <circle cx="0" cy="0" r={isCaringOrSafety ? 10 : 8} fill="url(#orbGlowGrad)" />
        <circle cx="-2.5" cy="-2.5" r="2.4" fill="#FFFFFF" opacity="0.85" />
      </g>
    </svg>
  );
};
