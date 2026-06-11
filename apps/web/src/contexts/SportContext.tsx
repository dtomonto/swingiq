'use client';

// ============================================================
// SwingVantage — Sport Context
// Tracks the user's sports across the app:
//   • selectedSports — every sport the athlete plays (multi-sport).
//   • activeSport    — the one currently in view (always one of
//                      selectedSports). Every page reads activeSport
//                      for sport-specific labels, colors, and config.
// Both persist to localStorage so choices survive reloads.
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { SportId } from '@swingiq/core';
import { SPORT_NAV_LABELS } from '@swingiq/core';

const STORAGE_KEY = 'swingiq_active_sport';
const SELECTED_KEY = 'swingiq_selected_sports';

const VALID_SPORTS: SportId[] = ['golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast'];

function sanitizeSports(ids: SportId[]): SportId[] {
  // de-dupe + keep only valid sports, preserving order
  const seen = new Set<SportId>();
  const out: SportId[] = [];
  for (const id of ids) {
    if (VALID_SPORTS.includes(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

// Sport display config (emoji + accent color) used across the app.
//
// NOTE — `accentColor` is a raw hex kept ONLY for consumers that cannot read
// CSS custom properties at paint time (e.g. <canvas> / Three.js / chart libs
// drawing to a 2D context). For anything that styles the DOM, prefer the
// token-based `SPORT_TOKENS` / `bg-sport-accent` utilities below: they pick up
// the active `data-sport` layer in globals.css automatically and ship with
// WCAG-AA-paired foreground/text variants. New DOM code should not read this hex.
export const SPORT_DISPLAY: Record<SportId, { emoji: string; accentColor: string; name: string }> = {
  golf: { emoji: '⛳', accentColor: '#22C55E', name: 'Golf' },
  tennis: { emoji: '🎾', accentColor: '#EAB308', name: 'Tennis' },
  pickleball: { emoji: '🏓', accentColor: '#84CC16', name: 'Pickleball' },
  padel: { emoji: '🎾', accentColor: '#0EA5E9', name: 'Padel' },
  baseball: { emoji: '⚾', accentColor: '#EF4444', name: 'Baseball' },
  softball_slow: { emoji: '🥎', accentColor: '#F97316', name: 'Slow Pitch Softball' },
  softball_fast: { emoji: '🥎', accentColor: '#EC4899', name: 'Fast Pitch Softball' },
};

/**
 * SSR-safe references to the ACTIVE sport's identity tokens (the `data-sport`
 * layer in globals.css). The string values are constant CSS-variable
 * references — the browser resolves them per active sport at paint time — so
 * they are identical for every sport and safe to render on the server. Use
 * them inside identity zones only (sport chips/heroes, sport-landing accents,
 * per-sport data series, active-sport nav), e.g.:
 *
 *   <span style={{ color: SPORT_TOKENS.accentText }} />
 *   <div style={{ backgroundImage: SPORT_TOKENS.wash }} />
 *
 * Never use these on buttons, CTAs, or status colors — those stay SwingVantage
 * (theme tokens) in every sport.
 */
export const SPORT_TOKENS = {
  accent: 'hsl(var(--sport-accent))',
  accentForeground: 'hsl(var(--sport-accent-foreground))',
  accentText: 'hsl(var(--sport-accent-text))',
  secondary: 'hsl(var(--sport-secondary))',
  wash: 'var(--sport-wash)',
  pattern: 'var(--sport-pattern)',
  viz1: 'hsl(var(--sport-viz-1))',
  viz2: 'hsl(var(--sport-viz-2))',
  viz3: 'hsl(var(--sport-viz-3))',
  duration: 'var(--sport-duration)',
  ease: 'var(--sport-ease)',
} as const;

export type SportTokens = typeof SPORT_TOKENS;

interface SportContextValue {
  activeSport: SportId;
  setActiveSport: (id: SportId) => void;
  /** Every sport the athlete has chosen to track (>= 1). */
  selectedSports: SportId[];
  /** Replace the whole selected-sports set (e.g. from intake). */
  setSelectedSports: (ids: SportId[]) => void;
  /** Add one sport to the set (no-op if already present). */
  addSport: (id: SportId) => void;
  /** Remove one sport (keeps at least one; re-points active if needed). */
  removeSport: (id: SportId) => void;
  /** True if the given sport is in the athlete's selected set. */
  isSelected: (id: SportId) => boolean;
  /** True when the athlete tracks more than one sport. */
  isMultiSport: boolean;
  isGolf: boolean;
  /** Emoji for the active sport */
  sportEmoji: string;
  /** Full display name */
  sportName: string;
  /** Tagline for sidebar/header */
  sportTagline: string;
  /** Nav labels dictionary for active sport */
  sportLabels: typeof SPORT_NAV_LABELS[keyof typeof SPORT_NAV_LABELS];
  /**
   * Raw hex accent for the active sport. Canvas/Three.js/chart consumers only —
   * for DOM styling use `sportTokens` / the `bg-sport-accent` utilities, which
   * track the active `data-sport` layer and carry AA-paired variants.
   */
  accentColor: string;
  /** CSS-variable references to the active sport's identity tokens (DOM-safe). */
  sportTokens: SportTokens;
}

const SportContext = createContext<SportContextValue>({
  activeSport: 'golf',
  setActiveSport: () => {},
  selectedSports: ['golf'],
  setSelectedSports: () => {},
  addSport: () => {},
  removeSport: () => {},
  isSelected: () => false,
  isMultiSport: false,
  isGolf: true,
  sportEmoji: '⛳',
  sportName: 'Golf',
  sportTagline: 'Golf Performance',
  sportLabels: SPORT_NAV_LABELS.golf,
  accentColor: '#22C55E',
  sportTokens: SPORT_TOKENS,
});

export function SportProvider({ children }: { children: ReactNode }) {
  const [activeSport, setActiveSportState] = useState<SportId>('golf');
  const [selectedSports, setSelectedSportsState] = useState<SportId[]>(['golf']);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const storedActive = localStorage.getItem(STORAGE_KEY);
      const storedSelectedRaw = localStorage.getItem(SELECTED_KEY);

      let selected: SportId[] = [];
      if (storedSelectedRaw) {
        try {
          const parsed = JSON.parse(storedSelectedRaw);
          if (Array.isArray(parsed)) selected = sanitizeSports(parsed as SportId[]);
        } catch {
          // ignore malformed value
        }
      }

      const active =
        storedActive && VALID_SPORTS.includes(storedActive as SportId)
          ? (storedActive as SportId)
          : null;

      // Back-compat: if no selected set was stored but an active sport was,
      // seed the set from it.
      if (selected.length === 0 && active) selected = [active];

      if (selected.length > 0) {
        setSelectedSportsState(selected);
        // Ensure the active sport is one the athlete actually tracks.
        setActiveSportState(active && selected.includes(active) ? active : selected[0]!);
      } else if (active) {
        setActiveSportState(active);
      }
    } catch {
      // localStorage not available (SSR guard)
    }
  }, []);

  // ── Sport identity bridge (the `data-sport` axis) ──────────────────────
  // Publish the active sport to <html data-sport="…"> so the sport-identity
  // token layer in globals.css (--sport-accent, --sport-wash, --sport-viz-*,
  // …) activates. Set on the ROOT element (alongside `data-theme`), NOT <body>:
  // Tailwind v4 computes `@theme` `--color-*` utilities (e.g. bg-sport-accent,
  // text-sport-accent-text) at :root, so a nested `[data-sport]` on <body>
  // would NOT re-resolve them — the utilities would silently keep the neutral
  // (primary) accent. Scoping `data-sport` to <html> (= :root) makes the sport
  // utilities track the active sport exactly like the theme tokens do. Purely
  // additive: no surface consumes these until the redesign wires identity zones.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.sport = activeSport;
  }, [activeSport]);

  const persistSelected = useCallback((ids: SportId[]) => {
    try {
      localStorage.setItem(SELECTED_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, []);

  const persistActive = useCallback((id: SportId) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const setActiveSport = useCallback(
    (id: SportId) => {
      if (!VALID_SPORTS.includes(id)) return;
      setActiveSportState(id);
      persistActive(id);
      // Using a sport implicitly adds it to your tracked set.
      setSelectedSportsState((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        persistSelected(next);
        return next;
      });
    },
    [persistActive, persistSelected],
  );

  const setSelectedSports = useCallback(
    (ids: SportId[]) => {
      const next = sanitizeSports(ids);
      if (next.length === 0) return; // never allow an empty set
      setSelectedSportsState(next);
      persistSelected(next);
      // Keep active valid; default to the first chosen sport.
      setActiveSportState((curr) => {
        const stay = next.includes(curr) ? curr : next[0]!;
        persistActive(stay);
        return stay;
      });
    },
    [persistActive, persistSelected],
  );

  const addSport = useCallback(
    (id: SportId) => {
      if (!VALID_SPORTS.includes(id)) return;
      setSelectedSportsState((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        persistSelected(next);
        return next;
      });
    },
    [persistSelected],
  );

  const removeSport = useCallback(
    (id: SportId) => {
      setSelectedSportsState((prev) => {
        if (!prev.includes(id) || prev.length <= 1) return prev; // keep >= 1
        const next = prev.filter((s) => s !== id);
        persistSelected(next);
        // Re-point active if we just removed it.
        setActiveSportState((curr) => {
          if (curr !== id) return curr;
          persistActive(next[0]!);
          return next[0]!;
        });
        return next;
      });
    },
    [persistActive, persistSelected],
  );

  const isSelected = useCallback((id: SportId) => selectedSports.includes(id), [selectedSports]);

  const display = SPORT_DISPLAY[activeSport];
  const labels = SPORT_NAV_LABELS[activeSport] ?? SPORT_NAV_LABELS.golf;

  return (
    <SportContext.Provider
      value={{
        activeSport,
        setActiveSport,
        selectedSports,
        setSelectedSports,
        addSport,
        removeSport,
        isSelected,
        isMultiSport: selectedSports.length > 1,
        isGolf: activeSport === 'golf',
        sportEmoji: display.emoji,
        sportName: display.name,
        sportTagline: labels.tagline,
        sportLabels: labels,
        accentColor: display.accentColor,
        sportTokens: SPORT_TOKENS,
      }}
    >
      {children}
    </SportContext.Provider>
  );
}

export function useSport(): SportContextValue {
  return useContext(SportContext);
}
