// ============================================================
// SwingVantage — Blog-to-Social: quality scoring
//
// Deterministic 1–100 score + actionable warnings for each generated
// post. Runs on AI output AND fallback output, so nothing low-quality
// ships silently. Checks platform fit, hook strength, specificity,
// non-generic language, CTA, readability, and link presence.
// ============================================================

import type { BlogAnalysis, GeneratedPost, Platform, VariationType } from './types';
import { getPlatformRule } from './platforms';

/** Marketing filler / AI tells the spec explicitly bans. */
export const BANNED_PHRASES = [
  'in today’s fast-paced world',
  "in today's fast-paced world",
  'unlock the power of',
  'game-changer',
  'game changer',
  'dive into',
  'revolutionize',
  'revolutionise',
  "don't miss out",
  'don’t miss out',
  'this changes everything',
  "here's why you need to",
  'here’s why you need to',
  'elevate your',
  'take it to the next level',
  'in conclusion',
  'look no further',
];

const CTA_CUES = [
  'read', 'full', 'guide', 'breakdown', 'see', 'learn', 'compare', 'view', 'checklist',
  'explore', 'how', 'start', 'get the', 'link in bio',
];

export interface ScoreInput {
  platform: Platform;
  variationType: VariationType;
  text: string;
  hashtags: string[];
  utmUrl: string;
}

export interface QualityResult {
  score: number;
  warnings: string[];
}

const URL_RE = /https?:\/\/\S+/i;

function firstLine(text: string): string {
  return text.split('\n').map((l) => l.trim()).find((l) => l.length > 0) ?? '';
}

/** Score one post 1–100 and collect warnings. Pure + synchronous. */
export function scorePost(input: ScoreInput, analysis: BlogAnalysis): QualityResult {
  const rule = getPlatformRule(input.platform);
  const text = input.text ?? '';
  const len = text.length;
  const lower = text.toLowerCase();
  const warnings: string[] = [];

  // ---- platform fit (chars + hashtags + link) ----
  let platformFit = 1;
  const linkInText = URL_RE.test(text);

  if (len > rule.maxChars) {
    platformFit -= 0.6;
    warnings.push(`Over ${rule.label} limit (${len}/${rule.maxChars} chars)`);
  } else if (len > rule.idealChars * 1.4) {
    platformFit -= 0.15;
    warnings.push(`Longer than ideal for ${rule.label}`);
  }

  const [hMin, hMax] = rule.hashtagRange;
  if (input.hashtags.length > hMax) {
    platformFit -= 0.2;
    warnings.push(`Too many hashtags for ${rule.label} (${input.hashtags.length}/${hMax})`);
  } else if (hMax > 0 && input.hashtags.length < hMin) {
    platformFit -= 0.05;
  }

  // ---- link presence (per platform link rule) ----
  let linkPresence = 1;
  if (rule.linkRule === 'inline' && input.platform !== 'reddit') {
    if (!linkInText) {
      linkPresence = 0.2;
      warnings.push('Missing blog link');
    }
  } else if (rule.linkRule === 'link_in_bio') {
    if (linkInText) {
      linkPresence = 0.4;
      warnings.push(`${rule.label} captions aren't clickable — use "link in bio", not a raw URL`);
    } else if (!/link in bio/i.test(text)) {
      linkPresence = 0.7; // not fatal, but a "link in bio" nudge is expected
    }
  }
  // 'description' (Pinterest): URL lives in a field, so body need not contain it.

  // ---- hook strength (first line) ----
  const hook = firstLine(text);
  let hookStrength = 0.5;
  if (hook.length >= 8 && hook.length <= 130) hookStrength += 0.2;
  if (/[?]/.test(hook) || /\b\d/.test(hook)) hookStrength += 0.15; // question or number
  if (!/^(in |the |a |this )/.test(hook.toLowerCase())) hookStrength += 0.15; // not a weak opener
  hookStrength = Math.min(1, hookStrength);
  if (hookStrength < 0.6) warnings.push('Weak opening hook');

  // ---- specificity (grounded in the post) ----
  const hasNumber = /\b\d/.test(text);
  const hitsKeyword = analysis.keywords.some((k) => lower.includes(k.toLowerCase()));
  const specificity = hasNumber || hitsKeyword ? 1 : 0.4;
  if (specificity < 1) warnings.push('Too generic — not clearly tied to the post');

  // ---- non-generic language ----
  let nonGeneric = 1;
  const hitBanned = BANNED_PHRASES.filter((p) => lower.includes(p.toLowerCase()));
  if (hitBanned.length > 0) {
    nonGeneric -= Math.min(0.8, 0.4 * hitBanned.length);
    warnings.push(`Generic/filler phrase: "${hitBanned[0]}"`);
  }

  // ---- CTA strength ----
  const hasCta = CTA_CUES.some((c) => lower.includes(c)) || linkInText;
  const ctaStrength = hasCta ? 1 : 0.4;
  if (!hasCta) warnings.push('No clear call to action');

  // ---- readability ----
  let readability = 1;
  if (len > 600 && !text.includes('\n')) {
    readability -= 0.3;
    warnings.push('Wall of text — add line breaks');
  }
  if (len > 0 && len < 20) {
    readability -= 0.3;
    warnings.push('Too short to be useful');
  }

  // ---- weighted total ----
  const weighted =
    platformFit * 0.22 +
    hookStrength * 0.18 +
    specificity * 0.16 +
    nonGeneric * 0.14 +
    ctaStrength * 0.12 +
    linkPresence * 0.12 +
    readability * 0.06;

  let score = Math.max(1, Math.min(100, Math.round(weighted * 100)));
  // Filler / AI-sounding phrases drag the WHOLE post down — they're the
  // clearest "this wasn't written by a person" signal, so they cut across
  // every other dimension rather than just nudging one.
  if (hitBanned.length > 0) {
    score = Math.round(score * (1 - Math.min(0.45, 0.18 * hitBanned.length)));
  }
  score = Math.max(1, score);
  return { score, warnings };
}

/** Convenience: score an already-built GeneratedPost. */
export function scoreGeneratedPost(post: GeneratedPost, analysis: BlogAnalysis): QualityResult {
  return scorePost(
    {
      platform: post.platform,
      variationType: post.variationType,
      text: post.text,
      hashtags: post.hashtags,
      utmUrl: post.utmUrl,
    },
    analysis,
  );
}
