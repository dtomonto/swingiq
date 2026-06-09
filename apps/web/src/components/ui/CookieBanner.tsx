'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { getConsent, setConsent, subscribeConsent } from '@/lib/consent';

export function CookieBanner() {
  // Show the banner only until the visitor has made a choice (accept OR
  // decline). Derived from the shared consent store, with a `false` server
  // snapshot so nothing renders during SSR — avoiding any hydration mismatch
  // and updating reactively the moment a choice is made.
  const show = useSyncExternalStore(subscribeConsent, () => getConsent() === null, () => false);

  const choose = (value: 'accepted' | 'declined') => {
    setConsent(value); // notifies analytics (e.g. Clarity) live, no reload
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t border-border px-4 py-4 no-print">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-muted-foreground text-xs leading-relaxed flex-1">
          SwingVantage uses optional, privacy-respecting analytics — including session-replay tools such as Microsoft Clarity — that set cookies to help us improve the product. They load only if you accept. Decline and the app works exactly the same, just without them. We don&apos;t use advertising cookies and never sell your data.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
          >
            Learn More
          </Link>
          <button
            onClick={() => choose('declined')}
            className="text-muted-foreground hover:text-foreground border border-border text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => choose('accepted')}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
