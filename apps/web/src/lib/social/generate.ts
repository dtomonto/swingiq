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
  CtaType,
  GeneratedPost,
  GenerationOptions,
  HookType,
  Platform,
  ScheduleRecommendation,
  ScheduleStep,
  SocialGeneration,
} from './types';
import { DEFAULT_OPTIONS, PROMPT_VERSION } from './types';
import { analyzeBlogPost } from './analyze';
import { buildFallbackPost, buildFallbackPosts } from './fallback';
import { getPlatformRule } from './platforms';
import { socialUtmUrl } from './utm';
import { buildHashtags } from './hashtags';
import { scorePost } from './quality';
import { buildSystemPrompt, buildUserPrompt } from './prompt';
import { generateSocialWithAI, isSocialAiConfigured, type AiResult } from './ai';
import { loadLearnedPreferences, topHook, rankedPlatforms, type LearnedPreferences } from './learning';
import { aiBudgetExceeded, recordAiSpend } from '@/lib/ai-budget';

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
  learned?: LearnedPreferences,
): ScheduleRecommendation {
  const priority = orderByPriority(
    a.recommendedPlatforms,
    options.platforms,
    learned ? rankedPlatforms(learned) : [],
  );
  const best = priority[0] ?? options.platforms[0] ?? 'linkedin';
  const pick = (i: number): Platform => priority[i % priority.length] ?? best;

  const steps: ScheduleStep[] = [
    { dayOffset: 0, label: 'Launch post', platform: best, variationType: 'primary' },
    { dayOffset: 2, label: 'Alternate angle', platform: pick(1), variationType: 'alternative_a' },
    { dayOffset: 7, label: 'Practical tip from the post', platform: pick(2), variationType: 'short' },
    { dayOffset: 21, label: 'Evergreen repost', platform: best, variationType: 'alternative_b' },
    { dayOffset: 45, label: 'Refreshed angle', platform: pick(1), variationType: 'conversational' },
  ];
  const cadence = steps.filter((s) =>
    getPlatformRule(s.platform).variationTypes.includes(s.variationType),
  );

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
  learned?: LearnedPreferences,
): SocialGeneration {
  const analysis = analyzeBlogPost(post);
  const posts = buildFallbackPosts(analysis, options, learned ? topHook(learned) : undefined);
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
    schedule: buildSchedule(analysis, options, learned),
    warnings,
  };
}

// ---- helpers ----
function orderByPriority(
  recommended: Platform[],
  selected: Platform[],
  learnedOrder: Platform[] = [],
): Platform[] {
  const learnedFirst = learnedOrder.filter((p) => selected.includes(p));
  const inBoth = recommended.filter((p) => selected.includes(p) && !learnedFirst.includes(p));
  const rest = selected.filter((p) => !learnedFirst.includes(p) && !inBoth.includes(p));
  return Array.from(new Set([...learnedFirst, ...inBoth, ...rest]));
}

function truncate(s: string, n: number): string {
  const t = s.trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}

