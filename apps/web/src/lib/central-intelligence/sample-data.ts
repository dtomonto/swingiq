// ============================================================
// CentralIntelligenceOS — illustrative sample population
// ------------------------------------------------------------
// SwingVantage is local-first: a user's profile + sessions live in their
// own browser (and sync to Supabase when configured). The admin command
// center therefore needs a server-side data source for AGGREGATE views.
// Until the relational aggregate is wired, this module supplies a clearly
// labelled, anonymized SAMPLE population so the command center is fully
// explorable — exactly the keyless-first pattern GrowthOS uses with its
// mock-data seed. The dashboard tags this as `dataSource: 'sample'`.
//
// No real user PII lives here — these are illustrative rows only.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { IntelligenceSignals } from './recommendations';

export interface SampleUserRow {
  id: string;
  primarySport: SportId;
  skillLevel: string;
  profilePercent: number;
  validSessions: number;
  status: string;
  recurringIssue: string | null;
  consent: 'granted' | 'revoked';
  lastActiveDaysAgo: number;
}

/** Illustrative anonymized rows for the User Intelligence Explorer. */
export const SAMPLE_USERS: SampleUserRow[] = [
  { id: 'athlete-1042', primarySport: 'golf', skillLevel: 'intermediate', profilePercent: 100, validSessions: 14, status: 'qualified', recurringIssue: 'open clubface', consent: 'granted', lastActiveDaysAgo: 1 },
  { id: 'athlete-1043', primarySport: 'golf', skillLevel: 'beginner', profilePercent: 71, validSessions: 3, status: 'profile_incomplete', recurringIssue: 'slice', consent: 'granted', lastActiveDaysAgo: 2 },
  { id: 'athlete-1051', primarySport: 'tennis', skillLevel: 'advanced', profilePercent: 100, validSessions: 8, status: 'profile_complete_sessions_needed', recurringIssue: 'late backhand prep', consent: 'granted', lastActiveDaysAgo: 0 },
  { id: 'athlete-1067', primarySport: 'baseball', skillLevel: 'intermediate', profilePercent: 83, validSessions: 11, status: 'profile_incomplete', recurringIssue: 'early extension', consent: 'granted', lastActiveDaysAgo: 9 },
  { id: 'athlete-1071', primarySport: 'pickleball', skillLevel: 'beginner', profilePercent: 40, validSessions: 1, status: 'profile_incomplete', recurringIssue: null, consent: 'revoked', lastActiveDaysAgo: 14 },
  { id: 'athlete-1080', primarySport: 'golf', skillLevel: 'advanced', profilePercent: 100, validSessions: 22, status: 'qualified', recurringIssue: 'early extension', consent: 'granted', lastActiveDaysAgo: 3 },
  { id: 'athlete-1090', primarySport: 'softball_fast', skillLevel: 'intermediate', profilePercent: 67, validSessions: 5, status: 'profile_incomplete', recurringIssue: 'rolling over', consent: 'granted', lastActiveDaysAgo: 6 },
  { id: 'athlete-1101', primarySport: 'tennis', skillLevel: 'intermediate', profilePercent: 100, validSessions: 10, status: 'qualified', recurringIssue: 'serve toss drift', consent: 'granted', lastActiveDaysAgo: 1 },
  { id: 'athlete-1112', primarySport: 'padel', skillLevel: 'beginner', profilePercent: 50, validSessions: 2, status: 'profile_incomplete', recurringIssue: null, consent: 'granted', lastActiveDaysAgo: 21 },
  { id: 'athlete-1120', primarySport: 'golf', skillLevel: 'intermediate', profilePercent: 88, validSessions: 7, status: 'profile_incomplete', recurringIssue: 'slice', consent: 'granted', lastActiveDaysAgo: 4 },
  { id: 'athlete-1133', primarySport: 'baseball', skillLevel: 'beginner', profilePercent: 100, validSessions: 12, status: 'qualified', recurringIssue: 'rolling over', consent: 'granted', lastActiveDaysAgo: 2 },
  { id: 'athlete-1140', primarySport: 'golf', skillLevel: 'elite', profilePercent: 100, validSessions: 31, status: 'qualified', recurringIssue: 'push-fade', consent: 'granted', lastActiveDaysAgo: 0 },
];

