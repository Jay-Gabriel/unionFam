'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sun } from 'lucide-react';

export function CityFinale({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-auto fixed inset-0 z-[120] grid place-items-center overflow-hidden bg-[#071522]/88 p-4 text-white backdrop-blur-xl">
    <motion.div animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.35, 0.7, 0.35] }} transition={{ duration: 5, repeat: Infinity }} className="absolute h-[70vmin] w-[70vmin] rounded-full bg-[radial-gradient(circle,#fde68a_0%,#67e8f9_38%,transparent_72%)] blur-3xl" />
    <motion.section initial={{ y: 28, scale: 0.96 }} animate={{ y: 0, scale: 1 }} className="relative max-w-2xl rounded-[32px] border border-amber-100/35 bg-[#123247]/94 p-6 text-center shadow-[0_35px_120px_rgba(56,189,248,.35)] sm:p-10">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-amber-100/50 bg-gradient-to-br from-amber-100 via-yellow-300 to-cyan-200 text-[#173246] shadow-[0_0_60px_rgba(253,224,71,.55)]"><Sun size={42} /></motion.div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[.25em] text-amber-200">Khép lại mùa đầu tiên</p>
      <h2 className="mt-2 text-3xl font-black sm:text-5xl">Bình minh đã trở lại</h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">Những ô cửa đã sáng, khu vườn đã nở và mặt hồ đã giữ lại điều bạn học được. Thành phố không sáng vì bạn trở thành một người hoàn hảo—nó sáng vì bạn đã thành thật và dám thử một bước nhỏ.</p>
      <blockquote className="mx-auto mt-5 max-w-lg rounded-2xl border border-white/10 bg-white/[.06] p-4 text-sm italic leading-6 text-cyan-100">“Bình minh không phải nơi hành trình kết thúc. Đó là lúc bạn đã nhìn đủ rõ để chọn cách mình muốn sống tiếp.” — Mây</blockquote>
      <button type="button" onClick={onClose} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-200 via-emerald-200 to-cyan-200 px-7 py-3 text-sm font-black text-[#102638]"><Sparkles size={16} />Trở về Thành Phố Mây</button>
    </motion.section>
  </motion.div>;
}
