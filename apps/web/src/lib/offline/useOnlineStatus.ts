'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks browser online/offline status. SSR-safe (assumes online until
 * the client hydrates). SwingIQ keeps working offline because all data
 * persists locally — this just lets the UI reassure the user.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}
