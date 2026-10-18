import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  FlaskConical,
  Award,
  ArrowRight,
  CheckCircle2,
  Send,
  Compass,
  HeartHandshake,
  ShieldCheck,
  Zap,
  TrendingUp,
  Flame,
  Layers,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStoredGeminiKey, callGeminiCompanionAPI } from '../../services/geminiService';
import { BETA_CONFIG } from '../../config/betaFlags';

interface PortalContentSectionsProps {
  onOpenPortalModal: (portal: 'story_chat' | 'experiment' | 'wisdom') => void;
}

export const PortalContentSections: React.FC<PortalContentSectionsProps> = ({ onOpenPortalModal }) => {
  // Mini interactive state for in-page chat preview
  const [quickMessage, setQuickMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'ai' | 'user'; text: string }[]>([
    {
      sender: 'ai',
      text: 'Chào bạn. Chúng ta không cần giải quyết toàn bộ cuộc sống hôm nay. Bạn có thể bắt đầu từ điều đang chiếm nhiều suy nghĩ hoặc năng lượng. Bạn muốn bắt đầu từ đâu?',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Quick 7-Day interactive check (initialized clean without fake user data)
  const [activeChecklist, setActiveChecklist] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [sliderQ6, setSliderQ6] = useState<number>(5.0);

  const submitQuickText = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) return;

    setChatLog(prev => [...prev, { sender: 'user', text: trimmed }]);
    setQuickMessage('');
    setIsTyping(true);

    try {
      const activeKey = getStoredGeminiKey();
      const res = await callGeminiCompanionAPI(activeKey, trimmed, chatLog);
      setChatLog(prev => [...prev, { sender: 'ai', text: res.text }]);
    } catch {
      setChatLog(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Mình vẫn đang ở đây lắng nghe bạn. Bạn cứ thong thả chia sẻ điều đang chiếm nhiều năng lượng nhất lúc này, chúng ta sẽ cùng nhìn lại từng chút một.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendQuickChat = async (e: React.FormEvent) => {
    e.preventDefault();
    submitQuickText(quickMessage);
  };

  const toggleDayCheck = (idx: number) => {
    const updated = [...activeChecklist];
    updated[idx] = !updated[idx];
    setActiveChecklist(updated);
    if (updated.filter(Boolean).length === 7) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.85 } });
    }
  };

  return (
    <div className="w-full bg-[#0a0814] text-stone-100 relative z-20 py-20 px-4 sm:px-6 lg:px-12 space-y-36 border-t border-amber-300/30">
      
      {/* =========================================================================
          SECTION 1: CỔNG THỨ NHẤT — CÂU CHUYỆN THỨC TỈNH & KHUNG CHAT ĐỐI THOẠI
          (Tương ứng About / Storytelling / Reflective Conversation)
         ========================================================================= */}
      <section id="portal-story" className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono uppercase tracking-widest">
            <BookOpen className="w-3.5 h-3.5" />
            <span>CÁNH CỔNG THỨ NHẤT • PHIÊN ĐẦU TIÊN (FIRST SESSION)</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-5xl text-amber-100 leading-tight">
            Hiểu Điều Đang Diễn Ra. Nhìn Rõ Điều Quan Trọng.
          </h2>
          <p className="font-sans text-stone-300 text-sm sm:text-base leading-relaxed">
            "Không gian phản chiếu an toàn dành cho người đi làm 23–35 tuổi đang đứng giữa nhiều áp lực và lựa chọn. Chúng ta không cần giải quyết toàn bộ cuộc sống hôm nay. Hãy bắt đầu từ một điều đang chiếm nhiều năng lượng nhất."
          </p>
        </div>

        {/* Content Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: The Full Awakening Story (Triết lý chuyển hóa) */}
          <div className="lg:col-span-7 bg-stone-900/60 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-md space-y-6 shadow-xl">
            <h3 className="font-serif text-2xl text-amber-200 border-b border-amber-400/20 pb-3 flex items-center justify-between">
              <span>Khoảng Lặng Giữa Guồng Quay</span>
              <Sparkles className="w-5 h-5 text-amber-300" />
            </h3>

            <div className="space-y-4 text-stone-300 text-sm sm:text-base leading-relaxed font-sans">
              <p>
                Áp lực công việc, guồng quay deadline và kỳ vọng cuộc sống đôi khi khiến bạn cảm thấy cạn kiệt năng lượng. Nhưng hiếm khi chúng ta có một khoảng lặng thật sự để <strong className="text-amber-200 font-medium">lắng nghe và phân định</strong> điều gì đang thực sự diễn ra.
              </p>
              <p>
                Bạn đứng trước những băn khoăn: công việc đang lấy quá nhiều thời gian, có nên cân nhắc một sự thay đổi, hay tiếp tục điều chỉnh cách sống hiện tại? Đôi khi sự mắc kẹt không đến từ việc bạn làm chưa tốt, mà từ việc chưa có dịp nhìn rõ ranh giới giữa hoàn cảnh bên ngoài và mong muốn bên trong.
              </p>
              <blockquote className="p-4 rounded-2xl bg-amber-500/10 border-l-4 border-amber-400 text-amber-100 italic text-sm">
                "Chúng ta không cần giải quyết toàn bộ cuộc sống hôm nay. Bạn có thể bắt đầu từ điều đang chiếm nhiều suy nghĩ hoặc năng lượng nhất lúc này."
              </blockquote>
              <p>
                Life Lab không khuyên bảo giáo điều hay quyết định thay bạn. Chúng tôi mang đến một <strong className="text-amber-200">không gian đối thoại phản chiếu chân thành</strong>, cùng bạn gọi tên điều đang diễn ra, xác nhận điều quan trọng và tự do chọn cách bước tiếp.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap gap-4 items-center justify-between border-t border-white/10">
              <span className="text-xs text-stone-400 font-mono">Phiên bản thử nghiệm Beta • Master V8.7.2</span>
              <button
                onClick={() => onOpenPortalModal('story_chat')}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-serif font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition"
              >
                <span>Mở Toàn Màn Hình Khung Chat AI</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive Chat Sandbox */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#1b152d] to-[#100d1e] p-6 rounded-3xl border border-amber-300/30 shadow-2xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-amber-300">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-sm text-stone-100 font-medium">Life Lab Companion AI</h4>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Sẵn Sàng Đối Thoại
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-200/60 uppercase">Beta Profile V1.0</span>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
              {chatLog.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-amber-400 text-stone-950 font-sans font-medium rounded-br-sm shadow-md'
                        : 'bg-stone-800/80 border border-white/10 text-stone-200 font-serif rounded-bl-sm whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-stone-800/50 text-amber-300 text-xs w-28">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            {/* Quick Prompts (Product Brief V1.0 3 Choices) */}
            <div className="pt-2 pb-1 flex gap-1.5 overflow-x-auto text-[10px] font-serif text-amber-200/80">
              <button
                type="button"
                onClick={() => submitQuickText('Công việc đang lấy quá nhiều thời gian.')}
                className="px-2.5 py-1 rounded-full bg-amber-400/15 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 transition whitespace-nowrap"
              >
                "Công việc đang lấy quá nhiều thời gian"
              </button>
              <button
                type="button"
                onClick={() => submitQuickText('Tôi đang cân nhắc một thay đổi.')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-amber-400/20 text-stone-300 hover:text-amber-200 border border-white/10 transition whitespace-nowrap"
              >
                "Cân nhắc một thay đổi"
              </button>
              <button
                type="button"
                onClick={() => submitQuickText('Tôi chưa biết, chỉ muốn bắt đầu nói.')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-amber-400/20 text-stone-300 hover:text-amber-200 border border-white/10 transition whitespace-nowrap"
              >
                "Chưa biết, chỉ muốn bắt đầu nói"
              </button>
            </div>

            {/* Quick Chat Input */}
            <form onSubmit={handleSendQuickChat} className="pt-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={quickMessage}
                onChange={e => setQuickMessage(e.target.value)}
                placeholder="Gõ tâm sự hoặc câu hỏi của bạn..."
                className="flex-1 bg-stone-950/70 border border-stone-700/60 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 transition"
              />
              <button
                type="submit"
                disabled={!quickMessage.trim() || isTyping}
                className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 transition flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CỔNG THỨ HAI — CÁC THÍ NGHIỆM ĐỜI SỐNG (SERVICES / EXPERIMENTS)
          (Tương ứng Services / The Session / Brain Recomposition / Training)
         ========================================================================= */}
      <section id="portal-experiments" className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-400/10 border border-purple-400/30 text-purple-300 text-xs font-mono uppercase tracking-widest">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>CÁNH CỔNG THỨ HAI • 5 LIFE EXPERIMENTS</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-5xl text-amber-100 leading-tight">
            5 Hướng Thử Nghiệm Trong Đời Sống
          </h2>
          <p className="font-sans text-stone-300 text-sm sm:text-base leading-relaxed">
            "Sự thật không đến từ việc đọc thêm lý thuyết. Sự thật được sáng tỏ qua những bước thử nhỏ mà bạn áp dụng vào nhịp sống, công việc và các mối quan hệ mỗi ngày."
          </p>
        </div>

        {/* 5 Distinct Experiment Offerings (Universal Life & Work issues) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: The Focus Session */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-white/10 hover:border-amber-400/40 transition duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-300 group-hover:scale-110 transition">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300/80">THÍ NGHIỆM 01</span>
              <h3 className="font-serif text-xl text-stone-100 group-hover:text-amber-200 transition">
                Phiên Soi Chiếu Trọng Tâm (The Focus Session)
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
                Dành một khoảng lặng chân thật để gọi tên chính xác điều đang vướng mắc: áp lực công việc, sự trì hoãn, hay một quyết định cá nhân đang khiến bạn băn khoăn.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-amber-200/70 font-serif">Thời lượng: 30 – 45 Phút</span>
              <span className="text-xs text-amber-300 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                Khám phá <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Mind & Rhythm Reset */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-white/10 hover:border-amber-400/40 transition duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-purple-300/80">THÍ NGHIỆM 02</span>
              <h3 className="font-serif text-xl text-stone-100 group-hover:text-amber-200 transition">
                Tái Thiết Lập Nhịp Điệu (Rhythm & Energy Reset)
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
                Giải phóng tâm trí khỏi trạng thái quá tải thông tin và deadline dồn dập. Tái cân bằng năng lượng sinh hoạt để tìm lại sự thảnh thơi nội tại.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-amber-200/70 font-serif">Thang đo: Năng lượng 1 — 10</span>
              <span className="text-xs text-amber-300 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                Khám phá <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 3: 7-Day Boundary Practice */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-white/10 hover:border-amber-400/40 transition duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-300/80">THÍ NGHIỆM 03</span>
              <h3 className="font-serif text-xl text-stone-100 group-hover:text-amber-200 transition">
                7 Ngày Thiết Lập Ranh Giới (7-Day Boundary Practice)
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
                Thực hành bảo vệ không gian riêng: ngắt kết nối công việc sau giờ làm, học cách từ chối những đòi hỏi quá tải để chăm sóc sức khỏe của chính mình.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-amber-200/70 font-serif">Hành trình: 7 Ngày Nhẹ Nhàng</span>
              <span className="text-xs text-amber-300 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                Khám phá <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 4: The Gap Analysis */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-white/10 hover:border-amber-400/40 transition duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-400/30 flex items-center justify-center text-rose-300 group-hover:scale-110 transition">
                <Flame className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-rose-300/80">THÍ NGHIỆM 04</span>
              <h3 className="font-serif text-xl text-stone-100 group-hover:text-amber-200 transition">
                Giải Mã Khoảng Cách (The Value Gap Bridge)
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
                Nhìn rõ khoảng cách giữa những điều bạn thực sự trân trọng (sức khỏe, sự bình an, gia đình) và nơi thời gian cùng năng lượng của bạn đang thực sự bị cuốn đi.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-amber-200/70 font-serif">Trọng tâm: Lý Tưởng vs Thực Tế</span>
              <span className="text-xs text-amber-300 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                Khám phá <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 5: Safe Haven Immersion (Span 2 on lg) */}
          <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/30 via-stone-900/70 to-purple-950/30 border border-amber-300/30 flex flex-col sm:flex-row gap-6 items-center justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-[10px] font-mono tracking-widest uppercase">
                THÍ NGHIỆM 05 • TRỌNG TÂM
              </div>
              <h3 className="font-serif text-2xl text-amber-200">
                Kiến Tạo Vùng Đệm Bình Tâm (Safe Haven Immersion)
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                Tách rời cảm giác giá trị bản thân khỏi áp lực thành tích hay kỳ vọng của người khác. Thiết lập vùng đệm tinh thần vững chãi để luôn chủ động đưa ra lựa chọn bình thản.
              </p>
            </div>
            <button
              onClick={() => onOpenPortalModal('experiment')}
              className="flex-shrink-0 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-serif font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.5)] transition"
            >
              Mở Thí Nghiệm Ngay
            </button>
          </div>

        </div>

        {/* Live Interactive Experiment Preview: Conditioned by BETA_CONFIG */}
        {BETA_CONFIG.showStreaks ? (
          <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/50 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-serif text-lg text-amber-200">
                  Thử Thách Thao Tác Trực Tiếp: Bảng 7 Ngày Thí Nghiệm
                </h4>
                <p className="text-xs text-stone-400">
                  Đánh dấu các ngày bạn đã thực hiện được 30 phút tự quyết mà không bị chi phối bởi ngoại cảnh:
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/30">
                <span>Tiến độ:</span>
                <strong className="text-sm">{activeChecklist.filter(Boolean).length}/7 Ngày</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {activeChecklist.map((done, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleDayCheck(idx)}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition duration-300 ${
                    done
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-stone-950/60 border-stone-800 text-stone-500 hover:border-stone-700'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider">Ngày {idx + 1}</span>
                  <CheckCircle2 className={`w-5 h-5 ${done ? 'text-amber-400' : 'text-stone-700'}`} />
                  <span className="text-[11px] font-serif">{done ? 'Đã vượt qua' : 'Chưa ghi nhận'}</span>
                </button>
              ))}
            </div>

            {/* Q6 Energy Slider */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 font-serif">Mức Độ Tự Chủ & Năng Lượng Tâm Lý (Q6 Scale):</span>
                <span className="font-mono font-bold text-amber-300 text-sm">{sliderQ6.toFixed(1)} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={sliderQ6}
                onChange={e => setSliderQ6(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-stone-800 rounded-lg"
              />
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/40 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-mono">
                <span>Trải nghiệm cá nhân hóa • Không dùng dữ liệu giả định</span>
              </div>
              <h4 className="font-serif text-lg text-amber-200">
                Thử Nghiệm Đời Sống Sẽ Được Khởi Tạo Sau Phiên Đầu Tiên
              </h4>
              <p className="text-xs text-stone-400 max-w-xl leading-relaxed">
                Life Lab không gán sẵn dữ liệu mẫu hay tiến độ ảo. Khi bạn hoàn thành phiên đối thoại đầu tiên và xác nhận Current Focus, một bước thử nhỏ (Life Experiment) nhẹ nhàng, phù hợp với đời sống thực sẽ được đề xuất.
              </p>
            </div>
            <button
              onClick={() => onOpenPortalModal('story_chat')}
              className="px-5 py-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-200 text-xs font-serif transition shrink-0"
            >
              Bắt đầu Phiên Đầu Tiên →
            </button>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 3: CỔNG THỨ BA — BÀI HỌC, KHO LƯU NHẬN THỨC & KINTSUGI REPAIR
          (Tương ứng Bookings / Wisdom Sanctuary / Memory Center)
         ========================================================================= */}
      <section id="portal-wisdom" className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-xs font-mono uppercase tracking-widest">
            <Award className="w-3.5 h-3.5" />
            <span>CÁNH CỔNG THỨ BA • WISDOM & KINTSUGI</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-5xl text-amber-100 leading-tight">
            Đền Đài Bài Học & Kintsugi Trí Tuệ
          </h2>
          <p className="font-sans text-stone-300 text-sm sm:text-base leading-relaxed">
            "Mỗi trải nghiệm chưa như ý không phải là thất bại. Đó là dữ liệu chân thật để bạn hiểu sâu hơn về bản thân và đúc kết thành bài học quý giá cho chặng đường tiếp theo."
          </p>
        </div>

        {/* 5 Clarity Dimensions Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl text-amber-200">5 Trọng Tâm Phản Chiếu Thường Gặp</h3>
            <span className="text-xs text-stone-400 font-mono">Khung tham chiếu • Master V8.7.2</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { id: 1, name: 'Tỉnh Thức', sub: 'Awareness', color: 'from-amber-400 to-amber-600', desc: 'Nhìn nhận thực tế mà không tự phán xét' },
              { id: 2, name: 'Nhận Diện', sub: 'The Gap', color: 'from-rose-400 to-rose-600', desc: 'Thấy rõ ranh giới giữa kỳ vọng và nhu cầu' },
              { id: 3, name: 'Vùng Đệm', sub: 'Safe Haven', color: 'from-emerald-400 to-emerald-600', desc: 'Tạo khoảng lặng bình tâm giữa guồng quay' },
              { id: 4, name: 'Ý Nghĩa', sub: 'Core Purpose', color: 'from-cyan-400 to-blue-600', desc: 'Lắng nghe điều bản thân thực sự trân trọng' },
              { id: 5, name: 'Tự Chủ', sub: 'Sovereignty', color: 'from-purple-400 to-indigo-600', desc: 'Tự do lựa chọn bước đi theo nhịp sống riêng' },
            ].map(gem => (
              <div key={gem.id} className="p-4 rounded-2xl bg-stone-900/60 border border-white/10 hover:border-amber-400/40 transition text-center space-y-2">
                <div className={`w-12 h-12 rounded-2xl mx-auto bg-gradient-to-br ${gem.color} flex items-center justify-center shadow-lg`}>
                  <Award className="w-6 h-6 text-stone-950" />
                </div>
                <h4 className="font-serif text-sm text-stone-100 font-medium">{gem.name}</h4>
                <p className="text-[10px] text-amber-300 font-mono tracking-wider">{gem.sub}</p>
                <p className="text-[11px] text-stone-400 font-sans leading-tight">{gem.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Kintsugi Philosophy Banner & Full Wisdom CTA */}
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-amber-950/40 via-stone-900/80 to-stone-900/60 border border-amber-300/40 shadow-2xl flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="space-y-4 max-w-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl text-amber-200">
              Kintsugi Repair: Học Từ Trải Nghiệm Thật
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Những va vấp, những quyết định vội vàng hay cảm giác kiệt sức đều là cơ hội để thấu hiểu bản thân sâu sắc hơn. Tại Life Lab, chúng ta trân trọng mọi trải nghiệm và chuyển hóa chúng thành bài học vững chắc cho hành trình dài.
            </p>
          </div>

          <button
            onClick={() => onOpenPortalModal('wisdom')}
            className="flex-shrink-0 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-serif font-bold text-sm shadow-[0_0_30px_rgba(245,158,11,0.5)] transition hover:scale-105"
          >
            Mở Đền Đài Bài Học & Dát Vàng
          </button>
        </div>

      </section>

      {/* Footer minimal signature */}
      <footer className="text-center pt-12 border-t border-white/5 space-y-2 text-xs text-stone-400 font-sans">
        <p className="font-serif text-amber-200/80 tracking-widest uppercase">
          Life Lab Sanctuary • Triết Lý Chuyển Hóa V8.7.2
        </p>
        <p className="text-[11px] text-stone-400">
          Tôn trọng bản quyền tác giả • Nghệ thuật đồ họa và kiến trúc do Life Lab phát triển độc quyền.
        </p>
      </footer>

    </div>
  );
};
