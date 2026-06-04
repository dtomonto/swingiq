// ============================================================
// GrowthOS — Mock-safe seed data
// ------------------------------------------------------------
// Realistic, SwingIQ-flavored demo records so every module is useful on
// day one WITHOUT a database. Every record is honestly tagged `mock` (or
// `placeholder`/`estimated`) via `dataSource`. Swap these for DB-backed
// reads later — see ./repository for the seam.
// ============================================================

import type {
  MarketingChannel, MarketingStrategy, MarketingCampaign, PaidCampaign,
  OrganicSocialPost, ContentAsset, CreatorPartner, AffiliatePartner,
  ReferralCampaign, CommunityInitiative, AuthorityOpportunity, SocialProofAsset,
  LifecycleStage, LifecycleAutomation, CRMMessage, CROOpportunity,
  GrowthExperiment, OfferTest, CompetitorInsight, CustomerInsight,
  BrandVoiceAsset, MarketingAsset, MarketingCalendarItem, UTMLink,
  MarketingMetric, MarketingTask, AIRecommendation,
  ConsentRecord, TrackingPixel, AttributionEvent,
} from './types';

const T = '2026-06-03T12:00:00.000Z';
const base = { dataSource: 'mock' as const, createdAt: T, updatedAt: T };

// ── Channels (§7) ─────────────────────────────────────────────
export const CHANNELS: MarketingChannel[] = [
  { ...base, id: 'ch-seo', name: 'Organic Search (SEO)', channelType: 'owned', primaryObjective: 'Capture high-intent "fix my slice" searches', funnelStage: 'awareness', targetAudience: 'Self-improving amateur golfers', monthlyBudgetUsd: 0, expectedCacUsd: 4, expectedConversionRate: 0.025, expectedRoi: 6, maturity: 'developing', status: 'high-potential', requiredAssets: ['Pillar pages', 'Programmatic landing pages'], dependencies: ['Content Studio'], risks: ['Slow to compound'], nextBestAction: 'Ship 9 priority landing pages from the SEO registry', lever: 'seo' },
  { ...base, id: 'ch-yt', name: 'YouTube (long-form)', channelType: 'owned', primaryObjective: 'Demonstrate AI swing analysis on real swings', funnelStage: 'consideration', targetAudience: 'Golfers researching swing tools', monthlyBudgetUsd: 200, expectedCacUsd: 9, expectedConversionRate: 0.018, expectedRoi: 4, maturity: 'emerging', status: 'underdeveloped', requiredAssets: ['Video scripts', 'Screen recordings'], dependencies: ['Content Studio'], risks: ['Production time'], nextBestAction: 'Script a "diagnose my slice with AI" walkthrough', lever: 'brand-authority' },
  { ...base, id: 'ch-paid-search', name: 'Paid Search', channelType: 'paid', primaryObjective: 'Convert bottom-funnel "launch monitor app" intent', funnelStage: 'conversion', targetAudience: 'In-market buyers', monthlyBudgetUsd: 600, expectedCacUsd: 22, expectedConversionRate: 0.04, expectedRoi: 2.4, maturity: 'experimental', status: 'experimental', requiredAssets: ['Ad copy', 'Landing pages'], dependencies: ['Paid Media', 'CRO Lab'], risks: ['CPC inflation'], nextBestAction: 'Validate one tight ad group before scaling spend', lever: 'paid-media' },
  { ...base, id: 'ch-email', name: 'Lifecycle Email', channelType: 'lifecycle', primaryObjective: 'Activate new users to first analysis', funnelStage: 'activation', targetAudience: 'New signups', monthlyBudgetUsd: 30, expectedCacUsd: 0, expectedConversionRate: 0.3, expectedRoi: 9, maturity: 'developing', status: 'active', requiredAssets: ['Welcome flow', 'Activation flow'], dependencies: ['Email/CRM'], risks: ['Deliverability'], nextBestAction: 'Wire the abandoned-first-upload flow', lever: 'activation' },
  { ...base, id: 'ch-reddit', name: 'Reddit Community', channelType: 'community', primaryObjective: 'Authentic presence in r/golf discussions', funnelStage: 'awareness', targetAudience: 'Engaged golf hobbyists', monthlyBudgetUsd: 0, expectedCacUsd: 6, expectedConversionRate: 0.012, expectedRoi: 3, maturity: 'experimental', status: 'underdeveloped', requiredAssets: ['Community guidelines', 'Helpful answers'], dependencies: ['Community Growth'], risks: ['Self-promo backlash'], nextBestAction: 'Answer 5 swing questions/week with genuine value', lever: 'community' },
];

