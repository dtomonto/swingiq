// ============================================================
// SwingVantage — Video Studio: App Surface Catalogue
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This is the "map" of the product that the opportunity engine walks
//   to decide WHERE a video would help. Each entry is a real page/zone
//   (a "surface") plus a few honest TRAITS about it — how complex it is,
//   where it sits in the funnel, whether it's public (SEO), whether it's
//   a first-run/empty/error/decision/trust moment, and so on.
//
//   The engine turns those traits into the 13 opportunity signals
//   (see scoring.ts) — so we never hand-wave 13 numbers per page; we
//   describe each surface truthfully once and derive the scores. Add a
//   surface here and the scanner picks it up automatically.
//
// Keep this list aligned with the real routes in app/(app), app/(marketing),
// and app/admin. Routes that already have a tutorial video are detected at
// scan time (lib/tutorial) and marked `alreadyCovered` — they're not hidden,
// just deprioritised.
// ============================================================

import type {
  VideoType,
  StudioAudience,
  StudioSport,
  JourneyStage,
} from './types';

/** A funnel position, used to weight conversion/retention signals. */
export type FunnelStage = 'top' | 'mid' | 'bottom' | 'activation' | 'retention' | 'internal';

export type Level = 'low' | 'medium' | 'high';

/**
 * Honest, intrinsic facts about a surface. The engine maps these to the
 * 13 opportunity signals — see scoring.ts `deriveSignals`.
 */
export interface SurfaceTraits {
  /** How hard the feature is to understand on first contact. */
  complexity: Level;
  funnelStage: FunnelStage;
  /** Publicly indexable page → SEO/AEO opportunity. */
  isPublic: boolean;
  /** A first-run / onboarding moment. */
  firstRun: boolean;
  /** Data/insight heavy → benefits from visual walkthrough. */
  dataHeavy: boolean;
  /** Generates repetitive "how do I…" support questions. */
  supportHot: boolean;
  /** A trust / safety / privacy moment. */
  trustMoment: boolean;
  /** A pricing / upgrade / decision moment. */
  decisionMoment: boolean;
  /** Users frequently hit errors / get stuck here. */
  errorProne: boolean;
  /** Content differs meaningfully per sport. */
  sportSpecific: boolean;
  /** Often shown with no data yet (empty state). */
  emptyStateProne: boolean;
  /** A re-engagement / come-back moment. */
  retentionMoment: boolean;
}

export interface AppSurface {
  /** Stable id, e.g. 'home-hero'. */
  id: string;
  /** Route the surface lives on. */
  page: string;
  /** The component/zone within the page (human description). */
  zone: string;
  label: string;
  description: string;
  /** The best-fit video type for this surface. */
  recommendedType: VideoType;
  audience: StudioAudience;
  sport: StudioSport | 'all';
  journeyStage: JourneyStage;
  traits: SurfaceTraits;
}

/** Trait preset helpers keep the catalogue terse and consistent. */
function traits(overrides: Partial<SurfaceTraits>): SurfaceTraits {
  return {
    complexity: 'medium',
    funnelStage: 'mid',
    isPublic: false,
    firstRun: false,
    dataHeavy: false,
    supportHot: false,
    trustMoment: false,
    decisionMoment: false,
    errorProne: false,
    sportSpecific: false,
    emptyStateProne: false,
    retentionMoment: false,
    ...overrides,
  };
}

