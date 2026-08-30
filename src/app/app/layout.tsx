'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  ChevronRight,
  Compass,
  FlaskConical,
  FolderArchive,
  GraduationCap,
  History,
  Home,
  Leaf,
  Menu,
  MessageCircleHeart,
  Sprout,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navigation: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Hôm nay',
    items: [
      { label: 'Tổng quan', href: '/app', icon: Home },
      { label: 'Trò chuyện cùng AI', href: '/app/conversations/new', icon: MessageCircleHeart },
    ],
  },
  {
    label: 'Thiết kế cuộc sống',
    items: [
      { label: 'Life Design Map', href: '/app/life-map', icon: Compass },
      { label: 'Financial Life', href: '/app/financial-life', icon: Wallet },
    ],
  },
  {
    label: 'Thực hành',
    items: [
      { label: 'Experiments', href: '/app/experiments', icon: FlaskConical },
      { label: 'Reflections', href: '/app/reflections', icon: BookOpen },
      { label: 'Learnings', href: '/app/learnings', icon: GraduationCap },
    ],
  },
  {
    label: 'Nhìn lại',
    items: [
      { label: 'Progress', href: '/app/progress', icon: TrendingUp },
      { label: 'Resources', href: '/app/resources', icon: FolderArchive },
      { label: 'Lịch sử Life Map', href: '/app/life-map/history', icon: History },
    ],
  },
];

const mobileNavigation = [
  { label: 'Hôm nay', href: '/app', icon: Home },
  { label: 'Trò chuyện', href: '/app/conversations/new', icon: MessageCircleHeart },
  { label: 'Life Map', href: '/app/life-map', icon: Compass },
  { label: 'Thử nghiệm', href: '/app/experiments', icon: FlaskConical },
];

function isRouteActive(pathname: string, href: string) {
  return pathname === href || (href !== '/app' && pathname.startsWith(href));
}

function Brand() {
  return (
    <Link href="/app" className="group flex items-center gap-3">
      <div className="relative grid h-11 w-11 place-items-center rounded-[17px] bg-white/10 text-calm-warm-ivory shadow-[0_10px_28px_rgba(0,0,0,0.18)] border border-white/10">
        <Leaf className="h-5 w-5 -rotate-12 transition-transform duration-500 group-hover:rotate-6 text-calm-lichen" />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-calm-forest-dusk bg-calm-pollen" />
      </div>
      <div>
        <div className="text-[17px] font-semibold tracking-[-0.025em] text-calm-paper-white">Life Lab</div>
        <div className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.17em] text-calm-fog/70">
          Understand · Choose · Become
        </div>
      </div>
    </Link>
  );
}

function Navigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-5" aria-label="Điều hướng chính">
      {navigation.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-calm-fog/50">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = isRouteActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`group flex items-center justify-between rounded-2xl px-3 py-2.5 text-[13px] transition-all duration-300 ${
                    active
                      ? 'bg-white/10 font-medium text-calm-warm-ivory shadow-glass border border-white/5'
                      : 'text-calm-fog hover:bg-white/5 hover:text-calm-paper-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-[17px] w-[17px] ${active ? 'text-calm-lichen' : 'text-calm-fern/80'}`} />
                    {item.label}
                  </span>
                  {active && <ChevronRight className="h-3.5 w-3.5 text-calm-lichen/80" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="app-calm-scope relative isolate min-h-screen bg-calm-deep-moss text-calm-paper-white"
      style={{ backgroundColor: '#263128' }}
    >
      {/* Static 2.5D atmosphere: same sanctuary language without WebGL startup cost. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-calm-deep-moss" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(circle at 82% 12%, rgba(185,198,165,0.12), transparent 30%), radial-gradient(circle at 18% 70%, rgba(89,106,85,0.18), transparent 38%), linear-gradient(180deg, #263128 0%, #1d2820 68%, #111b15 100%)',
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.055]"
          style={{ backgroundImage: "url('/visuals/living-sanctuary/root-back.svg')" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[42%] bg-cover bg-bottom opacity-[0.07]"
          style={{ backgroundImage: "url('/visuals/living-sanctuary/moss-front.svg')" }}
        />
      </div>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-calm-deep-moss/95 px-4 py-3 md:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-calm-paper-white"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Đóng menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-calm-deep-moss/80 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[286px] overflow-y-auto border-r border-white/10 bg-calm-deep-moss px-5 py-5 md:hidden"
            >
              <div className="mb-7 flex items-center justify-between">
                <Brand />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-calm-paper-white"
                  aria-label="Đóng menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Navigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] border-r border-white/5 bg-calm-deep-moss/92 md:flex md:flex-col">
        <div className="px-6 pb-5 pt-6">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-5">
          <Navigation pathname={pathname} />
        </div>
        <div className="p-4 pt-0">
          <Link
            href="/app/life-map"
            className="group block overflow-hidden rounded-[26px] border border-white/10 bg-white/5 p-4 shadow-glass"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-calm-warm-ivory shadow-sm border border-white/5">
                <Sprout className="h-4 w-4" />
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-calm-fog">Life Lab Loop</span>
            </div>
            <p className="text-[12px] font-medium leading-relaxed text-calm-fog/90">
              Mỗi câu trả lời là một hạt giống để bạn hiểu mình rõ hơn.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-calm-warm-ivory">
              Mở bản đồ <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </aside>

      <div className="relative md:pl-[272px] z-20">
        <header className="sticky top-0 z-20 hidden h-[86px] items-center justify-between border-b border-white/5 bg-calm-deep-moss/92 px-7 md:flex lg:px-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-calm-fog/70">Không gian của bạn</p>
            <h1 className="mt-1 text-[19px] font-medium tracking-[-0.02em] text-calm-paper-white">
              Hôm nay, bạn muốn lắng nghe điều gì?
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {process.env.NODE_ENV !== 'production' && (
              <span className="rounded-full border border-calm-pollen/30 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-calm-pollen">
                Local preview
              </span>
            )}
            <div className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-calm-paper-white shadow-sm">
              U
            </div>
          </div>
        </header>

        <main className="relative mx-auto min-h-[calc(100vh-86px)] w-full max-w-[1480px] px-4 pb-28 pt-5 sm:px-6 md:pb-10 md:pt-7 lg:px-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-[24px] border border-white/10 bg-calm-deep-moss/95 p-1.5 shadow-glass md:hidden">
        {mobileNavigation.map((item) => {
          const active = isRouteActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[18px] text-[9px] font-medium ${
                active ? 'bg-white/15 text-calm-warm-ivory' : 'text-calm-fog/70'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${active ? 'text-calm-warm-ivory' : 'text-calm-fog/70'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
