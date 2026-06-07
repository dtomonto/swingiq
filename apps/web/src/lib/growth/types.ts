// ============================================================
// GrowthOS — Type System (the contract every module builds on)
// ------------------------------------------------------------
// This is the single source of truth for GrowthOS data models. It is
// framework-agnostic and contains zero runtime logic so it can be
// imported by server components, client components, repositories,
// mock-data seeds, and future API/DB adapters alike.
//
// Design notes:
// - Every record carries a `dataSource` so the UI can HONESTLY label
//   whether a value is real, estimated, imported, placeholder, or mock.
// - Shared enums (FunnelStage, GrowthLever, ChannelType, scales) keep
//   the 28 modules consistent and let the generic module engine render
//   any record from a small definition.
// - All 32 data models from the GrowthOS spec live here (§36).
// ============================================================

// ──────────────────────────────────────────────────────────────
// Shared primitives
// ──────────────────────────────────────────────────────────────

/** How trustworthy a value is. The UI must surface this — never fake real data. */
export type DataSource = 'real' | 'estimated' | 'imported' | 'placeholder' | 'mock';

/** AARRR-style funnel stages, extended for brand + advocacy. */
export type FunnelStage =
  | 'awareness'
  | 'consideration'
  | 'acquisition'
  | 'activation'
  | 'engagement'
  | 'conversion'
  | 'retention'
  | 'referral'
  | 'revenue'
  | 'advocacy';

/** The strategic lever a piece of work pulls (§6, §35). */
export type GrowthLever =
  | 'awareness'
  | 'acquisition'
  | 'activation'
  | 'conversion'
  | 'retention'
  | 'referral'
  | 'revenue-expansion'
  | 'brand-authority'
  | 'community'
  | 'partnerships'
  | 'seo'
  | 'aeo'
  | 'geo'
  | 'paid-media'
  | 'product-led-growth';

/** Owned / paid / earned taxonomy plus modern channel types (§7). */
export type ChannelType =
  | 'owned'
  | 'paid'
  | 'earned'
  | 'shared'
  | 'partner'
  | 'lifecycle'
  | 'community'
  | 'referral'
  | 'affiliate'
  | 'retention';

/** Three-point scale used across scoring inputs. */
export type Scale = 'low' | 'medium' | 'high';

/** Generic maturity for a channel or initiative. */
export type Maturity = 'experimental' | 'emerging' | 'developing' | 'established' | 'mature';

/** Consistent priority scoring inputs (ICE + strategic fit + urgency, §6/§21). */
export interface PriorityInputs {
  impact: Scale;
  confidence: Scale;
  effort: Scale;
  strategicFit?: Scale;
  urgency?: Scale;
}