/** Distribution source values (anonymized) for the Profile Intelligence panel. */
export const SAMPLE_SKILL_VALUES: string[] = [
  ...Array(28).fill('beginner'), ...Array(46).fill('intermediate'),
  ...Array(22).fill('advanced'), ...Array(8).fill('elite'),
];

export const SAMPLE_SPORT_VALUES: string[] = [
  ...Array(58).fill('golf'), ...Array(18).fill('tennis'), ...Array(12).fill('baseball'),
  ...Array(8).fill('pickleball'), ...Array(5).fill('softball_fast'), ...Array(3).fill('padel'),
];

export const SAMPLE_GOAL_VALUES: string[] = [
  ...Array(34).fill('More consistency'), ...Array(28).fill('More distance / power'),
  ...Array(22).fill('Fix a specific miss'), ...Array(14).fill('Compete / rank up'),
];

/** Completion funnel steps (largest first). */
export const SAMPLE_COMPLETION_FUNNEL = [
  { label: 'Registered', count: 104 },
  { label: 'Started profile', count: 88 },
  { label: 'Completed profile', count: 51 },
  { label: 'Recorded first session', count: 47 },
  { label: 'Reached 10 sessions', count: 19 },
  { label: 'Qualified (Founding)', count: 14 },
];

/** Most-skipped required profile fields (anonymized counts). */
export const SAMPLE_TOP_MISSING_FIELDS = [
  { label: 'Average score or handicap', count: 31 },
  { label: 'Most common miss', count: 24 },
  { label: 'Practice setup', count: 18 },
  { label: 'At least one club in your bag', count: 12 },
];

export const SAMPLE_RECURRING_ISSUES = [
  { issue: 'early extension', count: 19 },
  { issue: 'open clubface', count: 16 },
  { issue: 'slice', count: 14 },
  { issue: 'late backhand prep', count: 9 },
  { issue: 'rolling over (hitting)', count: 7 },
];

export const SAMPLE_DRILL_EFFECTIVENESS = [
  { drill: 'Clubface awareness gate', sport: 'golf', completionRate: 72, helpfulPct: 81 },
  { drill: 'Hip hinge hold', sport: 'golf', completionRate: 64, helpfulPct: 76 },
  { drill: 'Split-step timing', sport: 'tennis', completionRate: 58, helpfulPct: 69 },
  { drill: 'Tee-height contact ladder', sport: 'baseball', completionRate: 61, helpfulPct: 74 },
];

export const SAMPLE_SESSION_SOURCES = {
  manual: 41, video: 96, launch_monitor: 58, simulator: 22, image: 9, practice: 0,
};

export const SAMPLE_GOVERNANCE = {
  consentRecords: 104,
  personalizationGranted: 99,
  productImprovementGranted: 92,
  exportRequests: 2,
  deleteRequests: 1,
  sensitiveDataFlags: 0,
  anonymizationHealthPct: 100,
  missingPurposeLabels: 0,
};

/** Aggregate signals used by the recommendations engine + executive panel. */
export const SAMPLE_SIGNALS: IntelligenceSignals = {
  totalUsers: 104,
  profilesComplete: 51,
  profileCompletionRate: 49,
  totalSessions: 226,
  avgSessionsPerUser: 2.2,
  retestRate: 18,
  uploadFailureRate: 7,
  inactiveUsers7d: 23,
  // founding filled in by the dashboard with REAL campaign progress.
  founding: { qualifiedCount: 0, requiredCount: 1000, remaining: 1000, full: false, membershipTiersEnabled: false, membershipUnlockReason: '' },
  topMissingFields: SAMPLE_TOP_MISSING_FIELDS,
  sessionsBySport: [
    { sport: 'golf', sessions: 138 }, { sport: 'tennis', sessions: 42 },
    { sport: 'baseball', sessions: 23 }, { sport: 'pickleball', sessions: 13 },
    { sport: 'softball_fast', sessions: 7 }, { sport: 'padel', sessions: 3 },
  ],
  topRecurringIssues: SAMPLE_RECURRING_ISSUES,
};

export const SAMPLE_EXECUTIVE_EXTRAS = {
  newThisWeek: 17,
  returningUsers: 38,
  aiDiagnosticCompletionRate: 84,
  dataQualityScorePct: 88,
};
