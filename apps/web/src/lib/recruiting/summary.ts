// ============================================================
// Player Recruiting Hub — AI player summary (deterministic core)
// ------------------------------------------------------------
// Turns the profile + film + data into a grounded recruiting
// narrative for six audiences. This is the KEYLESS path: every
// sentence is built from a labeled data point, so it is honest by
// construction. The optional provider re-word (api/recruiting/
// summary) must pass `validateSummaryBody` before it is accepted,
// and falls back to this output on any failure.
//
// Hard rule: never project a recruiting ceiling ("D1", "pro-ready",
// "elite prospect", "guaranteed"). Describe the evidence; let the
// coach project.
// ============================================================

import type { SportId } from '@swingiq/core';
import { SPORT_META } from './sports';
import {
  type RecruitingState,
  type SummaryAudience,
  type SummaryClaim,
  type ConfidenceLevel,
  type PlayerMetric,
  DATA_SOURCE_LABEL,
  VERIFIED_SOURCES,
} from './types';
import { getMetricDef } from './metrics';
import { benchmarkPosition, hasBenchmark } from './benchmarks';

export interface SummaryDraft {
  body: string;
  claims: SummaryClaim[];
  caveats: string[];
}

/** Phrases the summary must never contain — projecting a ceiling we can't support. */
export const FORBIDDEN_CLAIM_PATTERNS: RegExp[] = [
  /\bdivision\s*[i1]\b/i,
  /\bd-?1\b/i,
  /\bpro-?ready\b/i,
  /\belite prospect\b/i,
  /\bcan'?t-?miss\b/i,
  /\bguarantee/i,
  /\bfull ride\b/i,
  /\bscholarship\b/i,
  /\bgenerational\b/i,
  /\bnext\s+(jeter|trout|woods|williams|federer)\b/i,
];

/** Strip a sentence if it makes a forbidden ceiling claim. Returns null if it must be dropped. */
export function sanitizeClaimText(text: string): string | null {
  return FORBIDDEN_CLAIM_PATTERNS.some((re) => re.test(text)) ? null : text;
}

/** Validate an AI-reworded body: no forbidden claims, non-empty, not absurdly long. */
export function validateSummaryBody(body: string): boolean {
  if (!body || body.trim().length < 40) return false;
  if (body.length > 2400) return false;
  return !FORBIDDEN_CLAIM_PATTERNS.some((re) => re.test(body));
}

function confidenceFor(metric: PlayerMetric): ConfidenceLevel {
  const verified = VERIFIED_SOURCES.has(metric.source as never) || metric.coachValidated;
  const samples = metric.history.length;
  if (verified && samples >= 3) return 'high';
  if (verified || samples >= 3) return 'medium';
  if (metric.source === 'ai_estimated' || metric.source === 'needs_review') return 'needs_review';
  return 'low';
}

function fmtValue(v: number, unit: string): string {
  const rounded = Number.isInteger(v) ? v : Math.round(v * 100) / 100;
  return unit ? `${rounded} ${unit}`.trim() : `${rounded}`;
}

interface RankedMetric {
  metric: PlayerMetric;
  normalized: number;
  nearestLabel: string;
  confidence: ConfidenceLevel;
}

/** Rank a sport's benchmarked metrics by how strong they read (0–100). */
function rankMetrics(state: RecruitingState, sport: SportId): RankedMetric[] {
  const ranked: RankedMetric[] = [];
  for (const m of state.metrics) {
    if (m.sport !== sport || m.currentValue == null) continue;
    if (!hasBenchmark(m.metricKey, sport)) continue;
    const pos = benchmarkPosition(m.metricKey, sport, m.currentValue);
    if (!pos) continue;
    ranked.push({ metric: m, normalized: pos.normalized, nearestLabel: pos.nearestLabel, confidence: confidenceFor(m) });
  }
  return ranked.sort((a, b) => b.normalized - a.normalized);
}

/** Metrics with a measurable upward trend across their history. */
function improvingMetrics(state: RecruitingState, sport: SportId): PlayerMetric[] {
  return state.metrics.filter((m) => {
    if (m.sport !== sport || m.history.length < 2) return false;
    const def = getMetricDef(m.metricKey);
    const first = m.history[0].value;
    const last = m.history[m.history.length - 1].value;
    const improved = def?.higherIsBetter ? last > first : last < first;
    return improved;
  });
}

function strengthClaim(r: RankedMetric, sport: SportId): SummaryClaim {
  const def = getMetricDef(r.metric.metricKey);
  const label = def?.label ?? r.metric.metricKey;
  const value = fmtValue(r.metric.currentValue!, r.metric.unit);
  const where =
    r.normalized >= 80
      ? `at or above the ${r.nearestLabel.toLowerCase()} range`
      : r.normalized >= 60
        ? `around the ${r.nearestLabel.toLowerCase()} range`
        : `building toward the ${r.nearestLabel.toLowerCase()} range`;
  return {
    text: `${label} of ${value} sits ${where} (${SPORT_META[sport].name} reference, estimated).`,
    evidence: [r.metric.metricKey],
    confidence: r.confidence,
    source: r.metric.source,
  };
}

