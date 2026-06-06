// ============================================================
// Player Recruiting Hub — domain types
// ------------------------------------------------------------
// The type system behind the premium recruiting layer. Recruiting
// data lives in its OWN local-first store (`swingvantage-recruiting`,
// see store.ts), mirroring the Academy / Motion-Lab secondary stores.
// All derivation (profile strength, summaries, reel checks, analytics)
// is pure (see strength.ts / summary.ts / filmQuality.ts / analytics.ts).
//
// Honest-first is structural here: every metric and AI claim carries a
// source + verification label and a confidence level. The engine never
// emits a claim it can't trace to a labeled data point.
// ============================================================

import type { SportId } from '@swingiq/core';

// ── Credibility primitives ───────────────────────────────────

/** Where a data point came from. Drives the credibility label on every metric/claim. */
export type DataSource =
  | 'self_reported'
  | 'coach_verified'
  | 'device_imported'
  | 'platform_generated'
  | 'ai_estimated'
  | 'event_verified'
  | 'manual_entry'
  | 'needs_review';

export const DATA_SOURCE_LABEL: Record<DataSource, string> = {
  self_reported: 'Self-reported',
  coach_verified: 'Verified by coach',
  device_imported: 'Imported from device',
  platform_generated: 'Platform generated',
  ai_estimated: 'AI-estimated',
  event_verified: 'Event verified',
  manual_entry: 'Manually entered',
  needs_review: 'Needs verification',
};

/** A data point is "verified" when its source is independently corroborated. */
export const VERIFIED_SOURCES: ReadonlySet<DataSource> = new Set<DataSource>([
  'coach_verified',
  'device_imported',
  'event_verified',
]);

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'needs_review';

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
  needs_review: 'Needs human review',
};

/** Per-item visibility. Profiles are private by default. */
export type Visibility = 'public' | 'link_only' | 'private';

// ── Player identity ──────────────────────────────────────────

export type PlayerType =
  | 'high_school'
  | 'college'
  | 'junior_pro'
  | 'adult_amateur'
  | 'coach_managed';

export const PLAYER_TYPE_LABEL: Record<PlayerType, string> = {
  high_school: 'High school athlete',
  college: 'College athlete',
  junior_pro: 'Junior / developing pro',
  adult_amateur: 'Adult amateur',
  coach_managed: 'Coach-managed athlete',
};

export type RecruitingStatus =
  | 'exploring'
  | 'actively_recruiting'
  | 'committed'
  | 'transfer_portal'
  | 'not_looking';

export const RECRUITING_STATUS_LABEL: Record<RecruitingStatus, string> = {
  exploring: 'Exploring options',
  actively_recruiting: 'Actively recruiting',
  committed: 'Committed',
  transfer_portal: 'In the transfer portal',
  not_looking: 'Not currently looking',
};

export type Handedness = 'right' | 'left' | 'switch';

// ── Profile ──────────────────────────────────────────────────

/** A sport-specific layer on top of the core athlete identity. */
export interface SportProfile {
  sport: SportId;
  /** Position / event / specialty (e.g. "Shortstop", "Singles", "All-around"). */
  position: string;
  /** Secondary positions/specialties. */
  secondaryPositions: string[];
  battingHand?: Handedness;
  throwingHand?: Handedness;
  /** Golf: handicap index. */
  handicap?: number | null;
  /** Golf: scoring average. */
  scoringAverage?: number | null;
  /** Tennis: UTR / NTRP / ITF / other rating value. */
  rating?: number | null;
  ratingSystem?: 'UTR' | 'NTRP' | 'ITF' | 'WTN' | 'other';
  /** Highest level of competition reached, free text (e.g. "State, Regional"). */
  competitionLevel?: string;
  source: DataSource;
}

