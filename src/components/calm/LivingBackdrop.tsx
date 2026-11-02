import React, { useEffect, useRef } from 'react';

interface LivingBackdropProps {
  children?: React.ReactNode;
}

interface PollenParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  color: string;
}

export function LivingBackdrop({ children }: LivingBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#C6D6B4', '#EED596', '#FAF8F2', '#8FA083'];
    const particleCount = 75;
    const particles: PollenParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.6 + 0.2,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.35 + 0.1),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-calm-forest-dusk text-calm-paper-white overflow-hidden">
      {/* Ambient Forest Radial Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(circle at 80% 15%, rgba(198,214,180,0.18), transparent 50%), radial-gradient(circle at 15% 85%, rgba(89,106,85,0.25), transparent 55%), linear-gradient(180deg, #263128 0%, #1d2720 55%, #131b15 100%)',
          }}
        />
        {/* Soft floating pollen canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      </div>

      {/* Content Scrim */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
}
