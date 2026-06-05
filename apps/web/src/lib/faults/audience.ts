// ============================================================
// SwingVantage — Fault Ontology: Audience Mapping
// ------------------------------------------------------------
// Bridges the app's existing audience signals (CoachingTone and
// the store's UsageCategory) onto the ontology's three explanation
// audiences. Keeps role-aware copy consistent everywhere a fault
// is explained, without duplicating the mapping in each caller.
// ============================================================

import type { CoachingTone } from '@/lib/coaching/tones';
import type { UsageCategory } from '@/store';
import type { FaultAudience } from './types';

/** Map the chosen coaching tone to a fault explanation audience. */
export function audienceFromTone(tone?: CoachingTone | null): FaultAudience {
  switch (tone) {
    case 'parent':
      return 'parent';
    case 'competitive':
      return 'advanced';
    case 'coach':
    case 'team':
      return 'coach';
    case 'beginner':
    default:
      // Beginners get the gentlest, most encouraging framing.
      return 'parent';
  }
}

/**
 * Map the account usage category to a fault explanation audience. Used when
 * a tone has not been chosen — youth and parent/guardian accounts default to
 * the safety-first parent voice; coaches get the coach voice.
 */
export function audienceFromUsageCategory(cat: UsageCategory): FaultAudience {
  switch (cat) {
    case 'coach':
      return 'coach';
    case 'parent_guardian':
    case 'minor_under_13':
    case 'minor_13_17':
      return 'parent';
    case 'adult':
    default:
      return 'advanced';
  }
}
