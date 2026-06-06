// ============================================================
// SwingVantage — Daily Notes: Fault extraction
// ------------------------------------------------------------
// Turns a free-text daily note ("sliced it off the tee all day and
// topped a couple") into a small set of honestly-labelled faults so
// they can feed the player profile. Two complementary passes:
//
//   1. A casual-language LEXICON — tuned for how players actually
//      write ("shanked", "rolled over", "double fault"), each entry
//      mapped to a curated fault id where one exists.
//   2. The existing fault ONTOLOGY — token/name matching catches the
//      more technical terms ("early extension", "poor separation").
//
// Deterministic and conservative: nothing is invented, every hit is
// traceable to words the user wrote, and low-signal matches are
// dropped. This is NOT AI vision — it is a transparent text match.
// ============================================================

import type { SportId } from '@swingiq/core';
import { getFaultsForSport, matchFaultId } from '@/lib/faults';
import type { ExtractedFault } from './types';

interface LexiconEntry {
  /** Stable id for the tag. Prefer a curated ontology id when it fits. */
  id: string;
  label: string;
  /** Lower-cased phrases/words that signal this fault. */
  keywords: string[];
  /** Sports this entry applies to; omit for all sports. */
  sports?: SportId[];
}

// Hand-tuned for everyday language. Order doesn't matter — scoring decides.
// ids reuse curated ontology ids where one exists so retests/explanations
// light up; otherwise they're honest user-reported tags.
const LEXICON: LexiconEntry[] = [
  // ── Golf ball-flight & strike ──
  { id: 'slice_tendency', label: 'Slice tendency', sports: ['golf'], keywords: ['slice', 'sliced', 'slicing', 'banana', 'cut across', 'big cut', 'left to right too much'] },
  { id: 'hook_tendency', label: 'Hook tendency', sports: ['golf'], keywords: ['hook', 'hooked', 'hooking', 'snap hook', 'duck hook', 'snapped it'] },
  { id: 'pull_tendency', label: 'Pulling shots', sports: ['golf'], keywords: ['pull', 'pulled', 'pulling it', 'yanked'] },
  { id: 'push_tendency', label: 'Pushing shots', sports: ['golf'], keywords: ['push', 'pushed', 'pushing it', 'blocked', 'block right'] },
  { id: 'thin_contact', label: 'Thin / topped contact', sports: ['golf'], keywords: ['topped', 'top it', 'thin', 'thinned', 'bladed', 'skulled'] },
  { id: 'fat_contact', label: 'Fat / heavy contact', sports: ['golf'], keywords: ['fat', 'chunked', 'chunk', 'chunky', 'heavy', 'hit it fat', 'behind the ball', 'turf first'] },
  { id: 'shank', label: 'Shanks', sports: ['golf'], keywords: ['shank', 'shanked', 'shanks', 'hosel rocket', 'off the hosel'] },
  { id: 'over_the_top', label: 'Over the Top', sports: ['golf'], keywords: ['over the top', 'came over', 'out to in', 'casting over'] },
  { id: 'early_extension', label: 'Early Extension', sports: ['golf'], keywords: ['early extension', 'stood up', 'lost posture', 'lost my spine angle', 'standing up'] },
  { id: 'casting', label: 'Casting / early release', sports: ['golf'], keywords: ['casting', 'cast it', 'scooping', 'scooped', 'flipped', 'flippy', 'early release'] },
  { id: 'three_putt', label: 'Putting struggles', sports: ['golf'], keywords: ['three putt', '3 putt', 'three-putt', 'missed putts', 'lipped out', 'short putts', 'yips'] },
  { id: 'short_game', label: 'Short game struggles', sports: ['golf'], keywords: ['chunked chip', 'duffed', 'bladed chip', 'short game', 'around the green'] },
  // ── Bat sports (baseball / softball) ──
  { id: 'pop_up', label: 'Popping up', sports: ['baseball', 'softball_slow', 'softball_fast'], keywords: ['popped up', 'pop up', 'pop-up', 'under the ball', 'popping up', 'infield fly'] },
  { id: 'rolled_over', label: 'Rolling over', sports: ['baseball', 'softball_slow', 'softball_fast'], keywords: ['rolled over', 'rolling over', 'ground out', 'grounded out', 'weak grounder', 'top spin grounder'] },
  { id: 'swing_miss', label: 'Swing-and-miss', sports: ['baseball', 'softball_slow', 'softball_fast'], keywords: ['whiff', 'whiffed', 'swing and miss', 'swung through', 'struck out', 'k looking', 'punch out'] },
  { id: 'pull_off_early', label: 'Pulling off the ball', sports: ['baseball', 'softball_slow', 'softball_fast'], keywords: ['pulling off', 'flying open', 'pulled my head', 'head pull', 'bailing'] },
  { id: 'extreme_uppercut', label: 'Steep / uppercut path', sports: ['baseball', 'softball_slow', 'softball_fast'], keywords: ['uppercut', 'too steep', 'chopping', 'chop', 'long swing'] },
  // ── Tennis ──
  { id: 'late_contact', label: 'Late contact', sports: ['tennis'], keywords: ['late', 'caught late', 'jammed', 'cramped', 'behind on'] },
  { id: 'into_net', label: 'Dumping into the net', sports: ['tennis'], keywords: ['into the net', 'netted', 'dumped in the net', 'in the net'] },
  { id: 'spraying_long', label: 'Spraying long', sports: ['tennis'], keywords: ['long', 'sailing long', 'over the baseline', 'flying long'] },
  { id: 'serve_toss_inconsistency', label: 'Serve toss inconsistency', sports: ['tennis'], keywords: ['toss', 'ball toss', 'tossing', 'double fault', 'double-faulted', 'double faults'] },
  { id: 'poor_footwork', label: 'Footwork lapses', sports: ['tennis'], keywords: ['footwork', 'flat footed', 'flat-footed', 'lazy feet', 'feet stuck', 'didnt move my feet'] },
  // ── Cross-sport (any sport) ──
  { id: 'tempo_off', label: 'Tempo / rhythm off', keywords: ['rushed', 'rushing', 'too fast', 'too quick', 'jerky', 'tempo off', 'no rhythm', 'out of rhythm', 'quick transition'] },
  { id: 'inconsistent', label: 'Inconsistency', keywords: ['inconsistent', 'all over the place', 'sprayed it', 'spray', 'wild', 'two way miss', 'two-way miss', 'no consistency', 'up and down'] },
  { id: 'balance_off', label: 'Balance / posture off', keywords: ['off balance', 'falling back', 'falling away', 'lost balance', 'leaning back', 'swaying', 'sway'] },
  { id: 'tight_tense', label: 'Tension / tightness', keywords: ['tight', 'tense', 'tensed up', 'gripping too hard', 'no feel', 'stiff', 'forced it'] },
];

