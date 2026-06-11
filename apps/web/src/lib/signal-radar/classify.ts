// ============================================================
// SignalRadar OS — rules-based classifier (PURE, deterministic)
// ------------------------------------------------------------
// Turns a signal's text into structured labels (sentiment, intent,
// audience, sport, urgency, opportunity) using transparent keyword
// rules. Deterministic + keyless by design — this is the always-on
// default. `config.aiClassificationEnabled` is a future flag for an
// optional AI refinement layer (off until an AI provider is wired); the
// rules path always produces a complete, honest classification on its own.
// ============================================================

import type {
  SignalRadarConfig,
  SignalClassification,
  Sentiment,
  SignalIntent,
  AudienceType,
  SignalSport,
  Urgency,
  OpportunityType,
} from './types';
import { competitorTermsFor } from './config';
import type { CompetitorDef } from './types';

/** Lowercase + normalize curly punctuation so matching is robust. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchedTerms(haystack: string, terms: string[]): string[] {
  const hits: string[] = [];
  for (const t of terms) {
    const term = normalizeText(t);
    if (term && haystack.includes(term)) hits.push(t);
  }
  return Array.from(new Set(hits));
}

const POSITIVE_CUES = [
  'love', 'great', 'amazing', 'awesome', 'best', 'helpful', 'impressed', 'recommend',
  'excellent', 'fantastic', 'works well', 'game changer', 'game-changer', 'incredible',
  'underrated', 'so good', 'perfect', 'thank you', 'thanks',
];
const NEGATIVE_CUES = [
  'hate', 'awful', 'terrible', 'worst', 'bad', 'disappointed', 'useless', 'broken',
  'scam', 'waste', 'frustrated', 'annoying', 'horrible', 'misleading', 'overpriced',
  "doesn't work", 'does not work', 'not worth', 'inaccurate',
];

const PARENT_CUES = ['my son', 'my daughter', 'my kid', 'my child', "kid's", 'youth', 'junior', 'my 12 year old', 'my 10 year old'];
const COACH_CUES = ['coach', 'instructor', 'my students', 'my players', 'lesson', 'teaching pro', 'i coach'];
const TEAM_CUES = ['team', 'league', 'club', 'travel ball', 'academy', 'roster'];
const CREATOR_CUES = ['youtube', 'channel', 'subscribers', 'my blog', 'i blog', 'tiktok', 'reels', 'my followers', 'content creator', 'influencer'];
const BUYER_CUES = ['budget', 'looking to buy', 'for my academy', 'pricing', 'enterprise', 'bulk', 'for our team'];
const MEDIA_CUES = ['journalist', 'writing an article', 'press', 'reporter', 'roundup', 'review site'];

const QUESTION_CUES = ['how do i', 'how to', 'how can i', 'is there', 'anyone know', 'which', 'what app', 'recommend', 'looking for', 'best app', '?'];
const COMPARISON_CUES = ['vs', 'versus', 'alternative to', 'compared to', 'instead of', 'better than', 'or '];
const FEATURE_CUES = ['wish it had', 'should add', 'would be great if', 'feature request', 'please add', 'can you add', 'needs a'];
const BUG_CUES = ['bug', 'crash', 'crashes', 'error', 'broken', 'glitch', 'wont load', "won't load", 'stuck', 'freezes'];
const SUPPORT_CUES = ['refund', 'cancel', "can't log in", 'cant login', 'reset password', 'account', 'charged', 'billing', 'support'];
const BACKLINK_CUES = ['great resource', 'check out', 'this tool', 'i use', 'recommend this'];

export interface ClassifyContext {
  competitors: CompetitorDef[];
  /** Operator hint that overrides the inferred sport, if provided. */
  sportHint?: SignalSport;
}

/**
 * Classify a signal from its title + text using the config vocabularies.
 * Pure + deterministic. The `rationale` array explains every label.
 */
