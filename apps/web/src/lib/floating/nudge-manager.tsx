'use client';

// ============================================================
// SwingVantage — Bottom Nudge Manager (one-at-a-time)
// ------------------------------------------------------------
// Companion to the FloatingDock. The dock owns the bottom-RIGHT
// corner (persistent launchers: Guide, AI Coach). This manager owns
// the bottom EDGE nudge slot — the transient, dismissible banners
// that used to each render their own `fixed inset-x-0 bottom-0`
// wrapper and therefore stacked on top of each other and the mobile
// bottom nav (e.g. Continue-Progress at z-50 directly over
// Save-Progress at z-40).
//
// Every such banner registers with a PRIORITY; only the single
// highest-priority eligible one renders at a time. Its on-screen
// height is published to `--app-nudge-height` so the FloatingDock
// lifts above it — guaranteeing the dock FABs and the active nudge
// never collide on mobile.
//
// Positioning (fixed, full-width, clear of the mobile nav + iOS
// safe-area, correct z-index) lives in ONE place: the `.app-nudge`
// class in globals.css + <NudgeRegion> here. Do not add new
// `fixed bottom-…` banners on the app surface; add a nudge slot.
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { resolveActiveNudge, type NudgeEntry } from './nudge-priority';

// Re-export the pure core so callers keep a single import surface
// (`@/lib/floating/nudge-manager`).
export { resolveActiveNudge, NUDGE_PRIORITY, type NudgeEntry } from './nudge-priority';

interface NudgeApi {
  activeId: string | null;
  register: (entry: NudgeEntry) => void;
  unregister: (id: string) => void;
}

const NudgeContext = createContext<NudgeApi | null>(null);

export function NudgeProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<NudgeEntry[]>([]);

  const register = useCallback((entry: NudgeEntry) => {
    setEntries((cur) => {
      const existing = cur.find((e) => e.id === entry.id);
      if (existing && existing.priority === entry.priority) return cur; // no-op
      return [...cur.filter((e) => e.id !== entry.id), entry];
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setEntries((cur) => (cur.some((e) => e.id === id) ? cur.filter((e) => e.id !== id) : cur));
  }, []);

  const activeId = useMemo(() => resolveActiveNudge(entries), [entries]);
  const value = useMemo<NudgeApi>(
    () => ({ activeId, register, unregister }),
    [activeId, register, unregister],
  );

  return <NudgeContext.Provider value={value}>{children}</NudgeContext.Provider>;
}

/**
 * Connect a nudge to the slot.
 *
 * @param id        stable nudge id (see NUDGE_PRIORITY keys)
 * @param priority  higher wins
 * @param eligible  whether this nudge currently *wants* to show
 * @returns `active` — true only when this nudge both wants to show AND is
 *          the highest-priority one that does. Render only when active.
 *
 * Resilient: if used without a <NudgeProvider> (mis-wiring), it falls back
 * to `active === eligible` so a banner is never silently suppressed.
 */
export function useNudgeSlot(id: string, priority: number, eligible: boolean): { active: boolean } {
  const ctx = useContext(NudgeContext);
  const register = ctx?.register;
  const unregister = ctx?.unregister;

  useEffect(() => {
    if (!register || !unregister) return;
    if (eligible) {
      register({ id, priority });
      return () => unregister(id);
    }
    unregister(id);
    return undefined;
  }, [register, unregister, id, priority, eligible]);

  const active = ctx ? eligible && ctx.activeId === id : eligible;
  return { active };
}

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface NudgeRegionProps {
  children: ReactNode;
  className?: string;
  role?: string;
  'aria-label'?: string;
}

/**
 * The shared fixed container for an active nudge. Owns position / width /
 * z-index / safe-area via `.app-nudge` (globals.css) and publishes its
 * height to `--app-nudge-height` so the FloatingDock floats above it.
 * Render at most one of these at a time (the manager guarantees this).
 */
export function NudgeRegion({ children, className, role, 'aria-label': ariaLabel }: NudgeRegionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--app-nudge-height', `${el.offsetHeight}px`);
    publish();
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(publish);
      ro.observe(el);
    }
    return () => {
      ro?.disconnect();
      root.style.removeProperty('--app-nudge-height');
    };
  }, []);

  return (
    <div ref={ref} className={cn('app-nudge no-print', className)} role={role} aria-label={ariaLabel}>
      {children}
    </div>
  );
}
