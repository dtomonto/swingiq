// ============================================================
// CentralIntelligenceOS — Coach Mix: Configuration + Ethical Guarantees
// ------------------------------------------------------------
// The Coach Mix Learning Engine studies ADMIN-APPROVED coaching
// sources and converts them into ORIGINAL SwingVantage instructional
// frameworks. It never copies, clones, impersonates, or reproduces a
// coach's content.
//
// This file is the single place the ethical rules, the required
// disclaimer, the IP-risk vocabulary, the style vocabulary, and the
// blend math live — so they never drift across the engine, the admin
// command center, the recommendation layer, and the tests.
//
// DESIGN (mirrors CentralIntelligenceOS): keyless-first, local-first,
// deterministic. Everything here is a plain constant with no secrets
// and no DOM. AI is an OPTIONAL re-wording seam, never a requirement
// and never a source of new "facts".
// ============================================================

/**
 * The mandatory disclaimer that must accompany EVERY coach-inspired
 * profile, everywhere it surfaces. Verbatim and centralized so the
 * legal language can be reviewed in exactly one place.
 */
export const COACH_MIX_DISCLAIMER =
  'This profile is an internal SwingVantage teaching-influence framework based on ' +
  'admin-approved learning sources and generalized coaching principles. It is not ' +
  'affiliated with, endorsed by, or representative of the named coach unless an ' +
  'official partnership is documented.';

/**
 * The non-negotiable ethical rules of the Coach Mix engine. Surfaced in
 * the admin command center and asserted by the test-suite, so the
 * product's promises and its code can never silently diverge.
 */
export const COACH_MIX_ETHICS = {
  neverCopy: 'Never copy a coach’s content.',
  neverImpersonate: 'Never impersonate a coach.',
  neverFakeEndorsement: 'Never claim endorsement without a documented partnership.',
  neverRecreateLikeness: 'Never recreate a coach’s likeness, voice, or branded presentation.',
  approvalGated: 'Never let source-derived concepts influence the product without admin approval.',
  neverScrapeRestricted: 'Never scrape restricted content or bypass platform terms of service.',
  neverExposeUnfinished: 'Never expose unfinished coaching profiles to users.',
  namesAdminGated: 'Never show coach names to users unless an admin explicitly enables it.',
  preferOriginal: 'Always prefer original SwingVantage explanations, drills, and videos.',
  principlesNotContent: 'Learn high-level principles, structure, and tendencies — never exact phrasing or proprietary terminology.',
} as const;

/**
 * Accepted source material types. A source must be one of these AND carry
 * an explicit permission + copyright status before it can be learned from.
 */
export const SOURCE_TYPES = [
  'public_educational_video',
  'public_article',
  'public_social_post',
  'admin_notes',
  'licensed_material',
  'internal_swingvantage',
  'user_practice_notes',
  'official_partnership',
] as const;

/** Human labels for source types (admin UI). */
export const SOURCE_TYPE_LABELS: Record<(typeof SOURCE_TYPES)[number], string> = {
  public_educational_video: 'Public educational video link',
  public_article: 'Public article',
  public_social_post: 'Public social post link',
  admin_notes: 'Admin-written notes',
  licensed_material: 'Licensed instructional material',
  internal_swingvantage: 'Internal SwingVantage content',
  user_practice_notes: 'User-created practice notes',
  official_partnership: 'Official coach partnership material',
};

/**
 * IP-risk vocabulary. Every learned concept is graded so the admin can
 * triage review. `high` concepts are blocked from influencing anything
 * until an admin explicitly approves an original rewrite.
 */
export const IP_RISK_LEVELS = ['low', 'medium', 'high'] as const;

/**
 * The categories of structured knowledge the engine extracts. These are
 * PRINCIPLES and RELATIONSHIPS, never copied phrasing.
 */
export const CONCEPT_TYPES = [
  'technique_principle',
  'drill_concept',
  'skill_progression',
  'movement_pattern',
  'setup_preference',
  'swing_model_trait',
  'practice_structure',
  'checkpoint',
  'fault_to_fix',
  'player_cue',
  'retest_method',
  'development_pathway',
] as const;

/** Review states for a learned concept (admin review queue). */
export const REVIEW_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'archived',
  'needs_source_review',
] as const;

/** Who may see a coach profile / mix. Default for anything new is admin-only. */
export const VISIBILITY_LEVELS = ['admin_only', 'beta', 'user_visible'] as const;

/**
 * Neutral, user-safe style tags. These are what a user can ever see by
 * default — NEVER a coach's real name (that requires explicit admin opt-in
 * per `COACH_MIX_ETHICS.namesAdminGated`).
 */
export const STYLE_TAGS = [
  'Technical Precision',
  'Athletic Rotation',
  'Structured Fundamentals',
  'Feel-Based Simplicity',
  'Data-Driven Performance',
  'SwingVantage Blend',
] as const;

/**
 * How a coach label is shown to USERS, chosen by the admin per surface.
 * Default is the safest option (`style_only`).
 */
export const USER_LABEL_MODES = [
  'style_only', // e.g. "Athletic Rotation" — the safe default
  'coach_inspired', // e.g. "Inspired by an athletic, rotational model"
  'full_mix', // the full blend breakdown
  'none', // no coaching-influence label at all
] as const;

export const DEFAULT_USER_LABEL_MODE = 'style_only' as const;

// ── Blend math ──────────────────────────────────────────────

/** The stable id of the always-available, fully-original house model. */
export const SWINGVANTAGE_DEFAULT_COACH_ID = 'swingvantage-default';

/**
 * A mix's weights are normalized to sum to 100. If the admin's explicit
 * coach weights total less than 100, the remainder is automatically
 * assigned to the SwingVantage default model — so the house voice is
 * always the floor, never overridden to zero by accident.
 */
export const MIX_TOTAL_WEIGHT = 100;

/** Smallest meaningful influence weight (below this, a coach is effectively off). */
export const MIN_INFLUENCE_WEIGHT = 5;

/**
 * Feature flag for the USER-FACING "Curated Swing Drills for Your Current
 * Game" module. OFF by default — the whole system stays admin-only until
 * the owner deliberately turns it on (keyless-first, like every other
 * optional capability). Client-safe (NEXT_PUBLIC_*).
 */
export const COACH_MIX_USER_MODULE_FLAG = 'NEXT_PUBLIC_COACH_MIX_USER_MODULE';

export function isCoachMixUserModuleEnabled(): boolean {
  const v = (process.env[COACH_MIX_USER_MODULE_FLAG] ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}

/** Max drills a user-facing recommendation should ever surface (don't overwhelm). */
export const MAX_USER_DRILLS = 5;
