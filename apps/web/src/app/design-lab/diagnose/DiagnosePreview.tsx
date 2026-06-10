'use client';

// Dev-only seeded mount of the REAL DiagnoseContent, so the auth-gated diagnose
// result (its three glowing Overall / Face / Strike rings) can be reviewed
// without a Supabase session. Seeds ONE session with real shots so the
// diagnostic engine computes actual scores, mirrors the (app) provider stack,
// and restores the prior store on unmount (never clobbers real local data).

import { useEffect, useState } from 'react';
import { useSwingVantageStore } from '@/store';
import { DiagnoseContent } from '@/app/(app)/diagnose/DiagnoseContent';
import { BackgroundTasksProvider } from '@/lib/background-tasks/background-tasks-provider';
import { AutoSyncProvider } from '@/lib/backup/autosync/auto-sync-provider';
import { RelationalSyncProvider } from '@/lib/db';
import { NudgeProvider } from '@/lib/floating/nudge-manager';
import { DEMO_PROFILE, demoDiagnoseSession } from '../demoData';

export function DiagnosePreview() {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const store = useSwingVantageStore;
    const prev = store.getState();
    const snapshot = {
      profile: prev.profile,
      sessions: prev.sessions,
      setup_step: prev.setup_step,
    };
    store.setState({
      profile: DEMO_PROFILE,
      sessions: [demoDiagnoseSession()],
      setup_step: 'complete',
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeeded(true);
    return () => {
      store.setState(snapshot);
    };
  }, []);

  if (!seeded) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Seeding demo data…</div>;
  }

  return (
    <BackgroundTasksProvider>
      <RelationalSyncProvider>
        <AutoSyncProvider>
          <NudgeProvider>
            <DiagnoseContent />
          </NudgeProvider>
        </AutoSyncProvider>
      </RelationalSyncProvider>
    </BackgroundTasksProvider>
  );
}
