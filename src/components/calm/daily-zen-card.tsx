'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  Compass,
  Heart,
  Feather,
  Flame,
  Sprout,
  X,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export interface ZenCard {
  id: number;
  title: string;
  theme: string;
  icon: string;
  quote: string;
  coachingQuestion: string;
  energyTone: string;
}

export const ZEN_CARDS: ZenCard[] = [
  {
    id: 1,
    title: 'Khoảng Lặng Tâm Trí',
    theme: 'SỰ BÌNH YÊN',
    icon: '🍃',
    quote: 'Mọi câu trả lời bạn đang tìm kiếm ngoài thế giới đều đã nằm sẵn trong những phút giây bạn dám ngồi lại trong tĩnh lặng.',
    coachingQuestion: 'Hôm nay, điều gì đang chiếm nhiều năng lượng của bạn nhất mà bạn có thể buông bớt 10%?',
    energyTone: '432 Hz · Tĩnh Lặng',
  },
  {
    id: 2,
    title: 'Sức Mạnh Bước Nhỏ',
    theme: 'HÀNH ĐỘNG TỐI GIẢN',
    icon: '🌱',
    quote: 'Một cái cây đại thụ luôn bắt đầu từ một hạt mầm vô danh. Đừng coi thường những hành động 5 phút mỗi sáng.',
    coachingQuestion: 'Hành động nhỏ nhất bạn có thể làm ngay hôm nay để yêu thương bản thân là gì?',
    energyTone: '528 Hz · Tái Tạo',
  },
  {
    id: 3,
    title: 'Nghệ Thuật Buông Bỏ',
    theme: 'GIẢI PHÓNG',
    icon: '🕊️',
    quote: 'Bạn không thể đón nhận những điều mới mẻ khi hai bàn tay vẫn đang nắm chặt những kỳ vọng cũ kỹ.',
    coachingQuestion: 'Có kỳ vọng nào từ người khác mà bạn đang vô tình gánh vác thay họ không?',
    energyTone: '639 Hz · Hàn Gắn',
  },
  {
    id: 4,
    title: 'Lắng Nghe Cơ Thể',
    theme: 'SỰ HIỆN DIỆN',
    icon: '🫀',
    quote: 'Cơ thể là ngôi đền duy nhất bạn sống trọn đời. Khi nó mệt mỏi, đó là lời thỉnh cầu của tâm hồn cần được nghỉ ngơi.',
    coachingQuestion: 'Cơ thể bạn đang cảm thấy thế nào ngay lúc này? Bạn có đang nợ nó một giấc ngủ ngon?',
    energyTone: '432 Hz · Phục Hồi',
  },
  {
    id: 5,
    title: 'Lòng Biết Ơn Thuần Khiết',
    theme: 'NĂNG LƯỢNG ĐỦ ĐẦY',
    icon: '✨',
    quote: 'Hạnh phúc không đến khi bạn có mọi thứ bạn muốn, mà bắt đầu từ khoảnh khắc bạn trân quý những gì đang có.',
    coachingQuestion: 'Kể tên 3 điều giản dị hôm nay khiến bạn cảm thấy may mắn vì mình còn sống và hít thở?',
    energyTone: '741 Hz · Khai Sáng',
  },
  {
    id: 6,
    title: 'Can Đảm Là Chính Mình',
    theme: 'TỰ DO NỘI TÂM',
    icon: '🦁',
    quote: 'Thà bị ghét vì là chính mình, còn hơn được yêu mến vì một chiếc mặt nạ hoàn hảo nhưng mệt mỏi.',
    coachingQuestion: 'Nếu không sợ bị bất kỳ ai phán xét, quyết định tiếp theo của bạn trong tuần này là gì?',
    energyTone: '852 Hz · Bản Lĩnh',
  },
  {
    id: 7,
    title: 'Dòng Chảy Tự Nhiên',
    theme: 'THUẬN THEO TỰ NHIÊN',
    icon: '🌊',
    quote: 'Nước mềm mại nhưng xuyên qua đá núi bởi vì nó không đối đầu mà uyển chuyển luồn lách qua từng khe hở.',
    coachingQuestion: 'Có trở ngại nào bạn đang cố dùng sức chống lại thay vì bình thản tìm một hướng đi mềm mại hơn?',
    energyTone: '432 Hz · Dòng Chảy',
  },
];

