import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Sparkles,
  Send,
  ArrowLeft,
  ArrowDown,
  Key,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  Bot,
  RefreshCw,
  PauseCircle,
  BookmarkCheck,
  Check,
  X,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStoredGeminiKey, saveStoredGeminiKey, clearStoredGeminiKey, callGeminiCompanionAPI } from '../../services/geminiService';
import { BETA_CONFIG, SessionOutcomeType } from '../../config/betaFlags';
import { saveConversationToCloud, loadConversationFromCloud, saveMemoryToCloud } from '../../services/supabaseService';

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
      text: 'Chào bạn. Chúng ta không cần giải quyết toàn bộ cuộc sống hôm nay. Bạn có thể bắt đầu từ điều đang chiếm nhiều suy nghĩ hoặc năng lượng. Bạn muốn bắt đầu từ đâu?',
      timestamp: 'Ngay bây giờ',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKey] = useState<string>(getStoredGeminiKey);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Beta Master V8.7.2 Checkpoint & Memory State
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<SessionOutcomeType | null>(null);
  const [memoryConsent, setMemoryConsent] = useState<'granted' | 'declined' | null>(null);
  const [isSessionClosed, setIsSessionClosed] = useState(false);
  const [checkpointNote, setCheckpointNote] = useState('');
  const [conversationId, setConversationId] = useState<string>(() => Date.now().toString());

  // Tải lại hội thoại đã lưu (từ Supabase khi đã đăng nhập Google hoặc LocalStorage)
  useEffect(() => {
    loadConversationFromCloud().then(saved => {
      if (saved && saved.messages && saved.messages.length > 0) {
        setConversationId(saved.conversationId);
        setMessages(saved.messages);
      }
    });
  }, []);

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

  const submitMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isAiTyping || isSessionClosed) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedWithUser: Message[] = [...messages, newMsg];
    setMessages(updatedWithUser);
    saveConversationToCloud(conversationId, updatedWithUser);
    setInputText('');
    setIsAiTyping(true);

    try {
      const activeKey = apiKey.trim() || getStoredGeminiKey();
      const result = await callGeminiCompanionAPI(activeKey, trimmed, messages);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updatedWithAi: Message[] = [...updatedWithUser, aiMsg];
      setMessages(updatedWithAi);
      saveConversationToCloud(conversationId, updatedWithAi);
    } catch {
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Mình vẫn đang ở đây lắng nghe bạn. Bạn cứ thong thả chia sẻ điều đang chiếm nhiều năng lượng nhất lúc này, chúng ta sẽ cùng nhìn lại từng chút một.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updatedWithFallback: Message[] = [...updatedWithUser, fallbackMsg];
      setMessages(updatedWithFallback);
      saveConversationToCloud(conversationId, updatedWithFallback);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(inputText);
  };

  // P0-01: User Stop handler (dừng phiên ngay, không hỏi feedback hay ép lưu memory)
  const handleUserStop = () => {
    setIsSessionClosed(true);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Cảm ơn bạn đã ghé lại và dành thời gian cho chính mình. Chúng ta dừng tại đây nhé. Khi nào cần một khoảng lặng để nhìn lại, bạn luôn có thể quay lại.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // P0-06 & P0-08: Session Outcome Checkpoint & Memory Permission
  const handleConfirmCheckpoint = () => {
    if (!selectedOutcome) return;
    const outcomeLabels: Record<SessionOutcomeType, string> = {
      REFLECTIVE_PAUSE: 'Dừng lại với điều vừa rõ',
      BETTER_QUESTION: 'Giữ một câu hỏi ngẫm nghĩ',
      CONFIRMED_INSIGHT: 'Tiếp tục khám phá thấu suốt',
      MEANINGFUL_NEXT_STEP: 'Nhìn rõ một quyết định',
      LIFE_EXPERIMENT: 'Thử một bước nhỏ thực tế',
    };

    const outcomeText = outcomeLabels[selectedOutcome];
    const memoryNote = memoryConsent === 'granted'
      ? 'Đã lưu đúc kết vào bộ nhớ an toàn của bạn cho các phiên sau.'
      : 'Đã hoàn tất phiên không lưu (No Memory). Dữ liệu này không được ghi dài hạn.';

    const outcomeMsg: Message = {
      id: Date.now().toString(),
      sender: 'ai',
      text: `✨ **Đúc kết phiên đã ghi nhận**: ${outcomeText}${checkpointNote ? `\n\n*Chi tiết*: "${checkpointNote}"` : ''}\n\n🛡️ *Trạng thái bộ nhớ*: ${memoryNote}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedWithOutcome: Message[] = [...messages, outcomeMsg];
    setMessages(updatedWithOutcome);

    // Lưu phiên và đúc kết lên Supabase / LocalStorage
    saveConversationToCloud(conversationId, updatedWithOutcome, {
      type: selectedOutcome,
      text: checkpointNote || outcomeText,
    });

    if (memoryConsent === 'granted') {
      saveMemoryToCloud({
        id: Date.now().toString(),
        category: 'insight',
        title: outcomeText,
        reflection: checkpointNote || `Phiên hội thoại ngày ${new Date().toLocaleDateString('vi-VN')}: ${outcomeText}`,
        date: 'Vừa xong',
      });
    }

    setShowCheckpointModal(false);
    confetti({ particleCount: 40, spread: 45 });
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
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-stone-100 font-normal drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]">
              Khoảng Lặng Để Bắt Đầu
            </h1>
            <div className="font-serif text-base sm:text-xl md:text-2xl text-amber-100/90 leading-relaxed font-light space-y-2 drop-shadow-md">
              <p>Dành riêng cho bạn một không gian chậm lại giữa guồng quay công việc và cuộc sống.</p>
              <p className="italic text-amber-200">Không cần giải quyết toàn bộ cuộc sống hôm nay.</p>
              <p className="text-amber-100">Chỉ cần bắt đầu từ một điều đang chiếm nhiều suy nghĩ hoặc năng lượng nhất lúc này.</p>
            </div>
            <div className="pt-6">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-stone-950/70 border border-amber-300/50 backdrop-blur-md text-amber-200 text-xs font-mono tracking-widest uppercase shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-bounce">
                <span>CUỘN CHUỘT ĐỂ TIẾP TỤC KHÁM PHÁ</span>
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
              CHẶNG 1 • LẮNG NGHE ĐIỀU ĐANG DIỄN RA
            </span>
            <p className="font-serif text-2xl sm:text-3xl lg:text-4xl text-amber-100 leading-snug drop-shadow-lg">
              "Đôi khi sự kiệt sức không đến từ việc bạn làm chưa đủ tốt,<br />Mà từ việc chưa có dịp nhìn rõ:<br /><span className="text-amber-300 font-medium italic">Điều gì đang thực sự lấy đi năng lượng của mình?</span>"
            </p>
            <p className="text-stone-300 text-xs sm:text-sm font-sans max-w-xl mx-auto leading-relaxed pt-2">
              Không phán xét, không áp đặt giải pháp. Hãy bắt đầu từ việc gọi tên chính xác điều bạn đang trải qua.
            </p>
          </div>

          {/* STEP 3: MILESTONE 2 (40% - 58%) */}
          <div
            style={getStepStyle(0.39, 0.48, 0.58)}
            className="absolute text-center max-w-3xl space-y-4 p-8 sm:p-12 rounded-3xl bg-stone-950/80 border border-purple-400/40 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.25)]"
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-purple-300 block">
              CHẶNG 2 • TÁCH RỜI ÁP LỰC VÀ NHU CẦU NỘI TẠI
            </span>
            <p className="font-serif text-2xl sm:text-3xl lg:text-4xl text-purple-100 leading-snug drop-shadow-lg">
              "Đâu là áp lực từ hoàn cảnh xung quanh,<br />Và đâu là điều bạn thực sự muốn dành sự ưu tiên lúc này?"
            </p>
            <p className="text-stone-300 text-xs sm:text-sm font-sans max-w-xl mx-auto leading-relaxed pt-2">
              Khi nhìn rõ ranh giới giữa kỳ vọng bên ngoài và nhịp sống của chính mình, sự bối rối sẽ dần nhường chỗ cho sự bình thản.
            </p>
          </div>

          {/* STEP 4: MILESTONE 3 (60% - 78%) */}
          <div
            style={getStepStyle(0.59, 0.68, 0.78)}
            className="absolute text-center max-w-3xl space-y-4 p-8 sm:p-12 rounded-3xl bg-stone-950/80 border border-emerald-400/40 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.25)]"
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-emerald-300 block">
              CHẶNG 3 • TỰ DO LỰA CHỌN CÁCH TIẾP TỤC
            </span>
            <p className="font-serif text-2xl sm:text-3xl lg:text-4xl text-emerald-100 leading-snug drop-shadow-lg">
              "Bạn không bắt buộc phải hành động hay quyết định ngay.<br />Dừng lại với một điều vừa rõ đã là một kết quả trọn vẹn."
            </p>
            <p className="text-stone-300 text-xs sm:text-sm font-sans max-w-xl mx-auto leading-relaxed pt-2">
              Giữ một câu hỏi ngẫm nghĩ, thử một bước nhỏ, hoặc đơn giản là cho phép mình dừng lại nghỉ ngơi.
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
                  {/* P0-06 Session Outcome Checkpoint Button */}
                  <button
                    onClick={() => setShowCheckpointModal(true)}
                    className="text-[11px] text-amber-200 font-serif bg-amber-400/15 hover:bg-amber-400/25 px-2.5 py-1 rounded-full border border-amber-400/30 transition flex items-center gap-1 shadow-sm"
                    title="Đúc kết phiên đối thoại (Master V8.7.2 Checkpoint)"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>Đúc Kết Phiên</span>
                  </button>

                  {/* P0-01 User Stop Button */}
                  <button
                    onClick={handleUserStop}
                    disabled={isSessionClosed}
                    className="text-[11px] text-stone-300 font-serif bg-white/5 hover:bg-stone-800 disabled:opacity-40 px-2.5 py-1 rounded-full border border-white/10 transition flex items-center gap-1"
                    title="Dừng phiên trò chuyện ngay lúc này"
                  >
                    <PauseCircle className="w-3.5 h-3.5 text-stone-400" />
                    <span>{isSessionClosed ? 'Đã dừng' : 'Dừng lại'}</span>
                  </button>

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

              {/* Quick Reflection Prompts (Product Brief V1.0 - Launch Beta Profile) */}
              <div className="px-5 py-2.5 bg-stone-900/60 border-t border-white/5 flex gap-2 overflow-x-auto text-[11px] font-serif items-center">
                <span className="text-[10px] text-stone-400 font-mono flex items-center pr-1 uppercase tracking-wider shrink-0">
                  Lựa chọn mở đầu:
                </span>
                <button
                  type="button"
                  onClick={() => submitMessage('Công việc đang lấy quá nhiều thời gian.')}
                  disabled={isSessionClosed}
                  className="px-3 py-1.5 rounded-full bg-amber-400/15 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 transition whitespace-nowrap shrink-0 hover:scale-105"
                >
                  "Công việc đang lấy quá nhiều thời gian."
                </button>
                <button
                  type="button"
                  onClick={() => submitMessage('Tôi đang cân nhắc một thay đổi.')}
                  disabled={isSessionClosed}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-amber-400/20 text-stone-300 hover:text-amber-200 border border-white/10 transition whitespace-nowrap shrink-0 hover:scale-105"
                >
                  "Tôi đang cân nhắc một thay đổi."
                </button>
                <button
                  type="button"
                  onClick={() => submitMessage('Tôi chưa biết, chỉ muốn bắt đầu nói.')}
                  disabled={isSessionClosed}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-amber-400/20 text-stone-300 hover:text-amber-200 border border-white/10 transition whitespace-nowrap shrink-0 hover:scale-105"
                >
                  "Tôi chưa biết, chỉ muốn bắt đầu nói."
                </button>
              </div>

              {/* Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-stone-900/80 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  disabled={isSessionClosed}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={
                    isSessionClosed
                      ? 'Phiên đối thoại đã khép lại. Bạn có thể nhấn Đúc kết phiên để xem hoặc tải lại trang.'
                      : 'Gõ chia sẻ của bạn tại không gian này (không giới hạn chủ đề)...'
                  }
                  className="flex-1 bg-stone-950/90 border border-stone-700/60 rounded-2xl px-4 py-3 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isAiTyping || isSessionClosed}
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

          <span className="font-mono text-[11px] text-amber-300">Không Gian Đối Thoại (100%)</span>
        </div>

        {/* Session Outcome Checkpoint Modal (P0-06 & P0-08) */}
        {showCheckpointModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-xl rounded-3xl bg-stone-950 border border-amber-400/40 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-serif text-lg sm:text-xl text-amber-200 font-medium flex items-center gap-2">
                    <BookmarkCheck className="w-5 h-5 text-amber-400" />
                    <span>Đúc Kết Phiên Đối Thoại</span>
                  </h3>
                  <p className="text-xs text-stone-400 font-sans mt-0.5">
                    Session Outcome Checkpoint • Life Lab Master V8.7.2
                  </p>
                </div>
                <button
                  onClick={() => setShowCheckpointModal(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-200 hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 5 Outcomes Choice */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-amber-300/80 block">
                  1. Bạn muốn khép lại phiên hôm nay với kết quả nào?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'REFLECTIVE_PAUSE', title: 'Dừng với điều vừa rõ', desc: 'Không cần làm gì thêm, cho phép bản thân nghỉ ngơi.' },
                    { id: 'BETTER_QUESTION', title: 'Giữ một câu hỏi ngẫm nghĩ', desc: 'Mang theo một câu hỏi lắng đọng để quan sát.' },
                    { id: 'CONFIRMED_INSIGHT', title: 'Tiếp tục khám phá thấu suốt', desc: 'Nhìn sâu hơn vào gốc rễ điều đang diễn ra.' },
                    { id: 'MEANINGFUL_NEXT_STEP', title: 'Nhìn rõ một quyết định', desc: 'Một lựa chọn mà bạn cảm thấy yên tâm khi bước tiếp.' },
                    { id: 'LIFE_EXPERIMENT', title: 'Thử một bước nhỏ thực tế', desc: 'Một vi hành động nhỏ, nhẹ nhàng trong 1-3 ngày tới.' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedOutcome(item.id as SessionOutcomeType)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        selectedOutcome === item.id
                          ? 'bg-amber-400/20 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-xs font-medium text-amber-200">{item.title}</span>
                        {selectedOutcome === item.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-stone-400 font-sans mt-1 leading-snug">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Snapshot Note */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-amber-300/80 block">
                  2. Điều gì đọng lại rõ ràng nhất với bạn? (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={checkpointNote}
                  onChange={e => setCheckpointNote(e.target.value)}
                  placeholder="Ví dụ: Mình nhận ra mình đang quá cầu toàn trong công việc..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Memory Permission (P0-08 / Privacy Contract) */}
              <div className="p-4 rounded-2xl bg-stone-900/80 border border-amber-300/20 space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-serif text-xs text-stone-200 font-medium">Quyền Lưu Trữ Bộ Nhớ (Memory Permission)</span>
                </div>
                <p className="text-[11px] text-stone-400 font-sans leading-relaxed">
                  Life Lab chỉ lưu nội dung này nếu bạn đồng ý. Bạn có thể xem, chỉnh sửa hoặc xóa bất cứ lúc nào.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMemoryConsent('granted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-serif transition flex items-center gap-1.5 ${
                      memoryConsent === 'granted'
                        ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-200'
                        : 'bg-white/5 border border-white/10 text-stone-300 hover:bg-white/10'
                    }`}
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Lưu vào bộ nhớ cho phiên sau</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoryConsent('declined')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-serif transition flex items-center gap-1.5 ${
                      memoryConsent === 'declined'
                        ? 'bg-rose-500/20 border border-rose-400 text-rose-200'
                        : 'bg-white/5 border border-white/10 text-stone-400 hover:text-stone-300'
                    }`}
                  >
                    <X className="w-3 h-3 text-rose-400" />
                    <span>Không lưu (No Memory)</span>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckpointModal(false)}
                  className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
                >
                  Quay lại đối thoại
                </button>
                <button
                  type="button"
                  disabled={!selectedOutcome || memoryConsent === null}
                  onClick={handleConfirmCheckpoint}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-serif font-semibold text-xs transition shadow-md flex items-center gap-2"
                >
                  <span>Xác nhận & Khép lại phiên</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
