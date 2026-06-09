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
    // Compact, non-intrusive consent card anchored bottom-left. Previously a
    // full-width bottom bar that overlapped page content (and hero CTAs); a
    // contained card keeps the choice visible without covering the page. On
    // mobile it spans the width minus side margins; on ≥sm it caps at ~22rem
    // and clears the bottom-right help dock. Logic (consentRequired gating,
    // dynamic tool naming, accept-all/decline-all) is unchanged.
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 z-50 sm:right-auto sm:max-w-sm no-print"
    >
      <div className="rounded-2xl border border-border bg-popover text-popover-foreground p-4 shadow-theme-lg">
        <p className="text-sm font-semibold">Optional analytics</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          We use privacy-respecting analytics{tools.length > 0 ? ` (${toolList})` : ''} that load only if you accept.
          Decline and the app works exactly the same. No ad cookies; we never sell your data.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Link
            href="/privacy"
            className="mr-auto text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Learn More
          </Link>
          <button
            onClick={declineAll}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Decline
          </button>
          <button
            onClick={acceptAll}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-[1.08]"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
