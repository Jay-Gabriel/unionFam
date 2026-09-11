'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Sprout,
  Compass,
  ArrowRight,
  RefreshCw,
  PhoneCall,
  MessageCircleHeart,
  Flame,
  X,
  Target,
  Heart,
  Scale,
  Zap,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export interface SoulKnot {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  blindspot: string;
  seedOfClarity: string;
  awakeningQuestion: string;
  starterPrompt: string;
}

export const SOUL_KNOTS: SoulKnot[] = [
  {
    id: 'direction',
    title: 'Mất phương hướng & Bế tắc mục tiêu',
    subtitle: 'Lạc lối giữa nhiều ngã rẽ cuộc đời',
    icon: '🧭',
    color: 'text-calm-lichen',
    borderColor: 'border-calm-lichen/50',
    bgGradient: 'from-calm-lichen/20 to-transparent',
    blindspot: 'Bạn không thực sự thiếu lựa chọn, mà bạn đang sợ chọn sai. Bạn muốn một kết quả hoàn hảo trước cả khi dám bước bước đầu tiên.',
    seedOfClarity: 'Không có quyết định nào là đúng 100%. Sự rõ ràng chỉ xuất hiện trong hành động thực tế, không đến từ suy nghĩ trong đầu.',
    awakeningQuestion: 'Nếu biết chắc không có thất bại nào là vĩnh viễn, bạn muốn thử nghiệm điều nhỏ nhất gì trong tuần này?',
    starterPrompt: 'Mình vừa chơi Game Gỡ Nút Thắt và nhận diện mình đang bị [Mất phương hướng & Bế tắc mục tiêu]. Điểm mù của mình là sợ chọn sai trước khi dám bước. Hãy giúp mình bóc tách và chọn 1 hướng đi nhỏ nhất hôm nay nhé.',
  },
  {
    id: 'burnout',
    title: 'Quá tải công việc & Kiệt sức kinh niên',
    subtitle: 'Năng lượng cạn kiệt, gánh nặng quá nhiều',
    icon: '⏳',
    color: 'text-calm-danger-clay',
    borderColor: 'border-calm-danger-clay/50',
    bgGradient: 'from-calm-danger-clay/20 to-transparent',
    blindspot: 'Bạn nhầm lẫn giữa "sự bận rộn" và "giá trị bản thân". Bạn đang gánh vác kỳ vọng của mọi người mà quên mất việc đặt ranh giới bảo vệ chính mình.',
    seedOfClarity: 'Nghỉ ngơi không phải là phần thưởng sau khi làm xong hết việc, mà là điều kiện tiên quyết để bạn có thể sống một cuộc đời trọn vẹn.',
    awakeningQuestion: 'Điều gì sẽ xảy ra nếu bạn dám buông bớt 1 đầu việc không thuộc về trách nhiệm cốt lõi của mình?',
    starterPrompt: 'Mình vừa nhận diện nút thắt [Quá tải & Kiệt sức]. Mình đang cảm thấy cạn kiệt năng lượng và gánh quá nhiều trách nhiệm. Life Lab hãy cùng mình thiết lập lại ranh giới và nhịp điệu sống nhé.',
  },
  {
    id: 'money',
    title: 'Áp lực tài chính & Bất an tương lai',
    subtitle: 'Lo âu tiền bạc, cảm giác thiếu an toàn',
    icon: '💸',
    color: 'text-calm-pollen',
    borderColor: 'border-calm-pollen/50',
    bgGradient: 'from-calm-pollen/20 to-transparent',
    blindspot: 'Nỗi sợ tài chính của bạn thường lớn hơn con số thực tế. Bạn đang để áp lực tiền bạc cướp đi khả năng nhìn thấy các nguồn lực vô hình (kỹ năng, thời gian, mạng lưới quan hệ).',
    seedOfClarity: 'Tài chính là công cụ phục vụ cuộc sống bạn muốn, không phải là ông chủ quyết định mọi niềm vui của bạn.',
    awakeningQuestion: 'Con số tối thiểu thực sự để bạn cảm thấy bình an và bắt đầu theo đuổi điều ý nghĩa là bao nhiêu?',
    starterPrompt: 'Mình vừa khám phá nút thắt [Áp lực tài chính & Bất an cơm áo]. Mình muốn cùng Life Lab rà soát lại nguồn lực thực tế và thiết kế lại kế hoạch tài chính an tâm hơn.',
  },
  {
    id: 'relationship',
    title: 'Mối quan hệ & Cảm giác cô độc',
    subtitle: 'Khó kết nối sâu, cảm giác không ai hiểu mình',
    icon: '💔',
    color: 'text-[#e7bbb5]',
    borderColor: 'border-[#e7bbb5]/50',
    bgGradient: 'from-[#e7bbb5]/20 to-transparent',
    blindspot: 'Bạn mong muốn người khác thấu hiểu mình nhưng lại thường giấu kín cảm xúc thật vì sợ bị tổn thương hoặc phán xét.',
    seedOfClarity: 'Sự thân mật đích thực bắt đầu từ việc bạn dám thành thật với chính cảm xúc và tổn thương của mình.',
    awakeningQuestion: 'Lời chia sẻ chân thật nào bạn muốn nói với một người quan trọng nhưng vẫn đang giữ trong lòng?',
    starterPrompt: 'Mình vừa mở khóa nút thắt [Mối quan hệ & Cảm giác cô độc]. Mình muốn trò chuyện để hiểu rõ hơn cách giao tiếp chân thật và chữa lành sự kết nối với những người xung quanh.',
  },
  {
    id: 'tradeoff',
    title: 'Mâu thuẫn giữa Ổn định vs Tự do',
    subtitle: 'Vừa muốn an toàn, vừa khát khao bứt phá',
    icon: '⚖️',
    color: 'text-emerald-300',
    borderColor: 'border-emerald-400/50',
    bgGradient: 'from-emerald-500/20 to-transparent',
    blindspot: 'Bạn muốn có được sự tự do tuyệt đối nhưng lại không sẵn sàng trả cái giá của sự bất định. Bạn bị kẹt ở giữa hai lựa chọn mà không dấn thân vào bên nào.',
    seedOfClarity: 'Tự do không phải là không có ràng buộc, mà là quyền được lựa chọn điều bạn cam kết và sẵn lòng đánh đổi.',
    awakeningQuestion: 'Giữa tự do thời gian và sự an toàn quen thuộc, đâu là điều bạn ít sẵn sàng hy sinh hơn lúc này?',
    starterPrompt: 'Mình vừa nhận diện mâu thuẫn lớn nhất của mình là [Ổn định vs Tự do]. Hai điều này đang kéo mình về hai hướng đối nghịch. Life Lab hãy cùng mình làm rõ các điểm đánh đổi nhé.',
  },
  {
    id: 'imposter',
    title: 'Hội chứng Kẻ Giả Mạo & Tự Hoài Nghi',
    subtitle: 'Luôn cảm thấy mình chưa đủ giỏi, sợ lộ tẩy',
    icon: '🎭',
    color: 'text-indigo-300',
    borderColor: 'border-indigo-400/50',
    bgGradient: 'from-indigo-500/20 to-transparent',
    blindspot: 'Bạn đang so sánh hậu trường đầy bất an của mình với sân khấu hào nhoáng của người khác. Bạn đặt tiêu chuẩn hoàn hảo không tưởng để tự làm khó mình.',
    seedOfClarity: 'Bạn không cần phải là chuyên gia hoàn hảo để tạo ra giá trị. Trải nghiệm chân thực của bạn đã là tài sản quý giá nhất.',
    awakeningQuestion: 'Một thành tựu hoặc bài học quý giá nhất bạn từng vượt qua mà bạn chưa bao giờ công nhận bản thân là gì?',
    starterPrompt: 'Mình vừa mở khóa nút thắt [Hội chứng Kẻ Giả Mạo & Tự Hoài Nghi]. Mình luôn cảm thấy mình chưa đủ tốt. Mình muốn cùng Life Lab nhìn nhận lại những giá trị và tiềm năng thực sự của bản thân.',
  },
];

