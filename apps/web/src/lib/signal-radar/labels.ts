// ============================================================
// SignalRadar OS — display labels + tones (PURE, UI-shared)
// ------------------------------------------------------------
// Human-readable names for every enum + a tone hint for badges, so the
// engine roll-ups and the admin UI render consistent, friendly copy.
// Kept separate from types.ts so the contract stays data-only.
// ============================================================

import type {
  Sentiment,
  SignalIntent,
  AudienceType,
  SignalSport,
  Urgency,
  OpportunityType,
  SignalStatus,
  SignalSourceType,
  AdapterConfigState,
  ConversionKind,
} from './types';
import type { BadgeTone } from '@/components/admin/StatusBadge';

export const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  mixed: 'Mixed',
  unknown: 'Unknown',
};

export const SENTIMENT_TONE: Record<Sentiment, BadgeTone> = {
  positive: 'success',
  neutral: 'neutral',
  negative: 'danger',
  mixed: 'warning',
  unknown: 'neutral',
};

export const INTENT_LABEL: Record<SignalIntent, string> = {
  brand_mention: 'Brand mention',
  product_question: 'Product question',
  support_issue: 'Support issue',
  feature_request: 'Feature request',
  bug_report: 'Bug report',
  purchase_comparison: 'Comparison research',
  coaching_need: 'Coaching need',
  seo_content_opportunity: 'SEO/content opportunity',
  backlink_opportunity: 'Backlink opportunity',
  partnership_opportunity: 'Partnership opportunity',
  creator_opportunity: 'Creator opportunity',
  competitive_intel: 'Competitive intel',
  reputation_risk: 'Reputation risk',
  press_media: 'Press / media',
  spam_noise: 'Spam / noise',
};

export const AUDIENCE_LABEL: Record<AudienceType, string> = {
  recreational_athlete: 'Recreational athlete',
  parent: 'Parent',
  coach: 'Coach / instructor',
  team_league: 'Team / league',
  sports_tech_buyer: 'Sports-tech buyer',
  blogger_media: 'Blogger / media',
  creator: 'Creator / influencer',
  competitor: 'Competitor',
  unknown: 'Unknown',
};

export const SPORT_LABEL: Record<SignalSport, string> = {
  golf: 'Golf',
  tennis: 'Tennis',
  baseball: 'Baseball',
  softball_fast: 'Fastpitch softball',
  softball_slow: 'Slowpitch softball',
  pickleball: 'Pickleball',
  padel: 'Padel',
  multi_sport: 'Multi-sport',
  unknown: 'Unknown',
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const URGENCY_TONE: Record<Urgency, BadgeTone> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

export const OPPORTUNITY_LABEL: Record<OpportunityType, string> = {
  reply_respond: 'Reply / respond',
  create_content: 'Create content',
  build_feature: 'Build feature',
  fix_bug: 'Fix bug',
  improve_onboarding: 'Improve onboarding',
  improve_trust: 'Improve trust page',
  improve_landing: 'Improve landing page',
  add_faq: 'Add FAQ',
  contact_creator: 'Contact creator',
  pursue_backlink: 'Pursue backlink',
  monitor_only: 'Monitor only',
  ignore_archive: 'Ignore / archive',
};

export const STATUS_LABEL: Record<SignalStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  in_progress: 'In progress',
  responded: 'Responded',
  converted_task: 'Converted → task',
  converted_content: 'Converted → content',
  converted_product: 'Converted → product',
  converted_partnership: 'Converted → partnership',
  converted_reputation: 'Converted → reputation',
  archived: 'Archived',
  ignored: 'Ignored',
};

export const SOURCE_TYPE_LABEL: Record<SignalSourceType, string> = {
  search: 'Search',
  rss: 'RSS feed',
  google_alerts: 'Google Alerts',
  reddit: 'Reddit',
  youtube: 'YouTube',
  blog_news: 'Blog / news',
  backlink: 'Backlink',
  social: 'Social',
  competitor: 'Competitor',
  ai_answer_engine: 'AI answer engine',
  support: 'Support',
  analytics: 'Analytics',
  search_console: 'Search Console',
  manual: 'Manual',
  csv: 'CSV',
  webhook: 'Webhook',
};

export const ADAPTER_STATE_LABEL: Record<AdapterConfigState, string> = {
  active: 'Active',
  configured_disabled: 'Configured · disabled',
  missing_credentials: 'Missing credentials',
  manual_only: 'Manual only',
  placeholder: 'Placeholder',
  failing: 'Failing',
  healthy: 'Healthy',
};

export const ADAPTER_STATE_TONE: Record<AdapterConfigState, BadgeTone> = {
  active: 'success',
  healthy: 'success',
  manual_only: 'info',
  configured_disabled: 'neutral',
  missing_credentials: 'warning',
  placeholder: 'neutral',
  failing: 'danger',
};

export const CONVERSION_LABEL: Record<ConversionKind, string> = {
  content_idea: 'SEO content idea',
  product_feedback: 'Product feedback',
  partnership_lead: 'Partnership lead',
  support_response: 'Support response',
  reputation_risk: 'Reputation risk',
};

export function priorityTone(priority: number): BadgeTone {
  if (priority >= 80) return 'danger';
  if (priority >= 60) return 'warning';
  if (priority >= 35) return 'info';
  return 'neutral';
}
