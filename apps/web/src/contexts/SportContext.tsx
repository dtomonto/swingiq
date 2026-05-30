'use client';

// ============================================================
// SwingIQ — Sport Context
// Tracks the user's currently selected sport across the app.
// Persists to localStorage so the choice survives page reloads.
// Exposes sport config helpers so every component can access
// sport-specific labels, colors, and configuration.
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

const VALID_SPORTS: SportId[] = ['golf', 'tennis', 'baseball', 'softball_slow', 'softball_fast'];

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
  isGolf: true,
  sportEmoji: '⛳',
  sportName: 'Golf',
  sportTagline: 'Golf Performance',
  sportLabels: SPORT_NAV_LABELS.golf,
  accentColor: '#22C55E',
});

export function SportProvider({ children }: { children: ReactNode }) {
  const [activeSport, setActiveSportState] = useState<SportId>('golf');

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_SPORTS.includes(stored as SportId)) {
        setActiveSportState(stored as SportId);
      }
    } catch {
      // localStorage not available (SSR guard)
    }
  }, []);

  const setActiveSport = useCallback((id: SportId) => {
    setActiveSportState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const display = SPORT_DISPLAY[activeSport];
  const labels = SPORT_NAV_LABELS[activeSport] ?? SPORT_NAV_LABELS.golf;

  return (
    <SportContext.Provider
      value={{
        activeSport,
        setActiveSport,
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
