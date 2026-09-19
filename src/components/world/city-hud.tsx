'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, ChevronDown, Compass, Footprints, HelpCircle,
  Cloud, CloudOff, Home, LockKeyhole, Map, MapPinned, RotateCcw, Sparkles, X, Zap,
} from 'lucide-react';
import type { CityZone, VirtualInput, WorldJourney } from './world-types';
import { CITY_ZONES } from './world-data';
import { emitGlobalEmote, mergeVirtualInput, setGlobalVirtualInput } from './city-input';
import type { WorldSessionSummary } from './world-session';

const EMOTES = ['❤️', '👋', '✨', '🕊️'];

interface CityHudProps {
  journey: WorldJourney;
  currentZone: CityZone | null;
  collectedShards: number;
  onEmote: (emoji: string) => void;
  onVirtualInput: (input: VirtualInput) => void;
  onOpenZone: (zone: CityZone) => void;
  guideZone: CityZone;
  guideDistance: number;
  getLockedReason: (zone: CityZone) => string | null;
  onRestartTour: () => void;
  session: WorldSessionSummary;
}

export function CityHud({ journey, currentZone, collectedShards, onEmote, onVirtualInput, onOpenZone, guideZone, guideDistance, getLockedReason, onRestartTour, session }: CityHudProps) {
  const [questsOpen, setQuestsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [sprinting, setSprinting] = useState(false);
  const [touchControls, setTouchControls] = useState(true);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickTouchId = useRef<number | null>(null);
  const joystickPointerId = useRef<number | null>(null);
  const virtualInput = useRef<VirtualInput>({ x: 0, y: 0, jump: false, sprint: false });
  const jumpTimer = useRef<number | null>(null);

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator?.maxTouchPoints || 0) > 0);
      const isMobileSize = typeof window !== 'undefined' && window.innerWidth <= 1024;
      const query = typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse), (max-width: 1024px)') : null;
      setTouchControls(Boolean(hasTouch || isMobileSize || query?.matches));
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    window.addEventListener('touchstart', checkTouch, { once: true });
    return () => {
      window.removeEventListener('resize', checkTouch);
      window.removeEventListener('touchstart', checkTouch);
      if (jumpTimer.current) window.clearTimeout(jumpTimer.current);
    };
  }, []);

  const triggerEmoteAction = (emoji: string) => {
    emitGlobalEmote(emoji);
    onEmote(emoji);
  };

  const updateVirtualInput = (patch: Partial<VirtualInput>) => {
    const next = mergeVirtualInput(virtualInput.current, patch);
    virtualInput.current = next;
    setGlobalVirtualInput(patch);
    onVirtualInput(next);
  };

  const openZone = (zone: CityZone) => {
    onOpenZone(zone);
  };

  const updateFromCoordinates = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = rect.width / 2 - 10;
    const rawDist = Math.hypot(dx, dy);
    
    if (rawDist < 4) {
      setJoystick({ x: 0, y: 0 });
      updateVirtualInput({ x: 0, y: 0 });
      return;
    }

    const distance = Math.min(maxRadius, rawDist);
    const angle = Math.atan2(dy, dx);
    const normalizedRatio = distance / maxRadius;
    const x = Math.cos(angle) * normalizedRatio;
    const y = Math.sin(angle) * normalizedRatio;

    setJoystick({ x: x * maxRadius * 0.72, y: y * maxRadius * 0.72 });
    updateVirtualInput({ x, y });
  };

  // Native Multi-Touch Handlers (Does NOT block other touches)
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (joystickTouchId.current !== null) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    joystickTouchId.current = touch.identifier;
    updateFromCoordinates(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (joystickTouchId.current === null) return;
    const touch = Array.from(event.touches).find((t) => t.identifier === joystickTouchId.current);
    if (!touch) return;
    updateFromCoordinates(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const touch = Array.from(event.changedTouches).find((t) => t.identifier === joystickTouchId.current);
    if (touch || event.touches.length === 0) {
      joystickTouchId.current = null;
      setJoystick({ x: 0, y: 0 });
      updateVirtualInput({ x: 0, y: 0 });
    }
  };

  // Pointer Fallback (for mouse simulator testing on desktop)
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    if (joystickPointerId.current !== null) return;
    joystickPointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromCoordinates(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    if (joystickPointerId.current !== event.pointerId) return;
    updateFromCoordinates(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    if (joystickPointerId.current === event.pointerId) {
      joystickPointerId.current = null;
      setJoystick({ x: 0, y: 0 });
      updateVirtualInput({ x: 0, y: 0 });
    }
  };

  const jump = () => {
    if (jumpTimer.current) window.clearTimeout(jumpTimer.current);
    updateVirtualInput({ jump: true });
    jumpTimer.current = window.setTimeout(() => updateVirtualInput({ jump: false }), 220);
  };

  const setSprint = (active: boolean) => {
    setSprinting(active);
    updateVirtualInput({ sprint: active });
  };

  const toggleSprint = () => {
    setSprinting((current) => {
      const next = !current;
      updateVirtualInput({ sprint: next });
      return next;
    });
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between overflow-hidden p-3 text-white sm:p-5">
      <header className="pointer-events-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { const home = CITY_ZONES.find((zone) => zone.id === 'home'); if (home) onOpenZone(home); }} className="relative grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-[#173246]/80 shadow-lg backdrop-blur-xl hover:bg-[#173246]" aria-label="Mở Ngôi Nhà Bình Minh">
            <Home size={16} />
            {!session.checkedInToday && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-[#173246] bg-amber-300" />}
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
          <div title={session.saveStatus === 'saved' ? 'Đã lưu trên tài khoản' : session.saveStatus === 'saving' ? 'Đang lưu' : 'Đang lưu trên thiết bị'} className="hidden items-center gap-1.5 rounded-full border border-white/35 bg-[#173246]/82 px-3 py-2 text-[10px] font-bold text-white/70 shadow backdrop-blur-xl md:flex">
            {session.cloudAvailable ? <Cloud size={13} className={session.saveStatus === 'saving' ? 'animate-pulse text-cyan-200' : 'text-emerald-200'} /> : <CloudOff size={13} className="text-amber-200" />}
            {session.saveStatus === 'saving' ? 'Đang lưu' : session.cloudAvailable ? 'Đã lưu' : 'Trên máy'}
          </div>
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
                    <button key={quest.id} type="button" onClick={() => { const zone = CITY_ZONES.find((item) => item.id === quest.zoneId); if (zone) onOpenZone(zone); setQuestsOpen(false); }} className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-left hover:bg-white/[0.1]">
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

      <section className="pointer-events-auto absolute right-3 top-[66px] hidden w-[min(310px,calc(100vw-24px))] sm:right-5 sm:top-[78px] sm:block">
        <div className="rounded-[20px] border border-white/30 bg-[#112b3d]/90 p-3.5 shadow-[0_16px_42px_rgba(8,30,44,.3)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-200/30 bg-cyan-200/10 text-cyan-100">
              <Compass size={18} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-ping rounded-full bg-cyan-300" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-black uppercase tracking-[.18em] text-cyan-200">Mây đang dẫn đường</span>
              <strong className="mt-0.5 block truncate text-xs">Chương tiếp theo · {guideZone.name}</strong>
              <span className="mt-1 block text-[10px] text-white/55">Đi theo cột sáng · còn khoảng {Math.max(0, Math.round(guideDistance))}m</span>
            </span>
          </div>
          {guideDistance <= guideZone.radius + 2 && (
            <button type="button" onClick={() => onOpenZone(guideZone)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 py-2.5 text-[10px] font-black text-[#173246]">
              Bắt đầu chương này <ArrowRight size={12} />
            </button>
          )}
        </div>
      </section>

      {!questsOpen && <section className="pointer-events-auto absolute right-3 top-[132px] w-[min(240px,calc(100vw-96px))] sm:hidden">
        <button type="button" onClick={() => { if (guideDistance <= guideZone.radius + 2) onOpenZone(guideZone); }} className="flex w-full items-center gap-2 rounded-2xl border border-white/25 bg-[#112b3d]/88 p-2.5 text-left shadow-xl backdrop-blur-xl">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-200/12 text-cyan-100"><Compass size={15} /></span>
          <span className="min-w-0 flex-1"><strong className="block truncate text-[10px]">Tới {guideZone.name}</strong><span className="mt-0.5 block text-[9px] text-white/50">Cột sáng · {Math.max(0, Math.round(guideDistance))}m</span></span>
          {guideDistance <= guideZone.radius + 2 && <ArrowRight size={13} className="text-cyan-200" />}
        </button>
      </section>}

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
                <button type="button" onClick={() => openZone(currentZone)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[11px] font-black shadow-lg active:scale-95 ${getLockedReason(currentZone) ? 'border border-white/15 bg-white/10 text-white/65' : 'bg-gradient-to-r from-emerald-300 to-cyan-300 text-[#173246]'}`}>
                  {getLockedReason(currentZone) ? 'Chương bị khóa' : currentZone.actionLabel}{getLockedReason(currentZone) ? <LockKeyhole size={12} /> : <ArrowRight size={12} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="pointer-events-none flex w-full items-end justify-between pb-2 select-none">
        {touchControls && (
          <div
            ref={joystickRef}
            data-interactive="true"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="pointer-events-auto relative grid h-28 w-28 touch-none place-items-center rounded-full border-2 border-white/40 bg-[#173246]/85 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
          >
            {/* Directional markers */}
            <span className="pointer-events-none absolute top-2 text-[10px] font-black text-white/50">▲</span>
            <span className="pointer-events-none absolute bottom-2 text-[10px] font-black text-white/50">▼</span>
            <span className="pointer-events-none absolute left-2 text-[10px] font-black text-white/50">◀</span>
            <span className="pointer-events-none absolute right-2 text-[10px] font-black text-white/50">▶</span>
            <span className="pointer-events-none absolute inset-3 rounded-full border border-dashed border-white/20" />
            
            {/* Joystick Nub */}
            <span
              className="pointer-events-none grid h-13 w-13 place-items-center rounded-full border-2 border-white/80 bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-300 shadow-xl transition-transform duration-75"
              style={{ transform: `translate(${joystick.x}px, ${joystick.y}px)` }}
            >
              <span className="h-3.5 w-3.5 rounded-full bg-white/90 shadow" />
            </span>
          </div>
        )}

        {/* Emotes Bar - Accessible on both mobile & desktop */}
        <div className="pointer-events-auto mb-1 flex items-center gap-1 rounded-full border border-white/30 bg-[#173246]/85 p-1 shadow-xl backdrop-blur-xl">
          {EMOTES.map((emoji) => (
            <button
              key={emoji}
              type="button"
              data-interactive="true"
              onTouchStart={(e) => { e.stopPropagation(); triggerEmoteAction(emoji); }}
              onClick={(e) => { e.stopPropagation(); triggerEmoteAction(emoji); }}
              className="grid h-8 w-8 place-items-center rounded-full text-sm transition-transform hover:bg-white/15 active:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>

        {touchControls && (
          <div className="pointer-events-auto flex items-end gap-2.5 select-none">
            <button
              type="button"
              data-interactive="true"
              onTouchStart={(e) => { e.stopPropagation(); toggleSprint(); }}
              onClick={(e) => { e.stopPropagation(); toggleSprint(); }}
              className={`grid h-12 w-12 touch-none place-items-center rounded-full border-2 text-[10px] font-black shadow-xl backdrop-blur-xl transition active:scale-95 ${sprinting ? 'border-amber-300 bg-amber-400 text-[#173246] shadow-amber-400/50' : 'border-white/40 bg-[#173246]/85 text-white'}`}
            >
              <Footprints size={18} />
            </button>
            <button
              type="button"
              data-interactive="true"
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); jump(); }}
              onClick={(e) => { e.stopPropagation(); jump(); }}
              className="grid h-15 w-15 touch-none place-items-center rounded-full border-2 border-white/60 bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 text-xs font-black text-[#173246] shadow-2xl transition active:scale-90"
            >
              JUMP
            </button>
          </div>
        )}
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
                    <button type="button" onClick={() => { setHelpOpen(false); onRestartTour(); }} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/20 bg-cyan-200/10 p-3 text-xs font-black text-cyan-100"><RotateCcw size={14} />Xem lại phần mở đầu và tour</button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="flex items-center gap-2 text-lg font-black"><Map className="text-cyan-300" />Bản đồ Thành Phố Mây</h2>
                  <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                    {CITY_ZONES.filter((zone) => zone.id !== 'square' && zone.id !== 'vault').map((zone) => (
                      <button key={zone.id} type="button" onClick={() => { setMapOpen(false); onOpenZone(zone); }} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-left"><span className="mb-2 flex items-center justify-between"><span className="block h-2 w-8 rounded-full" style={{ background: zone.color }} />{getLockedReason(zone) && <LockKeyhole size={12} className="text-white/35" />}</span><strong>{zone.name}</strong></button>
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
