// ============================================================
// SwingVantage — Re-engagement OS: drip-cycle analysis (pure)
// ------------------------------------------------------------
// Turns the live re-engagement engine (TRIGGERS + COHORTS + selection
// rules) into an intuitive, analyzable picture of the whole drip cycle:
//   • where each campaign sits on the lifecycle timeline,
//   • a thorough per-campaign breakdown (audience, cadence, channels,
//     copy, deliverability), and
//   • strategy-level analysis (priority resolution, coverage gaps,
//     channel mix, frequency-cap behaviour) + a 0–100 health score.
//
// Pure: no React, no DOM, no window. Deterministic + unit-testable.
// Operator overrides (priority / cadence / channels / copy) are applied
// here so the admin console and any future bulk-send share one source.
// ============================================================

import type { ActivitySignal, NudgeChannel, NudgeMessage, TriggerId } from './types';
import { TRIGGERS } from './triggers';
import { COHORTS } from './cohorts';
import { buildPayloads } from './engine';

// ── Operator override model (persisted by ./strategy-store) ──────────

/** Per-campaign operator override. Any field left undefined keeps the code default. */
export interface StrategyOverride {
  enabled?: boolean;
  priority?: number;
  cooldownDays?: number;
  channels?: NudgeChannel[];
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  emailSubject?: string;
}

export type StrategyOverrides = Partial<Record<TriggerId, StrategyOverride>>;

/** Engine-wide tunables the admin can preview before committing to code. */
export interface StrategySettings {
  /** Max nudges of ANY kind per 24h (the engine ships with 1). */
  globalDailyCap: number;
}

export const DEFAULT_STRATEGY_SETTINGS: StrategySettings = { globalDailyCap: 1 };

// ── Drip-cycle lifecycle model ───────────────────────────────────────

export type DripStageId = 'activation' | 'cooling' | 'lapsing' | 'dormant' | 'event';

export interface DripStageMeta {
  id: DripStageId;
  label: string;
  description: string;
}

/** The ordered lifecycle stages a timeline campaign can occupy. */
export const DRIP_STAGES: DripStageMeta[] = [
  { id: 'activation', label: 'Activation', description: 'Signed up, no first result yet.' },
  { id: 'cooling', label: 'Cooling off', description: 'Recently active but slowing down.' },
  { id: 'lapsing', label: 'Lapsing', description: 'About a week since the last session.' },
  { id: 'dormant', label: 'Dormant', description: 'Quiet for two weeks or more.' },
  { id: 'event', label: 'Event-based', description: 'Fires on a behaviour, not a day count.' },
];

interface TimelinePlacement {
  stage: DripStageId;
  /** Day on the "days since last activity" axis, or null for event-based. */
  dayThreshold: number | null;
  kind: 'timeline' | 'event';
}

const PLACEMENT: Record<TriggerId, TimelinePlacement> = {
  activation: { stage: 'activation', dayThreshold: 0, kind: 'timeline' },
  comeback_3: { stage: 'cooling', dayThreshold: 3, kind: 'timeline' },
  comeback_7: { stage: 'lapsing', dayThreshold: 7, kind: 'timeline' },
  comeback_14: { stage: 'dormant', dayThreshold: 14, kind: 'timeline' },
  streak_at_risk: { stage: 'event', dayThreshold: null, kind: 'event' },
  finish_fix: { stage: 'event', dayThreshold: null, kind: 'event' },
  retest_due: { stage: 'event', dayThreshold: null, kind: 'event' },
};

/** Human-readable trigger condition (the `applies` rule, in plain English). */
const CONDITIONS: Record<TriggerId, string> = {
  comeback_14: 'No activity for 14+ days (and has practiced before).',
  comeback_7: 'No activity for 7+ days (and has practiced before).',
  comeback_3: 'No activity for 3+ days (and has practiced before).',
  retest_due: 'Has an active fix with 3+ drills logged — a retest is due.',
  streak_at_risk: 'Has a 2+ day streak but hasn’t practiced today.',
  finish_fix: 'Has an active fix still in progress.',
  activation: 'Signed up but hasn’t completed a first swing check.',
};

