'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Leaf } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  isLeafPetal?: boolean;
  rotation?: number;
  rotSpeed?: number;
}

export function LeafCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [typing, setTyping] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Positional coordinates
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const lastTrailPos = useRef({ x: -100, y: -100 });
  const velocity = useRef({ x: 0, y: 0 });
  const angleRef = useRef(-15);
  const particlesRef = useRef<Particle[]>([]);
  const isVisible = useRef(false);

  useEffect(() => {
    // Only enable on devices with fine pointer (mouse), disable on touch/mobile
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!hasFinePointer) return;

    setEnabled(true);

    const handlePointerMove = (e: PointerEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible.current) {
        isVisible.current = true;
        currentPos.current = { x: e.clientX, y: e.clientY };
        lastTrailPos.current = { x: e.clientX, y: e.clientY };
      }

      // Check what element we are hovering
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = !!target.closest(
          'a, button, [role="button"], input, textarea, select, label, .clickable, [data-interactive="true"]'
        );
        const isInputField = !!target.closest('input, textarea, [contenteditable="true"]');
        setHovered(isInteractive);
        setTyping(isInputField);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      setClicking(true);
      // Spawn burst of 6 glowing flower petals and pollen sparks on click
      const colors = ['#E5C478', '#B9C6A5', '#F7F5EE', '#9FC5A7'];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const speed = Math.random() * 50 + 35;
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 4 + 3,
          color: colors[i % colors.length],
          alpha: 1,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 15,
          life: 0,
          maxLife: 0.55,
          isLeafPetal: true,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 8,
        });
      }
    };

    const handlePointerUp = () => setClicking(false);
    const handlePointerLeave = () => {
      isVisible.current = false;
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
    };
    const handlePointerEnter = () => {
      isVisible.current = true;
      if (cursorRef.current) cursorRef.current.style.opacity = '1';
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('mouseleave', handlePointerLeave);
    document.addEventListener('mouseenter', handlePointerEnter);

    // Canvas resize for ambient pollen particles
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    // Animation frame loop for smooth leaf physics and pollen trail
    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth lerping
      const lerpFactor = 0.24;
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;

      velocity.current.x = dx;
      velocity.current.y = dy;

      currentPos.current.x += dx * lerpFactor;
      currentPos.current.y += dy * lerpFactor;

      // Natural leaf tilt based on movement direction
      const speed = Math.sqrt(dx * dx + dy * dy);
      if (speed > 1.2) {
        const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 45;
        // Smooth angle rotation
        let angleDiff = (targetAngle - angleRef.current) % 360;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;
        angleRef.current += angleDiff * 0.18;
      }

      // Update Cursor DOM
      if (cursorRef.current && isVisible.current) {
        cursorRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
        cursorRef.current.style.opacity = '1';
      }

      // Spawn pollen trail particles when moving
      const distFromLast = Math.hypot(
        currentPos.current.x - lastTrailPos.current.x,
        currentPos.current.y - lastTrailPos.current.y
      );

      if (distFromLast > 10 && isVisible.current) {
        lastTrailPos.current = { ...currentPos.current };
        if (particlesRef.current.length < 45) {
          const colors = ['#B9C6A5', '#E5C478', '#F7F5EE', '#9FC5A7'];
          particlesRef.current.push({
            x: currentPos.current.x + (Math.random() - 0.5) * 8,
            y: currentPos.current.y + (Math.random() - 0.5) * 8,
            size: Math.random() * 3 + 1.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 0.85,
            vx: (Math.random() - 0.5) * 22 - velocity.current.x * 0.06,
            vy: (Math.random() - 0.5) * 22 - velocity.current.y * 0.06 + 12,
            life: 0,
            maxLife: Math.random() * 0.7 + 0.4,
          });
        }
      }

      // Render Canvas Particles
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.life += dt;
            if (p.life >= p.maxLife) {
              particlesRef.current.splice(i, 1);
              continue;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            const progress = p.life / p.maxLife;
            const currentAlpha = p.alpha * (1 - progress);

            ctx.save();
            ctx.globalAlpha = currentAlpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;

            if (p.isLeafPetal && p.rotation !== undefined && p.rotSpeed !== undefined) {
              p.rotation += p.rotSpeed * dt;
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rotation);
              ctx.beginPath();
              ctx.ellipse(0, 0, p.size * (1 - progress * 0.4), p.size * 0.5 * (1 - progress * 0.4), 0, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseleave', handlePointerLeave);
      document.removeEventListener('mouseenter', handlePointerEnter);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Ambient Pollen Trail Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[99998]"
        aria-hidden="true"
      />

      {/* Living Leaf Cursor */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[99999] -ml-2 -mt-2 transition-opacity duration-300 will-change-transform"
        style={{ opacity: 0 }}
        aria-hidden="true"
      >
        <div
          className={`relative flex items-center justify-center transition-transform duration-200 ease-out ${
            clicking ? 'scale-75 rotate-12' : hovered ? 'scale-135 -rotate-6' : typing ? 'scale-90 opacity-60' : 'scale-100'
          }`}
          style={{
            transform: `rotate(${angleRef.current}deg)`,
          }}
        >
          {/* Ambient organic aura around leaf */}
          <div
            className={`absolute -inset-3 rounded-full blur-md transition-all duration-300 ${
              hovered
                ? 'bg-calm-pollen/45 scale-130 opacity-100'
                : 'bg-calm-lichen/25 scale-100 opacity-70'
            }`}
          />

          {/* Botanical Leaf Body */}
          <Leaf
            className={`h-5 w-5 transition-all duration-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)] ${
              hovered
                ? 'text-calm-pollen fill-calm-pollen/60 stroke-[2.4] scale-110'
                : 'text-calm-lichen fill-calm-lichen/45 stroke-[2]'
            }`}
          />

          {/* Golden Pollen Core Dot */}
          <span
            className={`absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-white/90 transition-all duration-300 ${
              hovered
                ? 'bg-calm-pollen scale-150 shadow-[0_0_10px_#E5C478]'
                : 'bg-calm-warm-ivory scale-100 shadow-[0_0_5px_rgba(255,255,255,0.9)]'
            }`}
          />
        </div>
      </div>
    </>
  );
}
