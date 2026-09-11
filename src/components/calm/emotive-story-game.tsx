'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Heart,
  MessageCircleHeart,
  PhoneCall,
  Volume2,
  VolumeX,
  ArrowRight,
  RotateCcw,
  Feather,
  Moon,
  Compass,
  Flame,
  Shield,
  Send,
  Eye,
  X,
  Share2,
  CheckCircle2,
} from 'lucide-react';

interface StoryScene {
  stepNumber: number;
  stageName: string;
  title: string;
  prompt: string;
  options: Array<{
    id: string;
    text: string;
    subtext: string;
    reaction: string;
    toneScore: string;
    musicFreq: number;
  }>;
}

const STORY_SCENES: StoryScene[] = [
  {
    stepNumber: 1,
    stageName: 'Trạm 1: Chiếc Mặt Nạ Vô Hình',
    title: 'Khi ai đó hỏi: "Dạo này bạn thế nào?", câu trả lời thực sự của bạn là gì?',
    prompt: 'Hãy thành thật với chính mình. Không ai ở đây phán xét bạn.',
    options: [
      {
        id: 'mask_fine',
        text: '“Mình vẫn ổn, vẫn bình thường thôi…”',
        subtext: 'Nhưng bên trong là sự trống rỗng và kiệt quệ không biết chia sẻ cùng ai.',
        reaction: 'Bạn đã quen với việc tỏ ra mạnh mẽ đến mức quên mất cách xin một cái ôm.',
        toneScore: 'Kiệt Quệ Vô Thức',
        musicFreq: 396,
      },
      {
        id: 'mask_smile',
        text: 'Cười xòa rồi chuyển chủ đề khác thật nhanh',
        subtext: 'Vì bạn sợ làm phiền người khác và không muốn trở thành gánh nặng.',
        reaction: 'Bạn luôn chăm sóc cảm xúc của cả thế giới, trừ chính bản thân mình.',
        toneScore: 'Hy Sinh Thầm Lặng',
        musicFreq: 417,
      },
      {
        id: 'mask_silence',
        text: 'Đã lâu lắm rồi không có ai thật lòng hỏi câu này…',
        subtext: 'Một mình đi làm, một mình về nhà, quen với sự cô độc giữa đám đông.',
        reaction: 'Sự cô đơn lớn nhất không phải là ở một mình, mà là giữa vạn người không ai hiểu mình.',
        toneScore: 'Cô Độc Giữa Đám Đông',
        musicFreq: 528,
      },
      {
        id: 'mask_chaos',
        text: 'Muốn kể hết mọi uất ức nhưng không biết bắt đầu từ đâu',
        subtext: 'Có quá nhiều gánh nặng dồn nén từ công việc, gia đình đến tương lai.',
        reaction: 'Tâm trí bạn như một mớ chỉ rối. Bạn không yếu đuối, bạn chỉ đang quá tải.',
        toneScore: 'Bão Tố Tâm Trí',
        musicFreq: 639,
      },
    ],
  },
  {
    stepNumber: 2,
    stageName: 'Trạm 2: Chiếc Vali Nặng Nhất',
    title: 'Gánh nặng nào đang bóp nghẹt năng lượng của bạn nhiều nhất lúc này?',
    prompt: 'Chạm vào chiếc vali bạn đang gồng gánh mỗi ngày:',
    options: [
      {
        id: 'bag_expectation',
        text: 'Áp lực phải thành công & Kỳ vọng của gia đình',
        subtext: 'Sợ làm người thân thất vọng, sợ bị xem là kẻ thất bại trước tuổi 30.',
        reaction: 'Bạn đang sống cuộc đời để làm hài lòng người khác hơn là vì hạnh phúc của mình.',
        toneScore: 'Áp Lực Kỳ Vọng',
        musicFreq: 432,
      },
      {
        id: 'bag_relationship',
        text: 'Một mối quan hệ bạn đã hết lòng nhưng chỉ nhận lại tổn thương',
        subtext: 'Cảm giác bị bỏ rơi, không được trân trọng dù đã cho đi tất cả.',
        reaction: 'Trái tim bạn đã chịu quá nhiều vết xước mà chưa từng được ai nâng niu.',
        toneScore: 'Tổn Thương Tình Cảm',
        musicFreq: 528,
      },
      {
        id: 'bag_financial',
        text: 'Nỗi bất an cơm áo gạo tiền & Nỗi sợ bị tụt lại phía sau',
        subtext: 'Nhìn bạn bè đồng trang lứa ai cũng tiến xa, còn mình vẫn giậm chân tại chỗ.',
        reaction: 'Đừng so sánh hậu trường đầy giông bão của bạn với sân khấu hào nhoáng của người khác.',
        toneScore: 'Lo Âu Tài Chính',
        musicFreq: 639,
      },
      {
        id: 'bag_lost',
        text: 'Mất phương hướng: Không biết mình thật sự muốn gì',
        subtext: 'Làm việc như một cỗ máy, mất hết cảm hứng sống và đam mê ngày nào.',
        reaction: 'Mất phương hướng là tín hiệu tâm hồn bạn đang kêu cứu để tìm về đúng bản ngã.',
        toneScore: 'Lạc Lối Bản Ngã',
        musicFreq: 741,
      },
    ],
  },
  {
    stepNumber: 3,
    stageName: 'Trạm 3: Tiếng Nói Của Đứa Trẻ Bên Trong',
    title: 'Nếu được gặp lại chính mình của những năm tháng ngây thơ, bạn muốn nói gì?',
    prompt: 'Hãy chọn lời thì thầm chân thật nhất từ sâu đáy lòng:',
    options: [
      {
        id: 'inner_sorry',
        text: '“Xin lỗi vì đã để bản thân chịu nhiều uất ức và tổn thương đến vậy…”',
        subtext: 'Xin lỗi vì đã quá khắt khe và chưa từng một lần khen ngợi chính mình.',
        reaction: 'Đã đến lúc tha thứ cho bản thân. Bạn đã làm tốt nhất có thể rồi.',
        toneScore: 'Sám Hối & Tự Chữa Lành',
        musicFreq: 528,
      },
      {
        id: 'inner_tired',
        text: '“Mình mệt lắm rồi… Mình chỉ muốn được nghỉ ngơi một chút thôi.”',
        subtext: 'Muốn được buông bỏ mọi trách nhiệm dù chỉ trong một ngày.',
        reaction: 'Nghỉ ngơi không phải là từ bỏ. Bạn được phép dừng lại để thở.',
        toneScore: 'Khao Khát Bình Yên',
        musicFreq: 432,
      },
      {
        id: 'inner_hug',
        text: '“Cảm ơn vì đã kiên cường không bỏ cuộc cho đến ngày hôm nay.”',
        subtext: 'Dù giông bão thế nào, bạn vẫn ở đây, vẫn tiếp tục bước đi.',
        reaction: 'Sự kiên cường của bạn là một phép màu. Bạn xứng đáng được yêu thương.',
        toneScore: 'Nội Lực Kiên Cường',
        musicFreq: 852,
      },
      {
        id: 'inner_dream',
        text: '“Đừng lo, mình nhất định sẽ tìm lại nụ cười và ước mơ rực rỡ ấy.”',
        subtext: 'Ngọn lửa bên trong bạn chưa bao giờ tắt, nó chỉ đang chờ ngày bùng cháy.',
        reaction: 'Hạt mầm hy vọng đã được tưới tắm. Cuộc đời bạn sắp bước sang chương mới.',
        toneScore: 'Hồi Sinh Hy Vọng',
        musicFreq: 963,
      },
    ],
  },
];

