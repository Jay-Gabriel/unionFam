import React, { useState, useEffect, useRef } from 'react';
import { Compass, Sparkles, Send, ArrowLeft, ArrowDown, Key, RotateCcw, Volume2, VolumeX, ShieldCheck, ChevronDown, CheckCircle2, Bot, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStoredGeminiKey, saveStoredGeminiKey, clearStoredGeminiKey, callGeminiCompanionAPI } from '../../services/geminiService';

interface CosmicStoryRoadProps {
  onBackToArches: () => void;
  onGoToExperiments?: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface RoadParticle {
  x: number;
  z: number;
  size: number;
  brightness: number;
  speed: number;
}

export const CosmicStoryRoad: React.FC<CosmicStoryRoadProps> = ({
  onBackToArches,
  onGoToExperiments,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [scrollProgress, setScrollProgress] = useState(0);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Chào bạn. Khi bước hết con đường ánh sáng này, bạn đã để lại phía sau những ồn ào vội vã. Giờ đây, khi đối diện với chính mình, nỗi trăn trở lớn nhất về tiền bạc mà bạn muốn chia sẻ là gì?',
      timestamp: 'Ngay bây giờ',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKey] = useState<string>(getStoredGeminiKey);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Auto-scroll whenever messages change or AI is typing
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  // Handle native window scroll to compute exact 0 to 1 progress
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const totalHeight = containerRef.current.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const currentScroll = window.scrollY;
      const progress = Math.min(Math.max(currentScroll / totalHeight, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3D Moving Perspective Golden Road Canvas Simulation
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

    // Initialize 3D road particles
    const particleCount = 220;
    const particles: RoadParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 1.8,
        z: Math.random(),
        size: Math.random() * 2.5 + 1,
        brightness: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.003 + 0.002,
      });
    }

    let lastScroll = window.scrollY;
    let scrollVelocity = 0;

    const render = () => {
      const currentScroll = window.scrollY;
      const delta = Math.abs(currentScroll - lastScroll);
      scrollVelocity = scrollVelocity * 0.9 + delta * 0.0004;
      lastScroll = currentScroll;

      ctx.clearRect(0, 0, width, height);

      const horizonY = height * 0.38;
      const bottomY = height;
      const roadTopWidth = width * 0.035;
      const roadBottomWidth = width * 0.75;
      const centerX = width * 0.5;

      // 1. Draw glowing road base gradient polygon
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX - roadTopWidth * 0.5, horizonY);
      ctx.lineTo(centerX + roadTopWidth * 0.5, horizonY);
      ctx.lineTo(centerX + roadBottomWidth * 0.5, bottomY);
      ctx.lineTo(centerX - roadBottomWidth * 0.5, bottomY);
      ctx.closePath();

      const roadGrad = ctx.createLinearGradient(0, bottomY, 0, horizonY);
      roadGrad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
      roadGrad.addColorStop(0.4, 'rgba(217, 119, 6, 0.28)');
      roadGrad.addColorStop(1, 'rgba(168, 85, 247, 0.05)');
      ctx.fillStyle = roadGrad;
      ctx.fill();

      // 2. Neon Side Borders of the Road
      ctx.strokeStyle = 'rgba(255, 235, 140, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.moveTo(centerX - roadTopWidth * 0.5, horizonY);
      ctx.lineTo(centerX - roadBottomWidth * 0.5, bottomY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + roadTopWidth * 0.5, horizonY);
      ctx.lineTo(centerX + roadBottomWidth * 0.5, bottomY);
      ctx.stroke();
      ctx.restore();

      // 3. Render and advance moving golden glitter particles
      ctx.save();
      const baseMoveSpeed = 0.0035 + scrollVelocity;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.z += p.speed + baseMoveSpeed;
        if (p.z > 1) {
          p.z = 0.01;
          p.x = (Math.random() - 0.5) * 1.8;
        }

        const screenY = horizonY + Math.pow(p.z, 1.8) * (bottomY - horizonY);
        const currentRoadWidth = roadTopWidth + Math.pow(p.z, 1.6) * (roadBottomWidth - roadTopWidth);
        const screenX = centerX + (p.x * currentRoadWidth * 0.5);

