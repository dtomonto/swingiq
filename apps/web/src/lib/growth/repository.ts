// ============================================================
// GrowthOS — Repository / service layer (mock-safe)
// ------------------------------------------------------------
// A single seam between the UI and the data source. Today every
// repository is an in-memory store seeded from ./mock-data. Tomorrow,
// swap `InMemoryRepository` for a Supabase-backed implementation that
// satisfies the same `Repository<T>` interface — the UI won't change.
//
// NOTE ON PERSISTENCE: in-memory writes survive within a running server
// process (fine for local dev / a single Node instance) but NOT across
// serverless invocations. That's intentional for a mock-safe first build;
// real persistence arrives with the DB adapter. The UI labels all of this
// as demo data via each record's `dataSource`.
// ============================================================

import type {
  MarketingChannel, MarketingStrategy, MarketingCampaign, PaidCampaign,
  OrganicSocialPost, ContentAsset, CreatorPartner, AffiliatePartner,
  ReferralCampaign, CommunityInitiative, AuthorityOpportunity, SocialProofAsset,
  LifecycleStage, LifecycleAutomation, CRMMessage, CROOpportunity,
  GrowthExperiment, OfferTest, CompetitorInsight, CustomerInsight,
  BrandVoiceAsset, MarketingAsset, MarketingCalendarItem, UTMLink,
  MarketingMetric, MarketingTask, AIRecommendation, ConsentRecord, TrackingPixel,
  AttributionEvent,
} from './types';
import * as seed from './mock-data';

export interface Repository<T extends { id: string }> {
  list(): T[];
  get(id: string): T | undefined;
  create(item: T): T;
  update(id: string, patch: Partial<T>): T | undefined;
  remove(id: string): boolean;
}

/** Generic in-memory repository. Clones the seed so mutations don't leak. */
class InMemoryRepository<T extends { id: string }> implements Repository<T> {
  private items: T[];
  constructor(seedItems: T[]) {
    this.items = seedItems.map((i) => ({ ...i }));
  }
  list(): T[] {
    return this.items.map((i) => ({ ...i }));
  }
  get(id: string): T | undefined {
    const found = this.items.find((i) => i.id === id);
    return found ? { ...found } : undefined;
  }
  create(item: T): T {
    this.items.unshift({ ...item });
    return item;
  }
  update(id: string, patch: Partial<T>): T | undefined {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.items[idx] = { ...this.items[idx], ...patch };
    return { ...this.items[idx] };
  }
  remove(id: string): boolean {
    const before = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    return this.items.length < before;
  }
}

// ── Typed repository singletons ───────────────────────────────
export const channelsRepo = new InMemoryRepository<MarketingChannel>(seed.CHANNELS);
export const strategiesRepo = new InMemoryRepository<MarketingStrategy>(seed.STRATEGIES);
export const campaignsRepo = new InMemoryRepository<MarketingCampaign>(seed.CAMPAIGNS);
export const paidCampaignsRepo = new InMemoryRepository<PaidCampaign>(seed.PAID_CAMPAIGNS);
export const contentRepo = new InMemoryRepository<ContentAsset>(seed.CONTENT);
export const socialRepo = new InMemoryRepository<OrganicSocialPost>(seed.SOCIAL);
export const lifecycleStagesRepo = new InMemoryRepository<LifecycleStage>(seed.LIFECYCLE_STAGES);
export const crmMessagesRepo = new InMemoryRepository<CRMMessage>(seed.CRM_MESSAGES);
export const automationsRepo = new InMemoryRepository<LifecycleAutomation>(seed.AUTOMATIONS);
export const creatorsRepo = new InMemoryRepository<CreatorPartner>(seed.CREATORS);
export const affiliatesRepo = new InMemoryRepository<AffiliatePartner>(seed.AFFILIATES);
export const referralsRepo = new InMemoryRepository<ReferralCampaign>(seed.REFERRALS);
export const communityRepo = new InMemoryRepository<CommunityInitiative>(seed.COMMUNITY);
export const authorityRepo = new InMemoryRepository<AuthorityOpportunity>(seed.AUTHORITY);
export const proofRepo = new InMemoryRepository<SocialProofAsset>(seed.PROOF);
export const croRepo = new InMemoryRepository<CROOpportunity>(seed.CRO);
export const experimentsRepo = new InMemoryRepository<GrowthExperiment>(seed.EXPERIMENTS);
export const offersRepo = new InMemoryRepository<OfferTest>(seed.OFFERS);
export const competitorsRepo = new InMemoryRepository<CompetitorInsight>(seed.COMPETITORS);
export const customerInsightsRepo = new InMemoryRepository<CustomerInsight>(seed.CUSTOMER_INSIGHTS);
export const brandVoiceRepo = new InMemoryRepository<BrandVoiceAsset>(seed.BRAND_VOICE);
export const assetsRepo = new InMemoryRepository<MarketingAsset>(seed.ASSETS);
export const calendarRepo = new InMemoryRepository<MarketingCalendarItem>(seed.CALENDAR);
export const utmRepo = new InMemoryRepository<UTMLink>(seed.UTM_LINKS);
export const metricsRepo = new InMemoryRepository<MarketingMetric>(seed.METRICS);
export const tasksRepo = new InMemoryRepository<MarketingTask>(seed.TASKS);
export const recommendationsRepo = new InMemoryRepository<AIRecommendation>(seed.RECOMMENDATIONS);
export const consentRepo = new InMemoryRepository<ConsentRecord>(seed.CONSENT_RECORDS);
export const pixelsRepo = new InMemoryRepository<TrackingPixel>(seed.TRACKING_PIXELS);
export const attributionRepo = new InMemoryRepository<AttributionEvent>(seed.ATTRIBUTION_EVENTS);

// ── Executive overview snapshot ───────────────────────────────
export interface OverviewSnapshot {
  counts: {
    channels: number;
    activeCampaigns: number;
    experiments: number;
    contentInProgress: number;
    openRecommendations: number;
    openTasks: number;
  };
  metrics: MarketingMetric[];
  topRecommendations: AIRecommendation[];
  upcoming: MarketingCalendarItem[];
}

export function getOverviewSnapshot(): OverviewSnapshot {
  const campaigns = campaignsRepo.list();
  const content = contentRepo.list();
  const recs = recommendationsRepo.list();
  const tasks = tasksRepo.list();
  const today = new Date('2026-06-03T00:00:00.000Z').getTime();

  return {
    counts: {
      channels: channelsRepo.list().length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      experiments: experimentsRepo.list().length,
      contentInProgress: content.filter((c) => ['draft', 'in-review', 'brief'].includes(c.status)).length,
      openRecommendations: recs.filter((r) => r.status !== 'done' && r.status !== 'archived').length,
      openTasks: tasks.filter((t) => t.status !== 'done').length,
    },
    metrics: metricsRepo.list(),
    topRecommendations: recs.slice(0, 3),
    upcoming: calendarRepo
      .list()
      .filter((c) => new Date(c.date).getTime() >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5),
  };
}
