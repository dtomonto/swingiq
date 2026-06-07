// ============================================================
// SwingVantage — Blog-to-Social: deterministic fallback writer
//
// Produces real, platform-native posts from a BlogAnalysis with NO AI.
// This is the keyless-first default (and the safety net if an AI call
// fails). Copy is assembled from the post's own insight/benefit/topic so
// it stays specific and grounded, never generic filler. Each platform +
// variation is composed differently per PLATFORM_RULES.
// ============================================================

import type {
  BlogAnalysis,
  CtaIntensity,
  CtaType,
  GeneratedPost,
  GenerationOptions,
  HookType,
  Platform,
  PostObjective,
  VariationType,
} from './types';
import { getPlatformRule, TWITTER_LINK_COST } from './platforms';
import { socialUtmUrl } from './utm';
import { buildHashtags } from './hashtags';
import { scorePost } from './quality';

// ---- CTA copy (contextual, never "click here") ----
const CTA_TEXT: Record<CtaType, string> = {
  read_guide: 'Read the full guide',
  see_breakdown: 'See the full breakdown',
  get_strategy: 'Get the complete strategy',
  learn_framework: 'Learn the framework',
  compare_options: 'Compare the options',
  view_analysis: 'See the full analysis',
  use_checklist: 'Use the checklist',
  explore_article: 'Explore the full article',
  see_how: 'See how it works',
  start_post: 'Start with the full post',
};

function pickCtaType(objective: PostObjective, analysis: BlogAnalysis): CtaType {
  switch (analysis.primaryAngle) {
    case 'comparison':
      return 'compare_options';
    case 'checklist':
      return 'use_checklist';
    case 'data_backed':
      return 'view_analysis';
    case 'step_by_step':
    case 'beginner_guide':
      return 'read_guide';
    case 'advanced_strategy':
      return 'get_strategy';
    default:
      break;
  }
  if (objective === 'free_tool_usage') return 'see_how';
  if (objective === 'build_credibility') return 'view_analysis';
  return 'see_breakdown';
}

function ctaPhrase(cta: CtaType, intensity: CtaIntensity): string {
  const base = CTA_TEXT[cta]; // e.g. "Read the full guide"
  if (intensity === 'direct') return `${base} →`;
  if (intensity === 'soft') {
    const lc = base.charAt(0).toLowerCase() + base.slice(1);
    return `If it's useful, ${lc}`;
  }
  return base; // medium
}

// ---- Hooks (grounded in the analysis) ----
function pickHookType(
  variation: VariationType,
  analysis: BlogAnalysis,
  learnedTopHook?: HookType,
): HookType {
  // Lead the strongest variations with the historically best hook, when known.
  if (learnedTopHook && (variation === 'primary' || variation === 'alternative_a')) {
    return learnedTopHook;
  }
  switch (variation) {
    case 'contrarian':
      return 'contrarian';
    case 'thread_starter':
      return 'curiosity';
    case 'professional':
      return analysis.strongestInsight.match(/\d/) ? 'data' : 'authority';
    case 'conversational':
      return 'pain_point';
    case 'alternative_a':
      return 'curiosity';
    case 'alternative_b':
      return 'question';
    case 'short':
      return 'benefit';
    default:
      return analysis.strongestInsight.match(/\d/) ? 'data' : 'tactical';
  }
}

