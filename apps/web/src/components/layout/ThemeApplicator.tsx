'use client';

import { useEffect } from 'react';
import { useSwingIQStore } from '@/store';

export function ThemeApplicator() {
  const theme = useSwingIQStore((s) => s.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      return;
    } else if (theme === 'light') {
      root.classList.remove('dark');
      return;
    }
    // system
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.matches) root.classList.add('dark');
    else root.classList.remove('dark');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) root.classList.add('dark');
      else root.classList.remove('dark');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);
  return null;
}
