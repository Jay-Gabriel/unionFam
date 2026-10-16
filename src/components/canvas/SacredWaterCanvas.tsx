import React, { useEffect, useRef } from 'react';

interface GlitterPoint {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  color: string;
  isFloating?: boolean;
  floatVx?: number;
  floatVy?: number;
}

export const SacredWaterCanvas: React.FC = () => {
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
      initGlitter();
    };
    window.addEventListener('resize', handleResize);

    // Over 1200+ multi-layer golden diamond glitter particles
    let glitterParticles: GlitterPoint[] = [];

    const initGlitter = () => {
      glitterParticles = [];
      const colors = ['#ffffff', '#fffbeb', '#fef08a', '#fde047', '#facc15', '#f59e0b'];
      const centerX = width * 0.5;

      // 1. Glitter along the semicircular shoreline terrace
      const terraceRadius = width * 0.65;
      const terraceCenterY = height * 0.64;
      for (let i = 0; i < 400; i++) {
        const angle = Math.PI * 0.08 + Math.random() * (Math.PI * 0.84);
        const rOffset = (Math.random() - 0.5) * 45;
        const r = terraceRadius + rOffset;
        const x = centerX + Math.cos(angle) * r;
        const y = terraceCenterY + Math.sin(angle) * r * 0.38;

        glitterParticles.push({
          x,
          y,
          size: Math.random() * 3 + 1,
          baseAlpha: Math.random() * 0.7 + 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.06 + 0.03,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      // 2. Dense Golden Glitter Highway (from shoreline terrace down to bottom)
      const pathTopY = height * 0.67;
      for (let i = 0; i < 650; i++) {
        const progress = Math.random(); // 0 at top, 1 at bottom
        const y = pathTopY + progress * (height - pathTopY);
        const pathWidthAtY = width * (0.16 + progress * 0.34);
        const x = centerX + (Math.random() - 0.5) * pathWidthAtY;

        glitterParticles.push({
          x,
          y,
          size: Math.random() * 3.2 + 0.8,
          baseAlpha: Math.random() * 0.8 + 0.2,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.07 + 0.02,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      // 3. Floating Sparkle Motes (Golden Fairy Dust hovering in the air)
      for (let i = 0; i < 150; i++) {
        glitterParticles.push({
          x: centerX + (Math.random() - 0.5) * (width * 0.7),
          y: height * 0.5 + Math.random() * (height * 0.45),
          size: Math.random() * 2.2 + 0.6,
          baseAlpha: Math.random() * 0.6 + 0.2,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.04 + 0.01,
          color: colors[Math.floor(Math.random() * colors.length)],
          isFloating: true,
          floatVx: (Math.random() - 0.5) * 0.4,
          floatVy: -(Math.random() * 0.5 + 0.2),
        });
      }
    };

    initGlitter();

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // ==========================================
      // 1. SKY: DAYLIGHT AZURE BLUE WITH GOLDEN GLOW (Matching Screenshot 21-24-42)
      // ==========================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.68);
      skyGrad.addColorStop(0, '#5f91cb');
      skyGrad.addColorStop(0.35, '#84abd9');
      skyGrad.addColorStop(0.65, '#b0c5e3');
      skyGrad.addColorStop(1, '#c5b8d8');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.68);

      // Soft Golden Sunburst / Divine Backlight behind Arches
      const sunX = width * 0.5;
      const sunY = height * 0.28;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, width * 0.48);
      sunGrad.addColorStop(0, 'rgba(255, 246, 200, 0.55)');
      sunGrad.addColorStop(0.3, 'rgba(254, 230, 160, 0.35)');
      sunGrad.addColorStop(0.7, 'rgba(235, 195, 230, 0.15)');
      sunGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, width * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // ==========================================
      // 2. RENAISSANCE CUMULUS CLOUDS
      // ==========================================
      ctx.save();
      const cloudY = height * 0.32;
      for (let i = 0; i < 6; i++) {
        const cx = width * (0.08 + i * 0.17) + Math.sin(time * 0.25 + i * 1.5) * 18;
        const cy = cloudY + Math.cos(time * 0.2 + i) * 10;
        const cGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, width * 0.22);
        cGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        cGrad.addColorStop(0.5, 'rgba(240, 235, 245, 0.2)');
        cGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = cGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, width * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ==========================================
      // 3. SACRED LAKE WATER (Deep Cerulean / Sapphire Surface)
      // ==========================================
      const waterTop = height * 0.63;
      const waterGrad = ctx.createLinearGradient(0, waterTop, 0, height);
      waterGrad.addColorStop(0, '#1c4278');
      waterGrad.addColorStop(0.35, '#132f57');
      waterGrad.addColorStop(0.75, '#0b1c36');
      waterGrad.addColorStop(1, '#071224');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, waterTop, width, height - waterTop);

      // Water Ripple Light Waves & Specular Caustics
      ctx.save();
      for (let w = 0; w < 7; w++) {
        const y = waterTop + w * ((height - waterTop) / 7);
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= width; x += 30) {
          const dy = Math.sin(x * 0.007 + time * 1.4 + w * 1.1) * (2.2 + w * 0.4);
          ctx.lineTo(x, y + dy);
        }
        ctx.strokeStyle = `rgba(255, 240, 180, ${0.14 - w * 0.015})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // Golden Road Reflection Blur on Lake Water
      const reflGrad = ctx.createRadialGradient(width * 0.5, height * 0.78, 10, width * 0.5, height * 0.82, width * 0.35);
      reflGrad.addColorStop(0, 'rgba(255, 215, 80, 0.25)');
      reflGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
      reflGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = reflGrad;
      ctx.fillRect(width * 0.1, waterTop, width * 0.8, height - waterTop);
      ctx.restore();

      // ==========================================
      // 4. SEMICIRCULAR SHORELINE TERRACE (Glittering Gold Arch Rim)
      // ==========================================
      const centerX = width * 0.5;
      const terraceRadius = width * 0.65;
      const terraceCenterY = height * 0.64;

      ctx.save();
      // Outer glow of terrace
      ctx.beginPath();
      ctx.ellipse(centerX, terraceCenterY, terraceRadius, terraceRadius * 0.38, 0, 0, Math.PI);
      ctx.strokeStyle = 'rgba(255, 215, 80, 0.85)';
      ctx.lineWidth = 12;
      ctx.shadowColor = 'rgba(255, 225, 110, 0.95)';
      ctx.shadowBlur = 24;
      ctx.stroke();

      // Inner brilliant gold band
      ctx.beginPath();
      ctx.ellipse(centerX, terraceCenterY, terraceRadius - 4, (terraceRadius - 4) * 0.38, 0, 0, Math.PI);
      ctx.strokeStyle = 'rgba(255, 245, 175, 0.9)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // ==========================================
      // 5. GOLDEN DIAMOND GLITTER HIGHWAY (Solid shimmering gold carpet)
      // ==========================================
      const pathTopY = height * 0.67;
      const pathTopW = width * 0.16;
      const pathBotW = width * 0.46;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX - pathTopW * 0.5, pathTopY);
      ctx.lineTo(centerX + pathTopW * 0.5, pathTopY);
      ctx.lineTo(centerX + pathBotW * 0.5, height);
      ctx.lineTo(centerX - pathBotW * 0.5, height);
      ctx.closePath();

      // Multi-stop Radiant Gold Gradient
      const pathGrad = ctx.createLinearGradient(0, height, 0, pathTopY);
      pathGrad.addColorStop(0, '#fff494');
      pathGrad.addColorStop(0.25, '#ffd24d');
      pathGrad.addColorStop(0.65, '#f59e0b');
      pathGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = pathGrad;
      ctx.shadowColor = 'rgba(255, 220, 100, 0.85)';
      ctx.shadowBlur = 32;
      ctx.fill();

      // Sparkling texture layer over path
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.restore();

      // ==========================================
      // 6. 1200+ GLITTER SPECKLES & FLOATING GOLD FAIRY DUST
      // ==========================================
      ctx.save();
      for (const p of glitterParticles) {
        p.phase += p.speed;

        // Animate floating motes upward gently
        if (p.isFloating) {
          p.x += (p.floatVx || 0) + Math.sin(time + p.phase) * 0.3;
          p.y += p.floatVy || -0.2;
          if (p.y < height * 0.45) {
            p.y = height * 0.95;
            p.x = centerX + (Math.random() - 0.5) * (width * 0.6);
          }
        }

        const twinkle = Math.sin(p.phase);
        if (twinkle > 0.05) {
          const currentAlpha = p.baseAlpha * (0.4 + twinkle * 0.6);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.8 + twinkle * 0.45), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha;
          ctx.shadowColor = '#fff59d';
          ctx.shadowBlur = p.size > 2 ? 10 : 5;
          ctx.fill();
        }
      }
      ctx.restore();

      // ==========================================
      // 7. WHITE WATER LILIES (LOTUS) WITH RADIANT GLOW (Floating on both sides)
      // ==========================================
      const renderLotus = (lx: number, ly: number, scale: number) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.scale(scale, scale);

        // Water reflection ring
        ctx.beginPath();
        ctx.ellipse(0, 10, 36, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10, 25, 55, 0.65)';
        ctx.fill();

        // Round Green Lotus Pad Leaf with slight split
        ctx.beginPath();
        ctx.ellipse(0, 10, 44, 16, 0, 0, Math.PI * 1.85);
        ctx.fillStyle = '#1e5443';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.fill();

        // White Lotus Petals with Delicate Ivory Shimmer
        const petalCount = 11;
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI - Math.PI * 0.5;
          ctx.save();
          ctx.rotate(angle * 0.65);
          ctx.beginPath();
          ctx.ellipse(0, -20, 10, 26, 0, 0, Math.PI * 2);
          const petalGrad = ctx.createLinearGradient(0, 0, 0, -42);
          petalGrad.addColorStop(0, '#e0eafc');
          petalGrad.addColorStop(0.65, '#ffffff');
          petalGrad.addColorStop(1, '#fffde4');
          ctx.fillStyle = petalGrad;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.restore();
        }

        // Golden Radiant Center Stamen
        ctx.beginPath();
        ctx.arc(0, -8, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcf33';
        ctx.shadowColor = '#fff176';
        ctx.shadowBlur = 14;
        ctx.fill();

        ctx.restore();
      };

      // Left Floating Lotus
      const leftLotusY = height * 0.81 + Math.sin(time * 1.3) * 3.5;
      renderLotus(width * 0.15, leftLotusY, Math.min(width / 1350, 1.15));

      // Right Floating Lotus
      const rightLotusY = height * 0.83 + Math.cos(time * 1.2) * 3.5;
      renderLotus(width * 0.85, rightLotusY, Math.min(width / 1350, 1.25));

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
