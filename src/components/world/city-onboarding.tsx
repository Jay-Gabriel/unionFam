'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Compass, Footprints, MapPinned, MousePointer2, Sparkles, X } from 'lucide-react';

interface CityOnboardingProps {
  open: boolean;
  onClose: () => void;
  onBegin: () => void;
}

const steps = [
  {
    eyebrow: 'Lời mở đầu',
    title: 'Bình minh đã biến mất',
    body: 'Một màn sương mang tên Quên Lãng đã phủ lên Thành Phố Mây. Những ô cửa tắt đèn, khu vườn ngừng nở và cư dân dần quên mất điều mình thật sự muốn sống vì.',
    icon: <Sparkles size={25} />,
  },
  {
    eyebrow: 'Người dẫn đường',
    title: 'Mình là Mây',
    body: 'Mình sẽ đi cùng bạn trong hành trình này. Bạn là Người Mang Hạt Sáng — mỗi câu trả lời thành thật và mỗi hành động nhỏ ngoài đời sẽ giúp một khu phố sáng trở lại.',
    icon: <Compass size={25} />,
  },
  {
    eyebrow: 'Cách khám phá',
    title: 'Đi, nhìn và lắng nghe',
    body: 'Hãy đi theo cột sáng có biểu tượng la bàn. Khi tới gần một địa danh, nút bắt đầu nhiệm vụ sẽ xuất hiện. Bạn có thể tự do khám phá nhưng các chương chính sẽ mở lần lượt.',
    icon: <Footprints size={25} />,
  },
  {
    eyebrow: 'Chương 1',
    title: 'Tới Học Viện Ban Mai',
    body: 'An đang đợi ở học viện phía bắc thành phố. Hãy đi theo cột sáng màu xanh, thắp những ô cửa đầu tiên và tìm lại điều bạn muốn dành thời gian của mình cho.',
    icon: <MapPinned size={25} />,
  },
];

export function CityOnboarding({ open, onClose, onBegin }: CityOnboardingProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        if (index < steps.length - 1) setIndex((value) => value + 1);
        else onBegin();
      }
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, onBegin, onClose, open]);

  const step = steps[index];
  const last = index === steps.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto fixed inset-0 z-[110] overflow-hidden bg-[#081727]/78 text-white backdrop-blur-md"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(125,211,252,.25),transparent_38%),linear-gradient(to_top,rgba(8,23,39,.96),rgba(8,23,39,.35))]" />
          <div className="absolute left-1/2 top-[15%] h-36 w-56 -translate-x-1/2 rounded-[50%] bg-white/10 blur-3xl" />
          <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur-xl sm:right-7 sm:top-7" aria-label="Đóng hướng dẫn">
            <X size={17} />
          </button>

          <div className="relative mx-auto flex h-full max-w-4xl flex-col items-center justify-end px-4 pb-5 pt-16 sm:justify-center sm:pb-8">
            <div className="mb-5 flex flex-col items-center sm:mb-8">
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative grid h-24 w-24 place-items-center rounded-[38%_48%_42%_52%] border border-white/55 bg-gradient-to-br from-white via-sky-100 to-cyan-200 text-[#15364c] shadow-[0_18px_70px_rgba(103,232,249,.4)] sm:h-28 sm:w-28"
              >
                <span className="absolute -left-5 bottom-2 h-11 w-14 rounded-full bg-white/85" />
                <span className="absolute -right-5 bottom-3 h-10 w-14 rounded-full bg-sky-100/90" />
                <span className="relative z-10">{step.icon}</span>
              </motion.div>
              <span className="mt-3 rounded-full border border-cyan-100/25 bg-[#15364c]/72 px-4 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-cyan-100 backdrop-blur-xl">Mây · người dẫn đường</span>
            </div>

            <motion.section
              key={index}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl rounded-[26px] border border-white/20 bg-[#102b3e]/92 p-5 shadow-[0_30px_90px_rgba(0,0,0,.42)] backdrop-blur-2xl sm:rounded-[34px] sm:p-8"
            >
              <p className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-200">{step.eyebrow}</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{step.title}</h1>
              <p className="mt-3 text-sm leading-6 text-white/72 sm:text-base sm:leading-7">{step.body}</p>

              {index === 2 && (
                <div className="mt-4 grid gap-2 text-[11px] sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[.055] p-3"><MousePointer2 size={15} className="mb-2 text-cyan-200" /><b>Máy tính</b><p className="mt-1 text-white/50">WASD để đi · kéo chuột xoay nhìn · Shift chạy · Space nhảy</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[.055] p-3"><Footprints size={15} className="mb-2 text-emerald-200" /><b>Điện thoại</b><p className="mt-1 text-white/50">Cần điều khiển bên trái · kéo màn hình xoay nhìn · nút chạy và nhảy</p></div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="flex gap-1.5">{steps.map((_, dot) => <span key={dot} className={`h-1.5 rounded-full transition-all ${dot === index ? 'w-7 bg-cyan-300' : 'w-1.5 bg-white/20'}`} />)}</div>
                <div className="flex gap-2">
                  {index > 0 && <button type="button" onClick={() => setIndex((value) => value - 1)} className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-bold text-white/60">Quay lại</button>}
                  <button type="button" onClick={() => last ? onBegin() : setIndex((value) => value + 1)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-2.5 text-xs font-black text-[#102638] shadow-lg">
                    {last ? 'Bắt đầu hành trình' : 'Tiếp tục'} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