export function classifySignal(
  input: { title?: string; text: string },
  config: SignalRadarConfig,
  ctx: ClassifyContext,
): SignalClassification {
  const text = normalizeText(`${input.title ?? ''} ${input.text}`);
  const rationale: string[] = [];

  // ── Brand / domain / old-brand / misspelling matches ──────
  const brandHits = matchedTerms(text, [
    ...config.brandTerms,
    ...config.brandMisspellings,
    ...config.domainTerms,
    ...config.oldBrandTerms,
    ...config.founderHandles,
  ]);
  const isDirectBrand = brandHits.length > 0;
  if (isDirectBrand) rationale.push(`Direct brand reference: ${brandHits.join(', ')}`);

  // ── Sport detection ───────────────────────────────────────
  const sportScores: { sport: SignalSport; hits: string[] }[] = [];
  for (const [sport, terms] of Object.entries(config.sportTerms)) {
    const hits = matchedTerms(text, terms ?? []);
    if (hits.length) sportScores.push({ sport: sport as SignalSport, hits });
  }
  let sport: SignalSport = 'unknown';
  let sportTermsMatched: string[] = [];
  if (ctx.sportHint && ctx.sportHint !== 'unknown') {
    sport = ctx.sportHint;
    sportTermsMatched = sportScores.find((s) => s.sport === sport)?.hits ?? [];
    rationale.push(`Sport set by operator hint: ${sport}`);
  } else if (sportScores.length === 1) {
    sport = sportScores[0].sport;
    sportTermsMatched = sportScores[0].hits;
    rationale.push(`Sport inferred (${sport}) from: ${sportTermsMatched.join(', ')}`);
  } else if (sportScores.length > 1) {
    sport = 'multi_sport';
    sportTermsMatched = sportScores.flatMap((s) => s.hits);
    rationale.push(`Multiple sports referenced: ${sportScores.map((s) => s.sport).join(', ')}`);
  }

  // ── Competitor matches ────────────────────────────────────
  const competitorTerms = competitorTermsFor(ctx.competitors);
  const competitorTermsMatched = matchedTerms(text, competitorTerms);
  if (competitorTermsMatched.length) rationale.push(`Competitor referenced: ${competitorTermsMatched.join(', ')}`);

  // ── Sentiment ─────────────────────────────────────────────
  const posHits = matchedTerms(text, POSITIVE_CUES);
  const riskHits = matchedTerms(text, config.riskTerms);
  const negHits = Array.from(new Set([...matchedTerms(text, NEGATIVE_CUES), ...riskHits]));
  let sentiment: Sentiment;
  if (posHits.length && negHits.length) sentiment = 'mixed';
  else if (negHits.length) sentiment = 'negative';
  else if (posHits.length) sentiment = 'positive';
  else sentiment = text.length < 3 ? 'unknown' : 'neutral';
  if (sentiment !== 'neutral' && sentiment !== 'unknown') {
    rationale.push(`Sentiment ${sentiment} (+${posHits.length}/-${negHits.length} cues)`);
  }

  // ── Spam / noise guard ────────────────────────────────────
  const spamHits = matchedTerms(text, config.spamTerms);
  const isSpam = spamHits.length > 0 && !isDirectBrand;

  // ── Demand / opportunity signals ──────────────────────────
  const demandHits = matchedTerms(text, config.demandTerms);
  const hasQuestion = QUESTION_CUES.some((q) => text.includes(q));
  const hasComparison = COMPARISON_CUES.some((c) => text.includes(c));
  const featureHit = FEATURE_CUES.some((c) => text.includes(c));
  const bugHit = BUG_CUES.some((c) => text.includes(c));
  const supportHit = SUPPORT_CUES.some((c) => text.includes(c));
  const mediaHit = MEDIA_CUES.some((c) => text.includes(c));

  // ── Intent (priority-ordered) ─────────────────────────────
  let intent: SignalIntent;
  if (isSpam) {
    intent = 'spam_noise';
  } else if (isDirectBrand && (sentiment === 'negative' || sentiment === 'mixed') && riskHits.length) {
    intent = 'reputation_risk';
  } else if (isDirectBrand && bugHit) {
    intent = 'bug_report';
  } else if (isDirectBrand && featureHit) {
    intent = 'feature_request';
  } else if (isDirectBrand && supportHit) {
    intent = 'support_issue';
  } else if (competitorTermsMatched.length && hasComparison) {
    intent = 'purchase_comparison';
  } else if (competitorTermsMatched.length && !isDirectBrand) {
    intent = 'competitive_intel';
  } else if (mediaHit) {
    intent = 'press_media';
  } else if ((demandHits.length || hasQuestion) && hasComparison) {
    intent = 'purchase_comparison';
  } else if (demandHits.length && hasQuestion) {
    intent = 'seo_content_opportunity';
  } else if (demandHits.length) {
    intent = 'coaching_need';
  } else if (hasQuestion && isDirectBrand) {
    intent = 'product_question';
  } else if (CREATOR_CUES.some((c) => text.includes(c)) && !isDirectBrand) {
    intent = 'creator_opportunity';
  } else if (isDirectBrand && !text.includes('http') && (posHits.length || matchedTerms(text, BACKLINK_CUES).length)) {
    intent = 'backlink_opportunity';
  } else if (isDirectBrand) {
    intent = 'brand_mention';
  } else if (hasQuestion) {
    intent = 'seo_content_opportunity';
  } else {
    intent = 'brand_mention';
  }
  rationale.push(`Intent: ${intent}`);

  // ── Audience ──────────────────────────────────────────────
  let audience: AudienceType = 'unknown';
  if (competitorTermsMatched.length && intent === 'competitive_intel') audience = 'competitor';
  else if (PARENT_CUES.some((c) => text.includes(c))) audience = 'parent';
  else if (COACH_CUES.some((c) => text.includes(c))) audience = 'coach';
  else if (TEAM_CUES.some((c) => text.includes(c))) audience = 'team_league';
  else if (CREATOR_CUES.some((c) => text.includes(c))) audience = 'creator';
  else if (MEDIA_CUES.some((c) => text.includes(c))) audience = 'blogger_media';
  else if (BUYER_CUES.some((c) => text.includes(c))) audience = 'sports_tech_buyer';
  else if (demandHits.length || hasQuestion) audience = 'recreational_athlete';
  if (audience !== 'unknown') rationale.push(`Audience: ${audience}`);

  // ── Opportunity type (derived from intent) ────────────────
  const opportunity = opportunityForIntent(intent, sentiment);

  // ── Urgency ───────────────────────────────────────────────
  let urgency: Urgency = 'low';
  if (intent === 'reputation_risk') urgency = sentiment === 'negative' ? 'critical' : 'high';
  else if (intent === 'bug_report' || intent === 'support_issue') urgency = 'high';
  else if (intent === 'purchase_comparison' || intent === 'backlink_opportunity') urgency = 'medium';
  else if (intent === 'seo_content_opportunity' || intent === 'feature_request' || intent === 'creator_opportunity') urgency = 'medium';
  else if (intent === 'spam_noise') urgency = 'low';

  return {
    sentiment,
    intent,
    audience,
    sport,
    urgency,
    opportunity,
    brandTermsMatched: brandHits,
    sportTermsMatched,
    competitorTermsMatched,
    rationale,
    method: 'rules',
  };
}

function opportunityForIntent(intent: SignalIntent, sentiment: Sentiment): OpportunityType {
  switch (intent) {
    case 'reputation_risk':
      return 'reply_respond';
    case 'support_issue':
      return 'reply_respond';
    case 'bug_report':
      return 'fix_bug';
    case 'feature_request':
      return 'build_feature';
    case 'product_question':
      return 'add_faq';
    case 'purchase_comparison':
      return 'improve_landing';
    case 'coaching_need':
    case 'seo_content_opportunity':
      return 'create_content';
    case 'backlink_opportunity':
      return 'pursue_backlink';
    case 'creator_opportunity':
    case 'partnership_opportunity':
      return 'contact_creator';
    case 'competitive_intel':
      return 'monitor_only';
    case 'press_media':
      return 'reply_respond';
    case 'brand_mention':
      return sentiment === 'negative' ? 'reply_respond' : 'monitor_only';
    case 'spam_noise':
      return 'ignore_archive';
    default:
      return 'monitor_only';
  }
}
