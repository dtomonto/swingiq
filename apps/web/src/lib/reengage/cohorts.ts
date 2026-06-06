// ============================================================
// SwingVantage — Re-engagement OS: owner-facing cohorts
// ------------------------------------------------------------
// Maps each trigger to a named audience the owner reasons about in the
// admin outbound preview. This is the bridge between the in-app engine
// and a future bulk send (Resend email is already configured).
// ============================================================

import type { Cohort } from './types';

export const COHORTS: Cohort[] = [
  { id: 'dormant-14', label: 'Dormant (14+ days)', description: 'Had activity, quiet for two weeks or more.', triggerId: 'comeback_14' },
  { id: 'lapsing-7', label: 'Lapsing (7–13 days)', description: 'A week or so since their last session.', triggerId: 'comeback_7' },
  { id: 'cooling-3', label: 'Cooling off (3–6 days)', description: 'Recently active but slowing down.', triggerId: 'comeback_3' },
  { id: 'retest-ready', label: 'Retest ready', description: 'Put in the reps; a retest is due.', triggerId: 'retest_due' },
  { id: 'streak-risk', label: 'Streak at risk', description: 'Active streak they haven’t continued today.', triggerId: 'streak_at_risk' },
  { id: 'unfinished-fix', label: 'Unfinished fix', description: 'Has an active fix still in progress.', triggerId: 'finish_fix' },
  { id: 'not-activated', label: 'Not activated', description: 'Signed up but no first swing check yet.', triggerId: 'activation' },
];
