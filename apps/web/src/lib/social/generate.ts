// ============================================================
// SwingVantage — Blog-to-Social: generation orchestrator
//
// Ties the engine together into one SocialGeneration result:
//   analyze → write posts → creative direction → schedule plan.
//
// This module owns the KEYLESS path (deterministic fallback). The AI
// path (ai.ts + prompt.ts) layers on top in the next batch via
// `generateSocial`, which will try AI then fall back to this — same
// output shape either way, so the API/UI never branch on it.
// ============================================================

import type { BlogPost } from '@/data/blog-posts';
import type {
  BlogAnalysis,
  CreativeSuggestions,
  GenerationOptions,
  Platform,
  ScheduleRecommendation,
  ScheduleStep,
  SocialGeneration,
} from './types';
import { DEFAULT_OPTIONS, PROMPT_VERSION } from './types';
import { analyzeBlogPost } from './analyze';
import { buildFallbackPosts } from './fallback';
import { getPlatformRule } from './platforms';

/** Deterministic creative direction grounded in the post (text only). */
export function buildCreative(a: BlogAnalysis): CreativeSuggestions {
  const topic = a.primaryTopic;
  const takeaway = a.keyTakeaways[0] ?? a.practicalBenefit;
  return {
    imageConcept: `A clean, high-contrast shot illustrating ${topic} — the "before vs after" of the fix, with a single arrow/callout drawing the eye to the key detail.`,
    carouselIdea: `${Math.min(a.keyTakeaways.length || 3, 6)} slides: one takeaway per slide (${a.keyTakeaways
      .slice(0, 3)
      .join('; ')}…), each with a one-line fix; final slide = CTA to the full post.`,
    textOverlay: truncate(a.strongestInsight, 70),
    videoAngle: `15–25s: demonstrate the single most actionable tip (${truncate(takeaway, 60)}), then cut to the on-screen takeaway and point to the full guide.`,
    thumbnailHeadline: truncate(titleCaseTopic(topic), 40),
    infographicIdea: `A simple cause → effect visual for ${topic}: the common mistakes on the left, the corrected outcome on the right.`,
    quoteCard: `"${truncate(a.strongestInsight, 120)}" — SwingVantage`,
  };
}

/** Deterministic, configurable-by-priority repost cadence. */
export function buildSchedule(
  a: BlogAnalysis,
  options: GenerationOptions,
): ScheduleRecommendation {
  const priority = orderByPriority(a.recommendedPlatforms, options.platforms);
  const best = priority[0] ?? options.platforms[0] ?? 'linkedin';
  const pick = (i: number): Platform => priority[i % priority.length] ?? best;

  const cadence: ScheduleStep[] = [
    { dayOffset: 0, label: 'Launch post', platform: best, variationType: 'primary' },
    { dayOffset: 2, label: 'Alternate angle', platform: pick(1), variationType: 'alternative_a' },
    { dayOffset: 7, label: 'Practical tip from the post', platform: pick(2), variationType: 'short' },
    { dayOffset: 21, label: 'Evergreen repost', platform: best, variationType: 'alternative_b' },
    { dayOffset: 45, label: 'Refreshed angle', platform: pick(1), variationType: 'conversational' },
  ].filter((s) => getPlatformRule(s.platform).variationTypes.includes(s.variationType));

  const bestTimeNote =
    a.targetAudience === 'business' || best === 'linkedin'
      ? 'Weekday mornings (Tue–Thu, ~8–10am local) tend to perform best for this audience.'
      : 'Weekday late afternoons/evenings and weekend mornings tend to perform best — confirm against your own analytics over time.';

  return { bestPlatform: best, priorityOrder: priority, cadence, bestTimeNote };
}

/**
 * KEYLESS generation: full result with deterministic posts. The AI path
 * (next batch) reuses buildCreative/buildSchedule and only swaps the post
 * writer, so this stays the guaranteed fallback.
 */
export function generateSocialFallback(
  post: BlogPost,
  options: GenerationOptions = DEFAULT_OPTIONS,
): SocialGeneration {
  const analysis = analyzeBlogPost(post);
  const posts = buildFallbackPosts(analysis, options);
  const warnings: string[] = [];
  if (posts.length === 0) warnings.push('No platforms selected.');

  return {
    blogSlug: post.slug,
    blogUrl: analysis.url,
    source: 'fallback',
    model: 'deterministic',
    promptVersion: PROMPT_VERSION,
    generatedAt: new Date().toISOString(),
    options,
    analysis,
    posts,
    creative: buildCreative(analysis),
    schedule: buildSchedule(analysis, options),
    warnings,
  };
}

// ---- helpers ----
function orderByPriority(recommended: Platform[], selected: Platform[]): Platform[] {
  const inBoth = recommended.filter((p) => selected.includes(p));
  const rest = selected.filter((p) => !inBoth.includes(p));
  return [...inBoth, ...rest];
}

function truncate(s: string, n: number): string {
  const t = s.trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}

function titleCaseTopic(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
