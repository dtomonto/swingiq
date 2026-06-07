// ============================================================
// SwingVantage Admin — generated fix/repair page logic (isomorphic, pure)
// ------------------------------------------------------------
// The relevance GATE + quality scoring for AI-generated fix pages.
// A query (from a user search or an AI-detected issue) is classified
// and scored BEFORE any page is created, so irrelevant, duplicate,
// spammy or unsafe pages never auto-publish.
//
// All heuristic and deterministic — no model calls — so it's testable
// and runs anywhere.
// ============================================================

export type FixSource = 'user_search' | 'ai_video' | 'ai_image' | 'manual';
export type FixStatus = 'needs_review' | 'approved' | 'rejected' | 'merged' | 'published';

export interface FixScores {
  /** 0–100: how on-topic for a SwingVantage fix page. */
  relevance: number;
  /** 0–100: how likely this duplicates existing content (higher = worse). */
  duplication: number;
  /** 0–100: content quality / specificity potential. */
  quality: number;
  /** 0–100: search/AEO opportunity. */
  seoOpportunity: number;
  /** 0–100: safety risk (medical/unsafe). Higher = block. */
  safetyRisk: number;
}

export interface FixCandidate {
  id: string;
  query: string;
  sport: string | null;
  source: FixSource;
  status: FixStatus;
  createdAt: string;
  notes?: string;
  mergedIntoId?: string;
  scores: FixScores;
}

// Sport / technique vocabulary → relevance.
const SPORT_TERMS: Record<string, string[]> = {
  golf: ['golf', 'slice', 'hook', 'driver', 'iron', 'putt', 'chip', 'pitch shot', 'topping', 'shank', 'fade', 'draw', 'wedge', 'tee'],
  tennis: ['tennis', 'forehand', 'backhand', 'serve', 'volley', 'topspin', 'groundstroke'],
  pickleball: ['pickleball', 'dink', 'third shot', 'kitchen', 'paddle', 'drop shot'],
  padel: ['padel', 'bandeja', 'vibora', 'glass', 'lob'],
  baseball: ['baseball', 'bat', 'hitting', 'swing', 'pop up', 'launch angle', 'contact'],
  softball: ['softball', 'slow pitch', 'fast pitch', 'rise ball', 'slap hit'],
};

const TECHNIQUE_TERMS = ['swing', 'stance', 'grip', 'follow through', 'backswing', 'contact', 'timing', 'rotation', 'weight shift', 'footwork'];
const FIX_PHRASES = ['how to', 'fix', 'stop', 'why do i', 'correct', 'improve', 'cure', 'drill'];
const UNSAFE_TERMS = ['pain', 'injury', 'injured', 'surgery', 'medication', 'concussion', 'fracture', 'torn', 'diagnose my', 'medical'];
const SPAM_TERMS = ['free money', 'casino', 'viagra', 'crypto', 'porn', 'loan'];

function tokens(q: string): string[] {
  return q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

export interface FixClassification {
  sport: string | null;
  isSportRelated: boolean;
  isUnsafe: boolean;
  isSpam: boolean;
  hasFixIntent: boolean;
}

export function classifyFixQuery(query: string): FixClassification {
  const q = query.toLowerCase();
  let sport: string | null = null;
  for (const [name, terms] of Object.entries(SPORT_TERMS)) {
    if (terms.some((t) => q.includes(t))) {
      sport = name;
      break;
    }
  }
  const isSportRelated = sport !== null || TECHNIQUE_TERMS.some((t) => q.includes(t));
  return {
    sport,
    isSportRelated,
    isUnsafe: UNSAFE_TERMS.some((t) => q.includes(t)),
    isSpam: SPAM_TERMS.some((t) => q.includes(t)),
    hasFixIntent: FIX_PHRASES.some((t) => q.includes(t)),
  };
}

export interface ScoreOptions {
  /** Existing page keywords/slugs to check duplication against. */
  existingKeywords?: string[];
}

export function scoreFixCandidate(query: string, opts: ScoreOptions = {}): FixScores {
  const c = classifyFixQuery(query);
  const toks = tokens(query);
  const wordCount = toks.length;

  // Relevance: sport match + technique terms + fix intent.
  let relevance = 0;
  if (c.sport) relevance += 55;
  else if (c.isSportRelated) relevance += 30;
  if (c.hasFixIntent) relevance += 25;
  if (TECHNIQUE_TERMS.some((t) => query.toLowerCase().includes(t))) relevance += 20;
  relevance = Math.min(100, relevance);

  // Quality: enough specificity, not too short or too long.
  let quality = 0;
  if (wordCount >= 3) quality += 40;
  if (wordCount >= 5) quality += 20;
  if (c.hasFixIntent) quality += 20;
  if (c.sport) quality += 20;
  if (wordCount > 14) quality -= 20; // rambling
  quality = Math.max(0, Math.min(100, quality));

  // Duplication vs existing keywords (token overlap).
  let duplication = 0;
  const existing = opts.existingKeywords ?? [];
  for (const k of existing) {
    const kt = new Set(tokens(k));
    const overlap = toks.filter((t) => kt.has(t)).length;
    const ratio = toks.length ? overlap / toks.length : 0;
    duplication = Math.max(duplication, Math.round(ratio * 100));
  }

  // SEO opportunity: informational "how to / why" phrasing scores well.
  let seoOpportunity = 0;
  if (c.hasFixIntent) seoOpportunity += 50;
  if (c.sport) seoOpportunity += 30;
  if (wordCount >= 4) seoOpportunity += 20;
  seoOpportunity = Math.min(100, seoOpportunity);

  // Safety risk.
  const safetyRisk = c.isUnsafe ? 90 : c.isSpam ? 80 : 0;

  return { relevance, duplication, quality, seoOpportunity, safetyRisk };
}

export type FixRecommendation = 'approve' | 'review' | 'reject';

/** The relevance gate: turn scores into a recommended action. */
export function recommendFix(scores: FixScores): { action: FixRecommendation; reason: string } {
  if (scores.safetyRisk >= 70) return { action: 'reject', reason: 'Unsafe or spam — never auto-publish.' };
  if (scores.relevance < 40) return { action: 'reject', reason: 'Off-topic for SwingVantage fix pages.' };
  if (scores.duplication >= 70) return { action: 'review', reason: 'Likely duplicates existing content — consider merging.' };
  if (scores.quality < 40) return { action: 'review', reason: 'Thin/low-specificity — needs a human eye.' };
  if (scores.relevance >= 70 && scores.quality >= 60 && scores.duplication < 50) {
    return { action: 'approve', reason: 'Strong, on-topic, distinct opportunity.' };
  }
  return { action: 'review', reason: 'Reasonable candidate — confirm before publishing.' };
}
