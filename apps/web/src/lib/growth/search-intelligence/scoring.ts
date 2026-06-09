// ============================================================
// SearchIntelligenceOS — transparent, explainable scoring (§17)
// ------------------------------------------------------------
// Every scorer returns a 0..100 number with the human-readable factor lines
// behind it (no black boxes). Pure functions, no I/O. These power page
// priority, keyword opportunity, technical-issue priority and the
// Impact×Confidence×Urgency×BusinessValue ÷ Effort action model.
// ============================================================

import type { Scale } from '../types';
import type {
  PageType, LinkSport, LinkIntent, LinkFunnel, ScoreBreakdown,
  IssueSeverity, ActionBand,
} from './types';

export const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

const SCALE_VAL: Record<Scale, number> = { low: 1, medium: 2, high: 3 };

// Page types that carry the most search/business value, highest first.
const PAGE_TYPE_VALUE: Partial<Record<PageType, number>> = {
  home: 95, 'sport-hub': 90, 'seo-programmatic': 80, tool: 78, comparison: 76,
  feature: 70, benchmark: 60, challenge: 58, blog: 55, faq: 55, glossary: 52,
  'sample-report': 50, video: 45, partner: 55, legal: 15, other: 40,
};

const INTENT_VALUE: Record<LinkIntent, number> = {
  transactional: 95, commercial: 80, informational: 55, navigational: 40,
};

// ──────────────────────────────────────────────────────────────
// Page content quality (§17)
// ──────────────────────────────────────────────────────────────

export interface PageQualitySignals {
  wordCount: number | null;
  hasDirectAnswer: boolean;
  faqCount: number;
  schemaCount: number;
  hasMetaDescription: boolean;
  pageType: PageType;
}

export function scorePageQuality(s: PageQualitySignals): ScoreBreakdown {
  const factors: string[] = [];
  let score = 40; // neutral baseline

  if (s.wordCount === null) {
    factors.push('Body not in an owned registry — quality estimated from structure only.');
  } else if (s.wordCount >= 900) { score += 25; factors.push(`Substantial content (${s.wordCount} words).`); }
  else if (s.wordCount >= 400) { score += 12; factors.push(`Adequate content (${s.wordCount} words).`); }
  else { score -= 10; factors.push(`Thin content (${s.wordCount} words).`); }

  if (s.hasDirectAnswer) { score += 12; factors.push('Has a direct-answer block (AEO-ready).'); }
  if (s.faqCount >= 3) { score += 10; factors.push(`${s.faqCount} FAQs (rich answers + schema).`); }
  else if (s.faqCount > 0) { score += 5; factors.push(`${s.faqCount} FAQ(s).`); }
  if (s.schemaCount > 0) { score += 8; factors.push(`Structured data declared (${s.schemaCount} type(s)).`); }
  else { score -= 5; factors.push('No structured data declared.'); }
  if (s.hasMetaDescription) { score += 5; } else { score -= 8; factors.push('Missing meta description.'); }

  return { score: clamp(score), factors };
}

// ──────────────────────────────────────────────────────────────
// Page business value (§17)
// ──────────────────────────────────────────────────────────────

export interface PageValueSignals {
  pageType: PageType;
  intent?: LinkIntent;
  funnelStage?: LinkFunnel;
  sport: LinkSport;
  /** 1 (highest) .. 5 (lowest) build/SEO priority. */
  priority: number;
}

export function scorePageBusinessValue(s: PageValueSignals): ScoreBreakdown {
  const factors: string[] = [];
  const typeVal = PAGE_TYPE_VALUE[s.pageType] ?? 40;
  const intentVal = s.intent ? INTENT_VALUE[s.intent] : 55;
  // Golf is the beachhead; softball is the named secondary.
  const sportBoost = s.sport === 'golf' ? 8 : s.sport === 'softball' ? 4 : 0;
  const priorityBoost = (6 - Math.max(1, Math.min(5, s.priority))) * 4; // p1 -> +20, p5 -> +4

  const score = clamp(typeVal * 0.55 + intentVal * 0.3 + priorityBoost + sportBoost);
  factors.push(`Page type "${s.pageType}" (${typeVal}/100 base value).`);
  if (s.intent) factors.push(`${s.intent} intent (${intentVal}/100).`);
  if (sportBoost) factors.push(`${s.sport} priority sport (+${sportBoost}).`);
  factors.push(`Build priority p${s.priority} (+${priorityBoost}).`);
  return { score, factors };
}

// ──────────────────────────────────────────────────────────────
// Page priority — what to WORK ON first (§17)
//   high value + improvement headroom + internal-link weakness.
// ──────────────────────────────────────────────────────────────