// ── Strategy (§6) ─────────────────────────────────────────────
export const STRATEGIES: MarketingStrategy[] = [
  { ...base, id: 'st-1', name: 'Own "fix my slice" search demand', objective: 'Become the default answer for slice/hook fixes', targetAudience: 'Amateur golfers Googling swing faults', persona: 'Weekend Warrior Wes', funnelStage: 'awareness', lever: 'seo', channelMix: ['SEO', 'YouTube', 'AEO'], coreMessage: 'See exactly why you slice — measured, not guessed', offer: 'Free first swing analysis', cta: 'Analyze my swing', requiredAssets: ['Slice pillar page', 'Answer blocks'], expectedImpact: 'Compounding organic acquisition', priority: { impact: 'high', confidence: 'medium', effort: 'medium', strategicFit: 'high', urgency: 'high' }, timeline: 'Q3 2026', dependencies: ['Content Studio'], status: 'in-progress', aiRecommendation: 'Cluster around fault → cause → drill; interlink to the analyzer.' },
  { ...base, id: 'st-2', name: 'Activate to first analysis fast', objective: 'Lift new-user activation rate to first AI analysis', targetAudience: 'New signups', persona: 'Curious Newcomer Nia', funnelStage: 'activation', lever: 'activation', channelMix: ['Email', 'In-app'], coreMessage: 'Your first insight is 2 minutes away', offer: 'Guided first upload', cta: 'Upload a swing', requiredAssets: ['Activation email', 'Empty-state nudges'], expectedImpact: 'Higher retention + word of mouth', priority: { impact: 'high', confidence: 'high', effort: 'low', strategicFit: 'high', urgency: 'high' }, timeline: 'Now', dependencies: ['Lifecycle'], status: 'in-progress', aiRecommendation: 'Trigger an activation nudge if no upload within 24h.' },
  { ...base, id: 'st-3', name: 'Coach + creator distribution', objective: 'Reach golfers through trusted coaches/creators', targetAudience: 'Followers of golf creators', persona: 'Improver Ian', funnelStage: 'acquisition', lever: 'partnerships', channelMix: ['Creators', 'Affiliate', 'YouTube'], coreMessage: 'The tool your coach would build', offer: 'Creator affiliate program', cta: 'Try the analyzer', requiredAssets: ['Creator brief', 'Tracking links'], expectedImpact: 'Lower-CAC trusted acquisition', priority: { impact: 'high', confidence: 'medium', effort: 'high', strategicFit: 'high', urgency: 'medium' }, timeline: 'Q4 2026', dependencies: ['Creators/Affiliates'], status: 'planned' },
];

// ── Campaigns (§8) ────────────────────────────────────────────
export const CAMPAIGNS: MarketingCampaign[] = [
  { ...base, id: 'cmp-1', name: 'Fix Your Slice — Content Launch', campaignType: 'content', objective: 'Rank + convert on slice-related queries', targetAudience: 'Slicers', persona: 'Weekend Warrior Wes', funnelStage: 'awareness', channelMix: ['SEO', 'YouTube', 'Reddit'], coreMessage: 'Stop guessing why you slice', offer: 'Free first analysis', cta: 'Analyze my swing', landingPage: '/fix-my-slice', budgetUsd: 0, startDate: '2026-06-10', endDate: '2026-08-31', status: 'active', kpiTarget: '5k organic visits/mo by Sept', actualPerformance: 'Baseline forming (mock)', relatedAssetIds: ['as-1'], relatedExperimentIds: ['exp-1'], priority: { impact: 'high', confidence: 'medium', effort: 'medium', strategicFit: 'high', urgency: 'high' } },
  { ...base, id: 'cmp-2', name: 'New User Activation Flow', campaignType: 'lifecycle', objective: 'Get new users to first analysis within 24h', targetAudience: 'New signups', persona: 'Curious Newcomer Nia', funnelStage: 'activation', channelMix: ['Email', 'In-app'], coreMessage: 'Your first insight is minutes away', offer: 'Guided first upload', cta: 'Upload a swing', landingPage: '/dashboard', budgetUsd: 0, startDate: '2026-06-05', endDate: null, status: 'active', kpiTarget: '+15% activation rate', actualPerformance: 'Measuring (mock)', relatedAssetIds: [], relatedExperimentIds: ['exp-2'], priority: { impact: 'high', confidence: 'high', effort: 'low', strategicFit: 'high', urgency: 'high' } },
  { ...base, id: 'cmp-3', name: 'Pro Tier Launch', campaignType: 'monetization', objective: 'Convert engaged free users to Pro', targetAudience: 'Power users on Free', persona: 'Improver Ian', funnelStage: 'revenue', channelMix: ['Email', 'In-app', 'Pricing page'], coreMessage: 'Unlock deeper AI analysis', offer: '14-day Pro trial', cta: 'Start free trial', landingPage: '/pricing', budgetUsd: 0, startDate: '2026-07-01', endDate: null, status: 'draft', kpiTarget: '3% free→paid', actualPerformance: '—', relatedAssetIds: [], relatedExperimentIds: ['exp-3'], priority: { impact: 'high', confidence: 'medium', effort: 'medium', strategicFit: 'high', urgency: 'medium' } },
  { ...base, id: 'cmp-4', name: 'Win-back Lapsed Users', campaignType: 'win-back', objective: 'Re-engage users inactive 30+ days', targetAudience: 'Churn-risk users', persona: 'Improver Ian', funnelStage: 'retention', channelMix: ['Email'], coreMessage: 'Your game missed you — here’s what’s new', offer: 'New feature highlight', cta: 'See what’s new', landingPage: '/updates', budgetUsd: 0, startDate: null, endDate: null, status: 'idea', kpiTarget: '8% reactivation', actualPerformance: '—', relatedAssetIds: [], relatedExperimentIds: [], priority: { impact: 'medium', confidence: 'medium', effort: 'low', strategicFit: 'medium', urgency: 'low' } },
];

