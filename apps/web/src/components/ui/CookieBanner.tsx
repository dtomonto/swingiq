'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  getConsent,
  acceptAll,
  declineAll,
  subscribeConsent,
  consentRequired,
  provisionedConsentItems,
} from '@/lib/consent';

export function CookieBanner() {
  // Show the banner only until the visitor has made a choice (accept OR
  // decline) AND only when something actually sets cookies (no pointless banner
  // in the cookieless default). Derived from the shared consent store with a
  // `false` server snapshot so nothing renders during SSR — avoiding any
  // hydration mismatch and updating reactively the moment a choice is made.
  const show = useSyncExternalStore(
    subscribeConsent,
    () => consentRequired() && getConsent() === null,
    () => false,
  );

  if (!show) return null;

  // Name the tools the visitor is accepting, so one click is still informed.
  const tools = provisionedConsentItems().map((i) => i.label);
  const toolList =
    tools.length === 1
      ? tools[0]
      : tools.length === 2
        ? `${tools[0]} and ${tools[1]}`
        : `${tools.slice(0, -1).join(', ')} and ${tools[tools.length - 1]}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t border-border px-4 py-4 no-print">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-muted-foreground text-xs leading-relaxed flex-1">
          SwingVantage uses optional, privacy-respecting analytics{tools.length > 0 ? ` (${toolList})` : ''} that set
          cookies to help us improve the product. <strong className="text-foreground">Accept all</strong> turns them on;
          decline and the app works exactly the same, just without them. We don&apos;t use advertising cookies and never
          sell your data.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
          >
            Learn More
          </Link>
          <button
            onClick={declineAll}
            className="text-muted-foreground hover:text-foreground border border-border text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={acceptAll}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
