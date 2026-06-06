// ============================================================
// SwingVantage — BodySync: constants, disclaimers, defaults
// ============================================================

import type {
  BodySyncState, HealthPermissions, HealthCategory, BodyRegion,
} from './types';

// ── Non-medical disclaimer (shown wherever health context appears) ──
export const NON_MEDICAL_DISCLAIMER =
  'SwingVantage uses wellness and performance data to personalize training ' +
  'recommendations. SwingVantage is not a medical device and does not diagnose, ' +
  'treat, or prevent any medical condition. If pain persists, consult a qualified ' +
  'health professional.';

export const SHORT_DISCLAIMER = 'Wellness guidance, not medical advice. Not a medical device.';

/** Safe, non-diagnostic phrasings the engines draw from. */
export const SAFE_LANGUAGE = {
  fatigue: 'This may indicate elevated fatigue.',
  lighter: 'Consider a lighter session today.',
  pain: 'If pain persists, consult a qualified health professional.',
  uncertain: 'This is an estimate from the data you shared, not a measurement.',
} as const;

// ── Category metadata (for the consent UI + privacy copy) ────
export const CATEGORY_META: Record<
  HealthCategory,
  { label: string; why: string; examples: string }
> = {
  recovery: {
    label: 'Recovery & Readiness',
    why: 'Tells SwingVantage when to push and when to back off, so you train smart.',
    examples: 'Sleep, resting heart rate, HRV, recovery/readiness scores',
  },
  activity: {
    label: 'Activity & Training Load',
    why: 'Spots workload spikes that raise fatigue and injury risk.',
    examples: 'Steps, exercise minutes, workouts, training load',
  },
  cardio: {
    label: 'Heart & Cardio',
    why: 'Helps explain performance dips and recovery deficits.',
    examples: 'Heart rate, resting HR, HRV, VO₂max, cardio recovery',
  },
  mobility: {
    label: 'Mobility & Movement',
    why: 'Flags days when range of motion or steadiness may limit your swing.',
    examples: 'Walking steadiness, balance, range of motion (if available)',
  },
  wellness: {
    label: 'Wellness Check-ins',
    why: 'Your own daily read on energy, soreness, pain, stress and sleep.',
    examples: 'Soreness, energy, pain, stress, hydration, focus',
  },
};

export const BODY_REGIONS: Array<{ id: BodyRegion; label: string }> = [
  { id: 'neck', label: 'Neck' },
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'elbow', label: 'Elbow' },
  { id: 'forearm', label: 'Forearm' },
  { id: 'wrist', label: 'Wrist' },
  { id: 'upper_back', label: 'Upper back' },
  { id: 'lower_back', label: 'Lower back' },
  { id: 'hip', label: 'Hip' },
  { id: 'groin', label: 'Groin' },
  { id: 'hamstring', label: 'Hamstring' },
  { id: 'knee', label: 'Knee' },
  { id: 'ankle', label: 'Ankle' },
  { id: 'foot', label: 'Foot' },
  { id: 'other', label: 'Other' },
];

// ── Defaults ─────────────────────────────────────────────────
export const DEFAULT_PERMISSIONS: HealthPermissions = {
  // Wellness (manual) is the only category on by default — it needs no device
  // and is the one the user types in themselves. Everything else is opt-in.
  recovery: false,
  activity: false,
  cardio: false,
  mobility: false,
  wellness: true,
};

export const DEFAULT_BODYSYNC_STATE: BodySyncState = {
  version: 1,
  settings: {
    enabled: false,
    consentedAt: null,
    cycleTrackingEnabled: false,
    shareReadinessWithCoach: false,
  },
  permissions: { ...DEFAULT_PERMISSIONS },
  connections: [],
  checkins: [],
  baselines: { restingHr: null, hrv: null, sleepHours: null, updatedAt: null },
};

/** Zone → user-facing presentation. */
export const ZONE_META = {
  green: { label: 'Ready', emoji: '🟢', tone: 'success', headline: 'Ready for full training' },
  yellow: { label: 'Moderate', emoji: '🟡', tone: 'warning', headline: 'Train, but ease the intensity' },
  orange: { label: 'Fatigue risk', emoji: '🟠', tone: 'warning', headline: 'Light technical work today' },
  red: { label: 'Recover', emoji: '🔴', tone: 'error', headline: 'Recovery recommended' },
} as const;