// ── Paid campaigns (§9) ───────────────────────────────────────
export const PAID_CAMPAIGNS: PaidCampaign[] = [
  { ...base, id: 'pc-1', name: 'Search — "golf swing analyzer"', dataSource: 'placeholder', platform: 'google-search', objective: 'Conversions', audience: 'In-market buyers', funnelStage: 'conversion', budgetUsd: 600, dailySpendUsd: 20, totalSpendUsd: null, cpcUsd: 1.8, cpmUsd: null, ctr: 0.04, cvr: 0.05, cpaUsd: 24, cacUsd: 24, roas: 2.1, ltvCacRatio: 3.2, creativeAssetIds: [], landingPage: '/analyzer', offer: 'Free first analysis', status: 'idea', performanceNotes: 'Projected — not yet live', optimization: 'Start with one tight exact-match ad group' },
  { ...base, id: 'pc-2', name: 'Meta — Slice pain hook', dataSource: 'placeholder', platform: 'meta', objective: 'Traffic → signup', audience: 'Golf interest, 28–55', funnelStage: 'acquisition', budgetUsd: 400, dailySpendUsd: 13, totalSpendUsd: null, cpcUsd: 0.9, cpmUsd: 12, ctr: 0.015, cvr: 0.03, cpaUsd: 30, cacUsd: 30, roas: 1.6, ltvCacRatio: 2.4, creativeAssetIds: [], landingPage: '/fix-my-slice', offer: 'Free first analysis', status: 'idea', performanceNotes: 'Projected — needs creative test', optimization: 'Test 3 hooks: pain / outcome / curiosity' },
];

// ── Content (§11) ─────────────────────────────────────────────
export const CONTENT: ContentAsset[] = [
  { ...base, id: 'co-1', name: 'Why You Slice (and the 3 real causes)', contentType: 'blog', funnelStage: 'awareness', channel: 'SEO', persona: 'Weekend Warrior Wes', searchIntent: 'informational', primaryKeyword: 'why do i slice', secondaryKeywords: ['slice causes', 'open clubface'], coreMessage: 'Slice = clubface relative to path; here’s how to see it', cta: 'Analyze my swing', status: 'draft', publishDate: '2026-06-12', relatedCampaignId: 'cmp-1', relatedExperimentId: null, performanceNotes: '—', repurposing: ['YouTube script', 'X thread', 'FAQ block'] },
  { ...base, id: 'co-2', name: 'Launch Monitor Numbers, Explained', contentType: 'how-to', funnelStage: 'consideration', channel: 'SEO', persona: 'Improver Ian', searchIntent: 'informational', primaryKeyword: 'launch monitor numbers explained', secondaryKeywords: ['smash factor', 'spin rate'], coreMessage: 'What each number means and which to fix first', cta: 'Import my data', status: 'idea', publishDate: null, relatedCampaignId: null, relatedExperimentId: null, performanceNotes: '—', repurposing: ['Carousel', 'Email'] },
  { ...base, id: 'co-3', name: 'SwingIQ vs. generic swing apps', contentType: 'comparison', funnelStage: 'conversion', channel: 'SEO', persona: 'Improver Ian', searchIntent: 'commercial', primaryKeyword: 'best golf swing analysis app', secondaryKeywords: ['swing app comparison'], coreMessage: 'Measured AI analysis vs. generic tips', cta: 'Try free', status: 'brief', publishDate: null, relatedCampaignId: null, relatedExperimentId: null, performanceNotes: '—', repurposing: ['Ad copy', 'Sales points'] },
];