/** Fields shared by (almost) every GrowthOS record. */
export interface BaseRecord {
  id: string;
  /** Human label shown in tables / detail headers. */
  name: string;
  dataSource: DataSource;
  owner?: string;
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// ──────────────────────────────────────────────────────────────
// 1. Channels & strategy
// ──────────────────────────────────────────────────────────────

export type ChannelStatus =
  | 'active'
  | 'underdeveloped'
  | 'overfunded'
  | 'high-potential'
  | 'experimental'
  | 'paused'
  | 'sunset';

export interface MarketingChannel extends BaseRecord {
  channelType: ChannelType;
  primaryObjective: string;
  funnelStage: FunnelStage;
  targetAudience: string;
  monthlyBudgetUsd: number | null;
  expectedCacUsd: number | null;
  expectedConversionRate: number | null; // 0..1
  expectedRoi: number | null; // e.g. 3 => 3x
  maturity: Maturity;
  status: ChannelStatus;
  requiredAssets: string[];
  dependencies: string[];
  risks: string[];
  nextBestAction: string;
  lever: GrowthLever;
}

export type StrategyStatus = 'idea' | 'planned' | 'in-progress' | 'live' | 'paused' | 'done' | 'archived';

export interface MarketingStrategy extends BaseRecord {
  objective: string;
  targetAudience: string;
  persona: string;
  funnelStage: FunnelStage;
  lever: GrowthLever;
  channelMix: string[];
  coreMessage: string;
  offer: string;
  cta: string;
  requiredAssets: string[];
  expectedImpact: string;
  priority: PriorityInputs;
  timeline: string;
  dependencies: string[];
  status: StrategyStatus;
  aiRecommendation?: string;
}

// ──────────────────────────────────────────────────────────────
// 2. Campaigns & paid media
// ──────────────────────────────────────────────────────────────

export type CampaignType =
  | 'launch' | 'product' | 'feature-announcement' | 'content' | 'seo'
  | 'paid-acquisition' | 'retargeting' | 'email' | 'sms' | 'push'
  | 'lifecycle' | 'referral' | 'affiliate' | 'creator' | 'partner'
  | 'community' | 'digital-pr' | 'seasonal' | 'win-back' | 'upgrade' | 'monetization';

export type CampaignStatus = 'idea' | 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';

export interface MarketingCampaign extends BaseRecord {
  campaignType: CampaignType;
  objective: string;
  targetAudience: string;
  persona: string;
  funnelStage: FunnelStage;
  channelMix: string[];
  coreMessage: string;
  offer: string;
  cta: string;
  landingPage: string;
  budgetUsd: number | null;
  startDate: string | null;
  endDate: string | null;
  status: CampaignStatus;
  kpiTarget: string;
  actualPerformance: string;
  relatedAssetIds: string[];
  relatedExperimentIds: string[];
  priority: PriorityInputs;
  aiRecommendation?: string;
}

export type PaidPlatform =
  | 'google-search' | 'google-pmax' | 'youtube' | 'meta' | 'tiktok'
  | 'linkedin' | 'reddit' | 'x' | 'programmatic' | 'retargeting'
  | 'sponsored-newsletter' | 'podcast' | 'creator-whitelisting' | 'native';

export interface PaidCampaign extends BaseRecord {
  platform: PaidPlatform;
  objective: string;
  audience: string;
  funnelStage: FunnelStage;
  budgetUsd: number | null;
  dailySpendUsd: number | null;
  totalSpendUsd: number | null;
  cpcUsd: number | null;
  cpmUsd: number | null;
  ctr: number | null; // 0..1
  cvr: number | null; // 0..1
  cpaUsd: number | null;
  cacUsd: number | null;
  roas: number | null;
  ltvCacRatio: number | null;
  creativeAssetIds: string[];
  landingPage: string;
  offer: string;
  status: CampaignStatus;
  performanceNotes: string;
  optimization: string;
}

// ──────────────────────────────────────────────────────────────
// 3. Content & social
// ──────────────────────────────────────────────────────────────

export type ContentStatus =
  | 'idea' | 'brief' | 'draft' | 'in-review' | 'published' | 'refresh-needed' | 'archived';

export type ContentType =
  | 'blog' | 'landing-page' | 'seo-page' | 'aeo-answer' | 'geo-knowledge'
  | 'lead-magnet' | 'newsletter' | 'case-study' | 'comparison' | 'product-page'
  | 'how-to' | 'resource-hub' | 'video-script' | 'webinar-script' | 'podcast-outline'
  | 'social-post' | 'email' | 'sales-enablement' | 'community-post';

/** Search intent classification used by the SEO/AEO/GEO engine (§10). */
export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';

export interface ContentAsset extends BaseRecord {
  contentType: ContentType;
  funnelStage: FunnelStage;
  channel: string;
  persona: string;
  searchIntent: SearchIntent | null;
  primaryKeyword: string;
  secondaryKeywords: string[];
  coreMessage: string;
  cta: string;
  status: ContentStatus;
  publishDate: string | null;
  relatedCampaignId: string | null;
  relatedExperimentId: string | null;
  performanceNotes: string;
  repurposing: string[];
}

export type SocialPlatform =
  | 'linkedin' | 'tiktok' | 'instagram' | 'facebook' | 'youtube'
  | 'youtube-shorts' | 'x' | 'reddit' | 'pinterest' | 'threads' | 'discord' | 'community';

export type SocialStatus = 'idea' | 'draft' | 'scheduled' | 'published' | 'repurpose' | 'refresh' | 'archived';

export interface OrganicSocialPost extends BaseRecord {
  platform: SocialPlatform;
  format: string;
  contentPillar: string;
  funnelStage: FunnelStage;
  persona: string;
  hook: string;
  body: string;
  cta: string;
  creativeNotes: string;
  status: SocialStatus;
  publishDate: string | null;
  performanceNotes: string;
  repurposing: string[];
}

// ──────────────────────────────────────────────────────────────
// 4. Lifecycle, CRM & messaging
// ──────────────────────────────────────────────────────────────

export type LifecycleStageKey =
  | 'anonymous' | 'new-lead' | 'new-user' | 'activated' | 'engaged'
  | 'power-user' | 'at-risk' | 'churned' | 'reactivated' | 'advocate';

export interface LifecycleStage extends BaseRecord {
  stageKey: LifecycleStageKey;
  userDefinition: string;
  userMindset: string;
  primaryNeed: string;
  businessObjective: string;
  recommendedMessage: string;
  recommendedChannel: string;
  recommendedCta: string;
  automationIdea: string;
  successMetric: string;
  aiNextBestAction: string;
}

export type MessageChannel = 'email' | 'sms' | 'push' | 'in-app';

export type AutomationStatus = 'idea' | 'draft' | 'ready' | 'live' | 'paused' | 'archived';

export interface LifecycleAutomation extends BaseRecord {
  trigger: string;
  audienceSegment: string;
  entryCriteria: string;
  exitCriteria: string;
  channel: MessageChannel;
  steps: string[];
  delayTiming: string;
  personalizationVars: string[];
  cta: string;
  goalMetric: string;
  suppressionLogic: string;
  status: AutomationStatus;
  riskNotes: string;
}

export interface CRMMessage extends BaseRecord {
  channel: MessageChannel;
  audienceSegment: string;
  subject: string;
  body: string;
  cta: string;
  goalMetric: string;
  status: AutomationStatus;
  /** Hard safety flag — GrowthOS never sends unless explicitly enabled. */
  sendEnabled: boolean;
}

// ──────────────────────────────────────────────────────────────
// 5. Partnerships, referral & community
// ──────────────────────────────────────────────────────────────

export type CompensationModel =
  | 'flat-fee' | 'commission' | 'hybrid' | 'product-access'
  | 'revenue-share' | 'performance-bonus' | 'unpaid';

export type PartnerStatus = 'prospect' | 'contacted' | 'negotiating' | 'active' | 'completed' | 'paused' | 'declined';

export interface CreatorPartner extends BaseRecord {
  platform: SocialPlatform | string;
  audienceType: string;
  audienceSize: number | null;
  audienceQuality: string;
  nicheRelevance: Scale;
  contact: string;
  compensationModel: CompensationModel;
  affiliateRate: string;
  status: PartnerStatus;
  contractStatus: string;
  disclosureRequirements: string;
  deliverables: string[];
  trackingLink: string;
  couponCode: string;
  performanceNotes: string;
  relationshipNotes: string;
}

export interface AffiliatePartner extends BaseRecord {
  platform: string;
  compensationModel: CompensationModel;
  affiliateRate: string;
  contact: string;
  status: PartnerStatus;
  trackingLink: string;
  couponCode: string;
  disclosureRequirements: string;
  conversions: number | null;
  revenueInfluencedUsd: number | null;
  performanceNotes: string;
}

export type ReferralStatus = 'idea' | 'draft' | 'live' | 'paused' | 'completed';

export interface ReferralCampaign extends BaseRecord {
  reward: string;
  audience: string;
  triggerMoment: string;
  inviteMessage: string;
  landingPage: string;
  status: ReferralStatus;
  referredUsers: number | null;
  conversionRate: number | null; // 0..1
  estimatedKFactor: number | null;
}

export type CommunityStatus = 'idea' | 'planned' | 'active' | 'paused' | 'archived';

export interface CommunityInitiative extends BaseRecord {
  platform: string;
  targetAudience: string;
  objective: string;
  engagementMechanic: string;
  contentPrompts: string[];
  successMetric: string;
  status: CommunityStatus;
}

// ──────────────────────────────────────────────────────────────
// 6. Authority, PR & social proof
// ──────────────────────────────────────────────────────────────

export type AuthorityStatus =
  | 'idea' | 'researching' | 'pitched' | 'in-progress' | 'won' | 'published' | 'declined';

export interface AuthorityOpportunity extends BaseRecord {
  opportunityType: string;
  targetOutlet: string;
  contact: string;
  pitchAngle: string;
  status: AuthorityStatus;
  audienceRelevance: Scale;
  deadline: string | null;
  requiredAssets: string[];
  outreachMessage: string;
  followUpDate: string | null;
  result: string;
  backlinkUrl: string;
}

export type ProofPermission = 'pending' | 'granted' | 'denied' | 'expired';
export type ProofRisk = 'low' | 'medium' | 'high' | 'unusable';

export interface SocialProofAsset extends BaseRecord {
  source: string;
  claimType: string;
  permissionStatus: ProofPermission;
  approvedWording: string;
  riskLevel: ProofRisk;
  supportingEvidence: string;
  dateCollected: string | null;
  reviewDate: string | null;
  allowedPlacements: string[];
}

// ──────────────────────────────────────────────────────────────
// 7. CRO, experiments & offers
// ──────────────────────────────────────────────────────────────

export type CROStatus = 'identified' | 'prioritized' | 'in-progress' | 'shipped' | 'measuring' | 'done' | 'parked';

export interface CROOpportunity extends BaseRecord {
  pageOrFlow: string;
  problemObserved: string;
  funnelStage: FunnelStage;
  hypothesis: string;
  recommendedChange: string;
  priority: PriorityInputs;
  relatedExperimentId: string | null;
  status: CROStatus;
  result: string;
  /** Which CRO heuristic this maps to (clarity, trust, friction, etc.). */
  heuristic: string;
}

export type ExperimentStatus =
  | 'backlog' | 'prioritized' | 'running' | 'completed' | 'inconclusive' | 'scaled' | 'stopped';

export interface GrowthExperiment extends BaseRecord {
  hypothesis: string;
  targetAudience: string;
  variantA: string;
  variantB: string;
  primaryMetric: string;
  secondaryMetric: string;
  startDate: string | null;
  endDate: string | null;
  status: ExperimentStatus;
  results: string;
  decision: string;
  learning: string;
  priority: PriorityInputs;
}

export interface OfferTest extends BaseRecord {
  targetSegment: string;
  funnelStage: FunnelStage;
  valueProposition: string;
  cta: string;
  priceOrIncentive: string;
  marginImpact: string;
  expectedConversionImpact: string;
  riskLevel: Scale;
  requiredAssets: string[];
  status: ExperimentStatus;
  results: string;
}

// ──────────────────────────────────────────────────────────────
// 8. Market intelligence & brand
// ──────────────────────────────────────────────────────────────

export interface CompetitorInsight extends BaseRecord {
  competitor: string;
  insightType: string;
  funnelImplication: string;
  productImplication: string;
  marketingImplication: string;
  confidence: Scale;
  evidence: string;
  recommendedAction: string;
  status: StrategyStatus;
}

export interface CustomerInsight extends BaseRecord {
  source: string;
  segment: string;
  insightType: string;
  funnelImplication: string;
  marketingImplication: string;
  confidence: Scale;
  evidence: string;
  recommendedAction: string;
  status: StrategyStatus;
}

export type BrandVoiceCategory =
  | 'positioning' | 'persona' | 'value-prop' | 'messaging-pillar' | 'tone'
  | 'approved-claim' | 'banned-claim' | 'product-description' | 'elevator-pitch'
  | 'differentiation' | 'use-case' | 'objection-handling' | 'proof-point'
  | 'category-narrative' | 'founder-pov' | 'manifesto' | 'boilerplate';

export interface BrandVoiceAsset extends BaseRecord {
  category: BrandVoiceCategory;
  content: string;
  /** For claims: whether the claim is substantiated and usable. */
  approved: boolean;
}

// ──────────────────────────────────────────────────────────────
// 9. Assets, calendar & operations
// ──────────────────────────────────────────────────────────────

export type AssetStatus = 'idea' | 'draft' | 'in-review' | 'approved' | 'published' | 'archived';

export interface MarketingAsset extends BaseRecord {
  assetType: string;
  funnelStage: FunnelStage;
  channel: string;
  persona: string;
  status: AssetStatus;
  approvedClaims: string[];
  relatedCampaignId: string | null;
  relatedExperimentId: string | null;
  performanceNotes: string;
  repurposing: string[];
}

export type CalendarItemType =
  | 'campaign-launch' | 'content-publish' | 'email-send' | 'social-post'
  | 'paid-start' | 'product-launch' | 'feature-announcement' | 'webinar'
  | 'partner-campaign' | 'seasonal' | 'experiment' | 'reporting' | 'compliance-review';

export interface MarketingCalendarItem extends BaseRecord {
  itemType: CalendarItemType;
  date: string; // ISO (the scheduled day)
  endDate: string | null;
  channel: string;
  funnelStage: FunnelStage | null;
  status: 'planned' | 'scheduled' | 'in-progress' | 'done' | 'cancelled';
  relatedCampaignId: string | null;
  relatedAssetId: string | null;
}

export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'in-review' | 'done';

export interface MarketingTask extends BaseRecord {
  description: string;
  assignee: string;
  status: TaskStatus;
  dueDate: string | null;
  dependencies: string[];
  approvalRequired: boolean;
  checklist: string[];
}

// ──────────────────────────────────────────────────────────────
// 10. Analytics, attribution, UTM & measurement
// ──────────────────────────────────────────────────────────────

export type MetricKind = 'real' | 'estimated' | 'imported' | 'placeholder';

export interface MarketingMetric extends BaseRecord {
  /** e.g. "CAC", "Activation rate". `name` holds the display label. */
  unit: string;
  value: number | null;
  kind: MetricKind;
  /** How this metric should be computed (the KPI dictionary entry). */
  definition: string;
  trend: number | null; // signed % vs previous period, null when unknown
  funnelStage: FunnelStage | null;
}

export interface UTMLink extends BaseRecord {
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  generatedUrl: string;
}

export interface AttributionEvent {
  id: string;
  eventName: string;
  timestamp: string;
  userId: string | null;
  anonymousId: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  page: string | null;
  referrer: string | null;
  deviceType: string | null;
  metadata: Record<string, unknown>;
}

/** The canonical analytics event names GrowthOS knows how to emit (§29). */
export type AnalyticsEventName =
  | 'page_viewed' | 'cta_clicked' | 'signup_started' | 'signup_completed'
  | 'login_completed' | 'feature_used' | 'content_viewed' | 'campaign_viewed'
  | 'campaign_converted' | 'upload_completed' | 'ai_result_generated'
  | 'payment_started' | 'payment_completed' | 'referral_invited' | 'referral_accepted'
  | 'user_returned' | 'user_became_inactive' | 'email_captured' | 'lead_magnet_downloaded'
  | 'pricing_viewed' | 'checkout_abandoned';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  userId?: string | null;
  anonymousId?: string | null;
  timestamp: string;
  source?: string;
  medium?: string;
  campaign?: string;
  page?: string;
  deviceType?: string;
  metadata?: Record<string, unknown>;
}