export function EmotiveStoryGame({
  onClose,
  isModal = false,
}: {
  onClose?: () => void;
  isModal?: boolean;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0); // 0: Intro, 1-3: Scenes, 4: Reflection/Climax
  const [userChoices, setUserChoices] = useState<Array<{ sceneIndex: number; optionId: string; text: string; reaction: string; toneScore: string }>>([]);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play audio frequency chord on choice selection
  const playChord = useCallback((freq: number) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Soft binaural chord
      [freq, freq * 1.25, freq * 1.5].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        gain.gain.setValueAtTime(0.06 / (idx + 1), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.8);
      });
    } catch {
      // Audio context policy
    }
  }, [soundEnabled]);

  const handleSelectOption = (sceneIndex: number, option: StoryScene['options'][0]) => {
    playChord(option.musicFreq);
    setActiveReaction(option.reaction);

    const newChoices = [...userChoices];
    newChoices[sceneIndex] = {
      sceneIndex,
      optionId: option.id,
      text: option.text,
      reaction: option.reaction,
      toneScore: option.toneScore,
    };
    setUserChoices(newChoices);

    setTimeout(() => {
      setActiveReaction(null);
      if (sceneIndex + 1 < STORY_SCENES.length) {
        setCurrentStep(sceneIndex + 2); // Go to next scene (1-indexed)
      } else {
        setCurrentStep(4); // Climax / Result Screen
      }
    }, 1800);
  };

  const handleStartGame = () => {
    playChord(528);
    setCurrentStep(1);
    setUserChoices([]);
    setActiveReaction(null);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setUserChoices([]);
    setActiveReaction(null);
  };

  // Generate Personalized AI Prompt from the user's emotional trail
  const getPersonalizedPrompt = () => {
    const maskChoice = userChoices[0]?.text || 'tỏ ra ổn dù rất mệt mỏi';
    const bagChoice = userChoices[1]?.text || 'gánh nặng áp lực kỳ vọng';
    const innerChoice = userChoices[2]?.text || 'muốn xin lỗi đứa trẻ bên trong';

    return `Chào Life Lab, mình vừa đi qua "Chuyến Tàu 00:00: Trạm Dừng Tâm Hồn" và nhận diện những cảm xúc thật nhất bấy lâu nay giấu kín:
1. Khi được hỏi dạo này thế nào, phản ứng thật của mình là: "${maskChoice}"
2. Chiếc vali nặng nhất đang bóp nghẹt mình là: "${bagChoice}"
3. Tiếng lòng gửi đến bản thân: "${innerChoice}"

Mình đang cảm thấy thực sự mệt mỏi và cần một khoảng lặng không phán xét. Bạn hãy cùng mình trò chuyện, lắng nghe và bóc tách những nút thắt này nhé.`;
  };

  const handleStartChat = () => {
    const prompt = getPersonalizedPrompt();
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('lifelab_preloaded_prompt', prompt);
    }
    router.push(`/app/conversations/new?prompt=${encodeURIComponent(prompt)}`);
    onClose?.();
  };

  return (
    <div className={`relative w-full max-w-4xl mx-auto overflow-hidden rounded-[36px] border border-calm-lichen/30 bg-gradient-to-b from-[#142217]/98 via-[#0f1a12]/98 to-[#09110b]/98 backdrop-blur-3xl p-6 sm:p-10 text-calm-paper-white shadow-[0_30px_90px_rgba(0,0,0,0.7)] ${isModal ? 'max-h-[92vh] overflow-y-auto' : ''}`}>
      {/* Background celestial particles & breathing aura */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-500/20 via-calm-pollen/15 to-transparent blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-gradient-to-tr from-calm-lichen/20 via-transparent to-transparent blur-3xl" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-calm-pollen/20 via-emerald-500/20 to-calm-lichen/20 border border-calm-pollen/40 shadow-[0_0_20px_rgba(238,213,150,0.3)]">
            <Moon size={22} className="text-calm-pollen animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-calm-pollen/15 border border-calm-pollen/30 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-calm-pollen">
                Trải Nghiệm Đánh Thức Cảm Xúc
              </span>
              <span className="text-[11px] text-calm-fog">✦ Độc bản Life Lab ✦</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              Chuyến Tàu 00:00: Trạm Dừng Cho Tâm Hồn
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-calm-fog hover:text-white transition"
            title={soundEnabled ? 'Tắt âm thanh tĩnh lặng' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-calm-fog hover:text-white transition"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      {currentStep > 0 && currentStep <= 3 && (
        <div className="relative z-10 pt-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-calm-lichen">
            Chặng {currentStep} / 3: {STORY_SCENES[currentStep - 1]?.stageName}
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === currentStep
                    ? 'w-8 bg-calm-pollen shadow-[0_0_10px_rgba(238,213,150,0.5)]'
                    : step < currentStep
                    ? 'w-4 bg-emerald-400'
                    : 'w-4 bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Flow Screens */}
      <AnimatePresence mode="wait">
        {/* SCENE 0: INTRO */}
        {currentStep === 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 py-10 flex flex-col items-center text-center space-y-7 max-w-2xl mx-auto"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-6 rounded-full bg-gradient-to-tr from-calm-pollen/20 via-emerald-500/20 to-transparent blur-2xl"
              />
              <div className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-b from-[#243a29] to-[#121f15] border-2 border-calm-pollen/50 shadow-[0_0_40px_rgba(238,213,150,0.3)]">
                <Feather size={50} className="text-calm-pollen animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-widest text-emerald-300 font-mono">
                ✦ Dành cho những ai đang mệt nhoài ✦
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Đêm nay, bạn không cần phải tỏ ra mạnh mẽ nữa.
              </h3>
              <p className="text-sm sm:text-base text-calm-fog/90 leading-relaxed max-w-xl mx-auto">
                Chuyến tàu 00:00 chỉ chở một hành khách duy nhất: <strong>chính bạn</strong>. Hãy bước lên toa tàu, gỡ bỏ chiếc mặt nạ thường ngày và nhìn ngắm những vết thương chưa lành trong tĩnh lặng.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartGame}
                className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-calm-pollen via-[#edd59a] to-calm-pollen px-9 py-4 text-sm sm:text-base font-extrabold text-black shadow-[0_0_35px_rgba(238,213,150,0.45)] hover:scale-105 active:scale-95 transition-all"
              >
                <span>Bước Lên Chuyến Tàu</span>
                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>

            <p className="text-[11px] text-calm-fog/60">
              * Không gian hoàn toàn riêng tư. Không lưu lại dữ liệu cá nhân nếu chưa có sự đồng ý của bạn.
            </p>
          </motion.div>
        )}

        {/* SCENES 1 to 3: INTERACTIVE EMOTIVE CHOICES */}
        {currentStep >= 1 && currentStep <= 3 && (
          <motion.div
            key={`scene-${currentStep}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="relative z-10 py-6 space-y-6 max-w-2xl mx-auto"
          >
            {/* Question Title */}
            <div className="text-center space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {STORY_SCENES[currentStep - 1]?.title}
              </h3>
              <p className="text-xs text-calm-fog">
                {STORY_SCENES[currentStep - 1]?.prompt}
              </p>
            </div>

            {/* Reaction Flash Popup when an option is clicked */}
            {activeReaction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="rounded-2xl border border-calm-pollen/50 bg-gradient-to-r from-calm-pollen/20 via-[#2a3c2e] to-calm-pollen/20 p-4 text-center shadow-[0_0_30px_rgba(238,213,150,0.3)]"
              >
                <p className="text-xs sm:text-sm font-semibold text-calm-warm-ivory italic">
                  “{activeReaction}”
                </p>
              </motion.div>
            )}

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {STORY_SCENES[currentStep - 1]?.options.map((option, idx) => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.015, x: 4 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleSelectOption(currentStep - 1, option)}
                  disabled={activeReaction !== null}
                  className="w-full text-left group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 hover:border-calm-pollen/60 hover:bg-white/[0.08] hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 max-w-[88%]">
                      <p className="text-sm sm:text-base font-bold text-white group-hover:text-calm-pollen transition">
                        {option.text}
                      </p>
                      <p className="text-xs text-calm-fog/85 leading-relaxed">
                        {option.subtext}
                      </p>
                    </div>

                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-calm-fog group-hover:border-calm-pollen/50 group-hover:bg-calm-pollen/20 group-hover:text-calm-pollen transition">
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* SCENE 4: CLIMAX & CONVERSION HOOK */}
        {currentStep === 4 && (
          <motion.div
            key="climax"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 py-4 space-y-6 max-w-3xl mx-auto"
          >
            {/* Climax Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">
                  ✦ Trạm Cuối: Ga Tĩnh Lặng ✦
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                  Bức Gương Soi Chiếu Tiềm Thức Của Bạn
                </h3>
              </div>

              <button
                type="button"
                onClick={handleRestart}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-calm-fog hover:bg-white/15 hover:text-white transition"
              >
                <RotateCcw size={12} />
                <span>Đi lại chuyến tàu</span>
              </button>
            </div>

            {/* 3 Emotional Insights Recap */}
            <div className="grid gap-3.5 sm:grid-cols-3">
              {userChoices.map((choice, idx) => (
                <div
                  key={idx}
                  className="rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-black/30 p-4 space-y-2 backdrop-blur-md"
                >
                  <span className="rounded-full bg-calm-pollen/15 px-2.5 py-0.5 text-[9px] font-bold uppercase text-calm-pollen border border-calm-pollen/30">
                    Trạm {idx + 1} · {choice.toneScore}
                  </span>
                  <p className="text-xs font-bold text-calm-warm-ivory line-clamp-2">
                    {choice.text}
                  </p>
                  <p className="text-[11px] text-calm-fog/80 italic border-t border-white/10 pt-2 leading-relaxed">
                    “{choice.reaction}”
                  </p>
                </div>
              ))}
            </div>

            {/* The Awakening Realization Card */}
            <div className="rounded-[28px] border border-calm-pollen/40 bg-gradient-to-r from-calm-pollen/15 via-[#2b3a2d]/90 to-calm-pollen/15 p-5 sm:p-6 text-center space-y-2 shadow-[0_0_35px_rgba(238,213,150,0.15)]">
              <span className="text-[11px] font-bold uppercase tracking-widest text-calm-pollen flex items-center justify-center gap-1.5">
                <Sparkles size={14} /> Thông điệp vũ trụ gửi đến bạn đêm nay
              </span>
              <p className="text-sm sm:text-base font-bold text-white max-w-xl mx-auto leading-relaxed">
                “Bạn không cần phải sửa chữa chính mình. Bạn chỉ cần ngừng gánh vác những kỳ vọng không thuộc về bạn. Hãy cho phép bản thân được sống thật một lần.”
              </p>
            </div>

            {/* THE CONVERSION HOOK: High-Empathy 1-Click to AI Companion Chat & Call */}
            <div className="rounded-[30px] border border-emerald-400/50 bg-gradient-to-b from-[#1b3323]/98 via-[#13251a]/98 to-[#0b1710]/98 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(52,211,153,0.25)] space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  <MessageCircleHeart size={16} />
                  <span>Người bạn đồng hành Life Lab đang ở đây</span>
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Bạn có muốn ngồi lại và trút hết nỗi niềm này cùng AI?
                </h4>
                <p className="text-xs sm:text-sm text-calm-lichen leading-relaxed">
                  Toàn bộ những cảm xúc và nút thắt bạn vừa bộc lộ đã được chuyển hóa thành một không gian đối thoại chân thành. Không phán xét. Không có lời khuyên sáo rỗng. Chỉ có sự thấu cảm tuyệt đối.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="flex-1 min-w-[260px] flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 px-6 py-4 text-xs sm:text-sm font-extrabold text-black shadow-[0_0_30px_rgba(52,211,153,0.5)] hover:scale-[1.02] active:scale-98 transition"
                >
                  <MessageCircleHeart size={18} />
                  <span>Mở Lòng Trò Chuyện Cùng AI Ngay →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    router.push('/app/conversations/new?call=true');
                    onClose?.();
                  }}
                  className="flex items-center justify-center gap-2 rounded-full border border-calm-pollen/40 bg-calm-pollen/15 px-6 py-4 text-xs sm:text-sm font-bold text-calm-pollen hover:bg-calm-pollen/25 transition"
                >
                  <PhoneCall size={16} />
                  <span>Gọi thoại 1:1 trong tĩnh lặng</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EmotiveStoryGameModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl my-auto"
        >
          <EmotiveStoryGame onClose={onClose} isModal={true} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
