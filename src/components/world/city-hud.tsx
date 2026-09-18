'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, ChevronDown, Compass, Footprints, HelpCircle,
  Home, Map, MapPinned, Sparkles, X, Zap,
} from 'lucide-react';
import type { CityZone, VirtualInput, WorldJourney } from './world-types';

const EMOTES = ['❤️', '👋', '✨', '🕊️'];

interface CityHudProps {
  journey: WorldJourney;
  currentZone: CityZone | null;
  collectedShards: number;
  onEmote: (emoji: string) => void;
  onVirtualInput: (input: VirtualInput) => void;
}

export function CityHud({ journey, currentZone, collectedShards, onEmote, onVirtualInput }: CityHudProps) {
  const router = useRouter();
  const [questsOpen, setQuestsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [sprinting, setSprinting] = useState(false);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const openZone = (zone: CityZone) => {
    if (zone.aiPromptStarter) {
      window.sessionStorage.setItem('lifelab_preloaded_prompt', zone.aiPromptStarter);
      router.push(`${zone.targetHref}?prompt=${encodeURIComponent(zone.aiPromptStarter)}`);
      return;
    }
    router.push(zone.targetHref);
  };

  const moveJoystick = (event: React.TouchEvent | React.MouseEvent) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const touch = 'touches' in event ? event.touches[0] : null;
    const clientX = touch ? touch.clientX : (event as React.MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (event as React.MouseEvent).clientY;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const distance = Math.min(42, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * distance / 42;
    const y = Math.sin(angle) * distance / 42;
    setJoystick({ x: x * 30, y: y * 30 });
    onVirtualInput({ x, y, jump: false, sprint: sprinting });
  };

  const stopJoystick = () => {
    dragging.current = false;
    setJoystick({ x: 0, y: 0 });
    onVirtualInput({ x: 0, y: 0, jump: false, sprint: false });
  };

  const jump = () => {
    onVirtualInput({ x: 0, y: 0, jump: true, sprint: sprinting });
    window.setTimeout(() => onVirtualInput({ x: 0, y: 0, jump: false, sprint: sprinting }), 120);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between overflow-hidden p-3 text-white sm:p-5">
      <header className="pointer-events-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push('/app')} className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-[#173246]/80 shadow-lg backdrop-blur-xl hover:bg-[#173246]" aria-label="Về tổng quan">
            <Home size={16} />
          </button>
          <div className="rounded-full border border-white/35 bg-[#173246]/82 px-4 py-2 shadow-lg backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              <strong className="text-xs tracking-tight">THÀNH PHỐ MÂY</strong>
              <span className="hidden border-l border-white/20 pl-2 text-[9px] text-white/60 sm:inline">LIFE LAB WORLD</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/35 bg-[#173246]/82 px-3 py-2 text-[11px] font-bold shadow backdrop-blur-xl sm:flex">
            <Zap size={13} className="text-amber-300" />
            {journey.energy}% năng lượng
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/35 bg-[#173246]/82 px-3 py-2 text-[11px] font-bold shadow backdrop-blur-xl">
            <Sparkles size={13} className="text-cyan-200" />
            {collectedShards}/4
          </div>
          <button type="button" onClick={() => setMapOpen(true)} className="grid h-9 w-9 place-items-center rounded-full border border-white/35 bg-[#173246]/82 shadow backdrop-blur-xl" aria-label="Mở bản đồ">
            <Map size={15} />
          </button>
          <button type="button" onClick={() => setHelpOpen(true)} className="grid h-9 w-9 place-items-center rounded-full border border-white/35 bg-[#173246]/82 shadow backdrop-blur-xl" aria-label="Mở hướng dẫn">
            <HelpCircle size={15} />
          </button>
        </div>
      </header>

      <section className="pointer-events-auto absolute left-3 top-[66px] w-[min(330px,calc(100vw-24px))] sm:left-5 sm:top-[78px]">
        <div className="overflow-hidden rounded-[20px] border border-white/25 bg-[#112b3d]/92 shadow-[0_16px_42px_rgba(8,30,44,.3)] backdrop-blur-xl">
          <button type="button" onClick={() => setQuestsOpen((open) => !open)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.06]">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-200/30 bg-cyan-200/10 text-cyan-100"><MapPinned size={16} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3 text-xs font-bold"><span>Hành trình · Cấp {journey.level}</span><span className="text-cyan-200">{journey.energy}%</span></span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/12"><span className="block h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400 transition-all duration-700" style={{ width: `${journey.energy}%` }} /></span>
            </span>
            <ChevronDown size={15} className={`text-white/65 transition ${questsOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence initial={false}>
            {questsOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="max-h-[42vh] space-y-2 overflow-y-auto border-t border-white/12 p-2.5">
                  {journey.loading ? <p className="p-3 text-xs text-white/65">Đang kết nối dữ liệu Life Lab…</p> : journey.quests.map((quest) => (
                    <button key={quest.id} type="button" onClick={() => quest.targetHref === '/app/world' ? setQuestsOpen(false) : router.push(quest.targetHref)} className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-left hover:bg-white/[0.1]">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-[10px] font-black" style={{ borderColor: `${quest.accentColor}66`, color: quest.accentColor, background: `${quest.accentColor}18` }}>
                        {quest.completed ? <CheckCircle2 size={16} /> : `${quest.progressPercent}%`}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex justify-between gap-2"><strong className="text-[11px]">{quest.title}</strong><span className="shrink-0 text-[9px] text-white/55">{quest.progress}/{quest.total}</span></span>
                        <span className="mt-1 block text-[10px] leading-4 text-white/66">{quest.description}</span>
                        <span className="mt-1.5 block text-[9px] font-bold" style={{ color: quest.accentColor }}>{quest.completed ? `Đã nhận: ${quest.reward}` : `Thưởng: ${quest.reward}`}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between border-t border-white/10 px-4 py-2 text-[10px] text-white/60"><span>{journey.completedQuests}/{journey.totalQuests} nhiệm vụ</span><span>🔥 {journey.streak} ngày</span></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <AnimatePresence>
        {currentZone && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} className="pointer-events-auto absolute bottom-24 left-1/2 w-[min(520px,calc(100vw-24px))] -translate-x-1/2 sm:bottom-20">
            <div className="rounded-[24px] border border-white/35 bg-[#173246]/91 p-4 shadow-[0_20px_55px_rgba(18,52,72,.35)] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <span className="h-11 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: currentZone.color, boxShadow: `0 0 16px ${currentZone.color}` }} />
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm">{currentZone.name}</strong>
                  <span className="mt-0.5 block text-[10px] font-semibold" style={{ color: currentZone.color }}>{currentZone.subtitle}</span>
                  <span className="mt-1 hidden text-[10px] leading-4 text-white/65 sm:block">{currentZone.description}</span>
                </span>
                <button type="button" onClick={() => openZone(currentZone)} className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2.5 text-[11px] font-black text-[#173246] shadow-lg active:scale-95">
                  {currentZone.actionLabel}<ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="pointer-events-none flex w-full items-end justify-between pb-1">
        <div
          ref={joystickRef}
          onTouchStart={(event) => { dragging.current = true; moveJoystick(event); }}
          onTouchMove={moveJoystick}
          onTouchEnd={stopJoystick}
          onMouseDown={(event) => { dragging.current = true; moveJoystick(event); }}
          onMouseMove={(event) => { if (dragging.current) moveJoystick(event); }}
          onMouseUp={stopJoystick}
          onMouseLeave={stopJoystick}
          className="pointer-events-auto relative grid h-20 w-20 place-items-center rounded-full border border-white/35 bg-[#173246]/72 shadow-xl backdrop-blur-xl touch-none sm:hidden"
        >
          <span className="absolute inset-3 rounded-full border border-white/15" />
          <span className="h-10 w-10 rounded-full border border-white/55 bg-gradient-to-tr from-emerald-400 to-cyan-300 shadow-lg" style={{ transform: `translate(${joystick.x}px, ${joystick.y}px)` }} />
        </div>

        <div className="pointer-events-auto mb-1 hidden items-center gap-1 rounded-full border border-white/30 bg-[#173246]/82 p-1 shadow-xl backdrop-blur-xl sm:flex">
          {EMOTES.map((emoji) => <button key={emoji} type="button" onClick={() => onEmote(emoji)} className="grid h-8 w-8 place-items-center rounded-full text-sm hover:bg-white/15">{emoji}</button>)}
        </div>

        <div className="pointer-events-auto flex items-end gap-2 sm:hidden">
          <button type="button" onPointerDown={() => setSprinting(true)} onPointerUp={() => setSprinting(false)} onPointerLeave={() => setSprinting(false)} className={`grid h-11 w-11 place-items-center rounded-full border text-[9px] font-black shadow-xl backdrop-blur-xl ${sprinting ? 'border-amber-200 bg-amber-300 text-[#173246]' : 'border-white/35 bg-[#173246]/78'}`}><Footprints size={16} /></button>
          <button type="button" onClick={jump} className="grid h-14 w-14 place-items-center rounded-full border border-white/45 bg-gradient-to-tr from-emerald-500 to-cyan-400 text-[10px] font-black shadow-xl active:scale-90">JUMP</button>
        </div>
      </footer>

      <AnimatePresence>
        {(helpOpen || mapOpen) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-[#102638]/76 p-4 backdrop-blur-lg">
            <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-lg rounded-[28px] border border-white/25 bg-[#173246]/96 p-6 shadow-2xl">
              <button type="button" onClick={() => { setHelpOpen(false); setMapOpen(false); }} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10"><X size={15} /></button>
              {helpOpen ? (
                <>
                  <h2 className="flex items-center gap-2 text-lg font-black"><Compass className="text-cyan-300" />Cách khám phá thành phố</h2>
                  <div className="mt-5 space-y-3 text-sm leading-6 text-white/72">
                    <p className="rounded-2xl bg-white/[0.06] p-4"><b className="text-white">Máy tính:</b> WASD hoặc phím mũi tên để đi, kéo chuột xoay camera, Shift chạy nhanh, Space nhảy.</p>
                    <p className="rounded-2xl bg-white/[0.06] p-4"><b className="text-white">Điện thoại:</b> dùng cần điều khiển trái, nút chạy và JUMP bên phải.</p>
                    <p className="rounded-2xl bg-white/[0.06] p-4"><b className="text-white">Mục tiêu:</b> tới các cột sáng để làm nhiệm vụ Life Lab và tìm 4 mảnh ký ức quanh thành phố.</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="flex items-center gap-2 text-lg font-black"><Map className="text-cyan-300" />Bản đồ Thành Phố Mây</h2>
                  <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                    {['Học Viện Ban Mai', 'Vườn Lắng Nghe', 'Đài Quan Sát', 'Nhà Kính Dũng Khí', 'Ga Trò Chơi', 'Bến Hồ Phản Chiếu'].map((name, index) => (
                      <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"><span className="mb-2 block h-2 w-8 rounded-full" style={{ background: ['#34d399', '#5eead4', '#fde047', '#86efac', '#fb7185', '#38bdf8'][index] }} /><strong>{name}</strong></div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