// ── Social (§12) ──────────────────────────────────────────────
export const SOCIAL: OrganicSocialPost[] = [
  { ...base, id: 'so-1', name: 'Slice diagnosis in 10 seconds', platform: 'youtube-shorts', format: 'short-video', contentPillar: 'Diagnose', funnelStage: 'awareness', persona: 'Weekend Warrior Wes', hook: 'Your slice isn’t your grip — it’s this', body: 'Show AI overlay detecting open face at impact.', cta: 'Analyze yours free', creativeNotes: 'Vertical, captions on', status: 'idea', publishDate: null, performanceNotes: '—', repurposing: ['TikTok', 'Reels'] },
  { ...base, id: 'so-2', name: 'Founder POV: why we built SwingIQ', platform: 'linkedin', format: 'text', contentPillar: 'Story', funnelStage: 'consideration', persona: 'Improver Ian', hook: 'Most golf apps guess. We measure.', body: 'Short founder note on measured feedback.', cta: 'See how it works', creativeNotes: 'No link in first comment test', status: 'draft', publishDate: '2026-06-09', performanceNotes: '—', repurposing: ['X', 'Newsletter'] },
];

// ── Lifecycle stages (§14) ────────────────────────────────────
export const LIFECYCLE_STAGES: LifecycleStage[] = [
  { ...base, id: 'ls-anon', name: 'Anonymous visitor', stageKey: 'anonymous', userDefinition: 'Unidentified site visitor', userMindset: 'Skeptical, curious', primaryNeed: 'Proof it works', businessObjective: 'Capture interest', recommendedMessage: 'See your swing measured, free', recommendedChannel: 'Landing page', recommendedCta: 'Analyze my swing', automationIdea: 'Exit-intent value reminder', successMetric: 'Visit → signup rate', aiNextBestAction: 'Lead with a measured before/after demo' },
  { ...base, id: 'ls-new-user', name: 'New user', stageKey: 'new-user', userDefinition: 'Signed up, no analysis yet', userMindset: 'Hopeful but unsure how', primaryNeed: 'Fast first win', businessObjective: 'Activate', recommendedMessage: 'Your first insight is 2 minutes away', recommendedChannel: 'Email + in-app', recommendedCta: 'Upload a swing', automationIdea: 'Activation nudge at 24h', successMetric: 'Activation rate', aiNextBestAction: 'Reduce first-upload friction' },
  { ...base, id: 'ls-at-risk', name: 'At-risk user', stageKey: 'at-risk', userDefinition: 'Engaged before, now cooling', userMindset: 'Distracted, busy', primaryNeed: 'A reason to return', businessObjective: 'Retain', recommendedMessage: 'One quick check-in on your progress', recommendedChannel: 'Email', recommendedCta: 'See your trend', automationIdea: 'Inactivity trigger at 14d', successMetric: 'Reactivation rate', aiNextBestAction: 'Surface their improvement trend' },
  { ...base, id: 'ls-advocate', name: 'Advocate', stageKey: 'advocate', userDefinition: 'Loves the product, tells others', userMindset: 'Proud, generous', primaryNeed: 'Easy ways to share', businessObjective: 'Referral', recommendedMessage: 'Help a buddy fix their slice', recommendedChannel: 'In-app + email', recommendedCta: 'Invite a friend', automationIdea: 'Trigger after a milestone', successMetric: 'Referral rate / K-factor', aiNextBestAction: 'Prompt referral right after an earned moment' },
];

// ── CRM messages + automations (§13) ──────────────────────────
export const CRM_MESSAGES: CRMMessage[] = [
  { ...base, id: 'crm-1', name: 'Welcome — set the first win', channel: 'email', audienceSegment: 'New signups', subject: 'Welcome to SwingIQ — let’s find your first fix', body: 'Draft: warm welcome + one clear CTA to upload a swing.', cta: 'Upload a swing', goalMetric: 'Activation', status: 'ready', sendEnabled: false },
  { ...base, id: 'crm-2', name: 'Activation nudge (24h)', channel: 'email', audienceSegment: 'No upload in 24h', subject: 'Your first swing insight is 2 minutes away', body: 'Draft: friendly nudge, link straight to upload.', cta: 'Analyze my swing', goalMetric: 'Activation', status: 'draft', sendEnabled: false },
];

