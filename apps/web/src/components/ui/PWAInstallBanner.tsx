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
    <div className="fixed top-0 left-0 right-0 z-50 bg-green-700 border-b border-green-600 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <p className="text-white text-xs leading-relaxed flex-1">
          Add SwingIQ to your home screen for quick access.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="bg-white text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
          >
            Add to Home Screen
          </button>
          <button
            onClick={handleDismiss}
            className="text-green-200 hover:text-white text-sm font-bold leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