/** Representative signal so trigger copy (e.g. streak count) renders fully. */
export const DEMO_SIGNAL: ActivitySignal = {
  daysSinceLastActivity: 14,
  streakDays: 5,
  streakAtRisk: true,
  hasPendingFix: true,
  retestDue: true,
  sessionCount: 3,
  activated: true,
  sport: 'golf',
};

// ── Override application (pure) ──────────────────────────────────────

export interface DripCampaign {
  triggerId: TriggerId;
  /** Owner-facing audience name. */
  label: string;
  cohortId: string;
  cohortDescription: string;
  /** Plain-English firing condition. */
  condition: string;
  stage: DripStageId;
  dayThreshold: number | null;
  kind: 'timeline' | 'event';
  enabled: boolean;
  priority: number;
  cooldownDays: number;
  tone: NudgeMessage['tone'];
  channels: NudgeChannel[];
  message: NudgeMessage;
  /** Whether this campaign differs from the committed code default. */
  customized: boolean;
}

function cohortFor(triggerId: TriggerId) {
  return COHORTS.find((c) => c.triggerId === triggerId);
}

/**
 * Build every campaign from the live engine, applying operator overrides.
 * The result is the single source the console renders and any future send
 * would consume.
 */
export function buildCampaigns(
  overrides: StrategyOverrides = {},
  signal: ActivitySignal = DEMO_SIGNAL,
): DripCampaign[] {
  return TRIGGERS.map((t) => {
    const base = t.build(signal);
    const ov = overrides[t.id] ?? {};
    const cohort = cohortFor(t.id);
    const placement = PLACEMENT[t.id];

    const message: NudgeMessage = {
      ...base,
      priority: ov.priority ?? t.priority,
      title: ov.title ?? base.title,
      body: ov.body ?? base.body,
      emailSubject: ov.emailSubject ?? base.emailSubject,
      cta: {
        label: ov.ctaLabel ?? base.cta.label,
        href: ov.ctaHref ?? base.cta.href,
      },
      channels: ov.channels ?? base.channels,
    };

    const customized = Object.keys(ov).length > 0;

    return {
      triggerId: t.id,
      label: cohort?.label ?? t.id,
      cohortId: cohort?.id ?? t.id,
      cohortDescription: cohort?.description ?? '',
      condition: CONDITIONS[t.id],
      stage: placement.stage,
      dayThreshold: placement.dayThreshold,
      kind: placement.kind,
      enabled: ov.enabled ?? true,
      priority: ov.priority ?? t.priority,
      cooldownDays: ov.cooldownDays ?? t.cooldownDays,
      tone: base.tone,
      channels: message.channels,
      message,
      customized,
    };
  });
}

/** Per-channel draft payloads for a campaign (delegates to the engine). */
export function campaignPayloads(c: DripCampaign, origin = 'https://swingvantage.com') {
  return buildPayloads(c.message, origin);
}

// ── Strategy analysis ────────────────────────────────────────────────

export interface ChannelUsage {
  channel: NudgeChannel;
  count: number;
  campaigns: string[];
}

export interface DeliverabilityRow {
  channel: NudgeChannel;
  ready: boolean;
  note: string;
}

export interface HealthFactor {
  key: string;
  label: string;
  score: number; // 0–100
  detail: string;
}

export type HealthBand = 'excellent' | 'good' | 'fair' | 'needs-work';

export interface StrategyHealth {
  score: number; // 0–100
  band: HealthBand;
  factors: HealthFactor[];
}

export interface PriorityRow {
  triggerId: TriggerId;
  label: string;
  priority: number;
  enabled: boolean;
  /** Triggers with a lower priority this one would suppress when both apply. */
  suppresses: string[];
}

export interface StrategyAnalysis {
  totalCampaigns: number;
  enabledCampaigns: number;
  timelineCampaigns: DripCampaign[]; // sorted by day threshold asc
  eventCampaigns: DripCampaign[];
  priorityOrder: PriorityRow[];
  channelMix: ChannelUsage[];
  deliverability: DeliverabilityRow[];
  coverageGaps: string[];
  warnings: string[];
  recommendations: string[];
  health: StrategyHealth;
  cadenceNote: string;
}

const CHANNELS: NudgeChannel[] = ['in_app', 'push', 'email'];

