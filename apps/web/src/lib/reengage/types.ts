// ============================================================
// SwingVantage — Re-engagement / Outbound OS: types
// ------------------------------------------------------------
// Turns "this user is drifting" into ONE honest, well-timed nudge,
// delivered in-app and (opt-in) via local notification / email.
// Draft-first: nothing is ever auto-sent without an explicit channel
// opt-in, and we never guilt-trip or spam (hard frequency caps).
// ============================================================

import type { SportId } from '@swingiq/core';

export type NudgeChannel = 'in_app' | 'push' | 'email';

export type TriggerId =
  | 'comeback_14'
  | 'comeback_7'
  | 'comeback_3'
  | 'streak_at_risk'
  | 'retest_due'
  | 'finish_fix'
  | 'activation';

/** A lightweight read of the user's current state, derived from the store. */
export interface ActivitySignal {
  daysSinceLastActivity: number | null;
  streakDays: number;
  /** Practiced before but not today, with a streak worth protecting. */
  streakAtRisk: boolean;
  hasPendingFix: boolean;
  retestDue: boolean;
  sessionCount: number;
  /** Completed the first swing check (the activation milestone). */
  activated: boolean;
  sport: SportId;
}

/** A built, ready-to-render / ready-to-send message. */
export interface NudgeMessage {
  triggerId: TriggerId;
  priority: number;
  tone: 'info' | 'encouraging' | 'celebratory';
  title: string;
  body: string;
  cta: { label: string; href: string };
  /** Subject line for the email channel. */
  emailSubject: string;
  /** Channels this nudge is allowed to use. */
  channels: NudgeChannel[];
}

export interface QuietHours {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface NudgePrefs {
  inApp: boolean;
  push: boolean;
  email: boolean;
  quietHours: QuietHours;
}

export interface NudgeState {
  version: 1;
  prefs: NudgePrefs;
  /** triggerId → ISO timestamp it was last shown (frequency cap). */
  lastShown: Partial<Record<TriggerId, string>>;
  /** triggerIds the user explicitly dismissed (snoozed for the cap window). */
  dismissed: Partial<Record<TriggerId, string>>;
  /** ISO of the most recent nudge of ANY kind (global daily cap). */
  lastAnyAt: string | null;
}

/** Owner-facing cohort for the admin outbound preview. */
export interface Cohort {
  id: string;
  label: string;
  description: string;
  triggerId: TriggerId;
}
