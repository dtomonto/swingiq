// ============================================================
// SwingVantage Milestones — Authority Impact Score (PURE / deterministic)
// ------------------------------------------------------------
// Scores how much SEO/AEO/GEO authority a milestone PAGE would add (0–100),
// with a transparent factor breakdown. Admin-only signal that drives "publish
// vs do-not-publish-yet" guidance. PURE: feed a definition, get a score.
// ============================================================

import type { AuthorityBand, AuthorityScore, MilestoneCategory, MilestoneDefinition } from './types';

/** Search-demand / topical weight by category. */
const CATEGORY_WEIGHT: Record<MilestoneCategory, number> = {
  'Swing Analysis': 22,
  'Sport Coverage': 22,
  'Education and Guides': 20,
  'Search and Authority': 18,
  'Retesting and Improvement': 16,
  'Coaching Intelligence': 15,
  'Practice Plans': 14,
  'Trust and Privacy': 14,
  'Platform Growth': 10,
  'Product Development': 9,
  'User Success': 9,
  'Global Access': 9,
  'Technical Performance': 7,
  'Community Signals': 8,
  'Admin and Operations': 5,
};

export function authorityBand(value: number): AuthorityBand {
  if (value >= 90) return 'strategic';
  if (value >= 75) return 'high_value';
  if (value >= 50) return 'supporting';
  if (value >= 25) return 'low_priority';
  return 'do_not_publish';
}

/** Compute the Authority Impact Score for a milestone definition. PURE. */
export function computeAuthorityScore(def: MilestoneDefinition): AuthorityScore {
  const factors: { label: string; delta: number }[] = [];
  const push = (label: string, delta: number) => { if (delta !== 0) factors.push({ label, delta }); };

  push('Base', 38);
  push(`Category demand: ${def.category}`, CATEGORY_WEIGHT[def.category]);

  if (def.relatedSport) push(`Sport-specific topical authority (${def.relatedSport})`, 10);
  if (def.relatedFeature) push(`Anchored to a feature (${def.relatedFeature})`, 6);
  if ((def.relatedPages?.length ?? 0) > 0) push('Has internal-link seeds', 6);
  if (def.relatedPersona) push(`Persona relevance (${def.relatedPersona})`, 4);

  // "First X" milestones make strong educational hooks; giant vanity counts less.
  if (def.trigger.value <= 1) push('Unique "first" educational angle', 8);
  if (def.trigger.value >= 10000) push('Large vanity number — thinner angle', -8);

  if (def.category === 'Trust and Privacy') push('Trust/credibility value', 6);
  if (def.trigger.type === 'admin_manual') push('Harder to verify (admin-attested)', -5);
  if (def.trigger.type === 'feature_flag') push('Product-capability proof', 3);

  const value = Math.max(0, Math.min(100, factors.reduce((s, f) => s + f.delta, 0)));
  return { value, band: authorityBand(value), factors };
}
