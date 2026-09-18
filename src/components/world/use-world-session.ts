'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  chooseNewestSnapshot, DEFAULT_WORLD_TRANSFORM, readLocalWorldSnapshot,
  type WorldMembership, type WorldSessionSnapshot, type WorldSessionSummary,
  type WorldTransform, writeLocalWorldSnapshot,
} from './world-session';
import type { CityZoneId } from './world-types';

const FREE_MEMBERSHIP: WorldMembership = {
  planCode: 'free', status: 'inactive', currentPeriodEnd: null, cancelAtPeriodEnd: false,
};

const DEFAULT_SUMMARY: WorldSessionSummary = {
  sessionId: null,
  sessionCount: 0,
  totalPlaySeconds: 0,
  lastSeenAt: null,
  cloudAvailable: false,
  saveStatus: 'loading',
  checkedInToday: false,
  checkInStreak: 0,
  membership: FREE_MEMBERSHIP,
};

type MutableWorldState = {
  collectedShardIds: string[];
  unlockedZoneIds: CityZoneId[];
  onboardingSeen: boolean;
  lastZoneId: CityZoneId | null;
};

type StartResponse = {
  data?: Partial<WorldSessionSummary> & { snapshot?: WorldSessionSnapshot | null };
};

function deviceClass(): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (!coarse) return 'desktop';
  return Math.min(window.innerWidth, window.innerHeight) >= 700 ? 'tablet' : 'mobile';
}

export function useWorldSession(
  mutableState: MutableWorldState,
  getTransform: () => WorldTransform | null,
) {
  const [restoredSnapshot, setRestoredSnapshot] = useState<WorldSessionSnapshot | null>(null);
  const [summary, setSummary] = useState<WorldSessionSummary>(DEFAULT_SUMMARY);
  const sessionStartedAt = useRef(Date.now());
  const sessionId = useRef<string | null>(null);
  const cloudAvailable = useRef(false);
  const ready = useRef(false);
  const stateRef = useRef(mutableState);
  const saving = useRef(false);
  const clientSessionKey = useRef('');

  useEffect(() => { stateRef.current = mutableState; }, [mutableState]);

  const makeSnapshot = useCallback((): WorldSessionSnapshot => ({
    transform: getTransform() || restoredSnapshot?.transform || DEFAULT_WORLD_TRANSFORM,
    collectedShardIds: [...new Set(stateRef.current.collectedShardIds)],
    unlockedZoneIds: [...new Set(stateRef.current.unlockedZoneIds)],
    onboardingSeen: stateRef.current.onboardingSeen,
    lastZoneId: stateRef.current.lastZoneId,
    lastSavedAt: new Date().toISOString(),
  }), [getTransform, restoredSnapshot]);

  const save = useCallback(async (ended = false) => {
    if (!ready.current || saving.current) return;
    const snapshot = makeSnapshot();
    writeLocalWorldSnapshot(snapshot);
    if (!cloudAvailable.current) {
      setSummary((current) => ({ ...current, saveStatus: 'local-only' }));
      return;
    }
    saving.current = true;
    setSummary((current) => ({ ...current, saveStatus: 'saving' }));
    try {
      const response = await fetch('/api/world/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        keepalive: ended,
        body: JSON.stringify({
          sessionId: sessionId.current,
          elapsedSeconds: Math.min(86400, Math.max(0, Math.round((Date.now() - sessionStartedAt.current) / 1000))),
          ended,
          snapshot,
        }),
      });
      if (!response.ok) throw new Error('SAVE_FAILED');
      setSummary((current) => ({ ...current, saveStatus: 'saved' }));
    } catch {
      setSummary((current) => ({ ...current, saveStatus: 'error' }));
    } finally {
      saving.current = false;
    }
  }, [makeSnapshot]);

  useEffect(() => {
    let cancelled = false;
    if (!clientSessionKey.current) clientSessionKey.current = crypto.randomUUID();
    const local = readLocalWorldSnapshot();
    fetch('/api/world/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', deviceClass: deviceClass(), clientSessionKey: clientSessionKey.current }),
    }).then(async (response) => {
      if (!response.ok) throw new Error('SESSION_START_FAILED');
      return response.json() as Promise<StartResponse>;
    }).then((json) => {
      if (cancelled) return;
      const data = json.data || {};
      const selected = chooseNewestSnapshot(data.snapshot || null, local);
      if (selected) setRestoredSnapshot(selected);
      sessionId.current = typeof data.sessionId === 'string' ? data.sessionId : null;
      cloudAvailable.current = data.cloudAvailable === true;
      setSummary({
        ...DEFAULT_SUMMARY,
        sessionId: sessionId.current,
        sessionCount: typeof data.sessionCount === 'number' ? data.sessionCount : 1,
        totalPlaySeconds: typeof data.totalPlaySeconds === 'number' ? data.totalPlaySeconds : 0,
        lastSeenAt: typeof data.lastSeenAt === 'string' ? data.lastSeenAt : null,
        cloudAvailable: cloudAvailable.current,
        saveStatus: cloudAvailable.current ? 'saved' : 'local-only',
        checkedInToday: data.checkedInToday === true,
        checkInStreak: typeof data.checkInStreak === 'number' ? data.checkInStreak : 0,
        membership: data.membership || FREE_MEMBERSHIP,
      });
      ready.current = true;
    }).catch(() => {
      if (cancelled) return;
      if (local) setRestoredSnapshot(local);
      cloudAvailable.current = false;
      ready.current = true;
      setSummary((current) => ({ ...current, saveStatus: 'local-only', cloudAvailable: false }));
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => { void save(false); }, 5000);
    const finish = () => { void save(true); };
    window.addEventListener('pagehide', finish);
    window.addEventListener('beforeunload', finish);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', finish);
      window.removeEventListener('beforeunload', finish);
      void save(true);
    };
  }, [save]);

  const checkIn = useCallback(async () => {
    if (summary.checkedInToday) return;
    setSummary((current) => ({ ...current, saveStatus: 'saving' }));
    try {
      const response = await fetch('/api/world/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-in' }),
      });
      const json = await response.json() as { data?: { checkedInToday?: boolean; checkInStreak?: number } };
      if (!response.ok) throw new Error('CHECK_IN_FAILED');
      setSummary((current) => ({
        ...current,
        checkedInToday: json.data?.checkedInToday === true,
        checkInStreak: json.data?.checkInStreak || Math.max(1, current.checkInStreak),
        saveStatus: current.cloudAvailable ? 'saved' : 'local-only',
      }));
    } catch {
      // The reward remains available after a transient connection failure.
      setSummary((current) => ({ ...current, saveStatus: 'error' }));
    }
  }, [summary.checkedInToday]);

  return { restoredSnapshot, summary, save, checkIn };
}