function buildHook(hook: HookType, a: BlogAnalysis): string {
  const topic = a.primaryTopic;
  switch (hook) {
    case 'question':
      return `Still fighting ${topic}?`;
    case 'contrarian':
      return `Most advice on ${topic} treats the symptom, not the cause.`;
    case 'pain_point':
      return `A ${topic} that keeps coming back usually has one root cause.`;
    case 'curiosity':
      return `There's one detail about ${topic} most people skip.`;
    case 'benefit':
      return capitalize(a.practicalBenefit.replace(/\.$/, ''));
    case 'data':
      return a.strongestInsight;
    case 'mistake':
      return `The most common ${topic} mistake isn't the one you'd expect.`;
    case 'before_after':
      return `What changes when you actually fix ${topic}.`;
    case 'authority':
      return `After breaking down a lot of swings, one ${topic} pattern stands out.`;
    case 'tactical':
      return a.keyTakeaways[0] ?? `A simple way to think about ${topic}.`;
    case 'emotional':
      return `${capitalize(a.emotionalAngle)} — and how to get past it.`;
  }
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Fit X posts to 280 including the (~23 char) link. */
function fitX(body: string, url: string): string {
  const budget = 280 - TWITTER_LINK_COST - 1; // 1 for the space
  let b = body.trim();
  if (b.length > budget) b = b.slice(0, budget - 1).replace(/\s+\S*$/, '') + '…';
  return `${b} ${url}`;
}

interface Composed {
  text: string;
  hookType: HookType;
  ctaType: CtaType;
}

function compose(
  a: BlogAnalysis,
  platform: Platform,
  variation: VariationType,
  options: GenerationOptions,
  url: string,
  learnedTopHook?: HookType,
): Composed {
  const hookType = pickHookType(variation, a, learnedTopHook);
  const ctaType = pickCtaType(options.objective, a);
  const hook = buildHook(hookType, a);
  const cta = ctaPhrase(ctaType, options.ctaIntensity);
  const insight = a.strongestInsight;
  const takeaway = a.keyTakeaways[0] ?? a.practicalBenefit;

  let text: string;

  switch (platform) {
    case 'x': {
      const body =
        variation === 'thread_starter'
          ? `${hook}\n\nThe fix comes down to one thing 🧵`
          : variation === 'contrarian'
            ? `${buildHook('contrarian', a)} ${takeaway}`
            : variation === 'short'
              ? hook
              : `${hook} ${insight}`;
      text = fitX(body, url);
      break;
    }
    case 'linkedin': {
      const parts = [
        hook,
        '',
        insight,
        variation === 'professional' ? `\nWhy it matters: ${takeaway}` : '',
        variation === 'conversational' ? `\nCurious how others approach this — what's worked for you?` : '',
        '',
        `${cta}: ${url}`,
      ].filter((p) => p !== '');
      text = parts.join('\n');
      break;
    }
    case 'facebook': {
      text =
        variation === 'short'
          ? `${hook}\n\n${cta}: ${url}`
          : `${hook}\n\n${insight}\n\n${cta}: ${url}`;
      break;
    }
    case 'threads': {
      text = `${hook}\n\n${takeaway}\n\n${cta}: ${url}`;
      break;
    }
    case 'youtube_community': {
      text = `${hook}\n\n${insight}\n\n${cta}: ${url}`;
      break;
    }
    case 'reddit': {
      // Non-promotional discussion framing; link disclosed at the end.
      text =
        `${buildHook('question', a)} ${insight}\n\n` +
        `Curious how others handle this. ` +
        `(I wrote up the full reasoning here — happy to discuss: ${url})`;
      break;
    }
    case 'instagram': {
      text =
        `${hook}\n\n${insight}\n\n${cta} — link in bio.`;
      break;
    }
    case 'tiktok': {
      text = `${hook} ${cta} (link in bio).`;
      break;
    }
    case 'pinterest': {
      // Description field; URL lives in the pin destination, not the body.
      text = `${capitalize(a.primaryTopic)}: ${insight} ${takeaway}`;
      break;
    }
    default:
      text = `${hook}\n\n${insight}\n\n${cta}: ${url}`;
  }

  return { text: text.trim(), hookType, ctaType };
}

/** Build a single fallback post (already scored). */
export function buildFallbackPost(
  a: BlogAnalysis,
  platform: Platform,
  variation: VariationType,
  options: GenerationOptions,
  learnedTopHook?: HookType,
): GeneratedPost {
  const url = socialUtmUrl(a.slug, platform, variation, options.campaign);
  const { text, hookType, ctaType } = compose(a, platform, variation, options, url, learnedTopHook);
  const hashtags = buildHashtags(a, platform);
  const { score, warnings } = scorePost(
    { platform, variationType: variation, text, hashtags, utmUrl: url },
    a,
  );

  return {
    platform,
    variationType: variation,
    text,
    charCount: text.length,
    utmUrl: url,
    hashtags,
    hookType,
    ctaType,
    rationale: `Keyless draft: ${hookType.replace('_', ' ')} hook for ${getPlatformRule(platform).label}, grounded in the post's strongest insight, with a "${CTA_TEXT[ctaType]}" CTA.`,
    qualityScore: score,
    warnings,
  };
}

/** Build every requested platform's full variation set, deterministically. */
export function buildFallbackPosts(
  a: BlogAnalysis,
  options: GenerationOptions,
  learnedTopHook?: HookType,
): GeneratedPost[] {
  const out: GeneratedPost[] = [];
  for (const platform of options.platforms) {
    for (const variation of getPlatformRule(platform).variationTypes) {
      out.push(buildFallbackPost(a, platform, variation, options, learnedTopHook));
    }
  }
  return out;
}
