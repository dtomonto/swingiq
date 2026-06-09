'use client';

// ============================================================
// Microsoft Clarity tag loader (operator-toggleable)
// ------------------------------------------------------------
// Loads the Clarity heatmap/session-recording tag only when BOTH are true:
//   1. NEXT_PUBLIC_CLARITY_PROJECT_ID is set (provisioned at deploy time), and
//   2. the `clarity.enabled` operator flag is on (the in-app kill-switch).
//
// The flag is the local-first operator override (localStorage), so an admin
// can stop/start Clarity from the dashboard without a redeploy. Because that
// override is device-local, it gates the tag in the operator's own session;
// the durable, all-visitor control remains the env var. The flag is read
// after mount (client-only) to avoid an SSR/CSR hydration mismatch.
// ============================================================

import Script from 'next/script';
import { useSyncExternalStore } from 'react';
import { isFlagEnabled, useFeatureFlags } from '@/lib/admin/stores/feature-flags';

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || '';

export function ClarityScript() {
  // Subscribe to the operator flag store the idiomatic way. The server
  // snapshot is `false`, so nothing renders during SSR (the tag is a
  // client-only, afterInteractive script anyway) — this avoids any hydration
  // mismatch and makes the toggle reactive without a setState-in-effect.
  const enabled = useSyncExternalStore(
    (cb) => useFeatureFlags.subscribe(cb),
    () => isFlagEnabled('clarity.enabled'),
    () => false,
  );

  if (!CLARITY_PROJECT_ID || !enabled) return null;

  return (
    <Script id="clarity-init" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_PROJECT_ID}");`}
    </Script>
  );
}
