// ============================================================
// SwingVantage — Development Roadmap (admin-facing content model)
// ------------------------------------------------------------
// The single source of truth for the "Features & Technologies in
// Development" page at /admin/development. It explains, in polished
// product language, what SwingVantage is building — and is HONEST
// about what exists today vs. what is still planned, so the page can
// never over-promise.
//
// This is pure, server-safe data (no DOM, no secrets). The disclaimer
// for coach-inspired work is imported from the Coach Mix engine so the
// legal language lives in exactly one place.
// ============================================================

import { COACH_MIX_DISCLAIMER } from '@/lib/central-intelligence/coach-mix/config';

/** How far along an initiative is — drives the status chip + honesty. */
export type RoadmapStatus = 'live' | 'in_development' | 'planned';

export const ROADMAP_STATUS_LABEL: Record<RoadmapStatus, string> = {
  live: 'Live',
  in_development: 'In development',
  planned: 'Planned',
};

export interface RoadmapSection {
  /** Stable id (used as the anchor + test key). */
  id: string;
  /** The A–H letter from the product brief, for scannability. */
  letter: string;
  title: string;
  status: RoadmapStatus;
  /** One-line hook shown under the title. */
  tagline: string;
  /** Polished product-language explanation of the initiative. */
  whatItIs: string;
  /** The concrete capabilities the initiative delivers. */
  capabilities: string[];
  /** HONEST note on what actually exists in the product right now. */
  todayStatus: string;
  /** Optional deep-link to the admin tool that already powers this. */
  relatedAdminHref?: string;
  relatedAdminLabel?: string;
  /** Ethics/IP guarantees (used by the coach-inspired section). */
  ethics?: string[];
}

/**
 * The six feature flags this initiative introduces. Kept here for the
 * page + tests; the operator-facing definitions live in lib/admin/flags.ts
 * (a test asserts the two lists never drift).
 */
export const COACHING_INTELLIGENCE_FLAGS = [
  'coaching_intelligence_enabled',
  'admin_coach_strategy_lab_enabled',
  'curated_drills_widget_enabled',
  'ai_video_learning_pipeline_enabled',
  'development_roadmap_visible_to_admin',
  'development_roadmap_visible_to_public',
] as const;

export type CoachingIntelligenceFlag = (typeof COACHING_INTELLIGENCE_FLAGS)[number];

/** The verbatim coach-inspired disclaimer, re-exported for the page. */
export const ROADMAP_COACH_DISCLAIMER = COACH_MIX_DISCLAIMER;