export const AUTOMATIONS: LifecycleAutomation[] = [
  { ...base, id: 'au-1', name: 'Abandoned first upload', trigger: 'Signup with no upload in 24h', audienceSegment: 'New users', entryCriteria: 'No analysis event', exitCriteria: 'First analysis completed', channel: 'email', steps: ['Day 0 welcome', 'Day 1 nudge', 'Day 3 value reminder'], delayTiming: '0 / 24h / 72h', personalizationVars: ['first_name'], cta: 'Upload a swing', goalMetric: 'Activation rate', suppressionLogic: 'Suppress if already activated', status: 'draft', riskNotes: 'Keep frequency low; honor unsubscribe' },
];

// ── Creators + affiliates (§15) ───────────────────────────────
export const CREATORS: CreatorPartner[] = [
  { ...base, id: 'cr-1', name: 'Mid-handicap YouTube coach', platform: 'youtube', audienceType: 'Improving amateurs', audienceSize: 85000, audienceQuality: 'High intent, engaged', nicheRelevance: 'high', contact: 'via channel', compensationModel: 'hybrid', affiliateRate: '20% / 90d', status: 'prospect', contractStatus: 'None', disclosureRequirements: 'Must disclose #ad / sponsored', deliverables: ['1 dedicated video', '2 shorts'], trackingLink: 'placeholder', couponCode: 'placeholder', performanceNotes: '—', relationshipNotes: 'Warm — engaged with our content' },
];

export const AFFILIATES: AffiliatePartner[] = [
  { ...base, id: 'af-1', name: 'Golf gear review blog', platform: 'blog', compensationModel: 'commission', affiliateRate: '25% first payment', contact: 'editor@', status: 'contacted', trackingLink: 'placeholder', couponCode: 'placeholder', disclosureRequirements: 'FTC affiliate disclosure required', conversions: null, revenueInfluencedUsd: null, performanceNotes: 'Awaiting reply' },
];

// ── Referral (§16) ────────────────────────────────────────────
export const REFERRALS: ReferralCampaign[] = [
  { ...base, id: 'rf-1', name: 'Fix a buddy’s slice', dataSource: 'placeholder', reward: 'Both get 1 month Pro', audience: 'Advocates', triggerMoment: 'After a milestone/earned moment', inviteMessage: 'I found why I slice — you’ve got to try this', landingPage: '/invite', status: 'idea', referredUsers: null, conversionRate: null, estimatedKFactor: null },
];

// ── Community (§17) ───────────────────────────────────────────
export const COMMUNITY: CommunityInitiative[] = [
  { ...base, id: 'cm-1', name: 'r/golf helpful-answers program', platform: 'reddit', targetAudience: 'Engaged hobbyists', objective: 'Trust + awareness', engagementMechanic: 'Genuinely answer swing questions', contentPrompts: ['Diagnose from a described miss', 'Explain a launch number'], successMetric: 'Profile clicks / signups', status: 'planned' },
];

// ── Authority / PR (§18) ──────────────────────────────────────
export const AUTHORITY: AuthorityOpportunity[] = [
  { ...base, id: 'pr-1', name: 'Golf podcast guest spot', opportunityType: 'Podcast guest', targetOutlet: 'Amateur golf improvement podcast', contact: 'host@', pitchAngle: 'What launch-monitor data really tells amateurs', status: 'idea', audienceRelevance: 'high', deadline: null, requiredAssets: ['Founder bio', 'Talking points'], outreachMessage: 'Draft: concise, value-first pitch', followUpDate: null, result: '', backlinkUrl: '' },
];

// ── Social proof (§19) ────────────────────────────────────────
export const PROOF: SocialProofAsset[] = [
  { ...base, id: 'sp-1', name: 'Beta user quote (pending permission)', source: 'Beta user', claimType: 'testimonial', permissionStatus: 'pending', approvedWording: '', riskLevel: 'unusable', supportingEvidence: 'Email thread', dateCollected: '2026-05-20', reviewDate: '2026-06-20', allowedPlacements: [] },
];

// ── CRO (§20) ─────────────────────────────────────────────────
export const CRO: CROOpportunity[] = [
  { ...base, id: 'cro-1', name: 'Pricing page value clarity', pageOrFlow: '/pricing', problemObserved: 'Tier differences unclear', funnelStage: 'conversion', hypothesis: 'Highlighting one tier lifts conversion', recommendedChange: 'Add a recommended tier + clearer benefit copy', priority: { impact: 'high', confidence: 'medium', effort: 'low', strategicFit: 'high', urgency: 'medium' }, relatedExperimentId: 'exp-3', status: 'prioritized', result: '', heuristic: 'Pricing clarity' },
  { ...base, id: 'cro-2', name: 'First-upload friction', pageOrFlow: '/dashboard', problemObserved: 'New users hesitate at upload', funnelStage: 'activation', hypothesis: 'A sample swing reduces hesitation', recommendedChange: 'Offer "try a sample swing" option', priority: { impact: 'high', confidence: 'medium', effort: 'medium', strategicFit: 'high', urgency: 'high' }, relatedExperimentId: 'exp-2', status: 'identified', result: '', heuristic: 'Form friction' },
];

