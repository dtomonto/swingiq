// ============================================================
// CentralIntelligenceOS — Recommendations engine (pure)
// ------------------------------------------------------------
// Turns aggregate, anonymized platform signals into a prioritized list
// of product/growth/coaching actions. Every recommendation carries a
// rationale, expected impact, target segment, product area, and a
// concrete suggested implementation — so the admin sees not just WHAT
// but WHY and HOW. Deterministic + keyless (no AI required).
//
// These feed both the CentralIntelligenceOS admin center and GrowthOS.
// ============================================================

import type { FoundingCampaignProgress, IntelligenceRecommendation } from './types';
import { FOUNDING_REQUIRED_SESSIONS } from './config';

export interface IntelligenceSignals {
  totalUsers: number;
  profilesComplete: number;
  /** 0–100. */
  profileCompletionRate: number;
  totalSessions: number;
  avgSessionsPerUser: number;
  /** 0–100. */
  retestRate: number;
  /** 0–100, share of uploads that failed. */
  uploadFailureRate: number;
  inactiveUsers7d: number;
  founding: FoundingCampaignProgress;
  /** Most-commonly-missing required profile fields across the base. */
  topMissingFields: Array<{ label: string; count: number }>;
  /** Sessions per sport, to spot a lagging sport. */
  sessionsBySport: Array<{ sport: string; sessions: number }>;
  /** Most common recurring coaching issues (anonymized), for content gaps. */
  topRecurringIssues?: Array<{ issue: string; count: number }>;
}

let recCounter = 0;
function recId(area: string): string {
  recCounter += 1;
  return `ci-rec-${area}-${recCounter}`;
}

/**
 * Generate prioritized recommendations from platform signals. Thresholds are
 * conservative so a recommendation only fires when the data genuinely warrants
 * it — no noise.
 */
