import React, { useEffect, useRef } from 'react';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  disabled?: boolean;
}

/**
 * Thẻ tương tác chiều sâu 3D siêu mượt 60fps (dùng rAF spring-lerp trực tiếp lên DOM, 0 React re-render khi di chuột).
 */
export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  intensity = 7,
  disabled = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ rx: 0, ry: 0, gx: 50, gy: 50, active: 0 });
  const currentRef = useRef({ rx: 0, ry: 0, gx: 50, gy: 50, active: 0 });

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const stepAnimation = () => {
    const cur = currentRef.current;
    const tgt = targetRef.current;

    const factor = 0.14;
    cur.rx += (tgt.rx - cur.rx) * factor;
    cur.ry += (tgt.ry - cur.ry) * factor;
    cur.gx += (tgt.gx - cur.gx) * factor;
    cur.gy += (tgt.gy - cur.gy) * factor;
    cur.active += (tgt.active - cur.active) * factor;

    const scale = 1 + cur.active * 0.012;

    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg) scale3d(${scale.toFixed(4)}, ${scale.toFixed(4)}, 1)`;
    }

    if (glowRef.current) {
      glowRef.current.style.opacity = (cur.active * 0.52).toFixed(3);
      glowRef.current.style.background = `radial-gradient(circle at ${cur.gx.toFixed(1)}% ${cur.gy.toFixed(1)}%, rgba(238, 213, 150, 0.26), transparent 58%)`;
    }

    const settled =
      Math.abs(tgt.rx - cur.rx) < 0.01 &&
      Math.abs(tgt.ry - cur.ry) < 0.01 &&
      Math.abs(tgt.active - cur.active) < 0.01;

    if (!settled) {
      rafRef.current = requestAnimationFrame(stepAnimation);
    } else {
      rafRef.current = null;
      if (tgt.active === 0 && cardRef.current) {
        cardRef.current.style.transform = '';
      }
    }
  };

  const ensureRunning = () => {
    if (rafRef.current === null && !disabled && !prefersReducedMotion) {
      rafRef.current = requestAnimationFrame(stepAnimation);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    targetRef.current = {
      ry: (px - 0.5) * intensity * 2,
      rx: (0.5 - py) * intensity * 2,
      gx: px * 100,
      gy: py * 100,
      active: 1,
    };
    ensureRunning();
  };

  const handleMouseLeave = () => {
    targetRef.current = { rx: 0, ry: 0, gx: 50, gy: 50, active: 0 };
    ensureRunning();
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d' }}
      className={`relative will-change-transform ${className}`}
    >
      {!disabled && !prefersReducedMotion && (
        <div
          ref={glowRef}
          aria-hidden="true"
          style={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
        />
      )}
      {children}
    </div>
  );
};
