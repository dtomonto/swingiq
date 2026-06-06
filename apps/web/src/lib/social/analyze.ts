// ============================================================
// SwingVantage — Blog-to-Social: deterministic blog analysis
//
// Reads a BlogPost and produces a structured BlogAnalysis with NO AI.
// This serves two jobs: (1) it's the grounded input handed to the AI
// prompt, and (2) it's the source of truth for the keyless fallback, so
// the generator produces real, specific posts even with no API key.
//
// Heuristic, not magic — but grounded entirely in the post's own words,
// so it never fabricates claims.
// ============================================================

import type { BlogPost } from '@/data/blog-posts';
import type {
  AudienceSegment,
  BlogAnalysis,
  ContentAngle,
  ContentTimeliness,
  FunnelStage,
  Platform,
} from './types';
import { blogUrl } from './utm';
import { sportHashtags, toHashtag } from './hashtags';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'for', 'with', 'your', 'you',
  'how', 'what', 'why', 'is', 'are', 'it', 'this', 'that', 'most', 'common', 'best', 'guide',
  'tips', 'ways', 'from', 'into', 'at', 'by', 'as', 'be', 'can', 'will', 'do', 'does',
]);

/** Split prose into trimmed sentences. */
function sentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Strip markdown markers we use in blog content (## and **bold**). */
function stripMarkdown(s: string): string {
  return s.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
}

/** Section headers (## ...) become candidate takeaways. */
function sectionHeaders(content: string): string[] {
  return content
    .split('\n')
    .filter((l) => l.startsWith('## '))
    .map((l) => stripMarkdown(l));
}

/** Bold lead lines like "**1. An out-to-in club path.**" → short takeaways. */
function boldLeads(content: string): string[] {
  const out: string[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const t = m[1].trim().replace(/^\d+\.\s*/, '');
    if (t.length > 6 && t.length < 120) out.push(t);
  }
  return out;
}

/** First sentence that carries a number/percentage — usually the strongest. */
function statInsight(content: string): string | null {
  for (const s of sentences(content)) {
    if (/\b\d+(\.\d+)?\s?%/.test(s) || /\b\d{2,}\b/.test(s)) {
      const clean = stripMarkdown(s);
      if (clean.length > 20 && clean.length < 240) return clean;
    }
  }
  return null;
}

function keywords(post: BlogPost): string[] {
  const fromTitle = post.title
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  const merged = [...post.tags.map((t) => t.toLowerCase()), ...fromTitle];
  return Array.from(new Set(merged)).slice(0, 10);
}

function inferAngle(post: BlogPost): ContentAngle {
  const t = `${post.title} ${post.category}`.toLowerCase();
  if (/\bmyth|misconception|truth about\b/.test(t)) return 'myth_busting';
  if (/\bmistake|stop doing|avoid|wrong\b/.test(t)) return 'mistake_to_avoid';
  if (/\bvs\b|versus|compare|comparison|better\b/.test(t)) return 'comparison';
  if (/\bcase study|story|journey\b/.test(t)) return 'case_study';
  if (/\bchecklist|steps?\b/.test(t) || /^\d+\s/.test(post.title)) return 'checklist';
  if (/\bhow to\b/.test(t)) return 'problem_solution';
  if (/\bguide|beginner|start|basics\b/.test(t)) return 'beginner_guide';
  if (/\badvanced|elite|pro\b/.test(t)) return 'advanced_strategy';
  if (/\bdata|numbers|stats|launch monitor|metric\b/.test(t)) return 'data_backed';
  return 'expert_insight';
}

function inferFunnel(post: BlogPost): FunnelStage {
  const t = `${post.title} ${post.category} ${post.tags.join(' ')}`.toLowerCase();
  if (/\bprice|pricing|free|start|sign up|trial|tool\b/.test(t)) return 'conversion';
  if (/\bvs\b|compare|review|alternative|best\b/.test(t)) return 'consideration';
  if (/\broutine|maintain|advanced|next level|keep\b/.test(t)) return 'retention';
  return 'awareness';
}

function inferTimeliness(post: BlogPost): ContentTimeliness {
  const t = `${post.title} ${post.category}`.toLowerCase();
  if (/\bmyth|debate|unpopular|controversial|wrong\b/.test(t)) return 'controversial';
  if (/\bdrill|how to|fix|steps?\b/.test(t)) return 'tactical';
  if (/\b202\d|new|update|announc|release\b/.test(t)) return 'timely';
  if (/\bmindset|confidence|motivation|why i\b/.test(t)) return 'inspirational';
  return 'evergreen';
}

function inferAudience(post: BlogPost): AudienceSegment {
  const t = `${post.title} ${post.category} ${post.tags.join(' ')}`.toLowerCase();
  if (/\bcoach|teaching|lesson plan\b/.test(t)) return 'coaches';
  if (/\bparent|junior|kid|youth\b/.test(t)) return 'parents';
  if (/\badvanced|elite|tour|pro\b/.test(t)) return 'advanced';
  if (/\bbeginner|first time|basics|new to\b/.test(t)) return 'beginners';
  return 'athletes';
}

const ANGLE_EMOTION: Record<ContentAngle, string> = {
  problem_solution: 'the frustration of a fault that keeps coming back',
  mistake_to_avoid: 'the relief of not wasting more practice time',
  myth_busting: 'the satisfaction of finally getting the real answer',
  expert_insight: 'the confidence of understanding the "why"',
  step_by_step: 'the calm of having a clear plan',
  data_backed: 'trust in evidence over guesswork',
  checklist: 'the control of a simple, repeatable system',
  beginner_guide: 'the encouragement of a clear starting point',
  advanced_strategy: 'the edge of a smarter approach',
  comparison: 'the clarity of a confident decision',
  trend_analysis: 'curiosity about where things are heading',
  case_study: 'belief that change is actually possible',
  personal_improvement: 'pride in measurable progress',
  time_saving: 'the relief of practicing less but better',
  money_saving: 'the satisfaction of spending smarter',
  performance: 'the drive to perform when it counts',
  competitive_advantage: 'the motivation to get ahead',
};

function recommendPlatforms(angle: ContentAngle, funnel: FunnelStage): Platform[] {
  const base: Platform[] = ['linkedin', 'x', 'facebook', 'instagram', 'threads'];
  // Visual/tactical content earns a TikTok nod; decision-stage earns Pinterest (search).
  if (angle === 'step_by_step' || angle === 'checklist' || angle === 'beginner_guide') {
    base.push('tiktok');
  }
  if (funnel === 'consideration' || angle === 'comparison') base.push('pinterest');
  return Array.from(new Set(base));
}

/** Produce the grounded analysis for a blog post. Deterministic. */
export function analyzeBlogPost(post: BlogPost): BlogAnalysis {
  const headers = sectionHeaders(post.content);
  const leads = boldLeads(post.content);
  const takeaways = (leads.length >= 3 ? leads : [...leads, ...headers]).slice(0, 6);
  const insight =
    statInsight(post.content) ?? leads[0] ?? stripMarkdown(headers[0] ?? post.excerpt);

  const angle = inferAngle(post);
  const funnel = inferFunnel(post);
  const kws = keywords(post);

  const recommendedHashtags = Array.from(
    new Set([
      ...sportHashtags(post.sport),
      ...post.tags.map((t) => toHashtag(t)).filter((t): t is string => Boolean(t)),
    ]),
  ).slice(0, 8);

  const primaryTopic = post.title
    .replace(/^how to\s+/i, '')
    .replace(/:.*/, '')
    .trim()
    .toLowerCase();

  return {
    slug: post.slug,
    title: post.title,
    url: blogUrl(post.slug),
    metaDescription: post.metaDescription,
    summary: post.excerpt,
    primaryTopic,
    targetAudience: inferAudience(post),
    searchIntent: post.metaDescription || `how to ${primaryTopic}`,
    keyTakeaways: takeaways,
    strongestInsight: insight,
    emotionalAngle: ANGLE_EMOTION[angle],
    practicalBenefit: takeaways[0] ?? post.excerpt,
    keywords: kws,
    recommendedHashtags,
    contentCategory: post.category,
    funnelStage: funnel,
    primaryAngle: angle,
    timeliness: inferTimeliness(post),
    recommendedPlatforms: recommendPlatforms(angle, funnel),
  };
}
