// ============================================================
// SwingVantage — Video Studio: Domain Types & Schemas
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This file is the "dictionary" for the AI Video department. It
//   defines every kind of record the system works with — a spotted
//   *opportunity* for a video, the *creative brief* that describes it,
//   the *generation job* that builds it, the finished *asset*, where it
//   gets *placed*, how it *performs*, and when it should be *reassessed*.
//
//   Everything else in lib/video-studio speaks these shapes. We keep
//   them in one file so the data model is reviewable at a glance, and we
//   attach Zod schemas to the records that cross a trust boundary (API
//   input, persisted rows) so bad data is rejected early.
//
// DESIGN RULES (mirrors lib/agents + lib/tutorial):
//   - Structured data first, UI copy second.
//   - Deterministic by default; an LLM is an OPTIONAL enhancer.
//   - Honest by design: nothing here fabricates a "configured" provider
//     or a real recording that does not exist.
// ============================================================

import { z } from 'zod';

// ── Shared vocabulary ─────────────────────────────────────────

/** Sports SwingVantage supports. Mirrors the app's SportId surface. */
export const SPORTS = ['golf', 'tennis', 'baseball', 'softball_slow', 'softball_fast'] as const;
export type StudioSport = (typeof SPORTS)[number];

/** Who a video is written for. Mirrors tutorial AUDIENCES / onboarding USER_TYPES. */
export const AUDIENCES = ['athlete', 'parent', 'coach', 'team', 'all'] as const;
export type StudioAudience = (typeof AUDIENCES)[number];

/**
 * Where a surface sits in the first-use → repeat-use journey. Kept
 * value-compatible with lib/tutorial's TutorialJourneyStage so the two
 * systems can share placements and analytics.
 */
export const JOURNEY_STAGES = [
  'discover', // what is this / why care (marketing, hero)
  'onboard', // first run, find your way around
  'capture', // record / upload a swing
  'understand', // read the AI analysis
  'improve', // turn analysis into practice
  'track', // measure progress over time
  'recover', // something went wrong — get unstuck
  'convert', // upgrade / trust / decision moments
  'retain', // re-engagement / come-back moments
] as const;
export type JourneyStage = (typeof JOURNEY_STAGES)[number];

/** The catalogue of video types the department can produce (spec §1). */
export const VIDEO_TYPES = [
  'hero_explainer',
  'feature_tutorial',
  'onboarding_walkthrough',
  'contextual_tooltip',
  'help_center',
  'empty_state',
  'error_resolution',
  'product_tour',
  'results_explainer',
  'trust_safety',
  'comparison',
  'conversion_upgrade',
  're_engagement',
  'sport_instructional',
  'admin_training',
] as const;
export type VideoType = (typeof VIDEO_TYPES)[number];

/** Visual treatment guidance for generation. */
export const VIDEO_STYLES = [
  'screen_capture', // narrated product screen-recording
  'motion_graphics', // kinetic type + UI motion
  'talking_head', // avatar/host presenter (HeyGen/Synthesia class)
  'kinetic_text', // text-forward, music-bed, no VO
  'live_action', // real footage (range/court/field)
  'hybrid', // screen + motion graphics overlay
] as const;
export type VideoStyle = (typeof VIDEO_STYLES)[number];

/** Output aspect ratios. */
export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5'] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

/** How a placement renders on the page. */
export const PLACEMENT_DISPLAYS = [
  'hero', // full-width hero block
  'inline', // 16:9 inline section player
  'card', // compact thumbnail + CTA
  'modal', // opens in a dialog
  'tooltip', // help drawer / popover
  'dashboard_card',
  'empty_state',
] as const;
export type PlacementDisplay = (typeof PLACEMENT_DISPLAYS)[number];

/** What makes a video appear / play. We never force sound. */
export const PLACEMENT_TRIGGERS = ['click-to-play', 'muted-autoplay', 'on-open'] as const;
export type PlacementTrigger = (typeof PLACEMENT_TRIGGERS)[number];

/** Risk → how much human oversight before publishing. */
export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

/** Lifecycle status of a published video asset (spec §6 governance). */
export const LIFECYCLE_STATES = [
  'evergreen',
  'seasonal',
  'experimental',
  'outdated',
  'deprecated',
] as const;
export type LifecycleState = (typeof LIFECYCLE_STATES)[number];

// ── §1 Video Opportunity ──────────────────────────────────────

/**
 * The dimensions the opportunity engine scores a surface on. Each is a
 * 0–100 "how much would video help here for this reason" signal. The
 * priority score is a weighted blend of these (see scoring.ts).
 */
