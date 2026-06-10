'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  getConsent,
  acceptAll,
  declineAll,
  setConsent,
  subscribeConsent,
  consentRequired,
  provisionedConsentItems,
  bannerMode,
  isRegionSettled,
  ensureRegion,
} from '@/lib/consent';

export function CookieBanner() {
  // Resolve the consent region first so the card appears once in its final mode
  // (EU opt-in vs. elsewhere opt-out) rather than flipping mid-resolution.
  useEffect(() => { ensureRegion(); }, []);

  // Show only when (a) the region is resolved, (b) a cookie-setting provider is
  // actually configured (no pointless banner in the cookieless default), and
  // (c) the visitor hasn't chosen yet. `false` server snapshot ⇒ nothing
  // renders during SSR (no hydration mismatch); it updates reactively the
  // moment a choice is made or the region resolves.
  const show = useSyncExternalStore(
    subscribeConsent,
    () => isRegionSettled() && consentRequired() && getConsent() === null,
    () => false,
  );
  const mode = useSyncExternalStore(subscribeConsent, bannerMode, () => 'optin' as const);

  // Opt-out mode (non-EU): "Accept all" starts pre-checked; the visitor unticks.
  const [accepted, setAccepted] = useState(true);

  if (!show) return null;

  // Name the tools so the choice is still informed.
  const tools = provisionedConsentItems().map((i) => i.label);
  const toolList =
    tools.length === 1
      ? tools[0]
      : tools.length === 2
        ? `${tools[0]} and ${tools[1]}`
        : `${tools.slice(0, -1).join(', ')} and ${tools[tools.length - 1]}`;
  const toolSuffix = tools.length > 0 ? ` (${toolList})` : '';

  return (
    // Compact, non-intrusive consent card anchored bottom-left (keeps the choice
    // visible without covering page content / hero CTAs). On mobile it spans the
    // width minus side margins; on ≥sm it caps at ~24rem and clears the
    // bottom-right help dock.
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 z-50 sm:right-auto sm:max-w-sm no-print"
    >
      <div className="rounded-2xl border border-border bg-popover text-popover-foreground p-4 shadow-theme-lg">
        <p className="text-sm font-semibold">Optional analytics</p>

        {mode === 'optout' ? (
          // Default-on region: analytics are already running; untick to opt out.
          <>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              We use privacy-respecting analytics{toolSuffix} that set cookies to help us improve the product. No ad
              cookies; we never sell your data.
            </p>
            <label className="mt-3 flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="font-semibold">Accept all analytics cookies</span>
              <span className="text-muted-foreground">— untick to opt out</span>
            </label>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href="/privacy"
                className="mr-auto text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
              >
                Learn More
              </Link>
              <button
                onClick={() => setConsent(accepted ? 'accepted' : 'declined')}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-[1.08]"
              >
                Save
              </button>
            </div>
          </>
        ) : (
          // Opt-in region (EU/EEA/UK/CH, or unknown): nothing pre-selected.
          <>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              We use privacy-respecting analytics{toolSuffix} that load only if you accept. Decline and the app works
              exactly the same. No ad cookies; we never sell your data.
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
          </>
        )}
      </div>
    </div>
  );
}
