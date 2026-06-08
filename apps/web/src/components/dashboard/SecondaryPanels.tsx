'use client';

// ============================================================
// SwingVantage — Dashboard "More for you" disclosure
// ------------------------------------------------------------
// Progressive disclosure for the dashboard's SECONDARY panels.
// The hero (DashboardIntelligence → one next-best-action) stays
// front-and-centre; the supporting panels (Athlete GI, next badge,
// daily note, growth) collapse behind one tap so a returning user
// sees a focused dashboard, not a wall of competing cards. Collapsed
// by default; the choice is remembered for the session so power users
// who open it aren't re-collapsed on every navigation.
// ============================================================

import { useEffect, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'swingiq.dashboard.moreForYou.open';

export function SecondaryPanels({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Restore the session preference (sessionStorage — resets each visit so the
  // calm, collapsed default returns, but stays open while navigating around).
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setOpen(true);
    } catch {
      /* sessionStorage unavailable — keep the collapsed default */
    }
  }, []);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <section aria-label="More for you">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <span className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" aria-hidden="true" />
          More for you
        </span>
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {open ? 'Hide' : 'Show'}
          <ChevronDown
            size={18}
            className={cn('transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
        </span>
      </button>
      {open && <div className="mt-4 space-y-6">{children}</div>}
    </section>
  );
}
