'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquareHeart,
  Compass,
  FlaskConical,
  BookOpen,
  GraduationCap,
  History,
  Wallet,
  TrendingUp,
  FolderArchive,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Tổng quan', href: '/app', icon: LayoutDashboard },
  { name: 'AI Conversation', href: '/app/conversations/new', icon: MessageSquareHeart },
  { name: 'Life Design Map', href: '/app/life-map', icon: Compass },
  { name: 'Experiments', href: '/app/experiments', icon: FlaskConical },
  { name: 'Reflections', href: '/app/reflections', icon: BookOpen },
  { name: 'Learnings', href: '/app/learnings', icon: GraduationCap },
  { name: 'Life Map (Lịch sử)', href: '/app/life-map/history', icon: History },
  { name: 'Financial Life', href: '/app/financial-life', icon: Wallet },
  { name: 'Progress', href: '/app/progress', icon: TrendingUp },
  { name: 'Resources', href: '/app/resources', icon: FolderArchive },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f6fc] text-slate-800 flex flex-col md:flex-row">
      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-between bg-white/90 backdrop-blur-md px-4 py-3 border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            L
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">Life Lab</h1>
            <p className="text-[10px] text-slate-500">Understand → Choose → Become</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-[265px] bg-[#fcfdff] border-r border-slate-200/70 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 flex flex-col h-full overflow-y-auto">
          {/* Logo Header */}
          <Link href="/app" className="group flex items-center gap-3 px-2 mb-6">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200"
            >
              <Sparkles size={20} />
            </motion.div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                Life Lab
              </h2>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Understand → Choose → Become</p>
            </div>
          </Link>

          {/* Navigation Links with Framer Motion hover & active spring indicator */}
          <nav className="space-y-1 flex-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/app' && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="relative block"
                >
                  <motion.div
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all ${
                      isActive
                        ? 'bg-[#1b2559] text-white shadow-md shadow-indigo-950/15 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 z-10">
                      <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500'} />
                      <span>{item.name}</span>
                    </div>

                    {isActive ? (
                      <motion.div
                        layoutId="activeChevron"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <ChevronRight size={14} className="text-indigo-200" />
                      </motion.div>
                    ) : null}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Widget: Life Lab Loop */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-gradient-to-b from-indigo-50/50 via-slate-50 to-violet-50/40 p-4 rounded-2xl border border-indigo-100/80 text-center shadow-sm"
            >
              <p className="text-[11px] font-bold text-indigo-900 tracking-wide uppercase mb-2">
                Life Lab Loop
              </p>
              
              {/* Loop Graphic Animation */}
              <div className="relative w-28 h-28 mx-auto my-2 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-300 animate-spin" style={{ animationDuration: '18s' }} />
                <div className="flex flex-col items-center z-10">
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">Explore</span>
                  <div className="flex items-center gap-1 text-[8px] text-slate-500 my-0.5">
                    <span>Learning</span>
                    <RefreshCw size={10} className="text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Choose</span>
                  </div>
                  <span className="text-[9px] font-bold text-violet-600 uppercase tracking-wider">Experience</span>
                </div>
              </div>

              {/* Quote */}
              <p className="text-[11px] text-slate-600 italic leading-snug mt-2 font-medium">
                &ldquo;Bạn là nhà khoa học của chính cuộc đời mình.&rdquo;
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">— Life Lab</p>
              
              <Link
                href="/app/life-map"
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 mt-2.5 inline-flex items-center gap-1 group"
              >
                <span>Triết lý Life Lab</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white/85 backdrop-blur-md sticky top-0 z-30 px-6 py-4 border-b border-slate-200/70 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Chào Minh Anh! 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Hôm nay bạn muốn khám phá điều gì về cuộc đời mình?
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Tìm kiếm (⌘K)"
                className="w-full bg-slate-100/90 border border-slate-200/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Notification Bell */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                3
              </span>
            </motion.button>

            {/* Profile Badge */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2.5 pl-2 border-l border-slate-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-200 bg-slate-200 flex-shrink-0 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                  alt="Minh Anh"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight">Minh Anh</div>
                <div className="text-[10px] text-slate-500 font-medium">Explorer</div>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </motion.div>
          </div>
        </header>

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 md:p-6 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
