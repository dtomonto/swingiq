// ============================================================
// SwingVantage — Blog-to-Social: platform rules engine
//
// Single source of truth for how each channel behaves: limits, how
// links are surfaced, how many hashtags are appropriate, which
// variations to produce, and the tone/notes fed to the AI prompt.
// The generator, the quality scorer, and the prompt all read from here
// so platform behavior never drifts across the codebase.
// ============================================================

import type { Platform, VariationType } from './types';

/** How a link can appear on a given platform. */
export type LinkRule =
  | 'inline' // URL goes directly in the post body
  | 'link_in_bio' // captions aren't clickable; point to profile/bio link
  | 'description'; // dedicated URL/description field (Pinterest)

export interface PlatformRule {
  id: Platform;
  label: string;
  /** Hard character ceiling for the post body. */
  maxChars: number;
  /** Where the copy reads best before it starts to underperform. */
  idealChars: number;
  /** Optional separate title field (Pinterest). */
  titleMaxChars?: number;
  /** [min, max] hashtags that fit native norms. */
  hashtagRange: [number, number];
  /** Variations to generate for this platform. */
  variationTypes: VariationType[];
  linkRule: LinkRule;
  /** utm_source value for this platform. */
  utmSource: string;
  /** On by default in the admin generator. */
  defaultEnabled: boolean;
  /** One-line voice guidance handed to the prompt. */
  tone: string;
  /** Behavior notes handed to the prompt so output stays native. */
  notes: string;
}

const SIX: VariationType[] = [
  'primary',
  'alternative_a',
  'alternative_b',
  'short',
  'professional',
  'conversational',
];

export const PLATFORM_RULES: Record<Platform, PlatformRule> = {
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    maxChars: 3000,
    idealChars: 1300,
    hashtagRange: [2, 5],
    variationTypes: SIX,
    linkRule: 'inline',
    utmSource: 'linkedin',
    defaultEnabled: true,
    tone: 'Professional, insightful, credibility-driven — no corporate fluff.',
    notes:
      'Open with a strong one-line hook, then a short specific insight or lesson from the post, then invite a thoughtful reply. Put the link on its own line near the end. Short paragraphs / line breaks, not a wall of text.',
  },
  x: {
    id: 'x',
    label: 'X / Twitter',
    maxChars: 280,
    idealChars: 250,
    hashtagRange: [0, 3],
    variationTypes: ['primary', 'thread_starter', 'contrarian', 'alternative_a', 'short'],
    linkRule: 'inline',
    utmSource: 'x',
    defaultEnabled: true,
    tone: 'Sharp, concise, scroll-stopping. Confident, not hypey.',
    notes:
      'Respect 280 chars INCLUDING the link (a link costs ~23 chars). primary = one sharp standalone post. thread_starter = a hook line that promises a payoff and ends with the link. contrarian = an insight-led or myth-busting take. 0–3 hashtags max, only if they add reach.',
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    maxChars: 2000,
    idealChars: 420,
    hashtagRange: [0, 2],
    variationTypes: ['primary', 'alternative_a', 'short', 'conversational'],
    linkRule: 'inline',
    utmSource: 'facebook',
    defaultEnabled: true,
    tone: 'Conversational and accessible — like telling a friend something useful.',
    notes:
      'Make the benefit clear in the first sentence. Encourage the click without sounding desperate. A soft question at the end is optional. Minimal hashtags.',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    maxChars: 2200,
    idealChars: 900,
    hashtagRange: [5, 12],
    variationTypes: ['primary', 'alternative_a', 'short', 'conversational'],
    linkRule: 'link_in_bio',
    utmSource: 'instagram',
    defaultEnabled: true,
    tone: 'Visual-first, warm, benefit-led caption.',
    notes:
      'Captions are not clickable — never paste a raw URL in the body; instead say "link in bio". Hook on line 1, value in the middle, CTA at the end. Hashtags go in a block after the caption (5–12).',
  },
  threads: {
    id: 'threads',
    label: 'Threads',
    maxChars: 500,
    idealChars: 400,
    hashtagRange: [0, 1],
    variationTypes: ['primary', 'alternative_a', 'conversational'],
    linkRule: 'inline',
    utmSource: 'threads',
    defaultEnabled: true,
    tone: 'Human, punchy, discussion-oriented.',
    notes:
      'Short paragraphs. Sound like a real person, not a brand. Invite a reply or a take when it fits. Link inline is fine. At most one hashtag.',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok caption',
    maxChars: 2200,
    idealChars: 150,
    hashtagRange: [3, 6],
    variationTypes: ['primary', 'short'],
    linkRule: 'link_in_bio',
    utmSource: 'tiktok',
    defaultEnabled: false,
    tone: 'Curiosity-driven, benefit-oriented, never cringe or exaggerated.',
    notes:
      'Caption supports a short-form video. Lead with curiosity or a concrete benefit, CTA to read the full post (link in bio). Suggest a video angle in the rationale. 3–6 niche hashtags.',
  },
  youtube_community: {
    id: 'youtube_community',
    label: 'YouTube Community',
    maxChars: 1500,
    idealChars: 600,
    hashtagRange: [0, 3],
    variationTypes: ['primary', 'alternative_a'],
    linkRule: 'inline',
    utmSource: 'youtube',
    defaultEnabled: false,
    tone: 'Community-style preview that rewards the reader before the click.',
    notes:
      'Give a genuine preview of the post’s strongest insight, then point to the full article with the link inline. Friendly, community voice.',
  },
  pinterest: {
    id: 'pinterest',
    label: 'Pinterest',
    maxChars: 500,
    idealChars: 200,
    titleMaxChars: 100,
    hashtagRange: [0, 5],
    variationTypes: ['primary', 'alternative_a'],
    linkRule: 'description',
    utmSource: 'pinterest',
    defaultEnabled: false,
    tone: 'Search-friendly and keyword-rich; save + click intent.',
    notes:
      'Treat this as SEO: a search-friendly pin title (≤100 chars) and a keyword-rich description. The blog URL goes in the pin’s destination field. Suggest a pin text overlay in the rationale. Keywords over hashtags.',
  },
  reddit: {
    id: 'reddit',
    label: 'Reddit (discussion)',
    maxChars: 10000,
    idealChars: 600,
    hashtagRange: [0, 0],
    variationTypes: ['primary'],
    linkRule: 'inline',
    utmSource: 'reddit',
    defaultEnabled: false,
    tone: 'Genuine, non-promotional, community-respecting.',
    notes:
      'ONLY suitable when the topic naturally supports discussion. Frame the blog’s insight as a real question or observation, not an ad. No hashtags. Provide a clearly-disclosed version (mentions affiliation) — never astroturf.',
  },
};

export const ALL_PLATFORMS = Object.keys(PLATFORM_RULES) as Platform[];

export const DEFAULT_PLATFORMS: Platform[] = ALL_PLATFORMS.filter(
  (p) => PLATFORM_RULES[p].defaultEnabled,
);

export function getPlatformRule(p: Platform): PlatformRule {
  return PLATFORM_RULES[p];
}

export function platformLabel(p: Platform): string {
  return PLATFORM_RULES[p]?.label ?? p;
}

/** A link counts against X's budget at the fixed t.co length (~23). */
export const TWITTER_LINK_COST = 23;