// ──────────────────────────────────────────────────────────────
// 11. Privacy, consent & tracking governance
// ──────────────────────────────────────────────────────────────

export type ConsentChannel = 'cookies' | 'analytics' | 'ads' | 'email' | 'sms' | 'push';
export type ConsentState = 'granted' | 'denied' | 'unknown';

export interface ConsentRecord extends BaseRecord {
  channel: ConsentChannel;
  state: ConsentState;
  source: string;
  region: string;
  retentionNote: string;
}

export interface TrackingPixel extends BaseRecord {
  vendor: string;
  purpose: string;
  /** Which consent channel must be granted before this fires. */
  consentChannel: ConsentChannel;
  loadsBeforeConsent: boolean;
  riskNote: string;
}

// ──────────────────────────────────────────────────────────────
// 12. AI layer
// ──────────────────────────────────────────────────────────────

export interface AIRecommendation extends BaseRecord {
  lever: GrowthLever;
  funnelStage: FunnelStage;
  reasoning: string;
  requiredAssets: string[];
  implementationSteps: string[];
  successMetric: string;
  priority: PriorityInputs;
  status: StrategyStatus;
  /** Whether this leaned on real analytics or is strategic-from-context. */
  basis: 'data' | 'strategic';
}

export interface AIAgentDefinition extends BaseRecord {
  purpose: string;
  inputs: string[];
  outputs: string[];
  guardrails: string[];
  reviewRequirements: string;
  confidence: Scale;
  suggestedNextAction: string;
}