export interface OpportunitySignals {
  userConfusionRisk: number;
  featureComplexity: number;
  funnelImportance: number;
  conversionOpportunity: number;
  onboardingFriction: number;
  educationalDepth: number;
  supportBurden: number;
  visualExplanationNeed: number;
  trustBuildingNeed: number;
  seoOpportunity: number;
  accessibilityBenefit: number;
  retentionValue: number;
  differentiationValue: number;
}

export const OPPORTUNITY_SIGNAL_KEYS: (keyof OpportunitySignals)[] = [
  'userConfusionRisk',
  'featureComplexity',
  'funnelImportance',
  'conversionOpportunity',
  'onboardingFriction',
  'educationalDepth',
  'supportBurden',
  'visualExplanationNeed',
  'trustBuildingNeed',
  'seoOpportunity',
  'accessibilityBenefit',
  'retentionValue',
  'differentiationValue',
];

export type OpportunityStatus =
  | 'recommended' // freshly scored, awaiting a decision
  | 'approved' // greenlit for a brief / generation
  | 'rejected' // declined by an admin
  | 'in_production' // a job exists
  | 'published' // an asset is live
  | 'dismissed'; // superseded / no longer relevant

export interface VideoOpportunity {
  id: string;
  /** Surface this opportunity targets (route + zone). */
  surfaceId: string;
  page: string;
  zone: string;
  recommendedType: VideoType;
  /** Business + UX rationale, in plain English. */
  businessRationale: string;
  uxRationale: string;
  signals: OpportunitySignals;
  /** 0–100 weighted blend of signals (scoring.ts). */
  priorityScore: number;
  /** 0–100 — how sure we are this is worth doing. */
  confidenceScore: number;
  confidence: ConfidenceLevel;
  /** Plain-English estimated impact, e.g. "Could lift upload completion". */
  estimatedImpact: string;
  suggestedPlacement: PlacementDisplay;
  /** Target length in seconds. */
  suggestedLengthSec: number;
  suggestedStyle: VideoStyle;
  suggestedCta: string;
  requiredAssets: string[];
  riskLevel: RiskLevel;
  /** True when a human must approve before generation/publish. */
  requiresApproval: boolean;
  audience: StudioAudience;
  sport: StudioSport | 'all';
  journeyStage: JourneyStage;
  status: OpportunityStatus;
  /** Whether a video already exists at this surface (gap detection). */
  alreadyCovered: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── §2 Creative Brief ─────────────────────────────────────────

export interface StoryboardScene {
  /** 1-based scene order. */
  index: number;
  /** Seconds this scene is on screen. */
  durationSec: number;
  /** What the viewer sees (visual direction). */
  visual: string;
  /** Spoken line for this scene (maps to a VO segment). */
  voiceover: string;
  /** On-screen text / lower-third for this scene. */
  onScreenText?: string;
}

export interface VideoCreativeBrief {
  id: string;
  opportunityId: string;
  version: number;
  objective: string;
  targetUser: string;
  userPainPoint: string;
  desiredOutcome: string;
  keyMessage: string;
  pageContext: string;
  /** Full narration script (also doubles as the text fallback). */
  script: string[];
  storyboard: StoryboardScene[];
  voiceover: string;
  onScreenText: string[];
  /** WebVTT cue lines (text only; timing added at compose time). */
  captions: string[];
  thumbnailConcept: string;
  cta: string;
  visualStyle: VideoStyle;
  durationTargetSec: number;
  aspectRatio: AspectRatio;
  platformUseCase: string;
  accessibilityRequirements: string[];
  /** SEO metadata for public videos. */
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  /** Answer-engine / generative-engine friendly summary. */
  aeoSummary: string;
  versionNotes: string;
  complianceNotes: string[];
  createdAt: string;
}

// ── §3/§4 Assets & Generation Jobs ────────────────────────────

export const JOB_STATUSES = [
  'queued',
  'pending',
  'processing',
  'completed',
  'failed',
  'retry',
  'cancelled',
  'manual_review',
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export interface JobEvent {
  at: string;
  status: JobStatus;
  message: string;
}

export interface VideoGenerationJob {
  id: string;
  briefId: string;
  opportunityId: string;
  providerId: string;
  status: JobStatus;
  /** 0–100 progress reported by the provider (best-effort). */
  progress: number;
  attempts: number;
  maxAttempts: number;
  /** Provider's own job id, when async. */
  providerJobId?: string;
  /** Estimated/charged cost in USD cents, for the budget guardrail. */
  estimatedCostCents: number;
  /** Result asset id once completed. */
  assetId?: string;
  error?: string;
  history: JobEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CaptionTrack {
  lang: string;
  /** Public URL or data URI to a WebVTT file. */
  src: string;
  label: string;
}

export interface VideoAsset {
  id: string;
  briefId: string;
  opportunityId: string;
  providerId: string;
  jobId: string;
  title: string;
  description: string;
  /** Primary playable source (mp4/webm/hls .m3u8) — may be a placeholder. */
  src?: string;
  mp4Src?: string;
  webmSrc?: string;
  hlsSrc?: string;
  poster?: string;
  thumbnail?: string;
  captions: CaptionTrack[];
  transcript: string;
  durationSec: number;
  aspectRatio: AspectRatio;
  /** True when this is a generated placeholder (no real footage yet). */
  isPlaceholder: boolean;
  /** Draft vs published — published assets can be served publicly. */
  published: boolean;
  lifecycle: LifecycleState;
  version: number;
  /** Free text for SEO upload/update dates etc. */
  seoUploadDate: string;
  seoUpdatedDate: string;
  createdAt: string;
  updatedAt: string;
}

// ── §5 Placements ─────────────────────────────────────────────

export interface StudioPlacement {
  id: string;
  /** Asset shown here (undefined => fall back to written/honest state). */
  assetId?: string;
  /** Surface from surfaces.ts. */
  surfaceId: string;
  page: string;
  zone: string;
  display: PlacementDisplay;
  trigger: PlacementTrigger;
  /** Display/audience/device gating. */
  audience: StudioAudience;
  sport: StudioSport | 'all';
  device: 'all' | 'mobile' | 'desktop';
  /** Optional experiment bucket key. */
  experiment?: string;
  priority: number;
  startAt?: string;
  endAt?: string;
  cta: string;
  blurb?: string;
  captionsRequired: boolean;
  journeyStage: JourneyStage;
  /** True when this placement is enabled (admin toggle). */
  enabled: boolean;
  /** Source registry — 'tutorial' entries are seeded from lib/tutorial. */
  source: 'studio' | 'tutorial';
}

// ── §6 Versions ───────────────────────────────────────────────

export interface VideoVersion {
  id: string;
  assetId: string;
  version: number;
  /** Why this version exists (from a reassessment or manual edit). */
  changeReason: string;
  briefId: string;
  createdAt: string;
  /** Whether this version is the currently-served one. */
  isCurrent: boolean;
}

// ── §8 Performance metrics + scores ───────────────────────────

export interface VideoPerformanceMetric {
  id: string;
  assetId: string;
  placementId: string;
  windowStart: string;
  windowEnd: string;
  impressions: number;
  plays: number;
  pauses: number;
  completions: number;
  /** Average completion fraction 0–1. */
  avgCompletion: number;
  ctaClicks: number;
  replays: number;
  muteToggles: number;
  captionToggles: number;
  /** Median drop-off point as a fraction 0–1. */
  dropOffPoint: number;
  downstreamConversions: number;
}

/** Computed scores used to rank reassessment + recommendations (spec §8). */
export interface VideoPerformanceScore {
  assetId: string;
  engagement: number; // 0–100
  conversionContribution: number; // 0–100
  education: number; // 0–100
  frictionReduction: number; // 0–100
  freshness: number; // 0–100
  /** Higher = more in need of attention/improvement. */
  recommendationPriority: number; // 0–100
}

// ── §7 Reassessment ───────────────────────────────────────────

export const REASSESSMENT_ACTIONS = [
  'keep',
  'improve_script',
  'shorten',
  'new_thumbnail',
  'move_placement',
  'replace',
  'add_captions',
  'add_transcript',
  'create_sport_variant',
  'create_mobile_variant',
  'create_onboarding_variant',
  'retire',
  'human_review',
] as const;
export type ReassessmentAction = (typeof REASSESSMENT_ACTIONS)[number];

export interface ReassessmentRecommendation {
  action: ReassessmentAction;
  /** 0–100 — how strongly we recommend it. */
  weight: number;
  rationale: string;
}

export interface VideoReassessment {
  id: string;
  assetId: string;
  placementId?: string;
  /** Ordered recommendations, strongest first. */
  recommendations: ReassessmentRecommendation[];
  /** The single top recommended action. */
  primaryAction: ReassessmentAction;
  /** Inputs that drove the recommendation (for transparency). */
  signals: string[];
  requiresHuman: boolean;
  createdAt: string;
}

// ── §12/§13 Provider config + brand ───────────────────────────

export interface VideoProviderConfig {
  id: string;
  label: string;
  /** Which capabilities this provider offers. */
  capabilities: ProviderCapability[];
  configured: boolean;
  /** Env vars that turn it on (for the admin checklist). */
  requiredEnv: string[];
  note: string;
  /** Hard ceiling so a misconfig can't run up a bill (USD cents). */
  maxCostPerJobCents: number;
  enabled: boolean;
}

export const PROVIDER_CAPABILITIES = [
  'video',
  'voiceover',
  'captions',
  'thumbnail',
  'compose',
] as const;
export type ProviderCapability = (typeof PROVIDER_CAPABILITIES)[number];

// ── §12 Audit log ─────────────────────────────────────────────

export const AUDIT_ACTIONS = [
  'scan',
  'opportunity_approved',
  'opportunity_rejected',
  'brief_generated',
  'job_started',
  'job_cancelled',
  'asset_published',
  'asset_unpublished',
  'placement_assigned',
  'placement_updated',
  'reassessment_run',
  'asset_retired',
  'provider_config_changed',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface VideoAuditLog {
  id: string;
  action: AuditAction;
  /** Who did it — 'system' for automated runs, or an admin identifier. */
  actor: string;
  /** The entity affected (opportunity/brief/job/asset/placement id). */
  targetId: string;
  /** Compact human description. */
  summary: string;
  /** Optional structured detail. */
  detail?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================
// Zod schemas — only for data that crosses a trust boundary
// (API input + persisted rows). Internal-only shapes stay as
// plain interfaces above to keep the file readable.
// ============================================================

export const SportSchema = z.enum(SPORTS);
export const AudienceSchema = z.enum(AUDIENCES);
export const VideoTypeSchema = z.enum(VIDEO_TYPES);
export const JourneyStageSchema = z.enum(JOURNEY_STAGES);
export const JobStatusSchema = z.enum(JOB_STATUSES);
export const ReassessmentActionSchema = z.enum(REASSESSMENT_ACTIONS);

/** API: approve/reject an opportunity. */
export const OpportunityDecisionSchema = z.object({
  opportunityId: z.string().min(1),
  decision: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional(),
});
export type OpportunityDecision = z.infer<typeof OpportunityDecisionSchema>;

/** API: request a creative brief for an opportunity. */
export const BriefRequestSchema = z.object({
  opportunityId: z.string().min(1),
  /** Optional overrides an admin can pass before generating. */
  overrides: z
    .object({
      durationTargetSec: z.number().int().min(5).max(600).optional(),
      aspectRatio: z.enum(ASPECT_RATIOS).optional(),
      visualStyle: z.enum(VIDEO_STYLES).optional(),
      cta: z.string().max(120).optional(),
    })
    .optional(),
});
export type BriefRequest = z.infer<typeof BriefRequestSchema>;

/** API: start a generation job. */
export const JobRequestSchema = z.object({
  briefId: z.string().min(1),
  /** Provider override; defaults to the resolved default provider. */
  providerId: z.string().optional(),
});
export type JobRequest = z.infer<typeof JobRequestSchema>;

/** API: record a video analytics event from the player. */
export const VideoEventSchema = z.object({
  event: z.enum([
    'impression',
    'play',
    'pause',
    'complete',
    'cta_click',
    'mute',
    'unmute',
    'caption_toggle',
    'replay',
    'error',
  ]),
  assetId: z.string().max(120).optional(),
  placementId: z.string().max(120),
  /** 0–1 completion fraction for play/pause/complete. */
  completion: z.number().min(0).max(1).optional(),
  /** Drop-off timestamp in seconds. */
  dropOffSec: z.number().min(0).max(36_000).optional(),
  videoVersion: z.number().int().min(0).optional(),
  journeyStage: JourneyStageSchema.optional(),
  page: z.string().max(300).optional(),
  sport: z.string().max(40).optional(),
  device: z.enum(['mobile', 'tablet', 'desktop']).optional(),
});
export type VideoEventInput = z.infer<typeof VideoEventSchema>;

/** API: assign / update a placement. */
export const PlacementUpsertSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  assetId: z.string().max(120).optional(),
  surfaceId: z.string().min(1).max(120),
  display: z.enum(PLACEMENT_DISPLAYS),
  trigger: z.enum(PLACEMENT_TRIGGERS),
  audience: AudienceSchema.default('all'),
  sport: z.union([SportSchema, z.literal('all')]).default('all'),
  device: z.enum(['all', 'mobile', 'desktop']).default('all'),
  cta: z.string().min(1).max(120),
  blurb: z.string().max(240).optional(),
  priority: z.number().int().min(0).max(100).default(50),
  enabled: z.boolean().default(true),
  experiment: z.string().max(60).optional(),
});
export type PlacementUpsert = z.infer<typeof PlacementUpsertSchema>;