function titleCaseTopic(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================
// AI path — layered on top of the keyless engine.
// ============================================================

const HOOK_TYPES = new Set<HookType>([
  'question', 'contrarian', 'pain_point', 'curiosity', 'benefit', 'data',
  'mistake', 'before_after', 'authority', 'tactical', 'emotional',
]);
const CTA_TYPES = new Set<CtaType>([
  'read_guide', 'see_breakdown', 'get_strategy', 'learn_framework', 'compare_options',
  'view_analysis', 'use_checklist', 'explore_article', 'see_how', 'start_post',
]);

/** Hard safety net so output never EXCEEDS a platform ceiling. */
function enforceMax(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

/** Keep only non-empty string fields from AI-proposed creative. */
function sanitizeCreative(c?: Partial<CreativeSuggestions>): Partial<CreativeSuggestions> {
  if (!c) return {};
  const out: Partial<CreativeSuggestions> = {};
  for (const [k, v] of Object.entries(c)) {
    if (typeof v === 'string' && v.trim()) {
      (out as Record<string, string>)[k] = v.trim();
    }
  }
  return out;
}

/**
 * Map AI creative text into fully-formed posts under OUR guardrails:
 * tracked UTM, clean hashtags, char ceiling, and authoritative scoring.
 * Any platform/variation the AI skipped is filled deterministically, so
 * the result is always complete.
 */
export function assembleFromAi(
  post: { slug: string },
  analysis: BlogAnalysis,
  options: GenerationOptions,
  ai: AiResult,
): { posts: GeneratedPost[]; creative: CreativeSuggestions } {
  const byKey = new Map<string, AiResult['posts'][number]>();
  for (const p of ai.posts) byKey.set(`${p.platform}:${p.variation}`, p);

  const posts: GeneratedPost[] = [];
  for (const platform of options.platforms) {
    const rule = getPlatformRule(platform);
    for (const variation of rule.variationTypes) {
      const aiPost = byKey.get(`${platform}:${variation}`);
      if (!aiPost) {
        posts.push(buildFallbackPost(analysis, platform, variation, options)); // gap-fill
        continue;
      }
      const url = socialUtmUrl(analysis.slug, platform, variation, options.campaign);
      let text = aiPost.text.replace(/\{\{LINK\}\}/g, url).trim();
      // Guarantee an inline link where the platform expects one.
      if (rule.linkRule === 'inline' && platform !== 'reddit' && !/https?:\/\//.test(text)) {
        text = `${text}\n\n${url}`;
      }
      text = enforceMax(text, rule.maxChars);
      const hashtags = buildHashtags(analysis, platform);
      const { score, warnings } = scorePost(
        { platform, variationType: variation, text, hashtags, utmUrl: url },
        analysis,
      );
      posts.push({
        platform,
        variationType: variation,
        text,
        charCount: text.length,
        utmUrl: url,
        hashtags,
        hookType: aiPost.hookType && HOOK_TYPES.has(aiPost.hookType) ? aiPost.hookType : 'tactical',
        ctaType: aiPost.ctaType && CTA_TYPES.has(aiPost.ctaType) ? aiPost.ctaType : 'see_breakdown',
        rationale: aiPost.rationale?.trim() || `AI draft for ${rule.label}, grounded in the post.`,
        qualityScore: score,
        warnings,
      });
    }
  }

  const creative: CreativeSuggestions = { ...buildCreative(analysis), ...sanitizeCreative(ai.creative) };
  return { posts, creative };
}

/**
 * Public entry point. Uses AI when configured (with our guardrails), and
 * transparently falls back to the deterministic engine on any miss — same
 * SocialGeneration shape either way. SERVER-ONLY when AI is configured.
 */
export async function generateSocial(
  post: import('@/data/blog-posts').BlogPost,
  options: GenerationOptions = DEFAULT_OPTIONS,
): Promise<SocialGeneration> {
  // Learn from past performance (empty until metrics exist → pure heuristics).
  const learned = await loadLearnedPreferences();
  if (!isSocialAiConfigured()) return generateSocialFallback(post, options, learned);

  // Global daily AI-spend kill-switch (off unless AI_DAILY_BUDGET_CENTS is set):
  // when spent, use the free deterministic generator instead of a paid call.
  if (await aiBudgetExceeded()) return generateSocialFallback(post, options, learned);

  try {
    const analysis = analyzeBlogPost(post);
    let user = buildUserPrompt(post, analysis, options);
    if (learned.hasData) {
      const th = topHook(learned);
      const tp = rankedPlatforms(learned).slice(0, 3);
      user += `\n\nHISTORICAL SIGNAL (lean this way when natural): best-performing hook = ${th ?? 'n/a'}; best platforms = ${tp.join(', ') || 'n/a'}.`;
    }
    const ai = await generateSocialWithAI(buildSystemPrompt(), user);
    if (!ai) return generateSocialFallback(post, options, learned);
    await recordAiSpend('social-generate');

    const { posts, creative } = assembleFromAi(post, analysis, options, ai);
    if (posts.length === 0) return generateSocialFallback(post, options, learned);

    return {
      blogSlug: post.slug,
      blogUrl: analysis.url,
      source: 'ai',
      model: `${process.env.AI_PROVIDER}:${process.env.OPENAI_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'default'}`,
      promptVersion: PROMPT_VERSION,
      generatedAt: new Date().toISOString(),
      options,
      analysis,
      posts,
      creative,
      schedule: buildSchedule(analysis, options, learned),
      warnings: [],
    };
  } catch {
    return generateSocialFallback(post, options, learned);
  }
}
