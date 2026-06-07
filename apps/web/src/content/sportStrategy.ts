// ============================================================
// SwingVantage — Sport Strategy Toggle (DEVELOPER-ONLY)
//
// Single source of truth for how prominent each sport/persona is
// across the public marketing surface. Edited in code by the
// developer and shipped via a normal commit/deploy.
//
// This is intentionally NOT a product feature: there is no admin
// UI, no environment-variable override, and nothing is exposed to
// visitors. One place to look, no runtime control surface.
//
// Tiers:
//   • primary   → gets a homepage persona card (the headline sports)
//                 + nav + footer + sample-switcher tab + sitemap.
//   • secondary → no homepage card; appears as a small
//                 "Also analyze: X →" link + nav/footer; stays indexed.
//   • hidden    → removed from ALL marketing links. The hub page
//                 stays live + indexed by default (keeps SEO); set
//                 `deindex: true` to also drop it from the sitemap.
//
// To re-tier a sport, change one `tier` below and deploy.
// See docs/FIVE_PERSONA_MASTER_PLAN.md §14B.
// ============================================================

export type SportTier = 'primary' | 'secondary' | 'hidden';

export type PersonaId =
  | 'golf'
  | 'baseball'
  | 'slow-pitch'
  | 'fast-pitch'
  | 'softball'
  | 'tennis'
  | 'pickleball'
  | 'padel';

export interface SportStrategyEntry {
  personaId: PersonaId;
  tier: SportTier;
  /** Display order within a tier (ascending). */
  order: number;
  /** Advanced: when `hidden`, also remove from sitemap / add noindex. */
  deindex?: boolean;
}

// ── The toggle (edit here) ───────────────────────────────────
export const SPORT_STRATEGY: SportStrategyEntry[] = [
  { personaId: 'golf', tier: 'primary', order: 1 },
  { personaId: 'baseball', tier: 'primary', order: 2 },
  { personaId: 'slow-pitch', tier: 'primary', order: 3 },
  { personaId: 'fast-pitch', tier: 'primary', order: 4 },
  { personaId: 'softball', tier: 'primary', order: 5 },
  { personaId: 'tennis', tier: 'secondary', order: 6 }, // ← middle ground
  { personaId: 'pickleball', tier: 'primary', order: 7 }, // racket sport — homepage card
  { personaId: 'padel', tier: 'primary', order: 8 }, // racket sport — homepage card
];

function entry(id: PersonaId): SportStrategyEntry | undefined {
  return SPORT_STRATEGY.find((e) => e.personaId === id);
}

/**
 * Effective tier, applying the softball-chooser rule: the generic
 * `softball` chooser is only meaningful when at least one of
 * slow-pitch / fast-pitch is visible. If both are hidden, the
 * chooser is hidden too.
 */
export function effectiveTier(id: PersonaId): SportTier {
  const e = entry(id);
  if (!e) return 'hidden';
  if (id === 'softball') {
    const slow = entry('slow-pitch')?.tier ?? 'hidden';
    const fast = entry('fast-pitch')?.tier ?? 'hidden';
    if (slow === 'hidden' && fast === 'hidden') return 'hidden';
  }
  return e.tier;
}

export function personaIdsByTier(tier: SportTier): PersonaId[] {
  return SPORT_STRATEGY.filter((e) => effectiveTier(e.personaId) === tier)
    .sort((a, b) => a.order - b.order)
    .map((e) => e.personaId);
}

export const primaryPersonaIds = (): PersonaId[] => personaIdsByTier('primary');
export const secondaryPersonaIds = (): PersonaId[] => personaIdsByTier('secondary');

/** True if the persona's pages should appear in the sitemap. */
export function isIndexable(id: PersonaId): boolean {
  const e = entry(id);
  if (!e) return false;
  if (effectiveTier(id) === 'hidden' && e.deindex) return false;
  return true;
}

/**
 * Dev guard — the marketing surface needs at least one primary sport.
 * Called by the unit test (and safe to call anywhere).
 */
export function assertStrategyValid(): void {
  if (personaIdsByTier('primary').length === 0) {
    throw new Error(
      'sportStrategy: at least one persona must have tier "primary".',
    );
  }
}
