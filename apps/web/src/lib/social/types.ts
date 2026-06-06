// ============================================================
// SwingVantage — Blog-to-Social: shared types
//
// The whole engine speaks these types. Kept framework-free (no React,
// no Supabase imports) so they're safe to use in server routes, the
// deterministic fallback, tests, and the admin UI alike.
// ============================================================

/** Every channel we can generate for. `reddit` is opt-in / discussion-only. */
export type Platform =
  | 'linkedin'
  | 'x'
  | 'facebook'
  | 'instagram'
  | 'threads'
  | 'tiktok'
  | 'youtube_community'
  | 'pinterest'
  | 'reddit';

/**
 * Variation flavors. Not every platform produces every one — each
 * platform declares its set in PLATFORM_RULES (see platforms.ts).
 */
export type VariationType =
  | 'primary'
  | 'alternative_a'
  | 'alternative_b'
  | 'short'
  | 'professional'
  | 'conversational'
  | 'thread_starter' // X-specific
  | 'contrarian'; // X-specific

export type BrandVoice =
  | 'professional'
  | 'expert'
  | 'friendly'
  | 'premium'
  | 'bold'
  | 'analytical'
  | 'coach'
  | 'founder'
  | 'educational'
  | 'conversational'
  | 'youthful'
  | 'technical'
  | 'executive'
  | 'simple';

export type AudienceSegment =
  | 'beginners'
  | 'advanced'
  | 'parents'
  | 'coaches'
  | 'athletes'
  | 'business'
  | 'decision_makers'
  | 'casual'
  | 'technical'
  | 'high_intent'
  | 'free_users'
  | 'returning'
  | 'subscribers';

export type PostObjective =
  | 'drive_traffic'
  | 'generate_discussion'
  | 'build_credibility'
  | 'educate'
  | 'promote_product'
  | 'announce_update'
  | 'seo_distribution'
  | 'build_community'
  | 'email_signups'
  | 'free_tool_usage';

export type CtaIntensity = 'soft' | 'medium' | 'direct';

export type HookType =
  | 'question'
  | 'contrarian'
  | 'pain_point'
  | 'curiosity'
  | 'benefit'
  | 'data'
  | 'mistake'
  | 'before_after'
  | 'authority'
  | 'tactical'
  | 'emotional';

export type CtaType =
  | 'read_guide'
  | 'see_breakdown'
  | 'get_strategy'
  | 'learn_framework'
  | 'compare_options'
  | 'view_analysis'
  | 'use_checklist'
  | 'explore_article'
  | 'see_how'
  | 'start_post';

export type ContentAngle =
  | 'problem_solution'
  | 'mistake_to_avoid'
  | 'myth_busting'
  | 'expert_insight'
  | 'step_by_step'
  | 'data_backed'
  | 'checklist'
  | 'beginner_guide'
  | 'advanced_strategy'
  | 'comparison'
  | 'trend_analysis'
  | 'case_study'
  | 'personal_improvement'
  | 'time_saving'
  | 'money_saving'
  | 'performance'
  | 'competitive_advantage';

export type FunnelStage = 'awareness' | 'consideration' | 'conversion' | 'retention';

export type ContentTimeliness =
  | 'evergreen'
  | 'timely'
  | 'tactical'
  | 'educational'
  | 'controversial'
  | 'inspirational'
  | 'promotional';

export type PostStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'published';

export type AutomationMode = 'manual' | 'semi_automatic' | 'fully_automatic';

/** Where the generated copy came from — surfaced honestly in the UI. */
export type GenerationSource = 'ai' | 'fallback';

/** Deterministic read of a blog post — AI input AND keyless fallback source. */
export interface BlogAnalysis {
  slug: string;
  title: string;
  url: string;
  metaDescription: string;
  summary: string;
  primaryTopic: string;
  targetAudience: AudienceSegment;
  searchIntent: string;
  keyTakeaways: string[];
  strongestInsight: string;
  emotionalAngle: string;
  practicalBenefit: string;
  keywords: string[];
  recommendedHashtags: string[];
  contentCategory: string;
  funnelStage: FunnelStage;
  primaryAngle: ContentAngle;
  timeliness: ContentTimeliness;
  recommendedPlatforms: Platform[];
}

/** One generated variation for one platform. */
export interface GeneratedPost {
  platform: Platform;
  variationType: VariationType;
  text: string;
  charCount: number;
  utmUrl: string;
  hashtags: string[];
  hookType: HookType;
  ctaType: CtaType;
  rationale: string;
  qualityScore: number; // 1–100
  warnings: string[];
}

export interface CreativeSuggestions {
  imageConcept: string;
  carouselIdea: string;
  textOverlay: string;
  videoAngle: string;
  thumbnailHeadline: string;
  infographicIdea: string;
  quoteCard: string;
}

export interface ScheduleStep {
  dayOffset: number;
  label: string;
  platform: Platform;
  variationType: VariationType;
}

export interface ScheduleRecommendation {
  bestPlatform: Platform;
  priorityOrder: Platform[];
  cadence: ScheduleStep[];
  bestTimeNote: string;
}

export interface GenerationOptions {
  platforms: Platform[];
  brandVoice: BrandVoice;
  audience?: AudienceSegment; // overrides inferred audience
  objective: PostObjective;
  ctaIntensity: CtaIntensity;
  automationMode: AutomationMode;
  campaign?: string; // utm_campaign override
}

/** The full result of generating social content for one blog post. */
export interface SocialGeneration {
  blogSlug: string;
  blogUrl: string;
  source: GenerationSource;
  model: string;
  promptVersion: string;
  generatedAt: string; // ISO
  options: GenerationOptions;
  analysis: BlogAnalysis;
  posts: GeneratedPost[];
  creative: CreativeSuggestions;
  schedule: ScheduleRecommendation;
  warnings: string[];
}

export const DEFAULT_OPTIONS: GenerationOptions = {
  platforms: ['linkedin', 'x', 'facebook', 'instagram', 'threads'],
  brandVoice: 'coach',
  objective: 'drive_traffic',
  ctaIntensity: 'medium',
  automationMode: 'semi_automatic',
};

export const PROMPT_VERSION = 'social-v1';
