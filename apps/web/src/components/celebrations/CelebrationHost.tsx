'use client';

// ============================================================
// SwingIQ — Celebration Host
// ------------------------------------------------------------
// Mounted once in the app shell. Watches the user's earned
// achievements (the same set powering the Swing Passport / badges)
// and fires a one-time celebration the moment a new one is earned —
// turning silently-computed wins into a felt reward.
//
// First-run safety: if this is the first time the ledger is seen, we
// seed it with everything already earned and celebrate nothing, so
// existing users aren't spammed for past milestones.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useSwingIQStore } from '@/store';
import { earnedAchievementIds, celebrationFor, type Celebration } from '@/lib/celebrations/earned';
import { loadLedger, saveLedger } from '@/lib/celebrations/ledger';
import { CelebrationToast } from './CelebrationToast';

let nextKey = 0;

export function CelebrationHost() {
  const sessions = useSwingIQStore((s) => s.sessions);
  const videoAnalyses = useSwingIQStore((s) => s.video_analyses);
  const training = useSwingIQStore((s) => s.training);
  const community = useSwingIQStore((s) => s.community);

  const [queue, setQueue] = useState<{ key: number; celebration: Celebration }[]>([]);

  const enqueue = useCallback((celebration: Celebration) => {
    // Keep at most 3 on screen so a burst of earns can't blanket the UI.
    setQueue((q) => [...q, { key: ++nextKey, celebration }].slice(-3));
  }, []);

  const dismiss = useCallback((key: number) => {
    setQueue((q) => q.filter((item) => item.key !== key));
  }, []);

  // Currently-earned achievement ids, keyed as a stable string so the
  // detection effect only runs when the earned set actually changes.
  const earnedIds = earnedAchievementIds({
    sessions,
    videoAnalyses,
    training,
    lastExportAt: community.lastExportAt,
    exportCount: community.exportCount,
    challengesCompleted: community.challengesCompleted,
  });
  const earnedKey = earnedIds.join(',');

  useEffect(() => {
    const ledger = loadLedger();

    // First run for this device: seed silently, celebrate nothing.
    if (!ledger.initialized) {
      saveLedger({ initialized: true, ids: earnedIds });
      return;
    }

    const known = new Set(ledger.ids);
    const fresh = earnedIds.filter((id) => !known.has(id));
    if (fresh.length === 0) return;

    for (const id of fresh) {
      const celebration = celebrationFor(id);
      if (celebration) enqueue(celebration);
    }
    saveLedger({ initialized: true, ids: [...ledger.ids, ...fresh] });
    // earnedIds is derived from earnedKey; depending on the key avoids loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earnedKey, enqueue]);

  // Dev-only manual trigger for visual verification (stripped in production).
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const handler = () => {
      enqueue(
        celebrationFor('seven_day_streak') ?? {
          id: 'demo',
          emoji: '🎉',
          title: 'Demo Celebration',
          subtitle: 'This is how an earned milestone looks.',
        },
      );
    };
    window.addEventListener('swingiq:celebrate-demo', handler);
    return () => window.removeEventListener('swingiq:celebrate-demo', handler);
  }, [enqueue]);

  if (queue.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      aria-live="polite"
    >
      {queue.map((item) => (
        <CelebrationToast
          key={item.key}
          celebration={item.celebration}
          onDismiss={() => dismiss(item.key)}
        />
      ))}
    </div>
  );
}
