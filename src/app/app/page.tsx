'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Search,
  Target,
  Heart,
  Sun,
  ListOrdered,
  Scale,
  HelpCircle,
  Clock,
  Flame,
  Calendar,
  Zap,
  ArrowRight,
  FlaskConical,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Smile,
  Compass,
  Star,
  Layers,
  Sparkle
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [chatMessage, setChatMessage] = useState('');
  const [selectedFocus, setSelectedFocus] = useState('Hiểu bản thân hơn');

  const focusOptions = [
    'Hiểu bản thân hơn',
    'Thiết kế cuộc sống',
    'Thử nghiệm',
    'Phát triển bản thân',
    'Tài chính',
    'Mối quan hệ',
  ];

  // Framer Motion Stagger Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      {/* 1. Top Banner / Quote Box */}
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.002 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-50/90 via-violet-50/80 to-blue-50/70 p-6 md:p-8 border border-indigo-100/90 shadow-soft"
      >
        <div className="flex items-start gap-4 max-w-4xl relative z-10">
          <div className="text-4xl font-serif text-indigo-400 select-none leading-none animate-float">
            “
          </div>
          <div className="space-y-1.5">
            <p className="text-slate-800 font-bold text-sm md:text-[15.5px] leading-relaxed">
              Life Lab không tồn tại để quyết định cuộc đời bạn.
            </p>
            <p className="text-slate-600 text-sm md:text-[15px] leading-relaxed font-normal">
              Life Lab giúp bạn hiểu lựa chọn của chính mình và biến lựa chọn đó thành một cuộc sống có thể bắt đầu ngay hôm nay.
            </p>
          </div>
        </div>

        {/* Decorative SVG Landscape */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-25 pointer-events-none hidden lg:block">
          <svg viewBox="0 0 400 200" className="w-full h-full object-cover">
            <path fill="#4f46e5" d="M0,200 L150,80 L250,150 L350,50 L400,200 Z" />
            <circle cx="350" cy="40" r="16" fill="#fbbf24" className="animate-pulse" />
          </svg>
        </div>
      </motion.div>

      {/* 2. Main Grid Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (7/12 on LG) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI Conversation Box */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">AI Conversation</h3>
              </div>
              <Link href="/app/conversations/new">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold transition-colors inline-block"
                >
                  Cuộc trò chuyện mới
                </motion.span>
              </Link>
            </div>

            {/* Message Stream Preview */}
            <div className="py-4 space-y-4 max-h-[380px] overflow-y-auto pr-1">
              
              {/* Message 1: AI */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 max-w-[85%]"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                  L
                </div>
                <div className="space-y-1">
                  <div className="bg-slate-100/90 text-slate-800 text-xs md:text-[13px] p-3.5 rounded-2xl rounded-tl-sm leading-relaxed font-normal shadow-sm">
                    Nếu bạn được tự lựa chọn cuộc đời mình, bạn muốn dành thời gian và năng lượng của mình cho điều gì?
                  </div>
                  <span className="text-[10px] text-slate-400 block px-1">10:32</span>
                </div>
              </motion.div>

              {/* Message 2: User */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start justify-end gap-3 ml-auto max-w-[85%]"
              >
                <div className="space-y-1 text-right">
                  <div className="bg-indigo-50 text-indigo-950 text-xs md:text-[13px] p-3.5 rounded-2xl rounded-tr-sm leading-relaxed font-semibold shadow-sm border border-indigo-100">
                    Mình muốn kinh doanh và có nhiều tiền.
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 px-1">
                    <span>10:33</span>
                    <CheckCheck size={12} className="text-indigo-500" />
                  </div>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                  alt="User"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm flex-shrink-0"
                />
              </motion.div>

              {/* Message 3: AI */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 max-w-[85%]"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                  L
                </div>
                <div className="space-y-1">
                  <div className="bg-slate-100/90 text-slate-800 text-xs md:text-[13px] p-3.5 rounded-2xl rounded-tl-sm leading-relaxed font-normal shadow-sm">
                    Điều gì trong cuộc sống mà nhiều tiền sẽ cho phép bạn làm mà hiện tại bạn chưa thể làm?
                  </div>
                  <span className="text-[10px] text-slate-400 block px-1">10:34</span>
                </div>
              </motion.div>

              {/* Message 4: User */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-start justify-end gap-3 ml-auto max-w-[85%]"
              >
                <div className="space-y-1 text-right">
                  <div className="bg-indigo-50 text-indigo-950 text-xs md:text-[13px] p-3.5 rounded-2xl rounded-tr-sm leading-relaxed font-semibold shadow-sm border border-indigo-100">
                    Mình muốn có thời gian cho gia đình và tự do về thời gian.
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 px-1">
                    <span>10:35</span>
                    <CheckCheck size={12} className="text-indigo-500" />
                  </div>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                  alt="User"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm flex-shrink-0"
                />
              </motion.div>

              {/* Message 5: AI */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-start gap-3 max-w-[85%]"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                  L
                </div>
                <div className="space-y-1">
                  <div className="bg-slate-100/90 text-slate-800 text-xs md:text-[13px] p-3.5 rounded-2xl rounded-tl-sm leading-relaxed font-normal shadow-sm">
                    Nếu bạn có đủ tiền để không phải lo cho gia đình nữa, bạn vẫn muốn dành phần lớn thời gian để kinh doanh không?
                  </div>
                  <span className="text-[10px] text-slate-400 block px-1">10:36</span>
                </div>
              </motion.div>

            </div>

            {/* Input Composer */}
            <div className="pt-3 border-t border-slate-100">
              <div className="relative flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white transition-all">
                <input
                  type="text"
                  placeholder="Chia sẻ thêm với Life Lab..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="w-full bg-transparent text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none pr-16"
                />
                <div className="absolute right-2 flex items-center gap-1.5">
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                    <Paperclip size={16} />
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-200 transition-all"
                  >
                    <Send size={14} />
                  </motion.button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
                Life Lab không phán xét. Life Lab lắng nghe để giúp bạn hiểu bản thân hơn.
              </p>
            </div>
          </motion.div>

          {/* Life Lab Loop của bạn Section */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-card hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <Compass className="text-indigo-600" size={18} />
              <h3 className="font-bold text-slate-900 text-base">Life Lab Loop của bạn</h3>
            </div>

            {/* 6 Step Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              
              {/* Step 1 */}
              <motion.div
                whileHover={{ y: -4, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="bg-blue-50/60 border border-blue-100/90 rounded-2xl p-3 text-center flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-2">
                  <Search size={15} />
                </div>
                <div className="font-bold text-[11px] text-slate-900">1. Explore</div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Khám phá bản thân và điều bạn thật sự muốn
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                whileHover={{ y: -4, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="bg-amber-50/60 border border-amber-100/90 rounded-2xl p-3 text-center flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-2">
                  <Target size={15} />
                </div>
                <div className="font-bold text-[11px] text-slate-900">2. Choose</div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Lựa chọn hướng đi phù hợp với bạn
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                whileHover={{ y: -4, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="bg-purple-50/60 border border-purple-100/90 rounded-2xl p-3 text-center flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 mx-auto flex items-center justify-center mb-2">
                  <FlaskConical size={15} />
                </div>
                <div className="font-bold text-[11px] text-slate-900">3. Experiment</div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Tạo thí nghiệm nhỏ để thử trong thực tế
                </p>
              </motion.div>

              {/* Step 4 */}
              <motion.div
                whileHover={{ y: -4, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="bg-emerald-50/60 border border-emerald-100/90 rounded-2xl p-3 text-center flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                  <Zap size={15} />
                </div>
                <div className="font-bold text-[11px] text-slate-900">4. Experience</div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Trải nghiệm và thu thập dữ liệu
                </p>
              </motion.div>

              {/* Step 5 */}
              <motion.div
                whileHover={{ y: -4, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="bg-indigo-50/60 border border-indigo-100/90 rounded-2xl p-3 text-center flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-2">
                  <BookOpen size={15} />
                </div>
                <div className="font-bold text-[11px] text-slate-900">5. Reflection</div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Nhìn lại những gì đã xảy ra
                </p>
              </motion.div>

              {/* Step 6 */}
              <motion.div
                whileHover={{ y: -4, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="bg-rose-50/60 border border-rose-100/90 rounded-2xl p-3 text-center flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-2">
                  <GraduationCap size={15} />
                </div>
                <div className="font-bold text-[11px] text-slate-900">6. Learning</div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Rút ra bài học về chính bạn
                </p>
              </motion.div>

            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3 font-medium">
              Vòng lặp này giúp bạn liên tục hiểu sâu hơn và thiết kế lại cuộc đời mình.
            </p>
          </motion.div>

        </div>

        {/* RIGHT COLUMN (5/12 on LG) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Life Design Map Widget */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Life Design Map</h3>
              </div>
              <Link href="/app/life-map" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                Xem chi tiết
              </Link>
            </div>

            {/* 6 Cards Grid (2x3) */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Card 1 */}
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col justify-between hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer shadow-sm"
              >
                <div>
                  <div className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider">1. MY LIFE</div>
                  <p className="text-xs font-semibold text-slate-600 mt-1">Cuộc đời tôi muốn sống</p>
                </div>
                <div className="self-end text-indigo-500 mt-2">
                  <Sparkles size={16} />
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col justify-between hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer shadow-sm"
              >
                <div>
                  <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">2. WHAT MATTERS</div>
                  <p className="text-xs font-semibold text-slate-600 mt-1">Điều thực sự quan trọng</p>
                </div>
                <div className="self-end text-emerald-500 mt-2">
                  <Heart size={16} />
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col justify-between hover:border-amber-300 hover:bg-amber-50/20 transition-all cursor-pointer shadow-sm"
              >
                <div>
                  <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">3. MY IDEAL DAY</div>
                  <p className="text-xs font-semibold text-slate-600 mt-1">Một ngày lý tưởng</p>
                </div>
                <div className="self-end text-amber-500 mt-2">
                  <Sun size={16} />
                </div>
              </motion.div>

              {/* Card 4 */}
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col justify-between hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer shadow-sm"
              >
                <div>
                  <div className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">4. WHAT IT TAKES</div>
                  <p className="text-xs font-semibold text-slate-600 mt-1">Tôi cần gì để sống cuộc đời đó</p>
                </div>
                <div className="self-end text-blue-500 mt-2">
                  <ListOrdered size={16} />
                </div>
              </motion.div>

              {/* Card 5 */}
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col justify-between hover:border-rose-300 hover:bg-rose-50/20 transition-all cursor-pointer shadow-sm"
              >
                <div>
                  <div className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">5. MY TRADE-OFFS</div>
                  <p className="text-xs font-semibold text-slate-600 mt-1">Tôi đang lựa chọn và từ bỏ điều gì</p>
                </div>
                <div className="self-end text-rose-500 mt-2">
                  <Scale size={16} />
                </div>
              </motion.div>

              {/* Card 6 */}
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col justify-between hover:border-violet-300 hover:bg-violet-50/20 transition-all cursor-pointer shadow-sm"
              >
                <div>
                  <div className="text-[10px] font-extrabold text-violet-800 uppercase tracking-wider">6. THE QUESTION</div>
                  <p className="text-xs font-semibold text-slate-600 mt-1">Câu hỏi tiếp theo để khám phá</p>
                </div>
                <div className="self-end text-violet-500 mt-2">
                  <HelpCircle size={16} />
                </div>
              </motion.div>

            </div>
          </motion.div>

          {/* Experiment hiện tại Widget */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FlaskConical size={18} className="text-indigo-600 animate-pulse" />
                <h3 className="font-bold text-slate-900 text-base">Experiment hiện tại</h3>
              </div>
              <Link href="/app/experiments" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                Xem tất cả
              </Link>
            </div>

            <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-slate-900 text-sm leading-tight">
                  Làm việc 4 ngày/tuần trong 1 tháng
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold whitespace-nowrap animate-pulse">
                  Đang thực hiện
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <Target size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800">Mục tiêu:</span> kiểm tra xem mình có thực sự muốn làm ít hơn hay chỉ muốn công việc có ý nghĩa hơn.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800">Thời gian:</span> 01/05/2025 - 31/05/2025
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    Trọng tâm quan sát:
                  </div>
                  <ul className="list-disc list-inside text-slate-500 pl-2 space-y-0.5 text-[11px]">
                    <li>Cảm giác trong công việc</li>
                    <li>Thời gian cho bản thân và gia đình</li>
                    <li>Mức độ năng lượng và hạnh phúc</li>
                  </ul>
                </div>
              </div>

              {/* Progress Bar with smooth Framer Motion fill */}
              <div className="pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-700">Tiến độ</span>
                  <span className="text-slate-500">Ngày 18 / 30</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden flex items-center">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full"
                  />
                </div>
                <div className="text-right text-[11px] font-extrabold text-emerald-600 mt-1">60%</div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 3. Bottom Row Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Insights mới (6/12 on LG) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-6 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Insights mới</h3>
            </div>
            <Link href="/app/life-map" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-3">
            {/* Insight 1 */}
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50/80 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  Bạn thường cảm thấy có năng lượng nhất khi được tự do sáng tạo.
                </p>
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">Hôm qua</span>
              </div>
            </motion.div>

            {/* Insight 2 */}
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-start gap-3 p-3 rounded-2xl bg-rose-50/50 border border-rose-100 hover:bg-rose-50/80 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Heart size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  Bạn coi gia đình là giá trị cốt lõi và muốn dành nhiều thời gian hơn cho họ.
                </p>
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">2 ngày trước</span>
              </div>
            </motion.div>

            {/* Insight 3 */}
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/50 border border-amber-100 hover:bg-amber-50/80 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Scale size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  Bạn đang mâu thuẫn giữa tự do thời gian và tham vọng tài chính lớn.
                </p>
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">4 ngày trước</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Streak (3/12 on LG) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-base">Streak</h3>
              <span className="text-[11px] text-slate-400 font-medium">Giữ nhịp mỗi ngày</span>
            </div>

            <div className="flex items-center gap-3 my-2 bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-2xl border border-orange-100">
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200"
              >
                <Flame size={20} />
              </motion.div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 leading-none">12 ngày</div>
                <div className="text-[11px] text-orange-600 font-bold mt-0.5">Keep going! 🔥</div>
              </div>
            </div>

            {/* Checklist Days */}
            <div className="grid grid-cols-7 gap-1 text-center pt-3 border-t border-slate-100">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                <div key={day} className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold">{day}</span>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-[10px] font-extrabold"
                  >
                    ✓
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Focus Selector (3/12 on LG) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
        >
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              Hôm nay bạn muốn tập trung vào điều gì?
            </h3>

            <div className="flex flex-wrap gap-2">
              {focusOptions.map((opt) => {
                const isSelected = selectedFocus === opt;
                return (
                  <motion.button
                    key={opt}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedFocus(opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-right">
            <Link href="/app/conversations/new">
              <motion.span
                whileHover={{ x: 3 }}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Bắt đầu trò chuyện →
              </motion.span>
            </Link>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