// ── Experiments (§21) ─────────────────────────────────────────
export const EXPERIMENTS: GrowthExperiment[] = [
  { ...base, id: 'exp-1', name: 'Slice page hero headline', hypothesis: 'Pain-led headline beats feature-led', targetAudience: 'Slice searchers', variantA: 'Stop guessing why you slice', variantB: 'AI swing analysis for amateurs', primaryMetric: 'Signup rate', secondaryMetric: 'Scroll depth', startDate: null, endDate: null, status: 'backlog', results: '', decision: '', learning: '', priority: { impact: 'medium', confidence: 'medium', effort: 'low', strategicFit: 'high', urgency: 'medium' } },
  { ...base, id: 'exp-2', name: 'Sample-swing activation', hypothesis: 'Offering a sample swing lifts activation', targetAudience: 'New users', variantA: 'Upload required', variantB: 'Try a sample swing', primaryMetric: 'Activation rate', secondaryMetric: 'Day-7 retention', startDate: null, endDate: null, status: 'prioritized', results: '', decision: '', learning: '', priority: { impact: 'high', confidence: 'medium', effort: 'medium', strategicFit: 'high', urgency: 'high' } },
  { ...base, id: 'exp-3', name: 'Highlighted pricing tier', hypothesis: 'A recommended tier lifts free→paid', targetAudience: 'Free power users', variantA: 'Three equal tiers', variantB: 'One highlighted tier', primaryMetric: 'Free→paid rate', secondaryMetric: 'ARPU', startDate: null, endDate: null, status: 'backlog', results: '', decision: '', learning: '', priority: { impact: 'high', confidence: 'medium', effort: 'low', strategicFit: 'high', urgency: 'medium' } },
];

// ── Offers (§22) ──────────────────────────────────────────────
export const OFFERS: OfferTest[] = [
  { ...base, id: 'of-1', name: '14-day Pro trial', targetSegment: 'Engaged free users', funnelStage: 'revenue', valueProposition: 'Experience deep AI analysis risk-free', cta: 'Start free trial', priceOrIncentive: '14 days free', marginImpact: 'Low (trial cost only)', expectedConversionImpact: '+ trial→paid pipeline', riskLevel: 'low', requiredAssets: ['Trial flow', 'Reminder emails'], status: 'backlog', results: '' },
];

// ── Market intel (§23) ────────────────────────────────────────
export const COMPETITORS: CompetitorInsight[] = [
  { ...base, id: 'ci-1', name: 'Generic apps lean on tips, not measurement', competitor: 'Generic swing apps', insightType: 'Positioning', funnelImplication: 'We win on "measured vs. guessed"', productImplication: 'Keep measurement front and center', marketingImplication: 'Lead comparison content with measurement', confidence: 'medium', evidence: 'Public landing pages (as data)', recommendedAction: 'Ship the comparison page', status: 'in-progress' },
];

export const CUSTOMER_INSIGHTS: CustomerInsight[] = [
  { ...base, id: 'cu-1', name: 'Amateurs distrust vague tips', source: 'Reddit + reviews', segment: 'Amateur golfers', insightType: 'Objection', funnelImplication: 'Proof reduces skepticism', marketingImplication: 'Show real measured analysis early', confidence: 'medium', evidence: 'Recurring theme in r/golf', recommendedAction: 'Add measured demo to hero', status: 'planned' },
];

// ── Brand voice (§24) ─────────────────────────────────────────
export const BRAND_VOICE: BrandVoiceAsset[] = [
  { ...base, id: 'bv-pos', name: 'Positioning', category: 'positioning', content: 'SwingIQ is measured swing analysis for amateurs — clarity, not vague tips.', approved: true },
  { ...base, id: 'bv-vp', name: 'Core value proposition', category: 'value-prop', content: 'See exactly what your swing is doing, measured — then get a clear next fix.', approved: true },
  { ...base, id: 'bv-tone', name: 'Tone of voice', category: 'tone', content: 'Encouraging, honest, plain-English. Confident but never hype. No jargon dumps.', approved: true },
  { ...base, id: 'bv-claim-ok', name: 'Approved claim: measured analysis', category: 'approved-claim', content: 'Analysis is based on measured swing data / pose estimation (note: estimates where applicable).', approved: true },
  { ...base, id: 'bv-claim-no', name: 'Banned claim: guaranteed results', category: 'banned-claim', content: 'Never promise guaranteed score/handicap improvement or "instant fixes".', approved: false },
];

