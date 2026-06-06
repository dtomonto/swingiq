'use client';

// SwingVantage Academy — premium "earned" celebration toaster.
// Watches the store for newly-earned badges/certifications and shows a
// restrained, professional toast (no confetti spam). Baselines on mount so
// pre-existing achievements don't re-toast on page load.
import { useEffect, useRef, useState } from 'react';
import { useAcademyStore } from '@/lib/academy/store';
import { getBadge, getCertification } from '@/lib/academy/content';

interface Toast { key: string; emoji: string; title: string; sub: string }

export function AcademyToaster() {
  const earnedBadges = useAcademyStore((s) => s.progress.earnedBadges);
  const certifications = useAcademyStore((s) => s.progress.certifications);
  const seen = useRef<{ b: Set<string>; c: Set<string> } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = { b: new Set(Object.keys(earnedBadges)), c: new Set(Object.keys(certifications)) };
      return;
    }
    const fresh: Toast[] = [];
    for (const id of Object.keys(earnedBadges)) {
      if (!seen.current.b.has(id)) {
        seen.current.b.add(id);
        const b = getBadge(id);
        if (b) fresh.push({ key: `b-${id}-${Date.now()}`, emoji: b.emoji, title: 'Badge earned', sub: b.name });
      }
    }
    for (const id of Object.keys(certifications)) {
      if (!seen.current.c.has(id)) {
        seen.current.c.add(id);
        const c = getCertification(id);
        if (c) fresh.push({ key: `c-${id}-${Date.now()}`, emoji: c.emoji, title: 'Certified', sub: c.name });
      }
    }
    if (fresh.length) setToasts((t) => [...t, ...fresh]);
  }, [earnedBadges, certifications]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((t) => t.slice(1)), 4500);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.key} className="flex items-center gap-3 rounded-theme border border-primary/30 bg-card px-4 py-3 shadow-theme transition-opacity">
          <span className="text-2xl" aria-hidden>{t.emoji}</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{t.title}</p>
            <p className="text-sm font-medium text-foreground">{t.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
