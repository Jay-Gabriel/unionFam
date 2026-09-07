'use client';

import React, { useEffect, useRef } from 'react';

interface FloatingLeaf {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  vx: number;
  vy: number;
  swaySpeed: number;
  swayOffset: number;
  swayWidth: number;
  color: string;
  fillAlpha: number;
  scaleX: number;
  scaleY: number;
  targetScaleX: number;
}

interface Spore {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  pulseOffset: number;
  vy: number;
  vx: number;
}

interface ClickBurst {
  x: number;
  y: number;
  particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotSpeed: number;
    alpha: number;
    life: number;
    maxLife: number;
  }>;
}

export function FloatingSanctuaryAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -500, y: -500, vx: 0, vy: 0, lastX: -500, lastY: -500 });
  const burstsRef = useRef<ClickBurst[]>([]);

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
    window.addEventListener('resize', handleResize, { passive: true });

    // Track mouse speed and position for wind physics
    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - mouseRef.current.lastX;
      const dy = e.clientY - mouseRef.current.lastY;
      mouseRef.current.vx = dx * 0.4;
      mouseRef.current.vy = dy * 0.4;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    // Click blossom burst
    const handlePointerDown = (e: PointerEvent) => {
      const colors = ['#B9C6A5', '#E5C478', '#F7F5EE', '#9FC5A7', '#D9CB8F'];
      const particles = [];
      const count = 10;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 45 + 30;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 15,
          size: Math.random() * 5 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 6,
          alpha: 0.9,
          life: 0,
          maxLife: Math.random() * 0.5 + 0.4,
        });
      }
      burstsRef.current.push({ x: e.clientX, y: e.clientY, particles });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    // Initialize 14 Floating Leaves
    const leafColors = ['#B9C6A5', '#E5C478', '#A4B896', '#F7F5EE', '#8E9E82'];
    const leaves: FloatingLeaf[] = [];
    const leafCount = Math.min(14, Math.max(8, Math.floor(width / 120)));

    for (let i = 0; i < leafCount; i++) {
      leaves.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 9 + 8,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        vx: (Math.random() - 0.5) * 12 + 6,
        vy: Math.random() * 18 + 12,
        swaySpeed: Math.random() * 1.5 + 0.8,
        swayOffset: Math.random() * Math.PI * 2,
        swayWidth: Math.random() * 30 + 15,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        fillAlpha: Math.random() * 0.25 + 0.2,
        scaleX: 1,
        scaleY: 1,
        targetScaleX: (Math.random() - 0.5) * 0.8 + 0.9,
      });
    }

    // Initialize 25 Glowing Spores / Fireflies
    const spores: Spore[] = [];
    const sporeColors = ['#E5C478', '#B9C6A5', '#FFF9E6'];
    for (let i = 0; i < 24; i++) {
      spores.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        color: sporeColors[Math.floor(Math.random() * sporeColors.length)],
        alpha: Math.random() * 0.6 + 0.2,
        pulseSpeed: Math.random() * 2 + 1.2,
        pulseOffset: Math.random() * Math.PI * 2,
        vy: -(Math.random() * 10 + 6),
        vx: (Math.random() - 0.5) * 8,
      });
    }

    // Helper to draw a botanical leaf shape on canvas
    const drawLeaf = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      rotation: number,
      scaleX: number,
      color: string,
      alpha: number
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(scaleX, 1);
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      // Draw smooth curved leaf contour
      ctx.moveTo(0, -size);
      ctx.bezierCurveTo(size * 0.8, -size * 0.5, size * 0.8, size * 0.5, 0, size);
      ctx.bezierCurveTo(-size * 0.8, size * 0.5, -size * 0.8, -size * 0.5, 0, -size);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();

      // Delicate leaf vein
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.8);
      ctx.lineTo(0, size * 0.8);
      ctx.stroke();

      ctx.restore();
    };

    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Dampen mouse velocity
      mouseRef.current.vx *= 0.92;
      mouseRef.current.vy *= 0.92;

      // 1. Update & Render Glowing Spores
      for (const spore of spores) {
        spore.y += spore.vy * dt;
        spore.x += (spore.vx + Math.sin(time * 0.001 * spore.pulseSpeed + spore.pulseOffset) * 6) * dt;

        // Wrap around
        if (spore.y < -10) {
          spore.y = height + 10;
          spore.x = Math.random() * width;
        }
        if (spore.x < -10) spore.x = width + 10;
        if (spore.x > width + 10) spore.x = -10;

        // Pulsing glow
        const currentAlpha =
          spore.alpha * (0.6 + 0.4 * Math.sin(time * 0.002 * spore.pulseSpeed + spore.pulseOffset));

        ctx.save();
        ctx.fillStyle = spore.color;
        ctx.globalAlpha = Math.max(0, currentAlpha);
        ctx.shadowColor = spore.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(spore.x, spore.y, spore.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Update & Render Floating Leaves with Wind Interaction
      for (const leaf of leaves) {
        // Natural swaying
        const sway = Math.sin(time * 0.001 * leaf.swaySpeed + leaf.swayOffset);
        leaf.y += leaf.vy * dt;
        leaf.x += (leaf.vx + sway * leaf.swayWidth) * dt;
        leaf.rotation += leaf.rotSpeed;

        // 3D Leaf tumbling effect (scaleX sine wave)
        leaf.scaleX = Math.sin(time * 0.0015 * leaf.swaySpeed + leaf.swayOffset);

        // Wind disturbance from mouse cursor
        const dx = leaf.x - mouseRef.current.x;
        const dy = leaf.y - mouseRef.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140 && dist > 1) {
          const force = (1 - dist / 140) * 80;
          leaf.x += (dx / dist) * force * dt + mouseRef.current.vx * dt * 0.5;
          leaf.y += (dy / dist) * force * dt + mouseRef.current.vy * dt * 0.5;
          leaf.rotation += (dx / dist) * 0.05;
        }

        // Wrap around screen edges
        if (leaf.y > height + 20) {
          leaf.y = -20;
          leaf.x = Math.random() * width;
        }
        if (leaf.x > width + 20) leaf.x = -20;
        if (leaf.x < -20) leaf.x = width + 20;

        drawLeaf(
          ctx,
          leaf.x,
          leaf.y,
          leaf.size,
          leaf.rotation,
          leaf.scaleX,
          leaf.color,
          leaf.fillAlpha
        );
      }

      // 3. Update & Render Click Bursts
      for (let bIndex = burstsRef.current.length - 1; bIndex >= 0; bIndex--) {
        const burst = burstsRef.current[bIndex];
        let aliveParticles = 0;

        for (const p of burst.particles) {
          p.life += dt;
          if (p.life < p.maxLife) {
            aliveParticles++;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 60 * dt; // Gravity
            p.rotation += p.rotSpeed * dt;

            const progress = p.life / p.maxLife;
            const currentAlpha = p.alpha * (1 - progress);

            drawLeaf(ctx, p.x, p.y, p.size * (1 - progress * 0.4), p.rotation, Math.cos(progress * Math.PI * 2), p.color, currentAlpha);
          }
        }

        if (aliveParticles === 0) {
          burstsRef.current.splice(bIndex, 1);
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10 opacity-70 transition-opacity duration-1000"
      aria-hidden="true"
    />
  );
}
