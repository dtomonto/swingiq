'use client';

// ============================================================
// SwingVantage — Motion Lab: feature-flag gate
// ------------------------------------------------------------
// Wires the `motion_lab.enabled` operator flag (admin → Feature Flags)
// so an operator can turn the lab off/on without a redeploy. The flag
// is the local-first device override, read after mount via
// useSyncExternalStore (the repo's idiomatic pattern — see
// components/analytics/ClarityScript) so the toggle is reactive and
// there's no SSR/CSR hydration mismatch for the default-on case.
// ============================================================

import { useSyncExternalStore } from 'react';
import { FlaskConical } from 'lucide-react';
import { isFlagEnabled, useFeatureFlags } from '@/lib/admin/stores/feature-flags';
import { MotionLabWizard } from './MotionLabWizard';

const FLAG = 'motion_lab.enabled';

export function MotionLabGate() {
  // Server + default snapshot is `true` (the lab ships on), so the common
  // path renders identically on server and client. An operator who has
  // locally disabled it sees the off-state resolve right after hydration.
  const enabled = useSyncExternalStore(
    (cb) => useFeatureFlags.subscribe(cb),
    () => isFlagEnabled(FLAG),
    () => true,
  );

  if (!enabled) return <MotionLabOff />;
  return <MotionLabWizard />;
}

function MotionLabOff() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <FlaskConical className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-lg font-bold text-foreground">Motion Lab is turned off</h1>
        <p className="text-sm text-muted-foreground mt-2">
          This analysis lab has been disabled for now. If you expected it to be available,
          an administrator can re-enable it from the Feature Flags panel.
        </p>
      </div>
    </div>
  );
}