export const APP_SURFACES: AppSurface[] = [
  // ── Marketing / discovery (public, top-of-funnel, SEO) ──────
  {
    id: 'home-hero',
    page: '/',
    zone: 'Marketing homepage hero, under the primary CTAs',
    label: 'Homepage hero explainer',
    description: 'First 60 seconds: what SwingVantage is and how it turns a swing into a fix.',
    recommendedType: 'hero_explainer',
    audience: 'all',
    sport: 'all',
    journeyStage: 'discover',
    traits: traits({ complexity: 'high', funnelStage: 'top', isPublic: true, trustMoment: true }),
  },
  {
    id: 'pricing-decision',
    page: '/pricing',
    zone: 'Pricing page, beside the plan comparison',
    label: 'What you get (free vs Pro)',
    description: 'Clarifies that core analysis is free and what an upgrade adds.',
    recommendedType: 'conversion_upgrade',
    audience: 'all',
    sport: 'all',
    journeyStage: 'convert',
    traits: traits({ funnelStage: 'bottom', isPublic: true, decisionMoment: true }),
  },
  {
    id: 'how-it-works',
    page: '/how-it-works',
    zone: 'How-it-works explainer page',
    label: 'The 3-step method',
    description: 'Analyze → learn → practice → improve, shown end-to-end.',
    recommendedType: 'product_tour',
    audience: 'all',
    sport: 'all',
    journeyStage: 'discover',
    traits: traits({ complexity: 'high', funnelStage: 'top', isPublic: true, dataHeavy: true }),
  },

  // ── Onboarding / activation ─────────────────────────────────
  {
    id: 'start-onboarding',
    page: '/start',
    zone: 'Start Here onboarding flow, step 1',
    label: 'Set up in 2 minutes',
    description: 'Walks a new user through picking a sport and getting a first result.',
    recommendedType: 'onboarding_walkthrough',
    audience: 'all',
    sport: 'all',
    journeyStage: 'onboard',
    traits: traits({ funnelStage: 'activation', firstRun: true, supportHot: true }),
  },
  {
    id: 'dashboard-firstrun',
    page: '/dashboard',
    zone: 'Today dashboard, first-run helper card',
    label: 'Your Today dashboard tour',
    description: 'Orients a new user to focus, recent sessions, and next action.',
    recommendedType: 'product_tour',
    audience: 'all',
    sport: 'all',
    journeyStage: 'onboard',
    traits: traits({ funnelStage: 'activation', firstRun: true, dataHeavy: true }),
  },

  // ── Capture (the core "do the thing" moment) ────────────────
  {
    id: 'upload-record',
    page: '/video',
    zone: 'Swing analyzer upload step, beside the recording guide',
    label: 'How to record a swing the AI can read',
    description: 'Camera angle, framing, and lighting that earn a confident analysis.',
    recommendedType: 'feature_tutorial',
    audience: 'all',
    sport: 'all',
    journeyStage: 'capture',
    traits: traits({ complexity: 'high', funnelStage: 'activation', supportHot: true, errorProne: true, sportSpecific: true }),
  },
  {
    id: 'upload-error',
    page: '/video',
    zone: 'Swing analyzer upload error state',
    label: 'Fix common upload problems',
    description: 'Angle, file size, and lighting issues — and how to solve them.',
    recommendedType: 'error_resolution',
    audience: 'all',
    sport: 'all',
    journeyStage: 'recover',
    traits: traits({ funnelStage: 'activation', errorProne: true, supportHot: true, emptyStateProne: true }),
  },
  {
    id: 'import-image',
    page: '/sessions/import/image',
    zone: 'Photo-of-screen import step',
    label: 'Snap a photo of your numbers',
    description: 'How to photograph a launch-monitor screen so it reads accurately.',
    recommendedType: 'feature_tutorial',
    audience: 'athlete',
    sport: 'golf',
    journeyStage: 'capture',
    traits: traits({ complexity: 'medium', supportHot: true, errorProne: true }),
  },

  // ── Understand (read the AI result — trust + education) ──────
  {
    id: 'results-read',
    page: '/video',
    zone: 'Swing analyzer results, above the transparency panel',
    label: 'How to read your analysis',
    description: 'What scores, confidence, and "estimate" actually mean, and what to do next.',
    recommendedType: 'results_explainer',
    audience: 'all',
    sport: 'all',
    journeyStage: 'understand',
    traits: traits({ complexity: 'high', dataHeavy: true, trustMoment: true, supportHot: true }),
  },
  {
    id: 'diagnose-read',
    page: '/diagnose',
    zone: 'Diagnosis results, top of the issues list',
    label: 'Reading your diagnosis',
    description: 'Severity, confidence, and how to pick the first thing to fix.',
    recommendedType: 'results_explainer',
    audience: 'athlete',
    sport: 'all',
    journeyStage: 'understand',
    traits: traits({ complexity: 'high', dataHeavy: true }),
  },
  {
    id: 'motion-lab-intro',
    page: '/motion-lab',
    zone: 'Motion Lab landing, first visit',
    label: 'Motion Lab: 3D analysis',
    description: 'What browser-side 3D motion capture shows and how to use it.',
    recommendedType: 'feature_tutorial',
    audience: 'athlete',
    sport: 'all',
    journeyStage: 'understand',
    // Motion Lab is a differentiating, complex, data-heavy capability.
    traits: traits({ complexity: 'high', dataHeavy: true }),
  },

  // ── Improve (practice) ──────────────────────────────────────
  {
    id: 'drills-empty',
    page: '/drills',
    zone: 'Drill library empty state',
    label: 'Practice with purpose',
    description: 'Turn your top fix into a focused, doable practice plan.',
    recommendedType: 'empty_state',
    audience: 'all',
    sport: 'all',
    journeyStage: 'improve',
    traits: traits({ emptyStateProne: true, sportSpecific: true }),
  },
  {
    id: 'fix-today',
    page: '/fix',
    zone: "Today's Fix card",
    label: "How Today's Fix works",
    description: 'One small, doable step at a time — why that beats overwhelm.',
    recommendedType: 'feature_tutorial',
    audience: 'all',
    sport: 'all',
    journeyStage: 'improve',
    traits: traits({ retentionMoment: true }),
  },
  {
    id: 'sport-instruction',
    page: '/drills',
    zone: 'Sport-specific drill detail',
    label: 'Sport-specific drill walkthrough',
    description: 'A short, correct demonstration of a key drill for each sport.',
    recommendedType: 'sport_instructional',
    audience: 'athlete',
    sport: 'all',
    journeyStage: 'improve',
    traits: traits({ complexity: 'high', sportSpecific: true, isPublic: true, dataHeavy: true }),
  },

  // ── Track (progress / retention) ────────────────────────────
  {
    id: 'progress-empty',
    page: '/progress',
    zone: 'Progress page empty / first-visit state',
    label: 'How progress tracking works',
    description: 'Trends, comparisons, and streaks that prove improvement.',
    recommendedType: 'empty_state',
    audience: 'all',
    sport: 'all',
    journeyStage: 'track',
    traits: traits({ emptyStateProne: true, dataHeavy: true, retentionMoment: true }),
  },
  {
    id: 'player-arc',
    page: '/arc',
    zone: 'Player Arc story header',
    label: 'Your improvement story',
    description: 'How SwingVantage turns sessions into a motivating narrative.',
    recommendedType: 're_engagement',
    audience: 'all',
    sport: 'all',
    journeyStage: 'retain',
    traits: traits({ retentionMoment: true, dataHeavy: true }),
  },

  // ── Trust & safety ──────────────────────────────────────────
  {
    id: 'privacy-trust',
    page: '/privacy',
    zone: 'Privacy & data page, top',
    label: 'Your data, explained',
    description: 'Plain-language account sync, privacy, and youth protections.',
    recommendedType: 'trust_safety',
    audience: 'all',
    sport: 'all',
    journeyStage: 'convert',
    traits: traits({ isPublic: true, trustMoment: true }),
  },
  {
    id: 'parent-safety',
    page: '/parents',
    zone: 'Parent safety hub',
    label: 'A safe space for young athletes',
    description: 'How SwingVantage keeps youth practice encouraging and private.',
    recommendedType: 'trust_safety',
    audience: 'parent',
    sport: 'all',
    journeyStage: 'convert',
    traits: traits({ isPublic: true, trustMoment: true }),
  },

  // ── Share / coach ───────────────────────────────────────────
  {
    id: 'reports-howto',
    page: '/reports',
    zone: 'Reports builder, first use',
    label: 'Build a coach-ready report',
    description: 'Turn sessions into a clean summary to share with a coach.',
    recommendedType: 'feature_tutorial',
    audience: 'coach',
    sport: 'all',
    journeyStage: 'improve',
    traits: traits({ complexity: 'medium', dataHeavy: true }),
  },

  // ── Account / data ──────────────────────────────────────────
  {
    id: 'data-backup',
    page: '/data',
    zone: 'Data center, backup & restore',
    label: 'Back up & protect your data',
    description: 'Keep progress safe and move it between devices.',
    recommendedType: 'help_center',
    audience: 'all',
    sport: 'all',
    journeyStage: 'track',
    traits: traits({ supportHot: true, trustMoment: true }),
  },

  // ── Internal / admin ────────────────────────────────────────
  {
    id: 'admin-growth-training',
    page: '/admin/growth',
    zone: 'GrowthOS admin onboarding',
    label: 'Operating GrowthOS (internal)',
    description: 'Internal training for the marketing OS — not user-facing.',
    recommendedType: 'admin_training',
    audience: 'team',
    sport: 'all',
    journeyStage: 'onboard',
    traits: traits({ funnelStage: 'internal', complexity: 'high', dataHeavy: true }),
  },
];

const SURFACE_BY_ID: Record<string, AppSurface> = Object.fromEntries(
  APP_SURFACES.map((s) => [s.id, s]),
);

export function getSurface(id: string): AppSurface | undefined {
  return SURFACE_BY_ID[id];
}
