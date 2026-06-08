// ============================================================
// CentralIntelligenceOS — Coach Mix: Concept Extraction
// ------------------------------------------------------------
// Turn an APPROVED LearningSource into structured, reviewable
// LearnedConcept objects — PRINCIPLES, not copied content.
//
// HONEST BY DESIGN (keyless-first): the deterministic extractor
// structures the admin's OWN tagged metadata + notes into learning
// objects. It never scrapes or reproduces the source. An optional AI
// seam can expand this later, but it is OFF by default and may only
// re-word — never invent claims or copy phrasing.
//
// Everything produced starts `reviewStatus: 'pending'`. Nothing here
// influences the product until an admin approves it.
// ============================================================

import type { ConceptType, IpRiskLevel, LearnedConcept, LearningSource } from './types';

let _seq = 0;
function conceptId(sourceId: string): string {
  _seq += 1;
  return `concept_${sourceId}_${_seq}`;
}

/** A source must be genuinely cleared before a single concept is extracted. */
export function canLearnFrom(source: LearningSource): boolean {
  if (!source.approvedForLearning) return false;
  if (source.permissionStatus === 'restricted') return false;
  if (source.permissionStatus === 'unknown') return false;
  if (source.copyrightStatus === 'restricted') return false;
  return true;
}

/** Conservative IP-risk grade from the source's nature + permissions. */
function ipRiskFor(source: LearningSource): IpRiskLevel {
  if (source.type === 'public_social_post') return 'high';
  if (source.copyrightStatus === 'attribution_required') return 'high';
  if (source.type === 'public_article' || source.type === 'public_educational_video') {
    return 'medium';
  }
  // admin notes, internal, licensed, partnership, user practice notes
  return 'low';
}

/** Conservative confidence from how directly-owned the source is. */
function baseConfidence(source: LearningSource): number {
  switch (source.type) {
    case 'internal_swingvantage':
    case 'admin_notes':
    case 'official_partnership':
      return 0.7;
    case 'licensed_material':
    case 'user_practice_notes':
      return 0.55;
    default:
      return 0.4; // public-derived: deliberately low, needs human read
  }
}

/** One candidate concept built from a tagged field of the source. */
function makeConcept(
  source: LearningSource,
  type: ConceptType,
  summary: string,
  suggestedRewrite: string,
  extra: Partial<Pick<LearnedConcept, 'suggestedDrillConnection' | 'suggestedFaultId'>> = {},
): LearnedConcept {
  return {
    id: conceptId(source.id),
    coachProfileId: source.coachProfileId,
    sourceId: source.id,
    type,
    summary,
    suggestedRewrite,
    confidence: baseConfidence(source),
    ipRisk: ipRiskFor(source),
    reviewStatus: 'pending',
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

/**
 * Extract reviewable concepts from an approved source. Returns `[]` for any
 * source that is not cleared to learn from. Deterministic in content (ids and
 * timestamps aside): same tagged metadata → same concepts.
 */
export function extractConcepts(source: LearningSource): LearnedConcept[] {
  if (!canLearnFrom(source)) return [];

  const concepts: LearnedConcept[] = [];
  const topic = source.topic.trim();

  if (source.techniqueCategory) {
    const tc = source.techniqueCategory.trim();
    concepts.push(
      makeConcept(
        source,
        'technique_principle',
        `Emphasizes ${tc} as a teaching priority.`,
        `SwingVantage framing: when working ${topic || 'this area'}, prioritize ${tc} — explained in plain language and tied to the player's own data.`,
      ),
    );
  }

  if (source.drillCategory) {
    const dc = source.drillCategory.trim();
    concepts.push(
      makeConcept(
        source,
        'drill_concept',
        `Uses ${dc} drills to develop the target motion.`,
        `Original SwingVantage drill direction in the "${dc}" family: a clear objective, a simple setup, a focused rep count, a success check, and an honest retest.`,
        { suggestedDrillConnection: dc },
      ),
    );
  }

  if (topic) {
    concepts.push(
      makeConcept(
        source,
        'movement_pattern',
        `Associates "${topic}" with a recognizable movement tendency.`,
        `SwingVantage will describe the "${topic}" tendency in its own words and connect it to the player's diagnosed pattern.`,
      ),
    );
  }

  // Admin's own notes become a single reviewable note-derived principle.
  if (source.notes && source.notes.trim().length > 0) {
    concepts.push(
      makeConcept(
        source,
        'player_cue',
        'Admin-provided coaching note captured for review.',
        'SwingVantage will turn the approved note into an original player cue — never the source wording verbatim.',
      ),
    );
  }

  return concepts;
}

/** Extract across many sources at once (skips any that are not cleared). */
export function extractConceptsForSources(sources: LearningSource[]): LearnedConcept[] {
  return sources.flatMap(extractConcepts);
}
