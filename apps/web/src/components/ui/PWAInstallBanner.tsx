'use client';

import { useState, useEffect } from 'react';

const DISMISS_KEY = 'swingiq_pwa_banner_dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed) return;
    } catch {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary border-b border-primary px-4 py-3 no-print">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <p className="text-white text-xs leading-relaxed flex-1">
          Add SwingVantage to your home screen for quick access.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="bg-card text-primary text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            Add to Home Screen
          </button>
          <button
            onClick={handleDismiss}
            className="text-primary-foreground/90 hover:text-white text-sm font-bold leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
