'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Sprout,
  Play,
  RotateCcw,
  MessageCircleHeart,
  PhoneCall,
  Volume2,
  VolumeX,
  Trophy,
  Flame,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  Heart,
  Scale,
} from 'lucide-react';

interface Obstacle {
  x: number;
  y: number;
  size: number;
  speed: number;
  label: string;
  color: string;
  type: 'danger' | 'clarity' | 'shield';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

const DILEMMAS = [
  {
    id: 'stability_vs_passion',
    question: 'Bạn đang đứng trước một công việc lương ổn định nhưng vắt kiệt tâm trí vs Một dự án đam mê nhưng nhiều bất định. Bạn bước vào cánh cổng nào?',
    leftOption: {
      label: 'Cổng 1: Chọn An Toàn & Tích Lũy',
      sub: 'Chấp nhận áp lực để giữ nền tảng tài chính vững vàng',
      tag: 'Thực Tế & Bền Bỉ',
      color: '#e5c478',
      summary: 'ưu tiên tích lũy nguồn lực và an toàn',
      blindspot: 'Dễ bị cuốn vào vùng an toàn quá lâu khiến ngọn lửa đam mê dần lụi tàn.',
      prompt: 'Mình vừa hoàn thành Game Vượt Bão Tâm Trí và chọn cổng [An Toàn & Tích Lũy]. Mình nhận thấy mình luôn sợ rủi ro và đang kẹt trong vùng an toàn quen thuộc. Life Lab hãy cùng mình tìm cách vừa giữ an toàn tài chính vừa nuôi dưỡng ước mơ nhé.',
    },
    rightOption: {
      label: 'Cổng 2: Dấn Thân Bứt Phá',
      sub: 'Chấp nhận bất định để sống trọn vẹn với khát vọng',
      tag: 'Tự Do & Can Đảm',
      color: '#34d399',
      summary: 'dám đối diện bất định để tìm kiếm sự tự do',
      blindspot: 'Dễ rơi vào khủng hoảng khi kế hoạch bứt phá gặp trục trặc nếu chưa chuẩn bị tâm lý.',
      prompt: 'Mình vừa chơi Game Vượt Bão Tâm Trí và chọn cổng [Dấn Thân Bứt Phá]. Mình khát khao tự do và làm điều ý nghĩa nhưng vẫn còn nhiều lo âu về tương lai bấp bênh. Life Lab hãy cùng mình lên lộ trình thử nghiệm nhỏ để tự tin tiến bước nhé.',
    },
  },
  {
    id: 'people_pleasing',
    question: 'Người thân mong muốn bạn đi theo con đường truyền thống, nhưng trái tim bạn muốn sống một cuộc đời khác biệt. Bạn sẽ làm gì?',
    leftOption: {
      label: 'Cổng 1: Chiều Lòng Kỳ Vọng',
      sub: 'Tránh mâu thuẫn, giữ hòa khí và làm yên lòng mọi người',
      tag: 'Trách Nhiệm & Hòa Hợp',
      color: '#e7bbb5',
      summary: 'thường nhượng bộ để bảo vệ cảm xúc của người khác',
      blindspot: 'Đè nén nhu cầu bản thân dẫn đến sự kiệt quệ và cảm giác uất ức ngầm bên trong.',
      prompt: 'Mình vừa chơi Game Vượt Bão Tâm Trí và nhận ra mình thường có xu hướng [Chiều lòng kỳ vọng gia đình/xã hội] mà bỏ quên mong muốn thật của bản thân. Life Lab hãy giúp mình học cách giao tiếp chân thành và thiết lập ranh giới nhé.',
    },
    rightOption: {
      label: 'Cổng 2: Sống Thật Với Chính Mình',
      sub: 'Dũng cảm bày tỏ quan điểm và tự chịu trách nhiệm cuộc đời',
      tag: 'Chân Thật & Độc Lập',
      color: '#60a5fa',
      summary: 'dám sống thật với giá trị cá nhân',
      blindspot: 'Có thể cảm thấy cô đơn hoặc tội lỗi khi đi ngược lại mong mỏi của người thân yêu.',
      prompt: 'Mình vừa kết thúc Game Vượt Bão Tâm Trí với lựa chọn [Sống thật với chính mình]. Mình muốn xây dựng sự độc lập nhưng không muốn làm tổn thương những người quan trọng. Life Lab hãy cùng mình gỡ nút thắt này nhé.',
    },
  },
];

export function PlayableLifeGame({
  onClose,
  isModal = false,
}: {
  onClose?: () => void;
  isModal?: boolean;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'dilemma' | 'result'>('intro');
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [shieldActive, setShieldActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentDilemmaIndex, setCurrentDilemmaIndex] = useState(0);
  const [chosenOption, setChosenOption] = useState<'left' | 'right' | null>(null);

  // Player Stats for Psychological Synthesis
  const [dodgedCount, setDodgedCount] = useState(0);
  const [clarityCollected, setClarityCollected] = useState(0);
  const [hitCount, setHitCount] = useState(0);

  // Player position & movement
  const playerRef = useRef({
    x: 250,
    y: 350,
    size: 22,
    speed: 7,
    targetX: 250,
    trail: [] as Array<{ x: number; y: number; alpha: number }>,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const gameStartTimeRef = useRef<number>(0);

  // Simple Web Audio API Synthesizer for zen game audio cues
  const playSound = useCallback((type: 'collect' | 'hit' | 'shield' | 'win') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'collect') {
        osc.frequency.setValueAtTime(528, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'shield') {
        osc.frequency.setValueAtTime(432, now);
        osc.frequency.exponentialRampToValueAtTime(648, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'win') {
        osc.frequency.setValueAtTime(528, now);
        osc.frequency.exponentialRampToValueAtTime(1056, now + 0.4);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  }, [soundEnabled]);

  // Create particle burst on events
  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 4 + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        alpha: 1,
        color,
      });
    }
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Start the Game Loop
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setEnergy(100);
    setShieldActive(false);
    setDodgedCount(0);
    setClarityCollected(0);
    setHitCount(0);
    obstaclesRef.current = [];
    particlesRef.current = [];
    playerRef.current.x = 250;
    playerRef.current.y = 350;
    playerRef.current.targetX = 250;
    playerRef.current.trail = [];
    gameStartTimeRef.current = Date.now();
    setCurrentDilemmaIndex(Math.floor(Math.random() * DILEMMAS.length));
  };

  // Main Canvas Animation Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let spawnTimer = 0;
    let currentEnergy = 100;
    let currentScore = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background with subtle night garden trail
      ctx.fillStyle = 'rgba(15, 23, 17, 0.35)';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(185, 198, 165, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 2. Handle Player Movement with Keyboard
      const player = playerRef.current;
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) {
        player.x -= player.speed;
      }
      if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) {
        player.x += player.speed;
      }
      if (keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current['W']) {
        player.y -= player.speed;
      }
      if (keysPressed.current['ArrowDown'] || keysPressed.current['s'] || keysPressed.current['S']) {
        player.y += player.speed;
      }