export function SoulKnotGame({
  onClose,
  isModal = false,
}: {
  onClose?: () => void;
  isModal?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'charging' | 'revealed'>('select');
  const [selectedKnot, setSelectedKnot] = useState<SoulKnot | null>(null);
  const [chargeProgress, setChargeProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const chargeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (chargeTimerRef.current) {
        clearInterval(chargeTimerRef.current);
      }
    };
  }, []);

  // Handle Hold to Unlock Mini-game mechanic
  const startCharging = (knot: SoulKnot) => {
    setSelectedKnot(knot);
    setStep('charging');
    setChargeProgress(0);
  };

  const stopCharging = () => {
    setIsPressing(false);
    if (chargeTimerRef.current) {
      clearInterval(chargeTimerRef.current);
      chargeTimerRef.current = null;
    }
  };

  const handleChargeStart = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) {
      // Prevent default context menu on long press (especially iOS Safari)
      e.stopPropagation();
    }
    stopCharging();
    setIsPressing(true);

    chargeTimerRef.current = setInterval(() => {
      setChargeProgress((p) => {
        if (p >= 100) {
          if (chargeTimerRef.current) clearInterval(chargeTimerRef.current);
          setTimeout(() => setStep('revealed'), 250);
          return 100;
        }
        return p + 6;
      });
    }, 45);
  };

  const handleQuickUnlock = () => {
    stopCharging();
    setChargeProgress(100);
    setTimeout(() => setStep('revealed'), 150);
  };

  const handleStartChatWithKnot = () => {
    if (!selectedKnot) return;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('lifelab_preloaded_prompt', selectedKnot.starterPrompt);
    }
    router.push(`/app/conversations/new?prompt=${encodeURIComponent(selectedKnot.starterPrompt)}`);
    onClose?.();
  };

  return (
    <div className={`relative w-full max-w-4xl mx-auto overflow-hidden rounded-[28px] sm:rounded-[36px] border border-white/15 bg-gradient-to-b from-[#212f24]/98 via-[#18241b]/98 to-[#101912]/98 backdrop-blur-2xl p-4 sm:p-7 md:p-9 text-calm-paper-white shadow-[0_25px_80px_rgba(0,0,0,0.6)] touch-manipulation ${isModal ? 'max-h-[88vh] max-h-[88dvh] overflow-y-auto overscroll-contain' : ''}`}>
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-calm-lichen/20 via-calm-pollen/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-500/15 via-transparent to-transparent blur-3xl" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 sm:pb-5 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-calm-lichen/20 to-calm-pollen/20 border border-calm-lichen/40 shadow-[0_0_15px_rgba(185,198,165,0.3)]">
            <Sprout size={20} className="text-calm-lichen animate-leaf-wave-1" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-calm-pollen opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-calm-pollen"></span>
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="rounded-full bg-calm-pollen/15 border border-calm-pollen/30 px-2 py-0.5 text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider text-calm-pollen">
                Game Tương Tác Tâm Trí
              </span>
              <span className="hidden xs:inline text-[10px] sm:text-[11px] text-calm-fog">✦ Bước đệm thấu hiểu ✦</span>
            </div>
            <h2 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5 truncate">
              La Bàn Gieo Hạt & Gỡ Nút Thắt Cuộc Sống
            </h2>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-calm-fog hover:bg-white/15 hover:text-white transition active:scale-95 shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main Game Screen Flows */}
      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="relative z-10 py-4 sm:py-6 space-y-4 sm:space-y-6"
          >
            <div className="text-center max-w-xl mx-auto space-y-1.5 sm:space-y-2 px-1">
              <p className="text-xs sm:text-sm font-semibold text-calm-warm-ivory">
                Hôm nay bạn đang trăn trở hoặc cảm thấy bế tắc nhất ở điều gì?
              </p>
              <p className="text-[11px] sm:text-xs text-calm-fog leading-relaxed">
                Chọn 1 nút thắt đang chiếm trọn tâm trí bạn để kích hoạt hạt mầm giải mã và bắt đầu cuộc đối thoại khai sáng.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 pt-1 sm:pt-2">
              {SOUL_KNOTS.map((knot) => (
                <motion.div
                  key={knot.id}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startCharging(knot)}
                  className={`cursor-pointer group relative overflow-hidden rounded-[20px] sm:rounded-[24px] border ${knot.borderColor} bg-gradient-to-b ${knot.bgGradient} bg-black/40 p-3.5 sm:p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)] active:bg-black/60`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">{knot.icon}</span>
                    <span className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full border border-white/15 bg-white/5 text-calm-fog group-hover:bg-white/20 group-hover:text-white transition">
                      <ArrowRight size={12} />
                    </span>
                  </div>

                  <div className="mt-2.5 sm:mt-3.5 space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-calm-warm-ivory transition leading-snug">
                      {knot.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-calm-fog/80 leading-snug">
                      {knot.subtitle}
                    </p>
                  </div>

                  <div className="mt-2.5 sm:mt-3.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px] sm:text-[11px] font-semibold text-calm-lichen">
                    <span>Chạm để giải mã</span>
                    <span className="group-hover:translate-x-1 transition-transform">Gỡ nút →</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'charging' && selectedKnot && (
          <motion.div
            key="charging"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 py-6 sm:py-10 flex flex-col items-center justify-center text-center space-y-5 sm:space-y-7"
          >
            <div className="space-y-1.5 sm:space-y-2 max-w-md px-2">
              <span className="text-3xl sm:text-4xl">{selectedKnot.icon}</span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{selectedKnot.title}</h3>
              <p className="text-[11px] sm:text-xs text-calm-fog leading-relaxed">
                Hãy hít một hơi thật sâu. Chạm và giữ quả cầu bên dưới để truyền năng lượng nhận thức vào nút thắt này.
              </p>
            </div>

            {/* Interactive Pulse Charging Orb */}
            <div className="relative flex items-center justify-center my-2 sm:my-4">
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute h-40 w-40 sm:h-48 sm:w-48 rounded-full border-2 border-calm-pollen/40 bg-calm-pollen/15 blur-lg"
              />

              <button
                type="button"
                onMouseDown={handleChargeStart}
                onMouseUp={stopCharging}
                onMouseLeave={stopCharging}
                onTouchStart={handleChargeStart}
                onTouchEnd={stopCharging}
                onTouchCancel={stopCharging}
                onClick={handleQuickUnlock}
                className="relative grid h-28 w-28 sm:h-32 sm:w-32 place-items-center rounded-full bg-gradient-to-tr from-[#384c3b] via-[#243527] to-[#384c3b] border-2 border-calm-lichen text-calm-warm-ivory shadow-[0_0_45px_rgba(185,198,165,0.4)] cursor-pointer hover:scale-105 active:scale-95 transition-transform select-none touch-none"
              >
                <div className="flex flex-col items-center gap-1 text-center">
                  <Sparkles size={22} className="text-calm-pollen animate-pulse" />
                  <span className="text-xs font-bold text-white">{isPressing ? 'Đang nạp...' : 'Chạm & Giữ'}</span>
                  <span className="text-[10px] font-mono text-calm-pollen">{chargeProgress}%</span>
                </div>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs space-y-2 px-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/40 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-calm-lichen via-calm-pollen to-emerald-400 transition-all duration-100"
                  style={{ width: `${chargeProgress}%` }}
                />
              </div>
              <button
                type="button"
                onClick={handleQuickUnlock}
                className="text-[11px] sm:text-[11.5px] text-calm-lichen underline hover:text-white transition active:scale-95"
              >
                Hoặc bấm để mở khóa ngay →
              </button>
            </div>
          </motion.div>
        )}

        {step === 'revealed' && selectedKnot && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="relative z-10 py-4 sm:py-6 space-y-4 sm:space-y-6"
          >
            {/* Top Result Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-white/10 pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-2xl sm:text-3xl">{selectedKnot.icon}</span>
                <div>
                  <span className="text-[9.5px] sm:text-[10.5px] font-mono uppercase tracking-wider text-emerald-300">
                    ✦ Đã bóc tách năng lượng tiềm thức ✦
                  </span>
                  <h3 className="text-base sm:text-xl font-bold text-white">{selectedKnot.title}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-calm-fog hover:bg-white/15 hover:text-white transition active:scale-95"
              >
                <RefreshCw size={12} />
                <span>Chọn nút thắt khác</span>
              </button>
            </div>

            {/* Insight breakdown cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {/* Card 1: Điểm mù tiềm thức */}
              <div className="rounded-[20px] sm:rounded-[24px] border border-calm-danger-clay/40 bg-gradient-to-b from-calm-danger-clay/15 to-black/30 p-4 sm:p-5 space-y-1.5 sm:space-y-2 backdrop-blur-md">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-calm-danger-clay uppercase tracking-wider">
                  <Flame size={14} />
                  <span>Điểm mù cốt lõi của bạn</span>
                </div>
                <p className="text-xs sm:text-sm text-calm-warm-ivory leading-relaxed">
                  “{selectedKnot.blindspot}”
                </p>
              </div>

              {/* Card 2: Hạt giống chuyển hóa */}
              <div className="rounded-[20px] sm:rounded-[24px] border border-calm-lichen/40 bg-gradient-to-b from-calm-lichen/15 to-black/30 p-4 sm:p-5 space-y-1.5 sm:space-y-2 backdrop-blur-md">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-calm-lichen uppercase tracking-wider">
                  <Sprout size={14} />
                  <span>Hạt giống nhận thức 24h</span>
                </div>
                <p className="text-xs sm:text-sm text-calm-warm-ivory leading-relaxed">
                  “{selectedKnot.seedOfClarity}”
                </p>
              </div>
            </div>

            {/* Awakening Question Hook */}
            <div className="rounded-[20px] sm:rounded-[24px] border border-calm-pollen/40 bg-gradient-to-r from-calm-pollen/15 via-[#2a372b]/80 to-calm-pollen/15 p-4 sm:p-5 text-center space-y-1.5 sm:space-y-2 shadow-[0_0_30px_rgba(238,213,150,0.15)]">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-calm-pollen flex items-center justify-center gap-1.5">
                <Sparkles size={13} /> Câu hỏi khai phóng cho bạn
              </span>
              <p className="text-xs sm:text-sm md:text-base font-bold text-white max-w-xl mx-auto leading-relaxed">
                “{selectedKnot.awakeningQuestion}”
              </p>
            </div>

            {/* THE CONVERSION FUNNEL: 1-Click to Chat & Voice Call */}
            <div className="rounded-[24px] sm:rounded-[28px] border border-emerald-500/40 bg-gradient-to-b from-[#182c1c]/95 to-[#101d13]/95 p-4 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5),0_0_25px_rgba(52,211,153,0.18)] space-y-3.5 sm:space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <MessageCircleHeart size={17} className="text-emerald-400 shrink-0" />
                  <span>Đưa nút thắt này vào trò chuyện cùng Life Lab ngay</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-calm-lichen leading-relaxed">
                  AI đã chuẩn bị sẵn mạch phản chiếu để cùng bạn đào sâu và tìm ra giải pháp hành động cụ thể.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={handleStartChatWithKnot}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-black shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:scale-[1.02] active:scale-98 transition text-center"
                >
                  <MessageCircleHeart size={16} />
                  <span>Trò chuyện cùng AI về nút thắt này →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    router.push('/app/conversations/new?call=true');
                    onClose?.();
                  }}
                  className="flex items-center justify-center gap-2 rounded-full border border-calm-pollen/40 bg-calm-pollen/15 px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-calm-pollen hover:bg-calm-pollen/25 transition active:scale-98"
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

export function SoulKnotGameModal({
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
          <SoulKnotGame onClose={onClose} isModal={true} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