export interface RecruitingProfile {
  id: string;
  // Identity
  athleteName: string;
  graduationYear?: number | null;
  playerType: PlayerType;
  primarySport: SportId;
  schoolOrClub?: string;
  teamName?: string;
  hometownRegion?: string; // city/state region — never a precise address
  heightInches?: number | null;
  weightLbs?: number | null;
  dominantHand?: Handedness;
  dateOfBirth?: string | null; // ISO; used only to derive minor status, not displayed publicly
  // Coaching / academics
  primaryCoachName?: string;
  primaryCoachContact?: string;
  gpa?: number | null;
  testScores?: string;
  intendedMajor?: string;
  academicInterests?: string;
  // Contact
  contactEmail?: string;
  contactPhone?: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  /** When true, the athlete's direct contact is hidden publicly and guardian/coach is used. */
  maskAthleteContact: boolean;
  // Recruiting context
  recruitingStatus: RecruitingStatus;
  transferStatus?: string;
  bio?: string;
  personalStatement?: string;
  goals?: string;
  coachabilityNotes?: string;
  verifiedLinks: VerifiedLink[];
  // Per-sport detail
  sportProfiles: Record<string, SportProfile>;
  // Meta
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface VerifiedLink {
  id: string;
  label: string;
  url: string;
  source: DataSource;
}

// ── Film ─────────────────────────────────────────────────────

export type FilmCategory =
  | 'highlight_reel'
  | 'full_game'
  | 'full_at_bat'
  | 'bullpen_session'
  | 'swing_session'
  | 'practice_session'
  | 'tournament_footage'
  | 'match_play'
  | 'range_session'
  | 'driver_session'
  | 'iron_session'
  | 'wedge_session'
  | 'putting_session'
  | 'serve_session'
  | 'groundstroke_session'
  | 'fielding_session'
  | 'throwing_session'
  | 'athletic_testing'
  | 'coach_evaluation'
  | 'before_after';

export type CameraAngle =
  | 'face_on'
  | 'down_the_line'
  | 'behind'
  | 'side'
  | 'overhead'
  | 'broadcast'
  | 'field_view'
  | 'court_view'
  | 'pitcher_catcher'
  | 'tee_view'
  | 'launch_monitor';

export interface FilmAsset {
  id: string;
  title: string;
  sport: SportId;
  category: FilmCategory;
  /** Object URL / remote URL / storage key. Raw video is never shared off-device automatically. */
  url?: string;
  thumbnailUrl?: string;
  durationSeconds?: number | null;
  date?: string;
  location?: string;
  opponentOrEvent?: string;
  cameraAngle?: CameraAngle;
  /** Skill type free tag (e.g. "Exit velo", "Second serve"). */
  skillType?: string;
  resultOutcome?: string;
  notes?: string;
  tags: string[];
  featured: boolean;
  visibility: Visibility;
  source: DataSource;
  /** Heuristic 0–100 film-quality score (lighting/length/angle/context). */
  qualityScore?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/** A trimmed segment of a film asset, used to compose reels. */
export interface Clip {
  id: string;
  filmId: string;
  label: string;
  startSeconds: number;
  endSeconds: number;
  /** Flash = wow moment; evaluation = shows repeatable mechanics under real conditions. */
  kind: 'flash' | 'evaluation';
  speed: 'full' | 'slow';
  createdAt: string;
}

export interface HighlightReel {
  id: string;
  title: string;
  sport: SportId;
  /** Reel style key from filmQuality.REEL_STYLES. */
  style: string;
  clipIds: string[];
  featured: boolean;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

// ── Metrics ──────────────────────────────────────────────────

export interface MetricSample {
  value: number;
  date: string; // ISO
  source: DataSource;
  note?: string;
}

export interface PlayerMetric {
  id: string;
  /** Catalog key from metrics.ts (e.g. "exit_velocity"). */
  metricKey: string;
  sport: SportId;
  /** Most recent value (denormalized for fast reads). */
  currentValue: number | null;
  unit: string;
  /** Chronological history (oldest → newest) for trend lines. */
  history: MetricSample[];
  source: DataSource;
  coachValidated: boolean;
  visibility: Visibility;
  notes?: string;
  updatedAt: string;
}

// ── Coach notes ──────────────────────────────────────────────

export interface CoachNote {
  id: string;
  authorName: string;
  authorRole?: string;
  body: string;
  /** Whether this note is corroborated (coach verified themselves). */
  verified: boolean;
  visibility: Visibility;
  createdAt: string;
}

// ── AI summary ───────────────────────────────────────────────

export type SummaryAudience =
  | 'coach'
  | 'scout'
  | 'parent'
  | 'bio'
  | 'email_intro'
  | 'social';

export interface SummaryClaim {
  text: string;
  /** Catalog keys / asset ids that ground this claim. */
  evidence: string[];
  confidence: ConfidenceLevel;
  source: DataSource;
}

export interface AIPlayerSummary {
  id: string;
  audience: SummaryAudience;
  /** The narrative paragraph(s). */
  body: string;
  /** Structured, traceable claims behind the narrative. */
  claims: SummaryClaim[];
  /** Honest caveats surfaced to the reader. */
  caveats: string[];
  /** "deterministic" (keyless engine) or "ai" (provider re-word). */
  generator: 'deterministic' | 'ai';
  createdAt: string;
}

// ── Sharing ──────────────────────────────────────────────────

export type ShareLinkKind =
  | 'public'
  | 'private'
  | 'password'
  | 'expiring'
  | 'coach'
  | 'scout'
  | 'team'
  | 'analytics_anon';

export interface ShareLinkPermissions {
  canView: boolean;
  canDownloadPacket: boolean;
  canContact: boolean;
  showVideo: boolean;
  showData: boolean;
  showContactInfo: boolean;
}

export interface ShareLink {
  id: string;
  slug: string;
  kind: ShareLinkKind;
  label: string;
  /** Recipient name for coach/scout/team-specific links. */
  recipientName?: string;
  permissions: ShareLinkPermissions;
  password?: string | null;
  expiresAt?: string | null;
  watermark: boolean;
  active: boolean;
  createdAt: string;
  revokedAt?: string | null;
}

// ── Packet ───────────────────────────────────────────────────

export type PacketVariant = 'coach' | 'scout' | 'parent';

export interface RecruitingPacket {
  id: string;
  variant: PacketVariant;
  generatedAt: string;
}

// ── Outreach ─────────────────────────────────────────────────

export interface OutreachContact {
  id: string;
  name: string;
  role?: string; // "Head Coach", "Recruiting Coordinator"
  organization?: string;
  sport?: SportId;
  email?: string;
  notes?: string;
  /** Personal connection, if any (used to personalize, never fabricated). */
  connection?: string;
  createdAt: string;
}

export type OutreachKind =
  | 'initial'
  | 'follow_up'
  | 'tournament_update'
  | 'new_reel'
  | 'updated_metrics'
  | 'thank_you'
  | 'personalized'
  | 'social_dm';

export interface OutreachMessage {
  id: string;
  contactId?: string;
  kind: OutreachKind;
  subject: string;
  body: string;
  /** Never auto-sent: 'draft' until the athlete (or guardian, if minor) approves. */
  status: 'draft' | 'approved' | 'sent';
  generator: 'deterministic' | 'ai';
  createdAt: string;
  approvedAt?: string | null;
  sentAt?: string | null;
}

// ── Engagement analytics ─────────────────────────────────────

export type EngagementType =
  | 'profile_view'
  | 'video_view'
  | 'video_watch_progress'
  | 'packet_download'
  | 'link_click'
  | 'contact_submit'
  | 'revoked_attempt';

export interface EngagementEvent {
  id: string;
  type: EngagementType;
  shareLinkId?: string;
  /** Coarse viewer fingerprint (never PII): hashed session marker. */
  viewerKey?: string;
  /** For video events: which asset/reel. */
  targetId?: string;
  /** For watch-progress: 0–1 fraction watched. */
  progress?: number;
  /** Coarse region only (e.g. "US-CA"), never precise geolocation. */
  region?: string;
  at: string;
}

// ── Safety / compliance ──────────────────────────────────────

export interface GuardianConsent {
  granted: boolean;
  guardianName?: string;
  guardianEmail?: string;
  /** Specific approvals the guardian has given. */
  allowPublicProfile: boolean;
  allowOutreach: boolean;
  allowContactDisplay: boolean;
  grantedAt?: string | null;
}

export interface VerificationRequest {
  id: string;
  /** What is being asked to verify: a metric id, film id, or "profile". */
  targetType: 'metric' | 'film' | 'profile';
  targetId: string;
  requestedFrom: string; // coach/trainer name or email
  status: 'pending' | 'verified' | 'declined';
  createdAt: string;
  resolvedAt?: string | null;
}

export interface RecruiterContactSubmission {
  id: string;
  shareLinkId?: string;
  fromName: string;
  fromOrganization?: string;
  fromEmail: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface AbuseReport {
  id: string;
  reason: string;
  details?: string;
  targetType: 'profile' | 'film' | 'message' | 'other';
  targetId?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string; // e.g. "share_link.create", "profile.publish", "link.revoke"
  detail?: string;
  at: string;
}

// ── Store shape ──────────────────────────────────────────────

export interface RecruitingState {
  profile: RecruitingProfile | null;
  film: FilmAsset[];
  clips: Clip[];
  reels: HighlightReel[];
  metrics: PlayerMetric[];
  coachNotes: CoachNote[];
  summaries: AIPlayerSummary[];
  shareLinks: ShareLink[];
  contacts: OutreachContact[];
  messages: OutreachMessage[];
  engagement: EngagementEvent[];
  guardianConsent: GuardianConsent;
  verifications: VerificationRequest[];
  contactSubmissions: RecruiterContactSubmission[];
  abuseReports: AbuseReport[];
  auditLog: AuditLogEntry[];
  /** True once the athlete has completed the onboarding wizard. */
  onboarded: boolean;
}

export const DEFAULT_GUARDIAN_CONSENT: GuardianConsent = {
  granted: false,
  allowPublicProfile: false,
  allowOutreach: false,
  allowContactDisplay: false,
  grantedAt: null,
};

export const DEFAULT_RECRUITING_STATE: RecruitingState = {
  profile: null,
  film: [],
  clips: [],
  reels: [],
  metrics: [],
  coachNotes: [],
  summaries: [],
  shareLinks: [],
  contacts: [],
  messages: [],
  engagement: [],
  guardianConsent: DEFAULT_GUARDIAN_CONSENT,
  verifications: [],
  contactSubmissions: [],
  abuseReports: [],
  auditLog: [],
  onboarded: false,
};

/** Sensible default permissions for a freshly-created share link. */
export const DEFAULT_SHARE_PERMISSIONS: ShareLinkPermissions = {
  canView: true,
  canDownloadPacket: true,
  canContact: true,
  showVideo: true,
  showData: true,
  showContactInfo: false, // contact masked by default — safest for minors
};

// ── Strength tiers ───────────────────────────────────────────

export type StrengthTier = 'incomplete' | 'basic' | 'recruitable' | 'strong' | 'elite';

export const STRENGTH_TIER_LABEL: Record<StrengthTier, string> = {
  incomplete: 'Incomplete',
  basic: 'Basic',
  recruitable: 'Recruitable',
  strong: 'Strong',
  elite: 'Elite Presentation',
};
