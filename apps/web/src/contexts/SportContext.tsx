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

const VALID_SPORTS: SportId[] = ['golf', 'tennis', 'baseball', 'softball_slow', 'softball_fast'];

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

// Sport display config (emoji + accent color) used across the app
export const SPORT_DISPLAY: Record<SportId, { emoji: string; accentColor: string; name: string }> = {
  golf: { emoji: '⛳', accentColor: '#22C55E', name: 'Golf' },
  tennis: { emoji: '🎾', accentColor: '#EAB308', name: 'Tennis' },
  baseball: { emoji: '⚾', accentColor: '#EF4444', name: 'Baseball' },
  softball_slow: { emoji: '🥎', accentColor: '#F97316', name: 'Slow Pitch Softball' },
  softball_fast: { emoji: '🥎', accentColor: '#EC4899', name: 'Fast Pitch Softball' },
};

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
  /** CSS accent color hex */
  accentColor: string;
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
      }}
    >
      {children}
    </SportContext.Provider>
  );
}

export function useSport(): SportContextValue {
  return useContext(SportContext);
}