// ──────────────────────────────────────────────────────────────
// 13. Link Intelligence (internal linking + link-audit + agent runs)
// ------------------------------------------------------------
// The Link Intelligence Agent is GrowthOS-native: it DISCOVERS backlink
// opportunities (as AuthorityOpportunity, kind `authority`) and competitor
// link gaps (as CompetitorInsight, kind `competitor`), and adds the three
// record types below for the one thing GrowthOS lacked — a real internal
// link engine. All carry `dataSource` so the UI stays honest.
// ──────────────────────────────────────────────────────────────

/** How an anchor relates to its destination (over-optimization guardrail input). */
export type AnchorKind =
  | 'exact-match' | 'partial-match' | 'branded' | 'natural'
  | 'descriptive' | 'navigational' | 'generic' | 'image-alt' | 'cta';

/** Lifecycle of an internal-link recommendation through human review. */
export type InternalLinkStatus =
  | 'pending' | 'approved' | 'applied' | 'auto-applied' | 'rejected' | 'snoozed';

export interface InternalLinkRecommendation extends BaseRecord {
  sourceUrl: string;
  destinationUrl: string;
  anchorText: string;
  anchorKind: AnchorKind;
  contextSentence: string;
  placement: string;
  purpose: string;
  targetKeyword: string;
  userBenefit: string;
  cluster: string;
  riskLevel: Scale;
  /** 0..100 explainable internal-link opportunity score. */
  score: number;
  /** Human-readable factor lines explaining the score (no black boxes). */
  scoreFactors: string[];
  /** True only when the guardrails deem it safe to auto-apply. */
  autoSafe: boolean;
  status: InternalLinkStatus;
}

