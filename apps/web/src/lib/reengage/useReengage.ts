'use client';

// ============================================================
// SwingVantage — Re-engagement OS: React hook
// ------------------------------------------------------------
// Derives an ActivitySignal from the main store, resolves the single
// best nudge for right now, and exposes the actions the UI needs.
// ============================================================

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useSwingVantageStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import {
  getNotificationPermission, requestNotificationPermission, showPracticeReminder,
} from '@/lib/notifications/practice-reminders';
import * as store from './store';
import { selectNudge, inQuietHours } from './engine';
import type { ActivitySignal, NudgeChannel, NudgeMessage, NudgePrefs, NudgeState } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface UseReengage {
  state: NudgeState;
  signal: ActivitySignal;
  nudge: NudgeMessage | null;
  availableChannels: NudgeChannel[];
  pushPermission: ReturnType<typeof getNotificationPermission>;
  markShown: () => void;
  dismiss: () => void;
  setPrefs: (patch: Partial<NudgePrefs>) => void;
  enablePush: () => Promise<void>;
  /** Deliver the current nudge through any opted-in out-of-app channel. */
  deliver: () => void;
}

export function useReengage(): UseReengage {
  const state = useSyncExternalStore(store.subscribe, store.read, store.read);
  const { sessions, video_analyses, training } = useSwingVantageStore();
  const { activeSport } = useSport();

  const signal = useMemo<ActivitySignal>(() => {
    const times = [
      ...sessions.map((s) => new Date(s.created_at).getTime()),
      ...video_analyses.map((v) => new Date(v.created_at).getTime()),
      training.last_practice_date ? new Date(training.last_practice_date).getTime() : NaN,
    ].filter((t) => !Number.isNaN(t));
    const lastActivity = times.length ? Math.max(...times) : null;
    const daysSinceLastActivity =
      lastActivity === null ? null : Math.floor((Date.now() - lastActivity) / DAY_MS);

    const streakDays = training.streak_days ?? 0;
    const practicedToday = training.last_practice_date
      ? todayKey(new Date(training.last_practice_date)) === todayKey()
      : false;
    const drillsDone = Object.keys(training.drills_completed ?? {}).length;
    const hasPendingFix = !!training.active_diagnosis_id;

    return {
      daysSinceLastActivity,
      streakDays,
      streakAtRisk: streakDays >= 1 && !practicedToday,
      hasPendingFix,
      // Honest heuristic: an active fix with several drills logged is retest-ready.
      retestDue: hasPendingFix && drillsDone >= 3,
      sessionCount: sessions.length,
      activated: sessions.length > 0 || video_analyses.length > 0,
      sport: activeSport,
    };
  }, [sessions, video_analyses, training, activeSport]);

  const pushPermission = getNotificationPermission();

  const availableChannels = useMemo<NudgeChannel[]>(() => {
    const out: NudgeChannel[] = ['in_app'];
    if (state.prefs.push && pushPermission === 'granted') out.push('push');
    if (state.prefs.email) out.push('email');
    return out;
  }, [state.prefs.push, state.prefs.email, pushPermission]);

  const nudge = useMemo(() => {
    if (!state.prefs.inApp) return null;
    if (inQuietHours(state)) return null;
    return selectNudge(signal, state, { availableChannels });
  }, [signal, state, availableChannels]);

  const markShown = useCallback(() => { if (nudge) store.markShown(nudge.triggerId); }, [nudge]);
  const dismiss = useCallback(() => { if (nudge) store.dismiss(nudge.triggerId); }, [nudge]);
  const setPrefs = useCallback((patch: Partial<NudgePrefs>) => store.setPrefs(patch), []);

  const enablePush = useCallback(async () => {
    const result = await requestNotificationPermission();
    store.setPrefs({ push: result === 'granted' });
  }, []);

  const deliver = useCallback(() => {
    if (!nudge) return;
    if (availableChannels.includes('push') && pushPermission === 'granted') {
      showPracticeReminder({ title: nudge.title, body: nudge.body, tag: `reengage-${nudge.triggerId}` });
    }
    store.markShown(nudge.triggerId);
  }, [nudge, availableChannels, pushPermission]);

  return {
    state, signal, nudge, availableChannels, pushPermission,
    markShown, dismiss, setPrefs, enablePush, deliver,
  };
}