        const currentSize = p.size * (0.4 + p.z * 1.8);
        const alpha = Math.min(Math.pow(p.z, 0.8) * p.brightness * 1.2, 0.95);

        ctx.beginPath();
        ctx.arc(screenX, screenY, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 235, 150, ${alpha})`;
        ctx.shadowColor = 'rgba(254, 215, 170, 0.8)';
        ctx.shadowBlur = 6 * p.z;
        ctx.fill();
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAiTyping) return;

    const userText = inputText.trim();
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsAiTyping(true);

    try {
      const activeKey = apiKey.trim() || getStoredGeminiKey();
      const result = await callGeminiCompanionAPI(activeKey, userText, messages);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: result.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Mình vẫn đang ở đây lắng nghe bạn. Khi đứng trước các quyết định tiền bạc, đâu là câu hỏi lớn nhất đang thôi thúc bạn tìm lời giải đáp?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = apiKey.trim();
    saveStoredGeminiKey(clean);
    setApiKey(clean);
    setShowKeyInput(false);
    confetti({ particleCount: 50, spread: 50 });
  };

  // Helper to calculate opacity & scale for each scrollytelling step
  const getStepStyle = (start: number, peak: number, end: number) => {
    if (scrollProgress < start || scrollProgress > end) {
      return { opacity: 0, transform: 'scale(0.8) translateY(40px)', pointerEvents: 'none' as const };
    }
    let opacity = 1;
    let scale = 1;
    let translateY = 0;

    if (scrollProgress < peak) {
      const t = (scrollProgress - start) / (peak - start);
      opacity = t;
      scale = 0.8 + 0.2 * t;
      translateY = 30 * (1 - t);
    } else {
      const t = (scrollProgress - peak) / (end - peak);
      opacity = 1 - t;
      scale = 1 + 0.25 * t;
      translateY = -30 * t;
    }

    return {
      opacity,
      transform: `scale(${scale}) translateY(${translateY}px)`,
      pointerEvents: opacity > 0.4 ? ('auto' as const) : ('none' as const),
      transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
    };
  };

  return (
    // Outer scroll container: 550vh tall to allow rich, continuous scrolling
    <div ref={containerRef} className="relative w-full h-[550vh] bg-[#070514] text-stone-100 font-sans select-none">
      
      {/* Fixed Fullscreen Viewport Layer */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between items-center z-10">
        
        {/* 1. Deep Cosmic Nebula & Galaxy Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(147,51,234,0.38)_0%,rgba(67,56,202,0.28)_35%,rgba(10,8,28,0.95)_75%,#050410_100%)]" />
          
          {/* Luminous Green-Yellow Cosmic Ribbon / Aurora Streamer (matching screenshot 20-51-48) */}
          <div className="absolute -top-32 left-[-15%] w-[130%] h-[550px] pointer-events-none opacity-45 blur-3xl bg-gradient-to-r from-emerald-400 via-amber-300 to-purple-600 rounded-[100%] transform -rotate-12" />

          {/* Starfield noise texture */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.7)_1px,transparent_1px),radial-gradient(circle_at_80%_40%,rgba(255,255,255,0.7)_1px,transparent_1px),radial-gradient(circle_at_40%_70%,rgba(255,255,255,0.6)_1.5px,transparent_1.5px),radial-gradient(circle_at_70%_80%,rgba(255,234,164,0.8)_1.5px,transparent_1.5px)] bg-[size:240px_240px]" />
        </div>

        {/* 2. Real-time 3D Moving Perspective Golden Road Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* 3. Top Header Navigation Bar */}
        <header className="relative z-40 w-full px-6 py-5 flex items-center justify-between backdrop-blur-md bg-stone-950/40 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToArches}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-amber-300/40 text-amber-200 text-xs font-serif transition shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:scale-105"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về 3 Cổng Vòm</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-stone-400 text-xs font-mono">
              <span>/</span>
              <span className="text-amber-200">Cổng 1: Con Đường Thức Tỉnh (Moving Cosmic Road)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Scroll progress indicator */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-amber-300/80 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              <span>Hành trình:</span>
              <span className="font-bold">{Math.round(scrollProgress * 100)}%</span>
            </div>

            {/* AI Connection Status Button */}
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-serif transition ${
                apiKey
                  ? apiKey.startsWith('AIzaSy')
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-sky-500/20 border-sky-400/60 text-sky-200 hover:bg-sky-500/30'
                  : 'bg-amber-500/20 border-amber-300/50 text-amber-200 hover:bg-amber-500/30'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>
                {apiKey
                  ? apiKey.startsWith('AIzaSy')
                    ? 'Gemini AI: Sẵn Sàng (AI Studio)'
                    : 'Gemini Token: Đã Nhận'
                  : 'Sanctuary Dialog Engine'}
              </span>
            </button>

            {onGoToExperiments && (
              <button
                onClick={onGoToExperiments}
                className="px-4 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-200 text-xs font-serif transition flex items-center gap-1.5"
              >
                <span>Sang Cổng 2</span>
                <span>→</span>
              </button>
            )}
          </div>
        </header>

        {/* API Key Modal Drawer */}
        {showKeyInput && (
          <div className="fixed top-20 right-6 z-50 w-84 p-5 rounded-2xl bg-stone-950/95 border border-amber-400/50 shadow-2xl backdrop-blur-xl animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-serif text-amber-200 font-semibold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Kết Nối Gemini AI Trực Tiếp</span>
              </h4>
            </div>
            <p className="text-[11px] text-stone-300 mb-2 leading-relaxed">
              Dán Google AI Studio API Key (bắt đầu bằng <code className="text-amber-300 font-mono">AIzaSy...</code>) để AI phản hồi trực tiếp thời gian thực:
            </p>
            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <input
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400 font-mono"
              />
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    clearStoredGeminiKey();
                    const defaultKey = getStoredGeminiKey();
                    setApiKey(defaultKey);
                  }}
                  className="text-[10px] text-amber-400/90 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Dùng Key Mặc Định</span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(false)}
                    className="px-3 py-1 text-xs text-stone-400 hover:text-stone-200"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded-lg text-xs shadow-md"
                  >
                    Lưu Key
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            DYNAMIC NARRATIVE QUOTES FLOATING ON THE RUNNING ROAD (BY SCROLL PROGRESS)
           ========================================================================= */}
        <div className="relative z-30 w-full max-w-4xl mx-auto px-4 flex-1 flex flex-col justify-center items-center">
          
          {/* STEP 1: INITIAL LIVING INVOCATION (0% - 18%) */}
          <div
            style={getStepStyle(0.0, 0.06, 0.18)}
            className="absolute text-center max-w-3xl space-y-4 px-4"
          >
            <h1 className="font-playfair text-4xl sm:text-6xl md:text-7xl text-stone-100 font-normal drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]">
              Cổng Thức Tỉnh
            </h1>
            <div className="font-playfair text-lg sm:text-2xl md:text-3xl text-amber-100/90 leading-relaxed font-light space-y-2 drop-shadow-md">
              <p>Đây là phiên làm việc đầu tiên của bạn cùng Life Lab.</p>
              <p className="italic text-amber-200">Một lời hiệu triệu sống động.</p>
              <p>Một ngưỡng cửa chuyển hóa.</p>
              <p className="text-amber-100">Một bước ngoặt tâm thức ngụy trang dưới hình hài một trang web.</p>
            </div>
            <div className="pt-6">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-stone-950/70 border border-amber-300/50 backdrop-blur-md text-amber-200 text-xs font-mono tracking-widest uppercase shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-bounce">
                <span>CUỘN CHUỘT ĐỂ CON ĐƯỜNG CHẠY TIẾP</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* STEP 2: MILESTONE 1 (20% - 38%) */}
          <div
            style={getStepStyle(0.19, 0.28, 0.38)}
            className="absolute text-center max-w-3xl space-y-4 p-8 sm:p-12 rounded-3xl bg-stone-950/80 border border-amber-300/40 backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.25)]"
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-amber-300 block">
              CHẶNG 1 • TIẾNG GỌI NỘI TÂM
            </span>
            <p className="font-playfair text-2xl sm:text-4xl lg:text-5xl text-amber-100 leading-snug drop-shadow-lg">
              "Bạn chưa bao giờ thiếu tiền.<br />Thứ bạn thực sự thiếu là sự thấu tỏ:<br /><span className="text-amber-300 font-medium italic">Tiền đang phục vụ cuộc đời nào?</span>"
            </p>
            <p className="text-stone-300 text-xs sm:text-sm font-sans max-w-xl mx-auto leading-relaxed pt-2">
              Khi chi tiêu trong sợ hãi, ta bóp nghẹt chính mình. Khi chi tiêu bằng sự tỉnh thức, tiền bạc trở thành đôi cánh tự do.
            </p>
          </div>

          {/* STEP 3: MILESTONE 2 (40% - 58%) */}
          <div
            style={getStepStyle(0.39, 0.48, 0.58)}
            className="absolute text-center max-w-3xl space-y-4 p-8 sm:p-12 rounded-3xl bg-stone-950/80 border border-purple-400/40 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.25)]"
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-purple-300 block">
              CHẶNG 2 • KHOẢNG CÁCH (THE GAP)
            </span>
            <p className="font-playfair text-2xl sm:text-4xl lg:text-5xl text-purple-100 leading-snug drop-shadow-lg">
              "Mỗi đồng tiền rời khỏi tài khoản<br />Là một lá phiếu bạn bầu cho tương lai mà bạn tin tưởng."
            </p>
            <p className="text-stone-300 text-xs sm:text-sm font-sans max-w-xl mx-auto leading-relaxed pt-2">
              Bạn có đang dùng tiền để tôn vinh sự sống và bình yên, hay đang dùng nó để làm vừa lòng những kỳ vọng của người khác?
            </p>
          </div>

          {/* STEP 4: MILESTONE 3 (60% - 78%) */}
          <div
            style={getStepStyle(0.59, 0.68, 0.78)}
            className="absolute text-center max-w-3xl space-y-4 p-8 sm:p-12 rounded-3xl bg-stone-950/80 border border-emerald-400/40 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.25)]"
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-emerald-300 block">
              CHẶNG 3 • DÁT VÀNG KINTSUGI
            </span>
            <p className="font-playfair text-2xl sm:text-4xl lg:text-5xl text-emerald-100 leading-snug drop-shadow-lg">
              "Vết nứt hôm qua không phải là thất bại.<br />Đó là nơi ánh sáng của trí tuệ bắt đầu rọi vào."
            </p>
            <p className="text-stone-300 text-xs sm:text-sm font-sans max-w-xl mx-auto leading-relaxed pt-2">
              Những sai lầm chi tiêu trong quá khứ chỉ là dữ liệu để hiệu chỉnh lại la bàn. Hãy tha thứ cho chính mình và bước tiếp.
            </p>
          </div>

          {/* STEP 5: FINAL DESTINATION — LIVE AI CHAT INTERFACE (80% - 100%) */}
          <div
            style={{
              opacity: scrollProgress >= 0.8 ? Math.min((scrollProgress - 0.8) / 0.08, 1) : 0,
              transform: `scale(${scrollProgress >= 0.8 ? 0.9 + 0.1 * Math.min((scrollProgress - 0.8) / 0.15, 1) : 0.8}) translateY(${scrollProgress >= 0.8 ? 0 : 50}px)`,
              pointerEvents: scrollProgress >= 0.82 ? ('auto' as const) : ('none' as const),
              transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            }}
            className="absolute w-full max-w-3xl"
          >
            {/* The Main Chat Interface Box */}
            <div className="w-full rounded-3xl bg-stone-950/95 border border-amber-300/50 backdrop-blur-2xl shadow-[0_0_70px_rgba(245,158,11,0.35)] flex flex-col h-[560px] overflow-hidden">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-stone-900/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
                  <div>
                    <h3 className="font-serif text-base text-amber-200 font-medium flex items-center gap-2">
                      <span>Life Lab Mirror Companion</span>
                      {apiKey ? (
                        apiKey.startsWith('AIzaSy') ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/40">
                            Gemini Pro Active
                          </span>
                        ) : (
                          <span className="text-[10px] bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded-full border border-sky-400/40">
                            Gemini Token Active
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40">
                          Sanctuary Dialog Engine
                        </span>
                      )}
                    </h3>
                    <span className="text-[10px] text-stone-400 font-mono tracking-wider">
                      Cuối Con Đường Ánh Sáng • Lắng Nghe Không Phán Xét
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowKeyInput(true)}
                    className="text-[11px] text-amber-300/90 font-mono bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/30 transition flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    <span>{apiKey ? 'Đổi Key' : 'Nhập Key'}</span>
                  </button>
                </div>
              </div>

              {/* Messages Flow Area with Dedicated Ref and Auto-Scroll */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
              >
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-amber-400 text-stone-950 font-sans font-medium rounded-br-none shadow-md'
                          : 'bg-stone-900/95 border border-white/10 text-stone-200 font-serif rounded-bl-none shadow-lg whitespace-pre-line'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 font-mono px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex items-center gap-2 p-4 rounded-2xl bg-stone-900/60 border border-white/5 text-amber-300 text-xs w-36 animate-fadeIn">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] font-serif text-stone-400 ml-1">Đang suy ngẫm...</span>
                  </div>
                )}
                {/* Scroll Target Div */}
                <div ref={chatEndRef} className="h-2 w-full" />
              </div>

              {/* Quick Reflection Prompts */}
              <div className="px-6 py-2 bg-stone-900/40 border-t border-white/5 flex gap-2 overflow-x-auto text-[11px] font-serif text-amber-200/80">
                <button
                  onClick={() => setInputText('Gợi ý cho tôi hướng bắt đầu hiệu chỉnh tâm lý tài chính')}
                  className="px-3 py-1 rounded-full bg-amber-400/15 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 transition whitespace-nowrap font-medium"
                >
                  ✨ "Gợi ý cho tôi"
                </button>
                <button
                  onClick={() => setInputText('Tôi luôn cảm thấy bất an dù trong tài khoản vẫn còn tiền tiết kiệm.')}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-amber-400/20 hover:text-amber-200 border border-white/10 transition whitespace-nowrap"
                >
                  "Tôi luôn bất an dù còn tiền"
                </button>
                <button
                  onClick={() => setInputText('Tôi hay mua sắm bốc đồng mỗi khi áp lực công việc lên cao.')}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-amber-400/20 hover:text-amber-200 border border-white/10 transition whitespace-nowrap"
                >
                  "Tôi hay mua sắm khi stress"
                </button>
                <button
                  onClick={() => setInputText('Làm sao để biết tiền của mình đang thực sự phục vụ cuộc đời nào?')}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-amber-400/20 hover:text-amber-200 border border-white/10 transition whitespace-nowrap"
                >
                  "Tiền đang phục vụ cuộc đời nào?"
                </button>
              </div>

              {/* Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-stone-900/80 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Gõ tâm sự hoặc câu hỏi của bạn tại điểm đích con đường..."
                  className="flex-1 bg-stone-950/90 border border-stone-700/60 rounded-2xl px-4 py-3 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 transition"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isAiTyping}
                  className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-serif font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                >
                  <span>Gửi</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          </div>

        </div>

        {/* 4. Bottom Journey Progress Slider Bar */}
        <div className="relative z-40 w-full max-w-4xl px-6 pb-4 flex items-center justify-between text-xs text-stone-400">
          <span className="font-mono text-[11px] text-amber-200/80">Khởi Đầu</span>
          
          <div className="flex-1 mx-4 h-1.5 bg-stone-900/80 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-purple-400 rounded-full transition-all duration-150 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
              style={{ width: `${Math.round(scrollProgress * 100)}%` }}
            />
          </div>

          <span className="font-mono text-[11px] text-amber-300">Khung Chat AI (100%)</span>
        </div>

      </div>

    </div>
  );
};
