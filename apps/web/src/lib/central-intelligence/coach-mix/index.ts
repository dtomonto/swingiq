// ============================================================
// CentralIntelligenceOS — Coach Mix Learning Engine (public barrel)
// ------------------------------------------------------------
// An admin-controlled engine that studies APPROVED coaching sources and
// converts them into ORIGINAL SwingVantage instructional frameworks,
// then blends them into a CoachingStrategy that biases the product's
// drills, diagnostics, and explanations.
//
// Import from '@/lib/central-intelligence/coach-mix'.
//
// Layout:
//   config.ts        — ethics, the required disclaimer, IP-risk, vocab, blend math
//   types.ts         — data model (profiles, sources, concepts, mixes, strategy)
//   seeds.ts         — admin-only seed coach profiles (no copied content)
//   mixing.ts        — weighted mix → resolved CoachingStrategy (pure)
//   recommendations.ts — bias DrillMatch output + build the user recommendation
//   extraction.ts    — approved source → reviewable concepts (nothing auto-published)
//   review-queue.ts  — the admin approval gate (only approved concepts influence)
//
// ETHICS: never copy, impersonate, or imply endorsement; learn principles,
// not content; everything admin-gated; coach names hidden from users unless
// an admin explicitly enables them. See config.ts.
// ============================================================

export * from './config';
export * from './types';
export * from './seeds';
export * from './mixing';
export * from './recommendations';
export * from './extraction';
export * from './review-queue';
export * from './trends';
export * from './video';