// ── Assets (§25) ──────────────────────────────────────────────
export const ASSETS: MarketingAsset[] = [
  { ...base, id: 'as-1', name: 'Fix My Slice landing page', assetType: 'landing-page', funnelStage: 'awareness', channel: 'SEO', persona: 'Weekend Warrior Wes', status: 'draft', approvedClaims: ['measured analysis'], relatedCampaignId: 'cmp-1', relatedExperimentId: 'exp-1', performanceNotes: '—', repurposing: ['Ad copy', 'Email'] },
  { ...base, id: 'as-2', name: 'Comparison battlecard', assetType: 'sales-enablement', funnelStage: 'conversion', channel: 'Sales', persona: 'Improver Ian', status: 'idea', approvedClaims: ['measured vs. guessed'], relatedCampaignId: null, relatedExperimentId: null, performanceNotes: '—', repurposing: ['Comparison page'] },
];

// ── Calendar (§26) ────────────────────────────────────────────
export const CALENDAR: MarketingCalendarItem[] = [
  { ...base, id: 'cal-1', name: 'Publish: Why You Slice', itemType: 'content-publish', date: '2026-06-12', endDate: null, channel: 'SEO', funnelStage: 'awareness', status: 'scheduled', relatedCampaignId: 'cmp-1', relatedAssetId: 'co-1' },
  { ...base, id: 'cal-2', name: 'Founder POV post (LinkedIn)', itemType: 'social-post', date: '2026-06-09', endDate: null, channel: 'LinkedIn', funnelStage: 'consideration', status: 'scheduled', relatedCampaignId: null, relatedAssetId: 'so-2' },
  { ...base, id: 'cal-3', name: 'Slice content campaign starts', itemType: 'campaign-launch', date: '2026-06-10', endDate: '2026-08-31', channel: 'Multi', funnelStage: 'awareness', status: 'planned', relatedCampaignId: 'cmp-1', relatedAssetId: null },
  { ...base, id: 'cal-4', name: 'Pro Tier launch', itemType: 'product-launch', date: '2026-07-01', endDate: null, channel: 'Multi', funnelStage: 'revenue', status: 'planned', relatedCampaignId: 'cmp-3', relatedAssetId: null },
  { ...base, id: 'cal-5', name: 'Monthly performance review', itemType: 'reporting', date: '2026-07-01', endDate: null, channel: 'Internal', funnelStage: null, status: 'planned', relatedCampaignId: null, relatedAssetId: null },
];

// ── UTM links (§27) ───────────────────────────────────────────
export const UTM_LINKS: UTMLink[] = [
  { ...base, id: 'utm-1', name: 'June newsletter → pricing', baseUrl: 'https://swingiq.app/pricing', source: 'newsletter', medium: 'email', campaign: 'june-2026', term: '', content: 'header-cta', generatedUrl: 'https://swingiq.app/pricing?utm_source=newsletter&utm_medium=email&utm_campaign=june-2026&utm_content=header-cta' },
];

// ── Metrics / KPI dictionary (§27) ────────────────────────────
export const METRICS: MarketingMetric[] = [
  { ...base, id: 'm-visitors', name: 'Total visitors', dataSource: 'placeholder', unit: 'visits', value: null, kind: 'placeholder', definition: 'Unique visitors in period (connect GA4/Plausible).', trend: null, funnelStage: 'awareness' },
  { ...base, id: 'm-activation', name: 'Activation rate', dataSource: 'placeholder', unit: '%', value: null, kind: 'placeholder', definition: '% of new users who complete their first analysis.', trend: null, funnelStage: 'activation' },
  { ...base, id: 'm-cac', name: 'CAC', dataSource: 'placeholder', unit: 'USD', value: null, kind: 'placeholder', definition: 'Total acquisition spend ÷ new customers.', trend: null, funnelStage: 'acquisition' },
  { ...base, id: 'm-free-paid', name: 'Free → Paid rate', dataSource: 'placeholder', unit: '%', value: null, kind: 'placeholder', definition: '% of free users who convert to a paid plan.', trend: null, funnelStage: 'revenue' },
  { ...base, id: 'm-ltvcac', name: 'LTV:CAC', dataSource: 'placeholder', unit: 'ratio', value: null, kind: 'placeholder', definition: 'Customer lifetime value ÷ CAC (target ≥ 3).', trend: null, funnelStage: 'revenue' },
];

