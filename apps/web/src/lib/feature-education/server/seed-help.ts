// ============================================================
// SwingVantage — Feature Education Engine: committed in-app help seed
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   A small, source-controlled set of PUBLISHED in-app help cards that the
//   user-facing <FeatureHelp/> reader shows out of the box — independent of
//   whether Supabase is connected or the in-memory repo has been populated.
//
//   These are evergreen, hand-curated cards (not engine-generated drafts), so
//   they are safe to ship published. Each one is grounded in a real route in
//   the Feature Registry. The reader (publishedInAppHelpForRoute) UNIONS these
//   with whatever the repo has; a repo asset with the same id wins, so the
//   admin pipeline can always override or retire a seeded card later.
//
//   To add a card: append a valid EducationAsset below with type 'in-app-help',
//   status 'published', and an inAppHelp.route that matches a real user route.
// ============================================================

import type { EducationAsset } from '../types';
import GENERATED_SEED from '@/data/feature-education-seed.json';

const ISO = '2026-06-08T00:00:00.000Z';

/** Published, curated in-app help shown by the <FeatureHelp/> reader. */
export const SEEDED_IN_APP_HELP: EducationAsset[] = [
  {
    id: 'feehelp_diagnose_read_results',
    featureId: 'feat_diagnose',
    type: 'in-app-help',
    audience: 'all',
    title: 'How to read your diagnosis',
    slug: 'diagnose-how-to-read',
    summary: 'Orients first-time users on the one-fix-first layout of the diagnosis page.',
    sections: [
      {
        heading: 'What you are looking at',
        body: [
          'Your diagnosis leads with the single fix that matters most, then the drills to groove it and a plan to get there.',
          'Start at the top fix and work down — the order is the priority.',
        ],
      },
    ],
    inAppHelp: {
      route: '/diagnose',
      placement: 'inline',
      headline: 'New here? Start with your top fix.',
      body: 'Your diagnosis is ordered by priority — the first card is the one change that will help your swing the most. Work top-down.',
      learnMoreHref: '/library',
    },
    visibility: 'user',
    status: 'published',
    version: 1,
    generator: 'deterministic',
    groundedIn: [{ kind: 'route', ref: '/diagnose' }],
    needsHumanReview: false,
    publishTarget: 'in-app',
    createdAt: ISO,
    updatedAt: ISO,
  },
];

/**
 * Engine-GENERATED published shipping content for every grounded, confident
 * feature in the registry — an in-app-help card per feature plus a public
 * FAQ + SEO/AEO article for public features. Produced deterministically by
 * `server/seed-build.ts` and committed as `data/feature-education-seed.json`
 * (regenerate with `FEE_BUILD_SEED=1 npx jest build-seed.gen`).
 *
 * Honest by design: only grounded, security-safe, non-needs-review features are
 * here — low-confidence detections and ungrounded features are withheld for
 * human review rather than auto-published.
 */
export const SEEDED_FEATURE_EDUCATION = GENERATED_SEED as unknown as EducationAsset[];

/**
 * All committed, source-controlled PUBLISHED assets (curated cards + generated
 * shipping content). The data layer unions these with repo assets so coverage,
 * gaps, and the in-app reader reflect them out of the box; a repo asset with
 * the same id wins, so the admin pipeline can override or retire any seed.
 */
export const SEEDED_ASSETS: EducationAsset[] = [...SEEDED_IN_APP_HELP, ...SEEDED_FEATURE_EDUCATION];
