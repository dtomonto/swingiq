// ============================================================
// SwingVantage — Diagnosis → Skill-Tree focus mapping
// ------------------------------------------------------------
// Bridges the deterministic diagnosis engine to the Athletic Journey skill tree:
// maps the athlete's current likely cause onto the ClassificationCategory it most
// develops, so the skill tree can flag the branch(es) tied to their current
// focus. Pure + side-effect-free; keyword-driven over the fault's drill families
// and name, with an honest 'technique' default (most swing/contact faults).
// ============================================================

import type { DeterministicDiagnosis } from '@/lib/intelligence/diagnose-types';
import type { ClassificationCategory } from './types';

interface CategoryRule {
  category: ClassificationCategory;
  /** Any keyword match (in drill families + fault name) selects this category. */
  keywords: string[];
}

// Ordered by specificity — the first matching rule wins, so movement/finesse/
// mental beat the broad 'technique' fallback.
const RULES: CategoryRule[] = [
  { category: 'movement', keywords: ['footwork', 'recovery', 'split step', 'movement', 'spacing', 'positioning', 'balance'] },
  { category: 'finesse', keywords: ['serve', 'short game', 'putting', 'touch', 'dink', 'soft hands', 'launch', 'spin'] },
  { category: 'mental', keywords: ['pressure', 'routine', 'reset', 'breathing', 'decision', 'selection'] },
  { category: 'tactical', keywords: ['shot selection', 'tactic', 'court positioning', 'oppo', 'opposite-field'] },
  { category: 'consistency', keywords: ['consistency', 'dispersion', 'mishit', 'off-center', 'timing', 'tempo', 'contact'] },
];

/**
 * The journey skill category a diagnosis most develops. Defaults to 'technique'
 * (the home of swing/stroke mechanics) when nothing more specific matches.
 */
export function diagnosisToSkillCategory(diagnosis: DeterministicDiagnosis): ClassificationCategory {
  const hay = [diagnosis.primary.name, ...diagnosis.primary.drillFamilies].join(' ').toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => hay.includes(k))) return rule.category;
  }
  return 'technique';
}