// ── Tasks (§34) ───────────────────────────────────────────────
export const TASKS: MarketingTask[] = [
  { ...base, id: 'tk-1', name: 'Ship 9 SEO landing pages', description: 'Publish the priority programmatic pages from the SEO registry', assignee: 'Owner', status: 'in-progress', dueDate: '2026-06-20', dependencies: ['Content Studio'], approvalRequired: false, checklist: ['Metadata', 'Internal links', 'Schema', 'QA'] },
  { ...base, id: 'tk-2', name: 'Connect analytics provider', description: 'Set NEXT_PUBLIC_PLAUSIBLE_DOMAIN or GA4 to replace placeholder metrics', assignee: 'Owner', status: 'todo', dueDate: null, dependencies: [], approvalRequired: false, checklist: ['Pick provider', 'Add env', 'Verify events'] },
];

// ── Recommendations (§35) ─────────────────────────────────────
export const RECOMMENDATIONS: AIRecommendation[] = [
  { ...base, id: 'rec-1', name: 'Wire the abandoned-first-upload email', lever: 'activation', funnelStage: 'activation', reasoning: 'Activation is the highest-leverage stage; a 24h nudge is low-effort and high-impact.', requiredAssets: ['Activation email (drafted)'], implementationSteps: ['Define trigger', 'Connect email provider', 'Enable send after review'], successMetric: 'Activation rate', priority: { impact: 'high', confidence: 'high', effort: 'low', strategicFit: 'high', urgency: 'high' }, status: 'planned', basis: 'strategic' },
  { ...base, id: 'rec-2', name: 'Ship the comparison page', lever: 'conversion', funnelStage: 'conversion', reasoning: 'Commercial-intent searchers convert; "measured vs. guessed" is our edge.', requiredAssets: ['Comparison page', 'Battlecard'], implementationSteps: ['Draft', 'Design', 'Publish', 'Add to nav'], successMetric: 'Comparison-page conversion', priority: { impact: 'high', confidence: 'medium', effort: 'medium', strategicFit: 'high', urgency: 'medium' }, status: 'idea', basis: 'strategic' },
  { ...base, id: 'rec-3', name: 'Connect an analytics provider', lever: 'acquisition', funnelStage: 'awareness', reasoning: 'Most KPIs are placeholders until a provider is connected — measurement unlocks the rest of GrowthOS.', requiredAssets: [], implementationSteps: ['Choose Plausible or GA4', 'Set env var', 'Verify events flow'], successMetric: 'Real metrics populated', priority: { impact: 'high', confidence: 'high', effort: 'low', strategicFit: 'high', urgency: 'high' }, status: 'planned', basis: 'strategic' },
];

// ── Consent records (§30) ─────────────────────────────────────
export const CONSENT_RECORDS: ConsentRecord[] = [
  { ...base, id: 'cn-1', name: 'Analytics consent', channel: 'analytics', state: 'unknown', source: 'No consent banner yet', region: 'Global', retentionNote: 'Define retention before collecting' },
  { ...base, id: 'cn-2', name: 'Email opt-in', channel: 'email', state: 'granted', source: 'Email-capture form (explicit)', region: 'Global', retentionNote: 'Honor unsubscribe immediately' },
  { ...base, id: 'cn-3', name: 'Ads consent', channel: 'ads', state: 'denied', source: 'Default deny until banner ships', region: 'EU/UK', retentionNote: 'No ad pixels until granted' },
];

// ── Tracking pixel inventory (§30) ────────────────────────────
export const TRACKING_PIXELS: TrackingPixel[] = [
  { ...base, id: 'px-1', name: 'Plausible (privacy-friendly)', vendor: 'Plausible', purpose: 'Aggregate analytics', consentChannel: 'analytics', loadsBeforeConsent: false, riskNote: 'Cookieless; lowest risk' },
  { ...base, id: 'px-2', name: 'Meta Pixel (planned)', vendor: 'Meta', purpose: 'Ad attribution + retargeting', consentChannel: 'ads', loadsBeforeConsent: false, riskNote: 'Requires ads consent + privacy disclosure' },
];

// ── Attribution events (§28) ──────────────────────────────────
export const ATTRIBUTION_EVENTS: AttributionEvent[] = [
  { id: 'at-1', eventName: 'signup_completed', timestamp: '2026-06-02T15:20:00.000Z', userId: null, anonymousId: 'a_demo1', source: 'google', medium: 'organic', campaign: null, term: 'fix my slice', content: null, page: '/fix-my-slice', referrer: 'https://google.com', deviceType: 'mobile', metadata: { firstTouch: 'organic-search' } },
  { id: 'at-2', eventName: 'campaign_converted', timestamp: '2026-06-02T18:05:00.000Z', userId: null, anonymousId: 'a_demo2', source: 'newsletter', medium: 'email', campaign: 'june-2026', term: null, content: 'header-cta', page: '/pricing', referrer: null, deviceType: 'desktop', metadata: { lastTouch: 'email' } },
];