export function DailyZenCardModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [card, setCard] = useState<ZenCard>(ZEN_CARDS[0]);
  const [hasDrawnToday, setHasDrawnToday] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const today = new Date().toISOString().slice(0, 10);
    const savedDate = localStorage.getItem('unionfam_zen_card_date');
    const savedId = localStorage.getItem('unionfam_zen_card_id');

    if (savedDate === today && savedId) {
      const found = ZEN_CARDS.find((c) => c.id === parseInt(savedId, 10));
      if (found) {
        setCard(found);
        setIsFlipped(true);
        setHasDrawnToday(true);
        return;
      }
    }

    // Pick deterministic or random card for today
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const cardIndex = dayOfYear % ZEN_CARDS.length;
    setCard(ZEN_CARDS[cardIndex]);
  }, [isOpen]);

  const handleDrawCard = () => {
    setIsFlipped(true);
    setHasDrawnToday(true);
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('unionfam_zen_card_date', today);
      localStorage.setItem('unionfam_zen_card_id', card.id.toString());
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative w-full max-w-md overflow-y-auto overscroll-contain max-h-[92vh] max-h-[92dvh] rounded-[36px] border border-calm-pollen/30 bg-gradient-to-b from-[#1e2c21]/98 via-[#152319]/98 to-[#0d1610]/98 p-5 sm:p-8 text-calm-paper-white shadow-[0_25px_70px_rgba(0,0,0,0.6)] my-auto touch-manipulation"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center space-y-1.5 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-calm-pollen/40 bg-calm-pollen/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-calm-pollen">
              <Sparkles size={13} /> Thẻ Bài Tĩnh Lặng Mỗi Ngày
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Thông Điệp Khai Mở Tâm Trí
            </h3>
            <p className="text-xs text-calm-fog">
              Rút một lá bài để định tâm và bắt đầu một ngày nhẹ nhàng hơn.
            </p>
          </div>

          {/* 3D Flip Card Container */}
          <div className="relative mx-auto w-full max-w-[280px] aspect-[5/7] perspective-[1000px] mb-6">
            <motion.div
              className="w-full h-full relative cursor-pointer"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => !isFlipped && handleDrawCard()}
            >
              {/* Back of Card (Before Drawing) */}
              <div
                className="absolute inset-0 w-full h-full rounded-[26px] border-2 border-calm-pollen/40 bg-gradient-to-br from-[#283b2d] via-[#1c2c20] to-[#121c15] p-5 flex flex-col items-center justify-between shadow-[0_15px_40px_rgba(0,0,0,0.4)]"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="flex items-center justify-between w-full text-[9px] font-mono text-calm-pollen/70 uppercase">
                  <span>✦ LIFE LAB</span>
                  <span>SANCTUARY ✦</span>
                </div>

                <div className="text-center space-y-3">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-calm-pollen/40 bg-calm-pollen/10 text-calm-pollen shadow-[0_0_25px_rgba(238,213,150,0.3)] animate-pulse">
                    <Sparkles size={36} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-calm-pollen">
                    Chạm để lật bài
                  </p>
                  <p className="text-[11px] text-calm-fog/80">Lắng nghe thông điệp dành riêng cho bạn hôm nay</p>
                </div>

                <div className="text-[9px] font-mono text-calm-lichen/60 tracking-wider">
                  #UNIONFAM-ORACLE
                </div>
              </div>

              {/* Front of Card (After Drawing) */}
              <div
                className="absolute inset-0 w-full h-full rounded-[26px] border-2 border-calm-lichen/40 bg-gradient-to-b from-[#223326] via-[#17241b] to-[#0e1711] p-5 flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="flex items-center justify-between text-[9px] font-mono text-calm-lichen tracking-wider uppercase">
                  <span>{card.theme}</span>
                  <span>{card.energyTone}</span>
                </div>

                <div className="text-center space-y-2">
                  <div className="text-3xl">{card.icon}</div>
                  <h4 className="text-lg font-bold text-calm-pollen">{card.title}</h4>
                  <div className="rounded-xl border border-white/10 bg-black/35 p-3 text-xs italic text-calm-warm-ivory leading-relaxed">
                    “{card.quote}”
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-calm-lichen">Câu hỏi tự vấn hôm nay:</p>
                  <p className="text-[10.5px] text-calm-paper-white font-medium leading-tight">
                    {card.coachingQuestion}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Footer */}
          <div className="space-y-2">
            {!isFlipped ? (
              <button
                type="button"
                onClick={handleDrawCard}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-calm-pollen to-[#ebd08c] px-6 py-3.5 text-sm font-bold text-calm-deep-moss shadow-[0_4px_20px_rgba(238,213,150,0.35)] transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles size={16} />
                <span>Rút thẻ bài hôm nay</span>
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-calm-lichen px-5 py-3 text-xs font-bold text-calm-deep-moss transition-all hover:scale-[1.02] active:scale-95"
                >
                  <CheckCircle2 size={14} />
                  <span>Đã định tâm · Bắt đầu ngày mới</span>
                </button>
                <p className="text-center text-[10px] text-calm-fog/60">
                  Mỗi ngày bạn có 1 lượt rút thẻ bài độc bản để duy trì nhịp tĩnh lặng.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