function normalize(s: string): string {
  return ` ${s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()} `;
}

/** Does the normalized text contain the phrase as a whole word/phrase? */
function contains(haystack: string, phrase: string): boolean {
  return haystack.includes(` ${phrase} `) || haystack.includes(` ${phrase}`) || haystack.includes(`${phrase} `);
}

const MAX_FAULTS = 6;

/**
 * Extract a small, honest set of faults from a daily note's free text.
 * Returns [] for empty/ambiguous text — never fabricates a fault.
 *
 * @param text  The note's free text.
 * @param sport The note's sport (scopes the lexicon + ontology).
 */
export function extractFaultsFromText(text: string, sport: SportId): ExtractedFault[] {
  const hay = normalize(text);
  if (hay.trim().length < 3) return [];

  const curatedIds = new Set(getFaultsForSport(sport).map((f) => f.id));
  const hits = new Map<string, ExtractedFault>();

  const add = (f: ExtractedFault) => {
    const existing = hits.get(f.id);
    if (!existing || f.confidence > existing.confidence) hits.set(f.id, f);
  };

  // Pass 1 — casual-language lexicon (scoped to this sport).
  for (const entry of LEXICON) {
    if (entry.sports && !entry.sports.includes(sport)) continue;
    const matched = entry.keywords.filter((k) => contains(hay, normalize(k).trim()));
    if (matched.length === 0) continue;
    // More distinct keyword hits → higher confidence (capped, honest).
    const confidence = Math.min(0.9, 0.6 + (matched.length - 1) * 0.1);
    const curated = curatedIds.has(entry.id);
    add({ id: entry.id, label: entry.label, confidence, curated });
  }

  // Pass 2 — ontology name/token match for technical phrasing the lexicon
  // doesn't cover. We try the whole text and each clause for a curated id.
  const clauses = text.split(/[.,;\n]|\band\b/i).map((c) => c.trim()).filter(Boolean);
  for (const clause of [text, ...clauses]) {
    const id = matchFaultId(clause, sport);
    if (!id) continue;
    const entry = getFaultsForSport(sport).find((f) => f.id === id);
    if (!entry) continue;
    add({ id, label: entry.name, confidence: 0.7, curated: true });
  }

  return Array.from(hits.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_FAULTS);
}
