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
  { id: 'slice_tendency', label: 'Slice tendency', sports: ['golf'], keywords: ['slice', 'sliced', 'slicing', 'banana', 'cut across', 'big cut', 'left to right too much', 'big slice', 'weak fade', 'leaking right'] },
  { id: 'hook_tendency', label: 'Hook tendency', sports: ['golf'], keywords: ['hook', 'hooked', 'hooking', 'snap hook', 'duck hook', 'snapped it', 'pull hook', 'turning it over too much'] },
  { id: 'pull_tendency', label: 'Pulling shots', sports: ['golf'], keywords: ['pull', 'pulled', 'pulling it', 'yanked', 'pulling left'] },
  { id: 'push_tendency', label: 'Pushing shots', sports: ['golf'], keywords: ['push', 'pushed', 'pushing it', 'blocked', 'block right', 'pushing right'] },
  { id: 'thin_contact', label: 'Thin / topped contact', sports: ['golf'], keywords: ['topped', 'top it', 'thin', 'thinned', 'bladed', 'skulled', 'caught it thin', 'worm burner', 'low runner', 'skinny'] },
  { id: 'fat_contact', label: 'Fat / heavy contact', sports: ['golf'], keywords: ['fat', 'chunked', 'chunk', 'chunky', 'heavy', 'hit it fat', 'behind the ball', 'turf first', 'hit behind it', 'turf before ball', 'dead fat'] },
  { id: 'shank', label: 'Shanks', sports: ['golf'], keywords: ['shank', 'shanked', 'shanks', 'hosel rocket', 'off the hosel'] },
  { id: 'sky_tee', label: 'Sky / pop-up off the tee', sports: ['golf'], keywords: ['skied', 'sky it', 'skied it', 'sky mark', 'popped up off the tee', 'pop up off the tee'] },
  { id: 'over_the_top', label: 'Over the Top', sports: ['golf'], keywords: ['over the top', 'came over', 'out to in', 'casting over', 'coming over it'] },
  { id: 'early_extension', label: 'Early Extension', sports: ['golf'], keywords: ['early extension', 'stood up', 'lost posture', 'lost my spine angle', 'standing up'] },
  { id: 'casting', label: 'Casting / early release', sports: ['golf'], keywords: ['casting', 'cast it', 'scooping', 'scooped', 'flipped', 'flippy', 'early release', 'flipping at it', 'threw it from the top'] },
  { id: 'three_putt', label: 'Putting struggles', sports: ['golf'], keywords: ['three putt', '3 putt', 'three-putt', '3 jack', 'three jacked', 'four putt', 'missed putts', 'lipped out', 'short putts', 'missed short putt', 'yips'] },
  { id: 'short_game', label: 'Short game struggles', sports: ['golf'], keywords: ['chunked chip', 'duffed', 'duffed a chip', 'bladed chip', 'thinned a chip', 'fluffed', 'short game', 'around the green', 'bunker trouble', 'sandy'] },
  { id: 'distance_loss', label: 'Distance / power loss', sports: ['golf'], keywords: ['no distance', 'lost distance', 'came up short', 'ballooning', 'ballooned', 'short all day', 'weak ball flight'] },
  // ── Bat sports (baseball / softball) ──
  { id: 'pop_up', label: 'Popping up', sports: ['baseball', 'softball_slow', 'softball_fast'], keywords: ['popped up', 'pop up', 'pop-up', 'popped out', 'under the ball', 'popping up', 'infield fly', 'sky ball', 'lazy fly'] },
  { id: 'rolled_over', label: 'Rolling over', sports: ['baseball', 'softball_slow', 'softball_fast'], keywords: ['rolled over', 'rolling over', 'ground out', 'grounded out', 'weak grounder', 'weak ground ball', 'top spin grounder', 'topped', 'topped it', 'chopper'] },
  { id: 'swing_miss', label: 'Swing-and-miss', sports: ['baseball', 'softball_slow', 'softball_fast'], keywords: ['whiff', 'whiffed', 'swing and miss', 'swung through', 'swung over it', 'struck out', 'k looking', 'punch out', 'fooled', 'chasing', 'chased', 'expanded the zone'] },
  { id: 'pull_off_early', label: 'Pulling off the ball', sports: ['baseball', 'softball_slow', 'softball_fast'], keywords: ['pulling off', 'flying open', 'pulled my head', 'head pull', 'bailing', 'stepping in the bucket', 'bucket foot', 'spinning off'] },
  { id: 'extreme_uppercut', label: 'Steep / uppercut path', sports: ['baseball', 'softball_slow', 'softball_fast'], keywords: ['uppercut', 'too steep', 'chopping', 'chop', 'long swing', 'casting hands', 'dropping my hands', 'bat drag', 'getting around it'] },
  { id: 'timing_contact', label: 'Timing at contact', sports: ['baseball', 'softball_slow', 'softball_fast'], keywords: ['out in front', 'way out front', 'late on the fastball', 'getting beat', 'beat by the fastball', 'jammed', 'ahead of it', 'too early'] },
  // ── Tennis ──
  { id: 'late_contact', label: 'Late contact', sports: ['tennis'], keywords: ['late', 'caught late', 'jammed', 'cramped', 'behind on', 'reaching', 'cramped up'] },
  { id: 'into_net', label: 'Dumping into the net', sports: ['tennis'], keywords: ['into the net', 'netted', 'dumped in the net', 'in the net'] },
  { id: 'spraying_long', label: 'Spraying long', sports: ['tennis'], keywords: ['long', 'sailing long', 'over the baseline', 'flying long', 'sending them long'] },
  { id: 'framed_contact', label: 'Off-centre / framed contact', sports: ['tennis'], keywords: ['framed', 'framed it', 'off the frame', 'shanked it', 'mishit', 'off centre', 'off center'] },
  { id: 'serve_toss_inconsistency', label: 'Serve toss inconsistency', sports: ['tennis'], keywords: ['toss', 'ball toss', 'tossing', 'double fault', 'double-faulted', 'double faults', 'no first serves', 'serve fell apart'] },
  { id: 'poor_footwork', label: 'Footwork lapses', sports: ['tennis'], keywords: ['footwork', 'flat footed', 'flat-footed', 'lazy feet', 'feet stuck', 'didnt move my feet', 'caught flat'] },
  // ── Cross-sport (any sport) ──
  { id: 'tempo_off', label: 'Tempo / rhythm off', keywords: ['rushed', 'rushing', 'rushing it', 'too fast', 'too quick', 'jerky', 'jumpy', 'tempo off', 'no rhythm', 'out of rhythm', 'quick transition', 'mistimed', 'timing was off'] },
  { id: 'inconsistent', label: 'Inconsistency', keywords: ['inconsistent', 'all over the place', 'sprayed it', 'spray', 'wild', 'two way miss', 'two-way miss', 'no consistency', 'up and down', 'hit and miss', 'streaky', 'couldnt repeat it'] },
  { id: 'balance_off', label: 'Balance / posture off', keywords: ['off balance', 'falling back', 'falling away', 'lost balance', 'leaning back', 'swaying', 'sway', 'lunging', 'falling forward', 'off my base'] },
  { id: 'tight_tense', label: 'Tension / tightness', keywords: ['tight', 'tense', 'tensed up', 'gripping too hard', 'no feel', 'stiff', 'forced it', 'pressing', 'overswinging', 'trying too hard', 'swinging out of my shoes'] },
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
