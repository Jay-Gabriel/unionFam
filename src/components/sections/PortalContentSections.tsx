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

interface PortalContentSectionsProps {
  onOpenPortalModal: (portal: 'story_chat' | 'experiment' | 'wisdom') => void;
}

export const PortalContentSections: React.FC<PortalContentSectionsProps> = ({ onOpenPortalModal }) => {
  // Mini interactive state for in-page chat preview
  const [quickMessage, setQuickMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'ai' | 'user'; text: string }[]>([
    {
      sender: 'ai',
      text: 'Chào bạn. Khi bạn đứng trước những con số trong tài khoản, cảm giác đầu tiên dâng lên là sự bình an hay nỗi bất an? Hãy chia sẻ thật lòng, ở đây không ai phán xét bạn.',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Quick 7-Day interactive check
  const [activeChecklist, setActiveChecklist] = useState<boolean[]>([true, true, true, false, false, false, false]);
  const [sliderQ6, setSliderQ6] = useState<number>(8.0);

  const handleSendQuickChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessage.trim() || isTyping) return;

    const userText = quickMessage.trim();
    setChatLog(prev => [...prev, { sender: 'user', text: userText }]);
    setQuickMessage('');
    setIsTyping(true);

    try {
      const activeKey = getStoredGeminiKey();
      const res = await callGeminiCompanionAPI(activeKey, userText, chatLog);
      setChatLog(prev => [...prev, { sender: 'ai', text: res.text }]);
    } catch {
      setChatLog(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Mình vẫn đang ở đây lắng nghe bạn. Khi bạn nghĩ về câu hỏi "Tiền đang phục vụ cuộc đời nào?", điều gì dâng lên đầu tiên trong lòng bạn?',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
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
            <span>CÁNH CỔNG THỨ NHẤT • ABOUT & CONVERSATION</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-5xl text-amber-100 leading-tight">
            Ai Đang Cầm La Bàn Cuộc Đời Bạn?
          </h2>
          <p className="font-sans text-stone-300 text-sm sm:text-base leading-relaxed">
            "Đây không phải là một trang web thông thường. Đây là một điểm ngoặt tâm thức, nơi bạn dừng lại để tự vấn: Tiền bạc đang phục vụ cuộc đời bạn, hay bạn đang làm nô lệ cho nó?"
          </p>
        </div>

        {/* Content Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: The Full Awakening Story (Triết lý chuyển hóa) */}
          <div className="lg:col-span-7 bg-stone-900/60 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-md space-y-6 shadow-xl">
            <h3 className="font-serif text-2xl text-amber-200 border-b border-amber-400/20 pb-3 flex items-center justify-between">
              <span>Hành Trình Tỉnh Thức (The Awakening)</span>
              <Sparkles className="w-5 h-5 text-amber-300" />
            </h3>

            <div className="space-y-4 text-stone-300 text-sm sm:text-base leading-relaxed font-sans">
              <p>
                Bao nhiêu năm qua, xã hội dạy bạn cách kiếm tiền, đầu tư, tích lũy. Nhưng chưa từng có trường lớp nào dạy bạn cách <strong className="text-amber-200 font-medium">lắng nghe nhịp thở của chính mình</strong> khi đứng trước những quyết định tài chính.
              </p>
              <p>
                Bạn bị cuốn vào vòng xoáy so sánh: người khác mua nhà, đổi xe, ăn những bữa tối sang trọng. Bạn chi tiêu không phải vì trái tim mách bảo, mà vì nỗi sợ bị bỏ lại phía sau (FOMO) hoặc để lấp đầy một khoảng trống cô đơn sau những giờ làm việc kiệt sức.
              </p>
              <blockquote className="p-4 rounded-2xl bg-amber-500/10 border-l-4 border-amber-400 text-amber-100 italic text-sm">
                "Khi bạn tiêu một đồng tiền trong sợ hãi, bạn đang nuôi dưỡng nỗi sợ. Khi bạn sử dụng tiền để tôn vinh sự sống và tình yêu thương, tiền bạc trở thành đôi cánh tự do."
              </blockquote>
              <p>
                Life Lab không cung cấp những lời khuyên làm giàu chớp nhoáng. Chúng tôi cung cấp một <strong className="text-amber-200">không gian soi chiếu thiêng liêng</strong>, nơi bạn có thể bộc bạch những bất an thầm kín nhất với AI Life Lab đã được tinh chỉnh theo chuẩn V8.7.2.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap gap-4 items-center justify-between border-t border-white/10">
              <span className="text-xs text-stone-400 font-mono">Đặc tả chuẩn mực V8.7.2 • Master Spec</span>
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
              <span className="text-[10px] font-mono text-amber-200/60 uppercase">Sanctuary V8.7</span>
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

            {/* Quick Prompts */}
            <div className="pt-2 pb-1 flex gap-1.5 overflow-x-auto text-[10px] font-serif text-amber-200/80">
              <button
                type="button"
                onClick={() => setQuickMessage('Gợi ý cho tôi hướng bắt đầu hiệu chỉnh tâm lý tài chính')}
                className="px-2.5 py-1 rounded-full bg-amber-400/15 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 transition whitespace-nowrap"
              >
                ✨ "Gợi ý cho tôi"
              </button>
              <button
                type="button"
                onClick={() => setQuickMessage('Tôi hay mua sắm bốc đồng mỗi khi stress.')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-amber-400/20 text-stone-300 hover:text-amber-200 border border-white/10 transition whitespace-nowrap"
              >
                "Hay mua sắm khi stress"
              </button>
              <button
                type="button"
                onClick={() => setQuickMessage('Tiền đang phục vụ cuộc đời nào?')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-amber-400/20 text-stone-300 hover:text-amber-200 border border-white/10 transition whitespace-nowrap"
              >
                "Tiền phục vụ cuộc đời nào?"
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
            5 Gói Thí Nghiệm Chuyển Hóa
          </h2>
          <p className="font-sans text-stone-300 text-sm sm:text-base leading-relaxed">
            "Sự thật không đến từ việc đọc thêm lý thuyết. Sự thật chỉ được chứng minh qua những thí nghiệm vi mô mà bạn dám thực hiện trong đời sống thường nhật."
          </p>
        </div>

        {/* 5 Distinct Experiment Offerings (Analogous to 5 Services on original site) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: The Deep Session */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-white/10 hover:border-amber-400/40 transition duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-300 group-hover:scale-110 transition">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300/80">THÍ NGHIỆM 01</span>
              <h3 className="font-serif text-xl text-stone-100 group-hover:text-amber-200 transition">
                Phiên Soi Chiếu Cốt Lõi (The Core Session)
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
                Đối diện trực diện với những khoản chi tiêu bị kìm nén. Nhận diện cảm xúc tội lỗi và chuyển hóa nó thành sự bình an sâu thẳm.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-amber-200/70 font-serif">Thời lượng: 60 Phút</span>
              <span className="text-xs text-amber-300 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                Khai mở <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Mind Recomposition */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-white/10 hover:border-amber-400/40 transition duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-purple-300/80">THÍ NGHIỆM 02</span>
              <h3 className="font-serif text-xl text-stone-100 group-hover:text-amber-200 transition">
                Tái Cấu Trúc Nhận Thức (Mind Recomposition)
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
                Giải phóng tâm trí khỏi trạng thái căng thẳng và quá tải số liệu. Sử dụng thang đo năng lượng Q6 Scale để tái cân bằng nhịp sinh học tiền bạc.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-amber-200/70 font-serif">Thang đo: 1 — 10</span>
              <span className="text-xs text-amber-300 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                Khai mở <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 3: 7-Day Micro Fast */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-white/10 hover:border-amber-400/40 transition duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-300/80">THÍ NGHIỆM 03</span>
              <h3 className="font-serif text-xl text-stone-100 group-hover:text-amber-200 transition">
                7 Ngày Tĩnh Lặng Chi Tiêu (7-Day Financial Fast)
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
                Thực hành 7 ngày không chi tiêu ngoài dự định. Tận hưởng cảm giác tự do khi làm chủ mọi quyết định mua sắm của chính mình.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-amber-200/70 font-serif">Hành trình: 7 Ngày</span>
              <span className="text-xs text-amber-300 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                Khai mở <ArrowRight className="w-3.5 h-3.5" />
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
                Giải Mã Khoảng Cách (The Gap Bridge)
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
                Thấy rõ độ lệch sâu sắc giữa những giá trị bạn tuyên bố coi trọng (Gia đình, Sức khỏe) và nơi tiền bạc của bạn thực sự chảy vào.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-amber-200/70 font-serif">Độ lệch: Real vs Claim</span>
              <span className="text-xs text-amber-300 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                Khai mở <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 5: Safe Haven Immersion (Span 2 on lg) */}
          <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/30 via-stone-900/70 to-purple-950/30 border border-amber-300/30 flex flex-col sm:flex-row gap-6 items-center justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-[10px] font-mono tracking-widest uppercase">
                THÍ NGHIỆM 05 • ĐỈNH CAO
              </div>
              <h3 className="font-serif text-2xl text-amber-200">
                Kiến Tạo Vùng Đệm An Tâm (Safe Haven Immersion)
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                Tách rời hoàn toàn cảm giác sinh tồn khỏi số dư ngân hàng. Thiết lập vùng đệm tài chính tâm lý để luôn đưa ra quyết định với tâm thế vững vàng của người chiến thắng.
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

        {/* Live Interactive Experiment Preview: 7-Day Checklist & Q6 Energy Slider */}
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
            "Không có thất bại nào là vĩnh viễn. Mọi sai lầm tài chính đều là một vết nứt thiêng liêng cần được dát vàng để tạo nên tác phẩm hoàn mỹ của cuộc đời bạn."
          </p>
        </div>

        {/* 5 Clarity Gems Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl text-amber-200">5 Viên Ngọc Clarity Khai Mở</h3>
            <span className="text-xs text-stone-400 font-mono">Dựa trên Master Blueprint V8.7.2</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { id: 1, name: 'Tỉnh Thức', sub: 'Awareness', color: 'from-amber-400 to-amber-600', desc: 'Thấu rõ dòng tiền không còn sợ hãi' },
              { id: 2, name: 'Nhận Diện', sub: 'The Gap', color: 'from-rose-400 to-rose-600', desc: 'Phát hiện độ lệch giữa lý tưởng và hành vi' },
              { id: 3, name: 'Vùng Đệm', sub: 'Safe Haven', color: 'from-emerald-400 to-emerald-600', desc: 'Tách rời cảm giác sinh tồn khỏi số dư' },
              { id: 4, name: 'Sứ Mệnh', sub: 'Core Purpose', color: 'from-cyan-400 to-blue-600', desc: 'Biết tiền đang phụng sự điều gì' },
              { id: 5, name: 'Tự Do', sub: 'Sovereignty', color: 'from-purple-400 to-indigo-600', desc: 'Làm chủ quyết định không bị áp lực cuốn đi' },
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
              Kintsugi Repair: Chữa Lành Những Vết Nứt Tài Chính
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Nếu bạn từng có những khoản đầu tư thua lỗ, những quyết định bốc đồng khiến bạn dằn vặt, đừng trốn tránh chúng. Tại Life Lab, chúng ta gắn kết những mảnh vỡ bằng lòng bao dung và sự hiểu biết, dát lên chúng lớp vàng của trí tuệ.
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