export type LinkFindingType =
  | 'orphan' | 'broken-internal' | 'over-linked' | 'deep-page'
  | 'weak-inlinks' | 'anchor-over-optimized' | 'cannibalization';

export type LinkFindingSeverity = 'critical' | 'high' | 'medium' | 'low';
export type LinkFindingStatus = 'open' | 'in-progress' | 'resolved' | 'ignored';

export interface LinkFinding extends BaseRecord {
  findingType: LinkFindingType;
  pageUrl: string;
  sport: string;
  severity: LinkFindingSeverity;
  detail: string;
  recommendedAction: string;
  /** A supporting number where one applies (depth, inbound count, …). */
  metric: number | null;
  status: LinkFindingStatus;
}

export type LinkRunCadence = 'daily' | 'weekly' | 'monthly' | 'manual';

export interface LinkAgentRun extends BaseRecord {
  cadence: LinkRunCadence;
  ranAt: string;
  pagesAnalyzed: number;
  internalLinksMapped: number;
  orphansFound: number;
  brokenFound: number;
  recommendationsGenerated: number;
  backlinkOppsDiscovered: number;
  competitorGapsFound: number;
  /** 0..100 health scores surfaced on the hub. */
  internalLinkHealth: number;
  backlinkOpportunityScore: number;
  aeoReadiness: number;
  summary: string;
  highlights: string[];
}

// ──────────────────────────────────────────────────────────────
// Union of every record type — handy for generic utilities.
// ──────────────────────────────────────────────────────────────

export type GrowthRecord =
  | MarketingChannel | MarketingStrategy | MarketingCampaign | PaidCampaign
  | OrganicSocialPost | ContentAsset | CreatorPartner | AffiliatePartner
  | ReferralCampaign | CommunityInitiative | AuthorityOpportunity | SocialProofAsset
  | LifecycleStage | LifecycleAutomation | CRMMessage | CROOpportunity
  | GrowthExperiment | OfferTest | CompetitorInsight | CustomerInsight
  | BrandVoiceAsset | MarketingAsset | MarketingCalendarItem | UTMLink
  | MarketingMetric | MarketingTask | AIRecommendation | AIAgentDefinition
  | InternalLinkRecommendation | LinkFinding | LinkAgentRun;
