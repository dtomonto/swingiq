'use client';

// ============================================================
// SwingVantage — useAnalysisJobs (reactive view of the job store)
// ------------------------------------------------------------
// useSyncExternalStore over the local-first job store. Re-renders on
// same-tab mutations and cross-tab `storage` events. The snapshot is a
// monotonic version number (stable identity) so React never loops; the
// job list is recomputed only when that version changes.
// ============================================================

import { useMemo, useSyncExternalStore } from 'react';
import { computeStats, getJobsVersion, loadJobs, subscribeJobs } from './store';
import type { AnalysisJob, JobStats } from './types';

export interface AnalysisJobsView {
  jobs: AnalysisJob[];
  stats: JobStats;
  /** True before hydration so callers can avoid an SSR/client mismatch. */
  hydrated: boolean;
}

const SERVER_VERSION = -1;

export function useAnalysisJobs(): AnalysisJobsView {
  const version = useSyncExternalStore(
    subscribeJobs,
    getJobsVersion,
    () => SERVER_VERSION,
  );

  return useMemo(() => {
    if (version === SERVER_VERSION) {
      const empty: AnalysisJob[] = [];
      return { jobs: empty, stats: computeStats(empty), hydrated: false };
    }
    const jobs = loadJobs();
    return { jobs, stats: computeStats(jobs), hydrated: true };
  }, [version]);
}
