'use client';

// ============================================================
// SwingIQ — Sport Context
// Tracks the user's currently selected sport across the app.
// Persists to localStorage so the choice survives page reloads.
// Default sport is 'golf' (existing behavior unchanged).
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

const STORAGE_KEY = 'swingiq_active_sport';

interface SportContextValue {
  activeSport: SportId;
  setActiveSport: (id: SportId) => void;
  isGolf: boolean;
}

const SportContext = createContext<SportContextValue>({
  activeSport: 'golf',
  setActiveSport: () => {},
  isGolf: true,
});

export function SportProvider({ children }: { children: ReactNode }) {
  const [activeSport, setActiveSportState] = useState<SportId>('golf');

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (
        stored === 'golf' ||
        stored === 'tennis' ||
        stored === 'baseball' ||
        stored === 'softball_slow' ||
        stored === 'softball_fast'
      ) {
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

  return (
    <SportContext.Provider
      value={{ activeSport, setActiveSport, isGolf: activeSport === 'golf' }}
    >
      {children}
    </SportContext.Provider>
  );
}

export function useSport(): SportContextValue {
  return useContext(SportContext);
}
