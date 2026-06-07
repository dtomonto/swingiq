// ============================================================
// GrowthOS — Module definitions registry
// ------------------------------------------------------------
// Declarative config that drives <RecordModule />. Each entry describes a
// module's table columns, detail fields, KPI row, and filter field. Adding
// a column or KPI is a one-line change here — no per-module UI code.
// ============================================================

import { formatUsd, formatPercent } from '@/lib/growth/format';
import { priorityScore } from '@/lib/growth/scoring';
import type {
  MarketingChannel, MarketingStrategy, MarketingCampaign, PaidCampaign,
  ContentAsset, OrganicSocialPost, CreatorPartner, AffiliatePartner,
  ReferralCampaign, CommunityInitiative, AuthorityOpportunity, SocialProofAsset,
  CROOpportunity, GrowthExperiment, OfferTest, CompetitorInsight, CustomerInsight,
  MarketingAsset, AIRecommendation, MarketingTask, CRMMessage, LifecycleAutomation,
  PriorityInputs,
} from '@/lib/growth/types';

type Rec = Record<string, unknown> & { id: string };

export type CellType =
  | 'text' | 'status' | 'dataSource' | 'priority' | 'date' | 'list' | 'chips' | 'number';

export interface ColumnDef {
  key: string;
  label: string;
  type?: CellType;
  accessor?: (r: Rec) => unknown;
  className?: string;
}

export interface FieldDef {
  key?: string;
  label: string;
  type?: CellType;
  accessor?: (r: Rec) => unknown;
}

export interface KpiSpec {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: string;
}

export interface ModuleDefinition {
  itemNoun: string;
  filterKey?: string;
  columns: ColumnDef[];
  detailFields: FieldDef[];
  kpis?: (records: Rec[]) => KpiSpec[];
}

// ── small helpers ─────────────────────────────────────────────
const countWhere = (records: Rec[], pred: (r: Rec) => boolean) => records.filter(pred).length;
const sumBudget = (records: Rec[], key: string) =>
  records.reduce((acc, r) => acc + (typeof r[key] === 'number' ? (r[key] as number) : 0), 0);
const avgPriority = (records: Rec[]) => {
  const withP = records.filter((r) => r.priority);
  if (withP.length === 0) return 0;
  return Math.round(withP.reduce((a, r) => a + priorityScore(r.priority as PriorityInputs), 0) / withP.length);
};

// Shared trailing detail fields almost every record carries.
const META_FIELDS: FieldDef[] = [
  { key: 'owner', label: 'Owner', type: 'text' },
  { key: 'dataSource', label: 'Data source', type: 'dataSource' },
  { key: 'notes', label: 'Notes', type: 'text' },
];