function buildClaims(state: RecruitingState, sport: SportId): SummaryClaim[] {
  const claims: SummaryClaim[] = [];
  const ranked = rankMetrics(state, sport);
  for (const r of ranked.slice(0, 3)) claims.push(strengthClaim(r, sport));

  const improving = improvingMetrics(state, sport);
  if (improving.length) {
    const names = improving.slice(0, 3).map((m) => getMetricDef(m.metricKey)?.label ?? m.metricKey);
    claims.push({
      text: `Trending up over tracked sessions in ${names.join(', ')}.`,
      evidence: improving.slice(0, 3).map((m) => m.metricKey),
      confidence: 'medium',
      source: 'platform_generated',
    });
  }

  const verifiedFilm = state.film.filter((f) => !f.deletedAt && VERIFIED_SOURCES.has(f.source as never));
  const gameFilm = state.film.filter(
    (f) => !f.deletedAt && ['full_game', 'tournament_footage', 'match_play', 'full_at_bat'].includes(f.category),
  );
  if (gameFilm.length) {
    claims.push({
      text: `${gameFilm.length} piece(s) of real-game / match footage on file for evaluation under live conditions.`,
      evidence: gameFilm.slice(0, 4).map((f) => f.id),
      confidence: verifiedFilm.length ? 'high' : 'medium',
      source: verifiedFilm.length ? 'event_verified' : 'self_reported',
    });
  }

  return claims;
}

function buildCaveats(state: RecruitingState, sport: SportId): string[] {
  const caveats: string[] = [];
  const sportMetrics = state.metrics.filter((m) => m.sport === sport);
  const selfReported = sportMetrics.filter((m) => !VERIFIED_SOURCES.has(m.source as never) && !m.coachValidated);
  if (selfReported.length) {
    caveats.push(
      `${selfReported.length} metric(s) are self-reported and not yet independently verified.`,
    );
  }
  const hasGame = state.film.some(
    (f) => !f.deletedAt && ['full_game', 'tournament_footage', 'match_play', 'full_at_bat'].includes(f.category),
  );
  if (!hasGame && state.film.length) {
    caveats.push('No game/match footage yet — current film is practice or session work.');
  }
  if (!sportMetrics.length) {
    caveats.push('No performance data added yet for this sport.');
  }
  return caveats;
}

function styleSentence(state: RecruitingState, sport: SportId): string {
  const sp = state.profile?.sportProfiles[sport];
  const pos = sp?.position?.trim();
  const name = state.profile?.athleteName?.trim() || 'This athlete';
  if (!pos) return `${name} competes in ${SPORT_META[sport].name.toLowerCase()}.`;
  return `${name} plays ${pos} in ${SPORT_META[sport].name.toLowerCase()}.`;
}

/** Compose the narrative body for an audience from the structured claims. */
function composeBody(
  state: RecruitingState,
  sport: SportId,
  audience: SummaryAudience,
  claims: SummaryClaim[],
  caveats: string[],
): string {
  const p = state.profile;
  const name = p?.athleteName?.trim() || 'This athlete';
  const klass = p?.graduationYear ? ` (class of ${p.graduationYear})` : '';
  const style = styleSentence(state, sport);
  const strengths = claims.filter((c) => c.evidence.length).map((c) => c.text);
  const coachability =
    p?.coachabilityNotes?.trim() ||
    (state.coachNotes[0]?.body?.trim() ? `Coach note: ${state.coachNotes[0].body.trim()}` : '');

  const link = '[your recruiting profile link]';

  switch (audience) {
    case 'social':
      return [
        `${name}${klass} — ${SPORT_META[sport].name}.`,
        strengths[0] ?? 'Film + verified data inside.',
        'Full profile + film:',
      ].join(' ');
    case 'email_intro':
      return [
        `Hi Coach — I'm ${name}${klass}, ${style.toLowerCase()}`,
        strengths[0] ? `A quick data point: ${strengths[0]}` : '',
        `I'd value the chance to be evaluated. My film and full data are here: ${link}.`,
      ]
        .filter(Boolean)
        .join(' ');
    case 'bio':
      return [
        `${name}${klass} is a ${SPORT_META[sport].name.toLowerCase()} athlete. ${style}`,
        strengths.slice(0, 2).join(' '),
        p?.personalStatement?.trim() ?? '',
      ]
        .filter(Boolean)
        .join(' ');
    case 'parent':
      return [
        `Here's an honest read on ${name}'s ${SPORT_META[sport].name.toLowerCase()} profile.`,
        strengths.length ? `What's showing up well: ${strengths.join(' ')}` : 'Keep adding film and data to strengthen the picture.',
        caveats.length ? `What to keep in mind: ${caveats.join(' ')}` : '',
        'Everything here is labeled by where it came from, so nothing is overstated.',
      ]
        .filter(Boolean)
        .join(' ');
    case 'scout':
      return [
        `${name}${klass}. ${style}`,
        strengths.length ? `Data: ${strengths.join(' ')}` : 'Limited data on file.',
        caveats.length ? `Caveats: ${caveats.join(' ')}` : '',
      ]
        .filter(Boolean)
        .join(' ');
    case 'coach':
    default:
      return [
        `${name}${klass}. ${style}`,
        strengths.length ? `Strengths the data supports: ${strengths.join(' ')}` : 'Profile is early — film and data still being added.',
        coachability ? coachability : '',
        caveats.length ? `Honest caveats: ${caveats.join(' ')}` : '',
      ]
        .filter(Boolean)
        .join(' ');
  }
}

export function buildSummary(
  state: RecruitingState,
  audience: SummaryAudience,
  sport?: SportId,
): SummaryDraft {
  const useSport = sport ?? state.profile?.primarySport ?? 'golf';
  const claims = buildClaims(state, useSport);
  const caveats = buildCaveats(state, useSport);
  let body = composeBody(state, useSport, audience, claims, caveats);

  // Defense in depth: drop anything that slipped through into a forbidden claim.
  if (!validateSummaryBody(body)) {
    body = body
      .split(/(?<=[.!?])\s+/)
      .filter((s) => sanitizeClaimText(s) !== null)
      .join(' ')
      .trim();
  }

  return { body, claims, caveats };
}

/** Human-readable source label for a claim (used in the UI traceability row). */
export function claimSourceLabel(claim: SummaryClaim): string {
  return DATA_SOURCE_LABEL[claim.source];
}
