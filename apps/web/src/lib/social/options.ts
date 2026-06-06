// ============================================================
// SwingVantage — Blog-to-Social: option validation
//
// One safe parser for generation options, shared by the API route and
// the admin UI. Unknown/invalid values fall back to safe defaults; the
// platform list is intersected with the real set so nothing bogus slips
// through. Pure + testable.
// ============================================================

import type {
  AudienceSegment,
  AutomationMode,
  BrandVoice,
  CtaIntensity,
  GenerationOptions,
  Platform,
  PostObjective,
} from './types';
import { DEFAULT_OPTIONS } from './types';
import { ALL_PLATFORMS, DEFAULT_PLATFORMS } from './platforms';
import { slugifyUtm } from './utm';

const BRAND_VOICES: BrandVoice[] = [
  'professional', 'expert', 'friendly', 'premium', 'bold', 'analytical', 'coach',
  'founder', 'educational', 'conversational', 'youthful', 'technical', 'executive', 'simple',
];
const AUDIENCES: AudienceSegment[] = [
  'beginners', 'advanced', 'parents', 'coaches', 'athletes', 'business', 'decision_makers',
  'casual', 'technical', 'high_intent', 'free_users', 'returning', 'subscribers',
];
const OBJECTIVES: PostObjective[] = [
  'drive_traffic', 'generate_discussion', 'build_credibility', 'educate', 'promote_product',
  'announce_update', 'seo_distribution', 'build_community', 'email_signups', 'free_tool_usage',
];
const CTA_INTENSITIES: CtaIntensity[] = ['soft', 'medium', 'direct'];
const AUTOMATION: AutomationMode[] = ['manual', 'semi_automatic', 'fully_automatic'];

function pick<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return typeof value === 'string' && (allowed as string[]).includes(value) ? (value as T) : fallback;
}

/** Exposed so the admin UI can render dropdowns from the same source of truth. */
export const OPTION_CHOICES = {
  platforms: ALL_PLATFORMS,
  brandVoices: BRAND_VOICES,
  audiences: AUDIENCES,
  objectives: OBJECTIVES,
  ctaIntensities: CTA_INTENSITIES,
  automation: AUTOMATION,
};

export function sanitizeOptions(raw: unknown): GenerationOptions {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const platforms = Array.isArray(o.platforms)
    ? (o.platforms.filter((p) => (ALL_PLATFORMS as string[]).includes(p as string)) as Platform[])
    : [];

  const audienceValid =
    typeof o.audience === 'string' && (AUDIENCES as string[]).includes(o.audience);

  return {
    platforms: platforms.length > 0 ? Array.from(new Set(platforms)) : DEFAULT_PLATFORMS,
    brandVoice: pick(o.brandVoice, BRAND_VOICES, DEFAULT_OPTIONS.brandVoice),
    audience: audienceValid ? (o.audience as AudienceSegment) : undefined,
    objective: pick(o.objective, OBJECTIVES, DEFAULT_OPTIONS.objective),
    ctaIntensity: pick(o.ctaIntensity, CTA_INTENSITIES, DEFAULT_OPTIONS.ctaIntensity),
    // We never auto-publish, so cap automation at semi-automatic regardless of input.
    automationMode: (() => {
      const m = pick(o.automationMode, AUTOMATION, DEFAULT_OPTIONS.automationMode);
      return m === 'fully_automatic' ? 'semi_automatic' : m;
    })(),
    campaign: typeof o.campaign === 'string' && o.campaign.trim()
      ? slugifyUtm(o.campaign)
      : undefined,
  };
}