export const MODULE_DEFINITIONS: Record<string, ModuleDefinition> = {
  // ── Strategy ────────────────────────────────────────────────
  strategy: {
    itemNoun: 'strategies',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Strategy' },
      { key: 'lever', label: 'Lever', type: 'text' },
      { key: 'funnelStage', label: 'Funnel', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'priority' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'objective', label: 'Objective' },
      { key: 'targetAudience', label: 'Audience' },
      { key: 'persona', label: 'Persona' },
      { key: 'lever', label: 'Growth lever' },
      { key: 'funnelStage', label: 'Funnel stage' },
      { key: 'channelMix', label: 'Channel mix', type: 'chips' },
      { key: 'coreMessage', label: 'Core message' },
      { key: 'offer', label: 'Offer' },
      { key: 'cta', label: 'CTA' },
      { key: 'requiredAssets', label: 'Required assets', type: 'list' },
      { key: 'expectedImpact', label: 'Expected impact' },
      { key: 'priority', label: 'Priority', type: 'priority' },
      { key: 'timeline', label: 'Timeline' },
      { key: 'dependencies', label: 'Dependencies', type: 'list' },
      { key: 'aiRecommendation', label: 'AI recommendation' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Strategies', value: r.length },
      { label: 'In progress', value: countWhere(r, (x) => x.status === 'in-progress'), accent: 'text-blue-400' },
      { label: 'Avg priority', value: avgPriority(r), sublabel: 'ICE + fit + urgency', accent: 'text-amber-400' },
      { label: 'High impact', value: countWhere(r, (x) => (x.priority as PriorityInputs)?.impact === 'high'), accent: 'text-green-400' },
    ],
  },

  // ── Campaigns ───────────────────────────────────────────────
  campaigns: {
    itemNoun: 'campaigns',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Campaign' },
      { key: 'campaignType', label: 'Type', type: 'text' },
      { key: 'funnelStage', label: 'Funnel', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'priority' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'campaignType', label: 'Type' },
      { key: 'objective', label: 'Objective' },
      { key: 'targetAudience', label: 'Audience' },
      { key: 'persona', label: 'Persona' },
      { key: 'funnelStage', label: 'Funnel stage' },
      { key: 'channelMix', label: 'Channel mix', type: 'chips' },
      { key: 'coreMessage', label: 'Core message' },
      { key: 'offer', label: 'Offer / hook' },
      { key: 'cta', label: 'CTA' },
      { key: 'landingPage', label: 'Landing page' },
      { key: 'budgetUsd', label: 'Budget', accessor: (r) => formatUsd(r.budgetUsd as number | null) },
      { key: 'startDate', label: 'Start', type: 'date' },
      { key: 'endDate', label: 'End', type: 'date' },
      { key: 'kpiTarget', label: 'KPI target' },
      { key: 'actualPerformance', label: 'Actual performance' },
      { key: 'priority', label: 'Priority', type: 'priority' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Campaigns', value: r.length },
      { label: 'Active', value: countWhere(r, (x) => x.status === 'active'), accent: 'text-green-400' },
      { label: 'In draft / idea', value: countWhere(r, (x) => x.status === 'draft' || x.status === 'idea'), accent: 'text-amber-400' },
      { label: 'Planned budget', value: formatUsd(sumBudget(r, 'budgetUsd')), accent: 'text-blue-400' },
    ],
  },

  // ── Channels ────────────────────────────────────────────────
  channels: {
    itemNoun: 'channels',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Channel' },
      { key: 'channelType', label: 'Type', type: 'text' },
      { key: 'maturity', label: 'Maturity', type: 'text' },
      { key: 'monthlyBudgetUsd', label: 'Budget/mo', accessor: (r) => formatUsd(r.monthlyBudgetUsd as number | null) },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'channelType', label: 'Channel type' },
      { key: 'primaryObjective', label: 'Primary objective' },
      { key: 'funnelStage', label: 'Funnel stage' },
      { key: 'targetAudience', label: 'Audience' },
      { key: 'lever', label: 'Growth lever' },
      { key: 'monthlyBudgetUsd', label: 'Monthly budget', accessor: (r) => formatUsd(r.monthlyBudgetUsd as number | null) },
      { key: 'expectedCacUsd', label: 'Expected CAC', accessor: (r) => formatUsd(r.expectedCacUsd as number | null) },
      { key: 'expectedConversionRate', label: 'Expected CVR', accessor: (r) => formatPercent(r.expectedConversionRate as number | null) },
      { key: 'expectedRoi', label: 'Expected ROI', accessor: (r) => (r.expectedRoi ? `${r.expectedRoi}x` : '—') },
      { key: 'maturity', label: 'Maturity' },
      { key: 'requiredAssets', label: 'Required assets', type: 'list' },
      { key: 'dependencies', label: 'Dependencies', type: 'list' },
      { key: 'risks', label: 'Risks', type: 'list' },
      { key: 'nextBestAction', label: 'Next best action' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Channels', value: r.length },
      { label: 'Active', value: countWhere(r, (x) => x.status === 'active'), accent: 'text-green-400' },
      { label: 'High-potential', value: countWhere(r, (x) => x.status === 'high-potential'), accent: 'text-amber-400' },
      { label: 'Total budget/mo', value: formatUsd(sumBudget(r, 'monthlyBudgetUsd')), accent: 'text-blue-400' },
    ],
  },

  // ── Paid media ──────────────────────────────────────────────
  'paid-media': {
    itemNoun: 'paid campaigns',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Campaign' },
      { key: 'platform', label: 'Platform', type: 'text' },
      { key: 'cacUsd', label: 'CAC', accessor: (r) => formatUsd(r.cacUsd as number | null) },
      { key: 'roas', label: 'ROAS', accessor: (r) => (r.roas ? `${r.roas}x` : '—') },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'platform', label: 'Platform' },
      { key: 'objective', label: 'Objective' },
      { key: 'audience', label: 'Audience' },
      { key: 'funnelStage', label: 'Funnel stage' },
      { key: 'budgetUsd', label: 'Budget', accessor: (r) => formatUsd(r.budgetUsd as number | null) },
      { key: 'dailySpendUsd', label: 'Daily spend', accessor: (r) => formatUsd(r.dailySpendUsd as number | null) },
      { key: 'cpcUsd', label: 'CPC', accessor: (r) => formatUsd(r.cpcUsd as number | null) },
      { key: 'ctr', label: 'CTR', accessor: (r) => formatPercent(r.ctr as number | null) },
      { key: 'cvr', label: 'CVR', accessor: (r) => formatPercent(r.cvr as number | null) },
      { key: 'cpaUsd', label: 'CPA', accessor: (r) => formatUsd(r.cpaUsd as number | null) },
      { key: 'cacUsd', label: 'CAC', accessor: (r) => formatUsd(r.cacUsd as number | null) },
      { key: 'roas', label: 'ROAS', accessor: (r) => (r.roas ? `${r.roas}x` : '—') },
      { key: 'ltvCacRatio', label: 'LTV:CAC', accessor: (r) => (r.ltvCacRatio ? `${r.ltvCacRatio}x` : '—') },
      { key: 'landingPage', label: 'Landing page' },
      { key: 'offer', label: 'Offer' },
      { key: 'performanceNotes', label: 'Performance notes' },
      { key: 'optimization', label: 'Optimization' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Paid campaigns', value: r.length },
      { label: 'Total budget', value: formatUsd(sumBudget(r, 'budgetUsd')), accent: 'text-blue-400' },
      { label: 'Live', value: countWhere(r, (x) => x.status === 'active'), accent: 'text-green-400' },
      { label: 'Projected', value: countWhere(r, (x) => x.dataSource === 'placeholder'), sublabel: 'not yet live', accent: 'text-purple-400' },
    ],
  },

  // ── Content ─────────────────────────────────────────────────
  content: {
    itemNoun: 'content assets',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Title' },
      { key: 'contentType', label: 'Type', type: 'text' },
      { key: 'primaryKeyword', label: 'Primary keyword', type: 'text' },
      { key: 'funnelStage', label: 'Funnel', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'contentType', label: 'Type' },
      { key: 'funnelStage', label: 'Funnel stage' },
      { key: 'channel', label: 'Channel' },
      { key: 'persona', label: 'Persona' },
      { key: 'searchIntent', label: 'Search intent' },
      { key: 'primaryKeyword', label: 'Primary keyword' },
      { key: 'secondaryKeywords', label: 'Secondary keywords', type: 'chips' },
      { key: 'coreMessage', label: 'Core message' },
      { key: 'cta', label: 'CTA' },
      { key: 'publishDate', label: 'Publish date', type: 'date' },
      { key: 'repurposing', label: 'Repurposing', type: 'chips' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Assets', value: r.length },
      { label: 'Published', value: countWhere(r, (x) => x.status === 'published'), accent: 'text-green-400' },
      { label: 'In pipeline', value: countWhere(r, (x) => ['idea', 'brief', 'draft', 'in-review'].includes(String(x.status))), accent: 'text-amber-400' },
      { label: 'Needs refresh', value: countWhere(r, (x) => x.status === 'refresh-needed'), accent: 'text-red-400' },
    ],
  },

  // ── Social ──────────────────────────────────────────────────
  social: {
    itemNoun: 'social posts',
    filterKey: 'platform',
    columns: [
      { key: 'name', label: 'Post' },
      { key: 'platform', label: 'Platform', type: 'text' },
      { key: 'contentPillar', label: 'Pillar', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'platform', label: 'Platform' },
      { key: 'format', label: 'Format' },
      { key: 'contentPillar', label: 'Content pillar' },
      { key: 'funnelStage', label: 'Funnel stage' },
      { key: 'persona', label: 'Persona' },
      { key: 'hook', label: 'Hook' },
      { key: 'body', label: 'Body' },
      { key: 'cta', label: 'CTA' },
      { key: 'creativeNotes', label: 'Creative notes' },
      { key: 'publishDate', label: 'Publish date', type: 'date' },
      { key: 'repurposing', label: 'Repurposing', type: 'chips' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Posts', value: r.length },
      { label: 'Scheduled', value: countWhere(r, (x) => x.status === 'scheduled'), accent: 'text-blue-400' },
      { label: 'Published', value: countWhere(r, (x) => x.status === 'published'), accent: 'text-green-400' },
      { label: 'Ideas', value: countWhere(r, (x) => x.status === 'idea'), accent: 'text-amber-400' },
    ],
  },

  // ── CRM messages ────────────────────────────────────────────
  crm: {
    itemNoun: 'messages',
    filterKey: 'channel',
    columns: [
      { key: 'name', label: 'Message' },
      { key: 'channel', label: 'Channel', type: 'text' },
      { key: 'audienceSegment', label: 'Segment', type: 'text' },
      { key: 'sendEnabled', label: 'Sending', accessor: (r) => (r.sendEnabled ? 'ENABLED' : 'draft-only') },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'channel', label: 'Channel' },
      { key: 'audienceSegment', label: 'Segment' },
      { key: 'subject', label: 'Subject' },
      { key: 'body', label: 'Body (draft)' },
      { key: 'cta', label: 'CTA' },
      { key: 'goalMetric', label: 'Goal metric' },
      { key: 'sendEnabled', label: 'Sending', accessor: (r) => (r.sendEnabled ? 'ENABLED' : 'Draft-only (safe default — never auto-sends)') },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Messages', value: r.length },
      { label: 'Ready', value: countWhere(r, (x) => x.status === 'ready'), accent: 'text-green-400' },
      { label: 'Drafts', value: countWhere(r, (x) => x.status === 'draft'), accent: 'text-amber-400' },
      { label: 'Send-enabled', value: countWhere(r, (x) => x.sendEnabled === true), sublabel: 'safe default off', accent: 'text-red-400' },
    ],
  },

  // ── Automations ─────────────────────────────────────────────
  automations: {
    itemNoun: 'automations',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Automation' },
      { key: 'channel', label: 'Channel', type: 'text' },
      { key: 'trigger', label: 'Trigger', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'trigger', label: 'Trigger' },
      { key: 'audienceSegment', label: 'Segment' },
      { key: 'entryCriteria', label: 'Entry criteria' },
      { key: 'exitCriteria', label: 'Exit criteria' },
      { key: 'channel', label: 'Channel' },
      { key: 'steps', label: 'Sequence steps', type: 'list' },
      { key: 'delayTiming', label: 'Delay timing' },
      { key: 'personalizationVars', label: 'Personalization', type: 'chips' },
      { key: 'cta', label: 'CTA' },
      { key: 'goalMetric', label: 'Goal metric' },
      { key: 'suppressionLogic', label: 'Suppression logic' },
      { key: 'riskNotes', label: 'Risk notes' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
  },

  // ── Creators ────────────────────────────────────────────────
  creators: {
    itemNoun: 'creators',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Partner' },
      { key: 'platform', label: 'Platform', type: 'text' },
      { key: 'audienceSize', label: 'Audience', type: 'number' },
      { key: 'compensationModel', label: 'Comp', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'platform', label: 'Platform' },
      { key: 'audienceType', label: 'Audience type' },
      { key: 'audienceSize', label: 'Audience size', type: 'number' },
      { key: 'audienceQuality', label: 'Audience quality' },
      { key: 'nicheRelevance', label: 'Niche relevance' },
      { key: 'contact', label: 'Contact' },
      { key: 'compensationModel', label: 'Compensation' },
      { key: 'affiliateRate', label: 'Affiliate rate' },
      { key: 'disclosureRequirements', label: 'Disclosure (required)' },
      { key: 'deliverables', label: 'Deliverables', type: 'list' },
      { key: 'trackingLink', label: 'Tracking link' },
      { key: 'couponCode', label: 'Coupon code' },
      { key: 'relationshipNotes', label: 'Relationship notes' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
  },

  // ── Affiliates ──────────────────────────────────────────────
  affiliates: {
    itemNoun: 'affiliates',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Affiliate' },
      { key: 'platform', label: 'Platform', type: 'text' },
      { key: 'affiliateRate', label: 'Rate', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'platform', label: 'Platform' },
      { key: 'compensationModel', label: 'Compensation' },
      { key: 'affiliateRate', label: 'Affiliate rate' },
      { key: 'contact', label: 'Contact' },
      { key: 'disclosureRequirements', label: 'Disclosure (required)' },
      { key: 'trackingLink', label: 'Tracking link' },
      { key: 'couponCode', label: 'Coupon code' },
      { key: 'conversions', label: 'Conversions', type: 'number' },
      { key: 'performanceNotes', label: 'Performance notes' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
  },

  // ── Referral ────────────────────────────────────────────────
  referral: {
    itemNoun: 'referral campaigns',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Campaign' },
      { key: 'reward', label: 'Reward', type: 'text' },
      { key: 'triggerMoment', label: 'Trigger', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'reward', label: 'Reward' },
      { key: 'audience', label: 'Audience' },
      { key: 'triggerMoment', label: 'Trigger moment' },
      { key: 'inviteMessage', label: 'Invite message' },
      { key: 'landingPage', label: 'Landing page' },
      { key: 'referredUsers', label: 'Referred users', type: 'number' },
      { key: 'conversionRate', label: 'Conversion rate', accessor: (r) => formatPercent(r.conversionRate as number | null) },
      { key: 'estimatedKFactor', label: 'Estimated K-factor', type: 'number' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
  },

  // ── Community ───────────────────────────────────────────────
  community: {
    itemNoun: 'initiatives',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Initiative' },
      { key: 'platform', label: 'Platform', type: 'text' },
      { key: 'objective', label: 'Objective', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'platform', label: 'Platform' },
      { key: 'targetAudience', label: 'Audience' },
      { key: 'objective', label: 'Objective' },
      { key: 'engagementMechanic', label: 'Engagement mechanic' },
      { key: 'contentPrompts', label: 'Content prompts', type: 'list' },
      { key: 'successMetric', label: 'Success metric' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
  },

  // ── Digital PR / authority ──────────────────────────────────
  pr: {
    itemNoun: 'opportunities',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Opportunity' },
      { key: 'opportunityType', label: 'Type', type: 'text' },
      { key: 'targetOutlet', label: 'Outlet', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'opportunityType', label: 'Type' },
      { key: 'targetOutlet', label: 'Target outlet' },
      { key: 'contact', label: 'Contact' },
      { key: 'pitchAngle', label: 'Pitch angle' },
      { key: 'audienceRelevance', label: 'Audience relevance' },
      { key: 'deadline', label: 'Deadline', type: 'date' },
      { key: 'requiredAssets', label: 'Required assets', type: 'list' },
      { key: 'outreachMessage', label: 'Outreach message' },
      { key: 'followUpDate', label: 'Follow-up', type: 'date' },
      { key: 'result', label: 'Result' },
      { key: 'backlinkUrl', label: 'Backlink URL' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
  },

  // ── Reputation / social proof ───────────────────────────────
  reputation: {
    itemNoun: 'proof assets',
    filterKey: 'permissionStatus',
    columns: [
      { key: 'name', label: 'Proof asset' },
      { key: 'claimType', label: 'Type', type: 'text' },
      { key: 'permissionStatus', label: 'Permission', type: 'status' },
      { key: 'riskLevel', label: 'Risk', type: 'status' },
    ],
    detailFields: [
      { key: 'source', label: 'Source' },
      { key: 'claimType', label: 'Claim type' },
      { key: 'permissionStatus', label: 'Permission status', type: 'status' },
      { key: 'approvedWording', label: 'Approved wording' },
      { key: 'riskLevel', label: 'Risk level', type: 'status' },
      { key: 'supportingEvidence', label: 'Supporting evidence' },
      { key: 'dateCollected', label: 'Date collected', type: 'date' },
      { key: 'reviewDate', label: 'Review date', type: 'date' },
      { key: 'allowedPlacements', label: 'Allowed placements', type: 'list' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Proof assets', value: r.length },
      { label: 'Usable', value: countWhere(r, (x) => x.permissionStatus === 'granted' && x.riskLevel !== 'unusable'), accent: 'text-green-400' },
      { label: 'Pending permission', value: countWhere(r, (x) => x.permissionStatus === 'pending'), accent: 'text-amber-400' },
      { label: 'Unusable', value: countWhere(r, (x) => x.riskLevel === 'unusable'), accent: 'text-red-400' },
    ],
  },

  // ── CRO ─────────────────────────────────────────────────────
  cro: {
    itemNoun: 'opportunities',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Opportunity' },
      { key: 'pageOrFlow', label: 'Page / flow', type: 'text' },
      { key: 'heuristic', label: 'Heuristic', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'priority' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'pageOrFlow', label: 'Page / flow' },
      { key: 'problemObserved', label: 'Problem observed' },
      { key: 'funnelStage', label: 'Funnel stage' },
      { key: 'hypothesis', label: 'Behavioral hypothesis' },
      { key: 'recommendedChange', label: 'Recommended change' },
      { key: 'heuristic', label: 'CRO heuristic' },
      { key: 'priority', label: 'Priority', type: 'priority' },
      { key: 'result', label: 'Result' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Opportunities', value: r.length },
      { label: 'Prioritized', value: countWhere(r, (x) => x.status === 'prioritized'), accent: 'text-blue-400' },
      { label: 'Shipped', value: countWhere(r, (x) => x.status === 'shipped' || x.status === 'done'), accent: 'text-green-400' },
      { label: 'Avg priority', value: avgPriority(r), accent: 'text-amber-400' },
    ],
  },

  // ── Experiments ─────────────────────────────────────────────
  experiments: {
    itemNoun: 'experiments',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Experiment' },
      { key: 'primaryMetric', label: 'Primary metric', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'priority' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'hypothesis', label: 'Hypothesis' },
      { key: 'targetAudience', label: 'Audience' },
      { key: 'variantA', label: 'Variant A' },
      { key: 'variantB', label: 'Variant B' },
      { key: 'primaryMetric', label: 'Primary metric' },
      { key: 'secondaryMetric', label: 'Secondary metric' },
      { key: 'startDate', label: 'Start', type: 'date' },
      { key: 'endDate', label: 'End', type: 'date' },
      { key: 'priority', label: 'Priority', type: 'priority' },
      { key: 'results', label: 'Results' },
      { key: 'decision', label: 'Decision' },
      { key: 'learning', label: 'Learning' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Experiments', value: r.length },
      { label: 'Running', value: countWhere(r, (x) => x.status === 'running'), accent: 'text-blue-400' },
      { label: 'Prioritized', value: countWhere(r, (x) => x.status === 'prioritized'), accent: 'text-amber-400' },
      { label: 'Avg priority', value: avgPriority(r), accent: 'text-green-400' },
    ],
  },

  // ── Offers ──────────────────────────────────────────────────
  offers: {
    itemNoun: 'offer tests',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Offer' },
      { key: 'targetSegment', label: 'Segment', type: 'text' },
      { key: 'riskLevel', label: 'Risk', type: 'status' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'targetSegment', label: 'Target segment' },
      { key: 'funnelStage', label: 'Funnel stage' },
      { key: 'valueProposition', label: 'Value proposition' },
      { key: 'cta', label: 'CTA' },
      { key: 'priceOrIncentive', label: 'Price / incentive' },
      { key: 'marginImpact', label: 'Margin impact' },
      { key: 'expectedConversionImpact', label: 'Expected conversion impact' },
      { key: 'riskLevel', label: 'Risk level', type: 'status' },
      { key: 'requiredAssets', label: 'Required assets', type: 'list' },
      { key: 'results', label: 'Results' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
  },

  // ── Market intel: competitors ───────────────────────────────
  competitors: {
    itemNoun: 'competitor insights',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Insight' },
      { key: 'competitor', label: 'Competitor', type: 'text' },
      { key: 'insightType', label: 'Type', type: 'text' },
      { key: 'confidence', label: 'Confidence', type: 'status' },
    ],
    detailFields: [
      { key: 'competitor', label: 'Competitor' },
      { key: 'insightType', label: 'Insight type' },
      { key: 'funnelImplication', label: 'Funnel implication' },
      { key: 'productImplication', label: 'Product implication' },
      { key: 'marketingImplication', label: 'Marketing implication' },
      { key: 'confidence', label: 'Confidence' },
      { key: 'evidence', label: 'Evidence' },
      { key: 'recommendedAction', label: 'Recommended action' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
  },

  // ── Market intel: customer insights ─────────────────────────
  'customer-insights': {
    itemNoun: 'customer insights',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Insight' },
      { key: 'segment', label: 'Segment', type: 'text' },
      { key: 'insightType', label: 'Type', type: 'text' },
      { key: 'confidence', label: 'Confidence', type: 'status' },
    ],
    detailFields: [
      { key: 'source', label: 'Source' },
      { key: 'segment', label: 'Segment' },
      { key: 'insightType', label: 'Insight type' },
      { key: 'funnelImplication', label: 'Funnel implication' },
      { key: 'marketingImplication', label: 'Marketing implication' },
      { key: 'confidence', label: 'Confidence' },
      { key: 'evidence', label: 'Evidence' },
      { key: 'recommendedAction', label: 'Recommended action' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
  },

  // ── Assets ──────────────────────────────────────────────────
  assets: {
    itemNoun: 'assets',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Asset' },
      { key: 'assetType', label: 'Type', type: 'text' },
      { key: 'channel', label: 'Channel', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'assetType', label: 'Asset type' },
      { key: 'funnelStage', label: 'Funnel stage' },
      { key: 'channel', label: 'Channel' },
      { key: 'persona', label: 'Persona' },
      { key: 'approvedClaims', label: 'Approved claims', type: 'chips' },
      { key: 'repurposing', label: 'Repurposing', type: 'chips' },
      { key: 'performanceNotes', label: 'Performance notes' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
  },

  // ── Recommendations ─────────────────────────────────────────
  recommendations: {
    itemNoun: 'recommendations',
    filterKey: 'lever',
    columns: [
      { key: 'name', label: 'Recommendation' },
      { key: 'lever', label: 'Lever', type: 'text' },
      { key: 'basis', label: 'Basis', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'priority' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'lever', label: 'Growth lever' },
      { key: 'funnelStage', label: 'Funnel stage' },
      { key: 'reasoning', label: 'Reasoning' },
      { key: 'requiredAssets', label: 'Required assets', type: 'list' },
      { key: 'implementationSteps', label: 'Implementation steps', type: 'list' },
      { key: 'successMetric', label: 'Success metric' },
      { key: 'priority', label: 'Priority', type: 'priority' },
      { key: 'basis', label: 'Basis', accessor: (r) => (r.basis === 'data' ? 'Data-backed' : 'Strategic (from product context)') },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Recommendations', value: r.length },
      { label: 'High priority', value: countWhere(r, (x) => priorityScore(x.priority as PriorityInputs) >= 55), accent: 'text-amber-400' },
      { label: 'Quick wins', value: countWhere(r, (x) => (x.priority as PriorityInputs)?.effort === 'low' && (x.priority as PriorityInputs)?.impact === 'high'), sublabel: 'high impact · low effort', accent: 'text-green-400' },
      { label: 'Data-backed', value: countWhere(r, (x) => x.basis === 'data'), sublabel: 'rest are strategic', accent: 'text-blue-400' },
    ],
  },

  // ── Operations: tasks ───────────────────────────────────────
  operations: {
    itemNoun: 'tasks',
    filterKey: 'status',
    columns: [
      { key: 'name', label: 'Task' },
      { key: 'assignee', label: 'Owner', type: 'text' },
      { key: 'dueDate', label: 'Due', type: 'date' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    detailFields: [
      { key: 'description', label: 'Description' },
      { key: 'assignee', label: 'Assignee' },
      { key: 'dueDate', label: 'Due date', type: 'date' },
      { key: 'dependencies', label: 'Dependencies', type: 'list' },
      { key: 'approvalRequired', label: 'Approval required', accessor: (r) => (r.approvalRequired ? 'Yes' : 'No') },
      { key: 'checklist', label: 'Checklist', type: 'list' },
      { key: 'status', label: 'Status', type: 'status' },
      ...META_FIELDS,
    ],
    kpis: (r) => [
      { label: 'Tasks', value: r.length },
      { label: 'In progress', value: countWhere(r, (x) => x.status === 'in-progress'), accent: 'text-blue-400' },
      { label: 'To do', value: countWhere(r, (x) => x.status === 'todo'), accent: 'text-amber-400' },
      { label: 'Done', value: countWhere(r, (x) => x.status === 'done'), accent: 'text-green-400' },
    ],
  },
};

// ── CRUD support ──────────────────────────────────────────────

/** Maps a definitionId to the repository `kind` used by /api/growth/records. */
export const DEFINITION_KIND: Record<string, string> = {
  strategy: 'strategy',
  campaigns: 'campaign',
  channels: 'channel',
  'paid-media': 'paid-campaign',
  content: 'content',
  social: 'social',
  crm: 'crm-message',
  automations: 'automation',
  creators: 'creator',
  affiliates: 'affiliate',
  referral: 'referral',
  community: 'community',
  pr: 'authority',
  reputation: 'proof',
  cro: 'cro',
  experiments: 'experiment',
  offers: 'offer',
  competitors: 'competitor',
  'customer-insights': 'customer-insight',
  assets: 'asset',
  recommendations: 'recommendation',
  operations: 'task',
};

export type FormInput = 'text' | 'textarea' | 'number' | 'date' | 'tags' | 'checkbox' | 'priority';

export interface FormFieldDef {
  key: string;
  label: string;
  input: FormInput;
}

const NUMBER_KEY = /usd|budget|rate|size|users|count|conversions|kfactor|spend|cpc|cpm|cpa|cac|roas|ctr|cvr|roi|score|revenue/i;
const DATE_KEY = /date|deadline/i;
const LONG_KEY = /message|body|reasoning|content|problem|hypothesis|change|outreach|invite|evidence|action|objective|description|wording|definition|narrative|pitch|proposition|mindset|need|notes|result|learning|decision|optimization|performance/i;
const BOOL_KEY = /^(sendEnabled|approvalRequired|approved|loadsBeforeConsent)$/;

/** Derives an editable form from a module's detail fields. */
export function deriveFormFields(def: ModuleDefinition): FormFieldDef[] {
  const fields: FormFieldDef[] = [{ key: 'name', label: 'Name', input: 'text' }];
  for (const f of def.detailFields) {
    if (!f.key || f.key === 'name' || f.key === 'dataSource') continue;
    if (fields.some((x) => x.key === f.key)) continue;
    let input: FormInput;
    if (BOOL_KEY.test(f.key)) input = 'checkbox';
    else if (f.type === 'priority') input = 'priority';
    else if (f.type === 'date' || DATE_KEY.test(f.key)) input = 'date';
    else if (f.type === 'number' || NUMBER_KEY.test(f.key)) input = 'number';
    else if (f.type === 'list' || f.type === 'chips') input = 'tags';
    else if (LONG_KEY.test(f.key)) input = 'textarea';
    else input = 'text';
    fields.push({ key: f.key, label: f.label, input });
  }
  return fields;
}

// Type-only re-exports so pages can import the record shapes if needed.
export type {
  MarketingChannel, MarketingStrategy, MarketingCampaign, PaidCampaign,
  ContentAsset, OrganicSocialPost, CreatorPartner, AffiliatePartner,
  ReferralCampaign, CommunityInitiative, AuthorityOpportunity, SocialProofAsset,
  CROOpportunity, GrowthExperiment, OfferTest, CompetitorInsight, CustomerInsight,
  MarketingAsset, AIRecommendation, MarketingTask, CRMMessage, LifecycleAutomation,
};