export function generateRecommendations(s: IntelligenceSignals): IntelligenceRecommendation[] {
  const recs: IntelligenceRecommendation[] = [];

  // Profile completion is low → fix the form / add progressive profiling.
  if (s.totalUsers >= 5 && s.profileCompletionRate < 60) {
    recs.push({
      id: recId('profile'),
      title: 'Lift profile completion with progressive profiling',
      rationale: `Only ${s.profileCompletionRate}% of players have a complete profile — coaching quality and Founding qualification both depend on it.`,
      expectedImpact: 'Higher diagnosis accuracy and more qualified Founding Members.',
      priority: s.profileCompletionRate < 40 ? 'critical' : 'high',
      area: 'profile',
      segment: 'Players with an incomplete profile',
      suggestedImplementation:
        'Surface the single next-best field (CentralIntelligenceOS already computes it) on the dashboard instead of a long form.',
      status: 'open',
    });
  }

  // A specific field is the top blocker → ask for it earlier.
  const topMissing = s.topMissingFields[0];
  if (topMissing && topMissing.count >= Math.max(3, s.totalUsers * 0.25)) {
    recs.push({
      id: recId('profile'),
      title: `Ask for "${topMissing.label}" earlier in onboarding`,
      rationale: `"${topMissing.label}" is the most-skipped required field (${topMissing.count} players).`,
      expectedImpact: 'Removes the single biggest profile-completion blocker.',
      priority: 'medium',
      area: 'onboarding',
      segment: `Players missing "${topMissing.label}"`,
      suggestedImplementation: 'Move this field to the first onboarding step with its why-it-matters line.',
      status: 'open',
    });
  }

  // Low sessions per user → teach how to record + nudge.
  if (s.totalUsers >= 5 && s.avgSessionsPerUser < 3) {
    recs.push({
      id: recId('sessions'),
      title: 'Add a "how to record a session" tutorial + first-session nudge',
      rationale: `Average sessions per user is ${s.avgSessionsPerUser.toFixed(1)} — most value (and Founding status) needs ${FOUNDING_REQUIRED_SESSIONS}.`,
      expectedImpact: 'More recorded sessions → better coaching memory and retention.',
      priority: 'high',
      area: 'sessions',
      segment: 'Players with fewer than 3 sessions',
      suggestedImplementation: 'Reuse Video Studio tutorial placement on /analyze; add milestone badges at 1, 3, 5, 10.',
      status: 'open',
    });
  }

  // Upload failures are hurting valid-session counts.
  if (s.uploadFailureRate >= 10) {
    recs.push({
      id: recId('sessions'),
      title: 'Investigate session upload failures',
      rationale: `${s.uploadFailureRate}% of uploads are failing — failed uploads don't count as valid sessions.`,
      expectedImpact: 'Recovers lost sessions and reduces qualification friction.',
      priority: s.uploadFailureRate >= 25 ? 'critical' : 'high',
      area: 'product',
      segment: 'Players who attempted an upload',
      suggestedImplementation: 'Add client-side validation + retry, and log failure reasons to the admin center.',
      status: 'open',
    });
  }

  // Inactivity → retention nudge (defer to reengage OS).
  if (s.inactiveUsers7d >= Math.max(3, s.totalUsers * 0.2)) {
    recs.push({
      id: recId('retention'),
      title: 'Add a 7-day re-engagement nudge',
      rationale: `${s.inactiveUsers7d} players have been inactive 7+ days.`,
      expectedImpact: 'Wins back at-risk users before they churn.',
      priority: 'high',
      area: 'retention',
      segment: 'Players inactive 7+ days',
      suggestedImplementation: 'Route through the existing ReengageOS / Churn agent — do not build a parallel system.',
      status: 'open',
    });
  }

  // Lagging sport → sport-specific onboarding.
  const sorted = [...s.sessionsBySport].sort((a, b) => a.sessions - b.sessions);
  const laggard = sorted[0];
  const leader = sorted[sorted.length - 1];
  if (laggard && leader && leader.sessions >= 10 && laggard.sessions < leader.sessions * 0.25) {
    recs.push({
      id: recId('content'),
      title: `Improve the ${laggard.sport} onboarding flow`,
      rationale: `${laggard.sport} has far fewer sessions (${laggard.sessions}) than ${leader.sport} (${leader.sessions}).`,
      expectedImpact: 'Balances engagement across sports and grows an underserved cohort.',
      priority: 'medium',
      area: 'content',
      segment: `${laggard.sport} players`,
      suggestedImplementation: `Add a ${laggard.sport}-specific guided first session and sample report.`,
      status: 'open',
    });
  }

  // Recurring issue across users → drill/content opportunity.
  const topIssue = s.topRecurringIssues?.[0];
  if (topIssue && topIssue.count >= Math.max(3, s.totalUsers * 0.15)) {
    recs.push({
      id: recId('content'),
      title: `Expand drills + SEO content for "${topIssue.issue}"`,
      rationale: `"${topIssue.issue}" is the most common recurring issue (${topIssue.count} players).`,
      expectedImpact: 'Helps the most players at once and captures high-intent search.',
      priority: 'medium',
      area: 'content',
      segment: `Players working on "${topIssue.issue}"`,
      suggestedImplementation: 'Add a focused drill set and a matching SEO landing page.',
      status: 'open',
    });
  }

  // Founding campaign nearing full → prep membership tiers.
  if (!s.founding.full && s.founding.remaining > 0 && s.founding.remaining <= s.founding.requiredCount * 0.1) {
    recs.push({
      id: recId('growth'),
      title: 'Prepare membership tiers — Founding campaign almost full',
      rationale: `${s.founding.remaining} of ${s.founding.requiredCount} Founding spots remain.`,
      expectedImpact: 'Smooth transition from launch campaign to monetization.',
      priority: 'medium',
      area: 'growth',
      segment: 'All users',
      suggestedImplementation: 'Stage tier copy/pricing now; tiers auto-unlock at 1,000 via the membership gate.',
      status: 'open',
    });
  }

  // Retest rate is low → the improvement loop isn't closing.
  if (s.totalSessions >= 20 && s.retestRate < 20) {
    recs.push({
      id: recId('coaching'),
      title: 'Close the improvement loop with retest prompts',
      rationale: `Retest rate is ${s.retestRate}% — players aren't measuring whether fixes worked.`,
      expectedImpact: 'Proves improvement, which drives retention and word-of-mouth.',
      priority: 'medium',
      area: 'coaching',
      segment: 'Players with a diagnosed issue',
      suggestedImplementation: 'Prompt a retest a few days after a fix; show the before/after delta.',
      status: 'open',
    });
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}