export const ROADMAP_SECTIONS: RoadmapSection[] = [
  {
    id: 'ai-swing-diagnostics',
    letter: 'A',
    title: 'AI Swing Diagnostics',
    status: 'live',
    tagline: 'Find the one fix that matters most — then prescribe the drill for it.',
    whatItIs:
      'SwingVantage analyzes a swing, identifies the key issues, and prioritizes the single ' +
      'highest-impact fix instead of overwhelming the athlete with a list. Each diagnosis ' +
      'connects to a recommended drill and an honest confidence label.',
    capabilities: [
      'Prioritized diagnosis — the #1 fix first, not a wall of faults',
      'Plain-English confidence (rules-based vs. measured) on every call',
      'Each issue links to a drill and a retest, closing the loop',
    ],
    todayStatus:
      'Live today through video analysis, the Fix Stack / DrillMatch loop, and the athlete ' +
      'priority engine. This roadmap layer makes the prioritization the centre of coaching.',
    relatedAdminHref: '/admin/ai-analyses',
    relatedAdminLabel: 'AI Analyses',
  },
  {
    id: 'coaching-intelligence-system',
    letter: 'B',
    title: 'Coaching Intelligence System',
    status: 'in_development',
    tagline: 'A teaching-strategy layer the admin controls and the athlete can choose.',
    whatItIs:
      'A coaching-strategy layer that adapts HOW SwingVantage teaches — tone, technical depth, ' +
      'drill selection, practice progression — based on teaching philosophy, the athlete’s ' +
      'preferences, skill level, sport, and performance data. Admins configure it; athletes ' +
      'will eventually pick the style that fits them.',
    capabilities: [
      'Admin-controlled teaching strategy that biases drills and explanations',
      'Adjusts tone and technical depth to the athlete and skill level',
      'Built on original SwingVantage frameworks — never copied content',
    ],
    todayStatus:
      'In development and admin-only: the Coach Mix engine resolves a weighted blend of ' +
      'teaching models into a strategy that biases DrillMatch. Athlete-facing style selection ' +
      'is gated off until approved.',
    relatedAdminHref: '/admin/coach-mix',
    relatedAdminLabel: 'Coach Mix',
  },
  {
    id: 'coach-inspired-teaching-styles',
    letter: 'C',
    title: 'Coach-Inspired Teaching Styles',
    status: 'in_development',
    tagline: 'Learn from publicly observable coaching principles — ethically, with attribution.',
    whatItIs:
      'SwingVantage may use coach-inspired instructional frameworks (e.g. a structured ' +
      'fundamentals model, a technical-precision model, an athletic-rotational model). These are ' +
      'high-level, generalized teaching tendencies — labelled “inspired by public teaching ' +
      'principles,” never a replica of any coach’s proprietary content.',
    capabilities: [
      'Original frameworks built from generalized, publicly observable principles',
      'A neutral style tag is shown to athletes — coach names stay admin-only',
      'Every profile carries a mandatory non-affiliation disclaimer',
    ],
    todayStatus:
      'In development and admin-only. Seed profiles exist in Coach Mix, each flagged ' +
      '“needs review” until an admin approves its sources. Nothing influences athletes yet.',
    relatedAdminHref: '/admin/coach-mix',
    relatedAdminLabel: 'Coach Mix',
    ethics: [
      'Does not impersonate any coach or claim endorsement',
      'Does not copy proprietary, paid, or copyrighted content',
      'Uses only admin-approved, attributed, legally allowable sources',
      'Labels styles as “inspired by public teaching principles,” not replicas',
    ],
  },
  {
    id: 'ai-drill-video-learning',
    letter: 'D',
    title: 'AI Drill & Video Learning System',
    status: 'in_development',
    tagline: 'Turn approved sources and real athlete needs into better drills and tutorials.',
    whatItIs:
      'A system that learns from admin-approved sources, athlete needs, and trend analysis to ' +
      'design better drills, tutorials, and future video concepts — always as original ' +
      'SwingVantage content, and always behind an admin approval gate before anything publishes.',
    capabilities: [
      'Approved source → extracted PRINCIPLE → admin review queue (nothing auto-publishes)',
      'Citations and IP-risk grading kept for every learned concept',
      'Future video/tutorial concepts drafted from gaps and athlete demand',
    ],
    todayStatus:
      'The learning-source registry, the extraction step, and the admin review queue exist in ' +
      'Coach Mix today. The video-concept generator and trend-driven briefs are planned next.',
    relatedAdminHref: '/admin/coach-mix',
    relatedAdminLabel: 'Coach Mix',
  },
  {
    id: 'curated-swing-drills',
    letter: 'E',
    title: 'Curated Swing Drills for Your Current Game',
    status: 'in_development',
    tagline: 'The right 3–5 drills for the athlete’s actual misses — not a generic list.',
    whatItIs:
      'Each athlete will eventually see a focused set of drills chosen from their most recent ' +
      'diagnosis, recurring miss pattern, uploaded launch-monitor or simulator data, sport, ' +
      'skill level, and chosen coaching style — leading with the single most important fix.',
    capabilities: [
      '3–5 ranked drills with a short “why this was chosen” for each',
      'Start / Save / Not relevant / I tried this / Retest actions',
      'Coaching-style tag and an honest retest recommendation',
    ],
    todayStatus:
      'The widget and its recommendation engine exist behind the NEXT_PUBLIC_COACH_MIX_USER_MODULE ' +
      'switch, OFF by default. It stays invisible to athletes until the owner enables it.',
  },
  {
    id: 'trend-intelligence',
    letter: 'F',
    title: 'Trend Intelligence',
    status: 'planned',
    tagline: 'Privacy-safe, aggregated patterns that tell us what to build next.',
    whatItIs:
      'Aggregated, privacy-safe analysis of which issues athletes struggle with most — by sport, ' +
      'skill level, and miss pattern — so SwingVantage knows which drills and tutorials to create ' +
      'next. Always aggregated, never individual, with a minimum sample size before anything shows.',
    capabilities: [
      'Top athlete problems by week / month / all-time',
      'Content gaps and recommended drills/videos to create',
      'Minimum-sample thresholds with honest “insufficient data” states',
    ],
    todayStatus:
      'Planned. The recommendation and review plumbing it builds on is in place; the aggregation ' +
      'and admin trend panel are the next iteration.',
  },
  {
    id: 'integrations-motion-launch-sim',
    letter: 'G',
    title: '3D Motion, Video, Launch Monitor & Simulator',
    status: 'in_development',
    tagline: 'Bring every data source into one athlete development picture.',
    whatItIs:
      'A forward-looking surface for richer capture and import: browser-side 3D motion analysis, ' +
      'video checkpoints, launch-monitor and simulator imports, swing profiles, and the athletic ' +
      'development journey that ties them together over time.',
    capabilities: [
      'Browser-side 3D motion analysis (Motion Lab)',
      'Launch-monitor / simulator CSV & JSON import with shot-intent classification',
      'Swing profiles and the multi-sport athletic development journey',
    ],
    todayStatus:
      'Mixed: Motion Lab and the universal launch-monitor/simulator importer are live; deeper ' +
      '3D mapping and tighter swing-profile integration are in development.',
    relatedAdminHref: '/admin/sports',
    relatedAdminLabel: 'Sports',
  },
  {
    id: 'privacy-and-ethics',
    letter: 'H',
    title: 'Privacy & Ethics',
    status: 'live',
    tagline: 'Athlete data improves the experience — it is never sold.',
    whatItIs:
      'Athlete data is used to improve the product and personalization, never sold. Any trend ' +
      'analytics are aggregated, privacy-safe, and compliant with applicable privacy requirements. ' +
      'Coaching influence is admin-gated and original by design.',
    capabilities: [
      'Aggregated, privacy-safe analytics — no individual athlete problems exposed',
      'Local-first, keyless-first data handling across the intelligence layer',
      'Admin approval required before any learned content can influence athletes',
    ],
    todayStatus:
      'Live as a design principle across CentralIntelligenceOS and Coach Mix: keyless-first, ' +
      'local-first, admin-gated, with a verbatim non-affiliation disclaimer on coach-inspired work.',
    relatedAdminHref: '/admin/legal',
    relatedAdminLabel: 'Legal & Privacy',
  },
];

/** Roadmap counts by status — drives the summary strip on the page. */
export function roadmapStatusCounts(
  sections: RoadmapSection[] = ROADMAP_SECTIONS,
): Record<RoadmapStatus, number> {
  return sections.reduce(
    (acc, s) => {
      acc[s.status] += 1;
      return acc;
    },
    { live: 0, in_development: 0, planned: 0 } as Record<RoadmapStatus, number>,
  );
}