function bandFor(score: number): HealthBand {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'needs-work';
}

export interface AnalyzeContext {
  /** Whether a transactional email provider is configured (server capability). */
  emailConfigured?: boolean;
  /** Whether web-push is wired (defaults to true — it's local/opt-in). */
  pushAvailable?: boolean;
}

/**
 * Analyze the whole drip strategy: ordering, coverage, channels,
 * deliverability, cadence safety, and an overall health score.
 */
export function analyzeStrategy(
  campaigns: DripCampaign[],
  settings: StrategySettings = DEFAULT_STRATEGY_SETTINGS,
  ctx: AnalyzeContext = {},
): StrategyAnalysis {
  const emailConfigured = ctx.emailConfigured ?? false;
  const enabled = campaigns.filter((c) => c.enabled);

  const timelineCampaigns = campaigns
    .filter((c) => c.kind === 'timeline')
    .sort((a, b) => (a.dayThreshold ?? 0) - (b.dayThreshold ?? 0));
  const eventCampaigns = campaigns.filter((c) => c.kind === 'event');

  // Priority resolution — when several apply, the engine picks the highest.
  const priorityOrder: PriorityRow[] = [...campaigns]
    .sort((a, b) => b.priority - a.priority)
    .map((c) => ({
      triggerId: c.triggerId,
      label: c.label,
      priority: c.priority,
      enabled: c.enabled,
      suppresses: campaigns
        .filter((o) => o.triggerId !== c.triggerId && o.enabled && o.priority < c.priority)
        .map((o) => o.label),
    }));

  // Channel mix across enabled campaigns.
  const channelMix: ChannelUsage[] = CHANNELS.map((ch) => {
    const using = enabled.filter((c) => c.channels.includes(ch));
    return { channel: ch, count: using.length, campaigns: using.map((c) => c.label) };
  });

  // Deliverability per channel (honest about what's actually wired).
  const emailUsers = enabled.filter((c) => c.channels.includes('email'));
  const deliverability: DeliverabilityRow[] = [
    { channel: 'in_app', ready: true, note: 'Always available — rendered inside the app.' },
    {
      channel: 'push',
      ready: ctx.pushAvailable ?? true,
      note: 'Web push is opt-in per device (browser permission required).',
    },
    {
      channel: 'email',
      ready: emailConfigured,
      note: emailConfigured
        ? 'Transactional email provider configured (Resend/etc.).'
        : `No email provider configured — ${emailUsers.length} campaign(s) draft email but can’t send yet.`,
    },
  ];

  // Coverage gaps across the lifecycle timeline.
  const coverageGaps: string[] = [];
  for (const stage of DRIP_STAGES) {
    if (stage.id === 'event') continue;
    const inStage = timelineCampaigns.filter((c) => c.stage === stage.id);
    if (inStage.length === 0) {
      coverageGaps.push(`No campaign covers the “${stage.label}” stage.`);
    } else if (inStage.every((c) => !c.enabled)) {
      coverageGaps.push(`“${stage.label}” stage has only disabled campaigns.`);
    }
  }
  // Largest silent window between consecutive enabled timeline touches.
  const enabledDays = timelineCampaigns
    .filter((c) => c.enabled && c.dayThreshold != null)
    .map((c) => c.dayThreshold as number)
    .sort((a, b) => a - b);
  for (let i = 1; i < enabledDays.length; i++) {
    const gap = enabledDays[i] - enabledDays[i - 1];
    if (gap >= 7) {
      coverageGaps.push(
        `${gap}-day silent window between day ${enabledDays[i - 1]} and day ${enabledDays[i]} touches.`,
      );
    }
  }

  // Warnings + recommendations.
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (emailUsers.length > 0 && !emailConfigured) {
    warnings.push(
      `${emailUsers.length} campaign(s) use the email channel but no provider is configured — those sends are drafts only.`,
    );
    recommendations.push('Add a Resend (or ConvertKit/Mailchimp) key to activate email delivery.');
  }
  const noCooldown = enabled.filter((c) => c.cooldownDays < 1);
  if (noCooldown.length > 0) {
    warnings.push(
      `${noCooldown.length} campaign(s) have no cooldown — they could repeat daily and feel like spam.`,
    );
  }
  if (settings.globalDailyCap > 2) {
    warnings.push(
      `Global daily cap is ${settings.globalDailyCap}/day — more than 1–2 nudges/day risks fatigue.`,
    );
  }
  if (enabled.length === 0) {
    warnings.push('Every campaign is disabled — no re-engagement will ever fire.');
  }
  const dupPriorities = new Map<number, number>();
  for (const c of enabled) dupPriorities.set(c.priority, (dupPriorities.get(c.priority) ?? 0) + 1);
  for (const [p, n] of dupPriorities) {
    if (n > 1) warnings.push(`${n} campaigns share priority ${p} — ordering between them is undefined.`);
  }
  if (coverageGaps.length === 0 && warnings.length === 0) {
    recommendations.push('Strategy looks healthy. Revisit copy quarterly to keep it fresh.');
  }

  // ── Health score (0–100) ──
  const stageIds = DRIP_STAGES.filter((s) => s.id !== 'event').map((s) => s.id);
  const coveredStages = stageIds.filter((sid) =>
    timelineCampaigns.some((c) => c.stage === sid && c.enabled),
  ).length;
  const coverageScore = Math.round((coveredStages / stageIds.length) * 100);

  const avgChannels =
    enabled.length === 0 ? 0 : enabled.reduce((s, c) => s + c.channels.length, 0) / enabled.length;
  const channelScore = Math.min(100, Math.round((avgChannels / 2) * 100)); // 2+ channels ⇒ 100

  const cadenceSafe =
    noCooldown.length === 0 && settings.globalDailyCap >= 1 && settings.globalDailyCap <= 2;
  const cadenceScore = cadenceSafe ? 100 : noCooldown.length > 0 ? 40 : 70;

  let deliverScore: number;
  if (emailUsers.length === 0) {
    deliverScore = 100; // not relying on the un-wired channel
  } else {
    deliverScore = emailConfigured ? 100 : 45;
  }

  const factors: HealthFactor[] = [
    {
      key: 'coverage',
      label: 'Lifecycle coverage',
      score: coverageScore,
      detail: `${coveredStages}/${stageIds.length} lifecycle stages have an active campaign.`,
    },
    {
      key: 'channels',
      label: 'Channel diversity',
      score: channelScore,
      detail: `Enabled campaigns use ${avgChannels.toFixed(1)} channels on average.`,
    },
    {
      key: 'cadence',
      label: 'Cadence safety',
      score: cadenceScore,
      detail: cadenceSafe
        ? `Cooldowns set; ${settings.globalDailyCap}/day global cap.`
        : 'Cooldown or daily-cap settings risk over-messaging.',
    },
    {
      key: 'deliverability',
      label: 'Deliverability',
      score: deliverScore,
      detail:
        emailUsers.length === 0
          ? 'No reliance on un-configured channels.'
          : emailConfigured
            ? 'Email provider configured.'
            : 'Email campaigns can’t actually send yet.',
    },
  ];
  const weights = { coverage: 0.35, channels: 0.2, cadence: 0.2, deliverability: 0.25 } as const;
  const score = Math.round(
    factors.reduce((s, f) => s + f.score * (weights[f.key as keyof typeof weights] ?? 0), 0),
  );

  const cadenceNote =
    `At most ${settings.globalDailyCap} nudge${settings.globalDailyCap === 1 ? '' : 's'} per day across all campaigns; ` +
    'each campaign also waits its own cooldown before repeating, and an explicit dismissal snoozes it for that window.';

  return {
    totalCampaigns: campaigns.length,
    enabledCampaigns: enabled.length,
    timelineCampaigns,
    eventCampaigns,
    priorityOrder,
    channelMix,
    deliverability,
    coverageGaps,
    warnings,
    recommendations,
    health: { score, band: bandFor(score), factors },
    cadenceNote,
  };
}

// ── Export for committing to code ────────────────────────────────────

/** Serialize operator overrides + settings to JSON for committing to triggers.ts. */
export function exportStrategyJson(overrides: StrategyOverrides, settings: StrategySettings): string {
  return JSON.stringify({ settings, overrides }, null, 2);
}
