'use client';

// ============================================================
// "Cookie settings" — re-open the consent banner to change your mind
// ------------------------------------------------------------
// Ethical consent means withdrawing is as easy as giving: this footer link
// clears the stored choice (clearConsent) so the banner re-appears and the
// visitor can accept or decline again. Rendered only when a cookie-setting
// provider is actually configured (consentRequired) — otherwise there is
// nothing to manage, so it stays hidden (no dead link). Server snapshot is
// `false`, so nothing renders during SSR and there is no hydration mismatch.
// ============================================================

import { useSyncExternalStore } from 'react';
import { clearConsent, consentRequired, subscribeConsent } from '@/lib/consent';

export function CookieSettingsLink({ className }: { className?: string }) {
  const show = useSyncExternalStore(subscribeConsent, consentRequired, () => false);
  if (!show) return null;

  return (
    <button
      type="button"
      onClick={clearConsent}
      className={className ?? 'text-muted-foreground transition-colors hover:text-foreground'}
    >
      Cookie settings
    </button>
  );
}
