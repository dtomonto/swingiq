'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_KEY = 'swingiq_cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(COOKIE_KEY);
      if (!accepted) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(COOKIE_KEY, 'accepted');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t border-gray-700 px-4 py-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-muted-foreground text-xs leading-relaxed flex-1">
          SwingIQ uses cookies for essential app functionality. No advertising or tracking cookies are used. Your data stays on your device.
        </p>
        <div className="flex gap-3 shrink-0">
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-white text-xs underline transition-colors"
          >
            Learn More
          </Link>
          <button
            onClick={accept}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