export interface PagePrioritySignals {
  qualityScore: number;
  businessValueScore: number;
  internalLinksIn: number;
  depth: number;
  isOrphan: boolean;
}

export function scorePagePriority(s: PagePrioritySignals): ScoreBreakdown {
  const factors: string[] = [];
  const headroom = 100 - s.qualityScore;
  const linkWeakness = s.internalLinksIn <= 1 ? 25 : s.internalLinksIn <= 3 ? 12 : 0;
  const orphanBoost = s.isOrphan ? 20 : 0;
  const depthPenalty = Number.isFinite(s.depth) ? Math.max(0, (s.depth - 3) * 4) : 0;

  const score = clamp(
    s.businessValueScore * 0.5 + headroom * 0.3 + linkWeakness + orphanBoost - depthPenalty,
  );
  factors.push(`Business value ${s.businessValueScore}/100 (weight 0.5).`);
  factors.push(`Improvement headroom ${headroom}/100 (weight 0.3).`);
  if (linkWeakness) factors.push(`Weak internal links (${s.internalLinksIn} inbound, +${linkWeakness}).`);
  if (orphanBoost) factors.push('Orphan page (+20).');
  if (depthPenalty) factors.push(`Deep page (depth ${s.depth}, -${Math.round(depthPenalty)}).`);
  return { score, factors };
}

// ──────────────────────────────────────────────────────────────
// Keyword opportunity (§17)
// ──────────────────────────────────────────────────────────────

export interface KeywordSignals {
  intent: LinkIntent;
  funnelStage: LinkFunnel;
  sport: LinkSport;
  hasOwnedPage: boolean;
  businessValueScore: number;
  /** 0..100, lower = easier to rank. */
  difficultyEstimate: number;
}

export function scoreKeywordOpportunity(s: KeywordSignals): ScoreBreakdown {
  const factors: string[] = [];
  const intentVal = INTENT_VALUE[s.intent];
  const gap = s.hasOwnedPage ? 10 : 35; // no page yet = bigger opportunity
  const ease = 100 - s.difficultyEstimate;

  const score = clamp(
    s.businessValueScore * 0.35 + intentVal * 0.2 + gap + ease * 0.2,
  );
  factors.push(`Business value ${s.businessValueScore}/100.`);
  factors.push(`${s.intent} intent (${intentVal}/100).`);
  factors.push(s.hasOwnedPage ? 'A page already targets this (+10).' : 'Content gap — no page yet (+35).');
  factors.push(`Relative ease ${ease}/100 (difficulty ${s.difficultyEstimate}).`);
  return { score, factors };
}

// ──────────────────────────────────────────────────────────────
// Technical-issue priority (§17)
// ──────────────────────────────────────────────────────────────

const SEVERITY_WEIGHT: Record<IssueSeverity, number> = {
  critical: 100, high: 78, medium: 50, low: 28, informational: 12,
};

export interface IssuePrioritySignals {
  severity: IssueSeverity;
  affectedCount: number;
  expectedImpact: Scale;
  fixComplexity: Scale;
  confidence: number; // 0..100
}

export function scoreIssuePriority(s: IssuePrioritySignals): number {
  const base = SEVERITY_WEIGHT[s.severity];
  const reach = Math.min(20, Math.log2(s.affectedCount + 1) * 7); // diminishing
  const impact = (SCALE_VAL[s.expectedImpact] - 1) * 8; // 0..16
  const easeBonus = (3 - SCALE_VAL[s.fixComplexity]) * 4; // low effort -> +8
  const conf = s.confidence / 100;
  return clamp((base + reach + impact + easeBonus) * (0.6 + 0.4 * conf));
}

// ──────────────────────────────────────────────────────────────
// Action priority — Impact × Confidence × Urgency × BusinessValue ÷ Effort
// (§12, §17). Banded: 90+/70+/40+/<40.
// ──────────────────────────────────────────────────────────────

export interface ActionPrioritySignals {
  impact: Scale;
  confidence: Scale;
  urgency: Scale;
  businessValue: Scale;
  effort: Scale;
}

export function scoreActionPriority(s: ActionPrioritySignals): { score: number; band: ActionBand } {
  const impact = SCALE_VAL[s.impact];
  const confidence = SCALE_VAL[s.confidence];
  const urgency = SCALE_VAL[s.urgency];
  const businessValue = SCALE_VAL[s.businessValue];
  const effort = SCALE_VAL[s.effort];

  // Raw ranges 1..81 over 1..3 -> normalize to 0..100.
  const raw = (impact * confidence * urgency * businessValue) / effort; // 0.33..81
  const score = clamp(((raw - 0.33) / (81 - 0.33)) * 100);
  return { score, band: actionBand(score) };
}

export function actionBand(score: number): ActionBand {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