      // Smooth touch drag interpolation
      player.x += (player.targetX - player.x) * 0.15;

      // Boundary clamp
      player.x = Math.max(player.size + 10, Math.min(width - player.size - 10, player.x));
      player.y = Math.max(player.size + 10, Math.min(height - player.size - 10, player.y));

      // Player Trail
      player.trail.push({ x: player.x, y: player.y, alpha: 0.8 });
      if (player.trail.length > 8) player.trail.shift();

      player.trail.forEach((p, idx) => {
        p.alpha *= 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (player.size * (idx + 1)) / 10, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(185, 198, 165, ${p.alpha * 0.4})`;
        ctx.fill();
      });

      // Draw glowing player avatar (The Seed)
      ctx.save();
      ctx.shadowColor = '#e5c478';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
      ctx.fillStyle = '#b9c6a5';
      ctx.fill();

      // Seed core pulse
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#e5c478';
      ctx.fill();

      // Shield aura if active
      if (shieldActive) {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Spawn Obstacles & Orbs
      spawnTimer++;
      if (spawnTimer % 35 === 0) {
        const rand = Math.random();
        const obsX = Math.random() * (width - 60) + 30;

        if (rand < 0.65) {
          // Negative psychological noise to dodge
          const labels = ['Overthinking', 'Kiệt sức', 'Phán xét', 'Bất an', 'Áp lực'];
          const pickedLabel = labels[Math.floor(Math.random() * labels.length)];
          obstaclesRef.current.push({
            x: obsX,
            y: -20,
            size: 22,
            speed: Math.random() * 2 + 3,
            label: pickedLabel,
            color: '#e78b80',
            type: 'danger',
          });
        } else if (rand < 0.90) {
          // Clarity drops to collect
          obstaclesRef.current.push({
            x: obsX,
            y: -20,
            size: 16,
            speed: 3.5,
            label: 'Tĩnh lặng',
            color: '#b9c6a5',
            type: 'clarity',
          });
        } else {
          // Shield power-up
          obstaclesRef.current.push({
            x: obsX,
            y: -20,
            size: 18,
            speed: 4,
            label: 'Khiên ranh giới',
            color: '#34d399',
            type: 'shield',
          });
        }
      }

      // 4. Update and Draw Obstacles
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.y += obs.speed;

        // Draw obstacle
        ctx.save();
        ctx.fillStyle = obs.color;
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.size, 0, Math.PI * 2);
        ctx.fill();

        // Label tag
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(obs.label, obs.x, obs.y + obs.size + 13);
        ctx.restore();

        // Collision Detection with Player
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < player.size + obs.size) {
          if (obs.type === 'danger') {
            if (shieldActive) {
              setShieldActive(false);
              spawnParticles(obs.x, obs.y, '#34d399', 16);
              playSound('shield');
            } else {
              currentEnergy = Math.max(0, currentEnergy - 20);
              setEnergy(currentEnergy);
              setHitCount((c) => c + 1);
              spawnParticles(obs.x, obs.y, '#e78b80', 20);
              playSound('hit');
            }
          } else if (obs.type === 'clarity') {
            currentScore += 50;
            currentEnergy = Math.min(100, currentEnergy + 10);
            setScore(currentScore);
            setEnergy(currentEnergy);
            setClarityCollected((c) => c + 1);
            spawnParticles(obs.x, obs.y, '#b9c6a5', 15);
            playSound('collect');
          } else if (obs.type === 'shield') {
            setShieldActive(true);
            spawnParticles(obs.x, obs.y, '#34d399', 18);
            playSound('shield');
          }

          obstaclesRef.current.splice(i, 1);
          continue;
        }

        // Remove if off-screen & score point for dodging
        if (obs.y > height + 30) {
          if (obs.type === 'danger') {
            setDodgedCount((d) => d + 1);
            currentScore += 10;
            setScore(currentScore);
          }
          obstaclesRef.current.splice(i, 1);
        }
      }

      // 5. Update and Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Check for completion or energy depletion
      const elapsed = (Date.now() - gameStartTimeRef.current) / 1000;
      if (elapsed >= 25 || currentEnergy <= 0) {
        playSound('win');
        setGameState('dilemma');
        return;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, shieldActive, playSound]);

  // Touch/Mouse dragging controls on canvas
  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * canvasRef.current.width;
    playerRef.current.targetX = x;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvasRef.current.width;
    playerRef.current.targetX = x;
  };

  // Move via On-Screen Mobile Buttons
  const moveLeft = () => {
    playerRef.current.targetX = Math.max(30, playerRef.current.x - 60);
  };
  const moveRight = () => {
    if (!canvasRef.current) return;
    playerRef.current.targetX = Math.min(canvasRef.current.width - 30, playerRef.current.x + 60);
  };

  // Handle Dilemma Choice Selection
  const handleSelectDilemma = (choice: 'left' | 'right') => {
    setChosenOption(choice);
    setGameState('result');
  };

  // 1-Click CTA to Chat with Preloaded Prompt
  const handleStartChat = () => {
    const currentDilemma = DILEMMAS[currentDilemmaIndex];
    const option = chosenOption === 'left' ? currentDilemma.leftOption : currentDilemma.rightOption;
    const prompt = option.prompt;

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('lifelab_preloaded_prompt', prompt);
    }
    router.push(`/app/conversations/new?prompt=${encodeURIComponent(prompt)}`);
    onClose?.();
  };

  const currentDilemma = DILEMMAS[currentDilemmaIndex];
  const selectedDilemmaResult = chosenOption === 'left' ? currentDilemma?.leftOption : currentDilemma?.rightOption;

  return (
    <div className={`relative w-full max-w-4xl mx-auto overflow-hidden rounded-[28px] sm:rounded-[36px] border border-white/15 bg-gradient-to-b from-[#1c2c1f]/98 via-[#142217]/98 to-[#0d160f]/98 backdrop-blur-2xl p-4 sm:p-7 md:p-8 text-calm-paper-white shadow-[0_25px_80px_rgba(0,0,0,0.6)] touch-manipulation ${isModal ? 'max-h-[88vh] max-h-[88dvh] overflow-y-auto overscroll-contain' : ''}`}>
      {/* Ambient background lightings */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-500/20 via-calm-pollen/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-gradient-to-tr from-calm-lichen/20 via-transparent to-transparent blur-3xl" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-400/25 to-calm-pollen/25 border border-emerald-400/40 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            <Sprout size={20} className="text-emerald-300 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider text-emerald-300">
                Playable Mini-Game
              </span>
              <span className="hidden xs:inline text-[10px] sm:text-[11px] text-calm-fog">✦ Thử thách phản xạ & Trực giác ✦</span>
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white mt-0.5 truncate">
              Hành Trình Hạt Mầm: Vượt Bão Tâm Trí
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-calm-fog hover:text-white transition active:scale-95"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-calm-fog hover:text-white transition active:scale-95"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Game Content State Transitions */}
      <AnimatePresence mode="wait">
        {/* State 1: Intro Screen */}
        {gameState === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="relative z-10 py-6 sm:py-8 flex flex-col items-center text-center space-y-5 sm:space-y-6 max-w-xl mx-auto"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="absolute -inset-4 rounded-full bg-gradient-to-tr from-emerald-400/30 via-calm-pollen/20 to-transparent blur-xl"
              />
              <div className="relative grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-full bg-gradient-to-b from-[#2a4030] to-[#16241a] border-2 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.35)]">
                <Sprout size={38} className="text-emerald-300 animate-bounce" />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2 px-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Vượt Qua Bão Suy Nghĩ & Lắng Nghe Trực Giác
              </h3>
              <p className="text-xs sm:text-sm text-calm-fog leading-relaxed">
                Điều khiển <strong>Hạt Mầm Tâm Trí</strong> né tránh những cơn bão lo âu (Overthinking, Kiệt sức, Phán xét) và thu thập những giọt Tĩnh Lặng để nảy mầm đối diện với ngã rẽ cuộc đời.
              </p>
            </div>

            {/* How to play pill guide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full text-left">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 space-y-1">
                <span className="text-[10px] font-bold text-calm-lichen uppercase tracking-wider">1. Điều khiển</span>
                <p className="text-[11px] text-calm-fog">Phím mũi tên / A-D hoặc Chạm vuốt trên màn hình</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 space-y-1">
                <span className="text-[10px] font-bold text-calm-danger-clay uppercase tracking-wider">2. Né tránh</span>
                <p className="text-[11px] text-calm-fog">Né chướng ngại vật màu đỏ để giữ năng lượng sống</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 space-y-1">
                <span className="text-[10px] font-bold text-calm-pollen uppercase tracking-wider">3. Đối thoại</span>
                <p className="text-[11px] text-calm-fog">Mở khóa ngã rẽ & nhận gợi ý trò chuyện AI bóc tách</p>
              </div>
            </div>

            <button
              type="button"
              onClick={startGame}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 px-7 sm:px-8 py-3.5 text-xs sm:text-sm font-extrabold text-black shadow-[0_0_30px_rgba(52,211,153,0.5)] hover:scale-105 active:scale-95 transition w-full sm:w-auto"
            >
              <Play size={17} fill="currentColor" />
              <span>BẮT ĐẦU CHƠI NGAY (25s)</span>
            </button>
          </motion.div>
        )}

        {/* State 2: Active Gameplay Screen */}
        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 py-2 space-y-3"
          >
            {/* Live Stats Header */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-3.5 sm:px-4 py-2 text-xs gap-2">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-1.5">
                  <Trophy size={14} className="text-calm-pollen" />
                  <span className="font-mono font-bold text-white">{score}</span>
                  <span className="text-[10px] text-calm-fog hidden xs:inline">Điểm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className={shieldActive ? 'text-emerald-400 animate-pulse' : 'text-calm-fog/40'} />
                  <span className="text-[10px] text-calm-fog">{shieldActive ? 'Khiên BẬT' : 'Khiên TẮT'}</span>
                </div>
              </div>

              {/* Energy Bar */}
              <div className="flex items-center gap-2 min-w-[110px] sm:min-w-[140px]">
                <Flame size={14} className="text-calm-danger-clay" />
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10 border border-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${energy > 50 ? 'bg-gradient-to-r from-emerald-400 to-calm-lichen' : energy > 25 ? 'bg-calm-pollen' : 'bg-calm-danger-clay animate-pulse'}`}
                    style={{ width: `${energy}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-calm-warm-ivory">{energy}%</span>
              </div>
            </div>

            {/* The 2D Interactive Canvas */}
            <div className="relative mx-auto flex items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-[#0e1610] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] touch-none">
              <canvas
                ref={canvasRef}
                width={500}
                height={400}
                className="w-full max-w-[500px] h-[300px] sm:h-[380px] cursor-crosshair"
                onTouchMove={handleCanvasTouchMove}
                onMouseMove={handleCanvasMouseMove}
              />

              {/* Subtle instruction overlay */}
              <div className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[10px] sm:text-[10.5px] text-calm-fog/60 px-2">
                Vuốt ngón tay hoặc nhấn phím ← → để di chuyển hạt mầm
              </div>
            </div>

            {/* Mobile Virtual Controller Buttons */}
            <div className="flex items-center justify-center gap-3 pt-1 sm:hidden">
              <button
                type="button"
                onClick={moveLeft}
                className="flex-1 flex items-center justify-center gap-1 rounded-2xl border border-white/15 bg-white/10 py-3 text-xs font-bold active:bg-white/25 transition"
              >
                <ArrowLeft size={16} /> Sang Trái
              </button>
              <button
                type="button"
                onClick={moveRight}
                className="flex-1 flex items-center justify-center gap-1 rounded-2xl border border-white/15 bg-white/10 py-3 text-xs font-bold active:bg-white/25 transition"
              >
                Sang Phải <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* State 3: Dilemma Decision Screen */}
        {gameState === 'dilemma' && currentDilemma && (
          <motion.div
            key="dilemma"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative z-10 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-2xl mx-auto text-center"
          >
            <div className="space-y-1.5 sm:space-y-2 px-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-calm-pollen/40 bg-calm-pollen/15 px-3 py-1 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-calm-pollen">
                <Sparkles size={12} /> Cây Cổ Thụ Nhận Thức Xuất Hiện
              </span>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
                Bạn đã vượt qua bão tâm trí! Giờ là lúc lựa chọn ngã rẽ:
              </h3>
              <p className="text-xs sm:text-sm text-calm-fog leading-relaxed">
                “{currentDilemma.question}”
              </p>
            </div>

            {/* 2 Decision Portals */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 text-left pt-1 sm:pt-2">
              {/* Left Portal */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectDilemma('left')}
                className="group relative overflow-hidden rounded-[22px] sm:rounded-[26px] border border-calm-pollen/50 bg-gradient-to-b from-[#2a382b]/90 to-[#18241b]/90 p-4 sm:p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-calm-pollen transition-all"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="rounded-full bg-calm-pollen/20 px-2.5 py-0.5 text-[9px] sm:text-[9.5px] font-bold text-calm-pollen border border-calm-pollen/30">
                    {currentDilemma.leftOption.tag}
                  </span>
                  <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform">🚪</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-calm-pollen transition">
                  {currentDilemma.leftOption.label}
                </h4>
                <p className="mt-1 text-[11px] sm:text-xs text-calm-fog leading-snug">
                  {currentDilemma.leftOption.sub}
                </p>
                <div className="mt-3 sm:mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px] sm:text-[11px] font-semibold text-calm-pollen">
                  <span>Bước vào cánh cổng này</span>
                  <span className="group-hover:translate-x-1 transition-transform">Chọn →</span>
                </div>
              </motion.button>

              {/* Right Portal */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectDilemma('right')}
                className="group relative overflow-hidden rounded-[22px] sm:rounded-[26px] border border-emerald-500/50 bg-gradient-to-b from-[#1c3523]/90 to-[#102216]/90 p-4 sm:p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-emerald-400 transition-all"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[9px] sm:text-[9.5px] font-bold text-emerald-300 border border-emerald-500/30">
                    {currentDilemma.rightOption.tag}
                  </span>
                  <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform">✨</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  {currentDilemma.rightOption.label}
                </h4>
                <p className="mt-1 text-[11px] sm:text-xs text-calm-fog leading-snug">
                  {currentDilemma.rightOption.sub}
                </p>
                <div className="mt-3 sm:mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px] sm:text-[11px] font-semibold text-emerald-300">
                  <span>Bước vào cánh cổng này</span>
                  <span className="group-hover:translate-x-1 transition-transform">Chọn →</span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* State 4: Deep Psychological Assessment & AI Chat Conversion */}
        {gameState === 'result' && selectedDilemmaResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="relative z-10 py-3 sm:py-4 space-y-4 sm:space-y-5"
          >
            {/* Player Stats Recap */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-white/10 pb-3 sm:pb-4">
              <div>
                <span className="text-[9.5px] sm:text-[10px] font-mono uppercase tracking-widest text-emerald-300">
                  ✦ Báo Cáo Giải Mã Tâm Trí Sau Ván Chơi ✦
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">
                  Bạn chọn: {selectedDilemmaResult.label}
                </h3>
              </div>

              <button
                type="button"
                onClick={startGame}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-calm-fog hover:bg-white/15 hover:text-white transition active:scale-95"
              >
                <RotateCcw size={12} />
                <span>Chơi lại</span>
              </button>
            </div>

            {/* 3 Metric Insight Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-2.5 sm:p-3 text-center space-y-0.5">
                <p className="text-[9.5px] sm:text-[10px] text-calm-fog uppercase">Điểm Tĩnh Lặng</p>
                <p className="text-sm sm:text-base md:text-lg font-bold text-calm-pollen">{score} pts</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-2.5 sm:p-3 text-center space-y-0.5">
                <p className="text-[9.5px] sm:text-[10px] text-calm-fog uppercase">Cơn Bão Đã Né</p>
                <p className="text-sm sm:text-base md:text-lg font-bold text-emerald-300">{dodgedCount} lần</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-2.5 sm:p-3 text-center space-y-0.5">
                <p className="text-[9.5px] sm:text-[10px] text-calm-fog uppercase">Năng Lượng Giữ</p>
                <p className="text-sm sm:text-base md:text-lg font-bold text-calm-lichen">{energy}%</p>
              </div>
            </div>

            {/* Subconscious Blindspot Analysis */}
            <div className="rounded-[20px] sm:rounded-[24px] border border-calm-danger-clay/40 bg-gradient-to-b from-calm-danger-clay/15 to-black/30 p-3.5 sm:p-5 space-y-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-calm-danger-clay uppercase tracking-wider">
                <Flame size={14} />
                <span>Điểm mù tiềm thức được nhận diện qua ván chơi</span>
              </div>
              <p className="text-xs sm:text-sm text-calm-warm-ivory leading-relaxed">
                “{selectedDilemmaResult.blindspot}”
              </p>
            </div>

            {/* THE CONVERSION HOOK: Directly into AI Chat & Voice Call */}
            <div className="rounded-[24px] sm:rounded-[28px] border border-emerald-500/40 bg-gradient-to-b from-[#1a2f1f]/95 via-[#122216]/95 to-[#0b170e]/95 p-4 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5),0_0_25px_rgba(52,211,153,0.18)] space-y-3.5 sm:space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <MessageCircleHeart size={17} className="text-emerald-400 shrink-0" />
                    <span>Life Lab đã sẵn sàng cùng bạn gỡ nút thắt này</span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-calm-lichen leading-relaxed">
                    Mọi lựa chọn trong game phản ánh chính xác trạng thái tâm trí thực tế của bạn. Hãy để AI đồng hành bóc tách sâu hơn về lựa chọn này ngay bây giờ.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-extrabold text-black shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:scale-[1.02] active:scale-98 transition text-center"
                >
                  <MessageCircleHeart size={16} />
                  <span>Trò chuyện cùng AI về ngã rẽ này ngay →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    router.push('/app/conversations/new?call=true');
                    onClose?.();
                  }}
                  className="flex items-center justify-center gap-2 rounded-full border border-calm-pollen/40 bg-calm-pollen/15 px-5 py-3.5 text-xs sm:text-sm font-bold text-calm-pollen hover:bg-calm-pollen/25 transition active:scale-98"
                >
                  <PhoneCall size={15} />
                  <span>Gọi thoại 1:1</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PlayableLifeGameModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl my-auto"
        >
          <PlayableLifeGame onClose={onClose} isModal={true} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
