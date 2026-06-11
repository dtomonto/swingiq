'use client';

// ============================================================
// SwingVantage — RecordAssist feature-flag gate
// ------------------------------------------------------------
// Wires the `record_assist.enabled` operator flag (admin → Feature Flags)
// so an operator can kill-switch the guided recorder without a redeploy.
// Mirrors MotionLabGate's useSyncExternalStore pattern (no SSR/CSR
// hydration mismatch for the default-on case).
// ============================================================

import { useSyncExternalStore } from 'react';
import { Video } from 'lucide-react';
import { isFlagEnabled, useFeatureFlags } from '@/lib/admin/stores/feature-flags';
import { RecordAssistExperience } from './RecordAssistExperience';
import type { RecordAssistSport } from '@/lib/record-assist/types';

const FLAG = 'record_assist.enabled';

export function RecordAssistGate({ initialSport }: { initialSport?: RecordAssistSport }) {
  const enabled = useSyncExternalStore(
    (cb) => useFeatureFlags.subscribe(cb),
    () => isFlagEnabled(FLAG),
    () => true,
  );

  if (!enabled) return <RecordAssistOff />;
  return <RecordAssistExperience initialSport={initialSport} />;
}

function RecordAssistOff() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
          <Video className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <h1 className="text-lg font-bold text-foreground">RecordAssist is turned off</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Guided recording has been disabled for now. If you expected it to be available,
          an administrator can re-enable it from the Feature Flags panel.
        </p>
      </div>
    </div>
  );
}
