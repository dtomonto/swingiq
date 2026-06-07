// ============================================================
// GrowthOS — Repository / service layer (production: Supabase-backed)
// ------------------------------------------------------------
// One async seam between the UI and storage. When Supabase is configured,
// records persist in a single `growth_records` JSONB table (keyed by
// `kind`). When it isn't, the repo degrades to an in-process store seeded
// from ./mock-data so the whole app still works keyless (same pattern as
// lib/billing/entitlements.ts). The UI doesn't care which is active.
//
// SECURITY: uses the service-role admin client, which BYPASSES RLS. That's
// safe here because every GrowthOS route + write API is already behind the
// ADMIN_SECRET guard — only trusted admin code reaches this layer.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
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

const TABLE = 'growth_records';

export interface Repository<T extends { id: string }> {
  kind: string;
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T | undefined>;
  remove(id: string): Promise<boolean>;
  /** Whether this repo is currently backed by a real database. */
  isPersistent(): boolean;
}

// ── In-process fallback store ─────────────────────────────────
// Backed by a globalThis singleton so every module instance in a single
// server process shares the same data — this survives Next dev's HMR
// re-evaluation and keeps reads/writes consistent within one process.
// (Still per-process: not durable across serverless invocations — that's
// what Supabase is for. This is purely the keyless/dev fallback.)
const GLOBAL_KEY = '__growthos_mem_store__';

function globalStore(): Map<string, Map<string, { id: string }>> {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map<string, Map<string, { id: string }>>();
  return g[GLOBAL_KEY] as Map<string, Map<string, { id: string }>>;
}

class MemoryStore<T extends { id: string }> {
  private map: Map<string, T>;
  constructor(kind: string, seedItems: T[]) {
    const gs = globalStore();
    let m = gs.get(kind) as Map<string, T> | undefined;
    if (!m) {
      m = new Map<string, T>();
      for (const item of seedItems) m.set(item.id, { ...item });
      gs.set(kind, m as Map<string, { id: string }>);
    }
    this.map = m;
  }
  list(): T[] { return Array.from(this.map.values()).map((i) => ({ ...i })); }
  get(id: string): T | undefined { const f = this.map.get(id); return f ? { ...f } : undefined; }
  create(item: T): T { this.map.set(item.id, { ...item }); return item; } // upsert by id
  update(id: string, patch: Partial<T>): T | undefined {
    const e = this.map.get(id);
    if (!e) return undefined;
    const merged = { ...e, ...patch } as T;
    this.map.set(id, merged);
    return { ...merged };
  }
  remove(id: string): boolean { return this.map.delete(id); }
}

/**
 * Builds a repository for one record `kind`. Uses Supabase when available,
 * else the in-process MemoryStore. Every Supabase path falls back to the
 * memory seed on error (e.g. the migration hasn't been run yet) so the UI
 * never hard-fails.
 */
function makeRepo<T extends { id: string }>(kind: string, seedItems: T[]): Repository<T> {
  const mem = new MemoryStore<T>(kind, seedItems);
  const admin = () => createSupabaseAdminClient();

  return {
    kind,
    isPersistent() { return admin() !== null; },

    async list(): Promise<T[]> {
      const c = admin();
      if (!c) return mem.list();
      try {
        const { data, error } = await c.from(TABLE).select('data').eq('kind', kind);
        if (error || !data) return mem.list();
        return (data as Array<{ data: T }>).map((r) => r.data);
      } catch {
        return mem.list();
      }
    },

    async get(id: string): Promise<T | undefined> {
      const c = admin();
      if (!c) return mem.get(id);
      try {
        const { data, error } = await c.from(TABLE).select('data').eq('kind', kind).eq('id', id).maybeSingle();
        if (error || !data) return mem.get(id);
        return (data as { data: T }).data;
      } catch {
        return mem.get(id);
      }
    },

    async create(item: T): Promise<T> {
      const c = admin();
      if (!c) return mem.create(item);
      const now = new Date().toISOString();
      const { error } = await c.from(TABLE).upsert(
        { id: item.id, kind, data: item, created_at: now, updated_at: now },
        { onConflict: 'id' },
      );
      // Fall back to the in-process store if the table is missing / errors,
      // so the UI stays consistent with reads (which also fall back).
      if (error) return mem.create(item);
      return item;
    },

    async update(id: string, patch: Partial<T>): Promise<T | undefined> {
      const c = admin();
      if (!c) return mem.update(id, patch);
      const existing = await this.get(id);
      if (!existing) return mem.update(id, patch);
      const merged = { ...existing, ...patch, updatedAt: new Date().toISOString() } as T;
      const { error } = await c.from(TABLE).update({ data: merged, updated_at: new Date().toISOString() }).eq('id', id).eq('kind', kind);
      if (error) return mem.update(id, patch);
      return merged;
    },

    async remove(id: string): Promise<boolean> {
      const c = admin();
      if (!c) return mem.remove(id);
      const { error } = await c.from(TABLE).delete().eq('id', id).eq('kind', kind);
      if (error) return mem.remove(id);
      return true;
    },
  };
}

// ── Typed repository singletons (kind = stable string key) ────
export const channelsRepo = makeRepo<MarketingChannel>('channel', seed.CHANNELS);
export const strategiesRepo = makeRepo<MarketingStrategy>('strategy', seed.STRATEGIES);
export const campaignsRepo = makeRepo<MarketingCampaign>('campaign', seed.CAMPAIGNS);
export const paidCampaignsRepo = makeRepo<PaidCampaign>('paid-campaign', seed.PAID_CAMPAIGNS);
export const contentRepo = makeRepo<ContentAsset>('content', seed.CONTENT);
export const socialRepo = makeRepo<OrganicSocialPost>('social', seed.SOCIAL);
export const lifecycleStagesRepo = makeRepo<LifecycleStage>('lifecycle-stage', seed.LIFECYCLE_STAGES);
export const crmMessagesRepo = makeRepo<CRMMessage>('crm-message', seed.CRM_MESSAGES);
export const automationsRepo = makeRepo<LifecycleAutomation>('automation', seed.AUTOMATIONS);
export const creatorsRepo = makeRepo<CreatorPartner>('creator', seed.CREATORS);
export const affiliatesRepo = makeRepo<AffiliatePartner>('affiliate', seed.AFFILIATES);
export const referralsRepo = makeRepo<ReferralCampaign>('referral', seed.REFERRALS);
export const communityRepo = makeRepo<CommunityInitiative>('community', seed.COMMUNITY);
export const authorityRepo = makeRepo<AuthorityOpportunity>('authority', seed.AUTHORITY);
export const proofRepo = makeRepo<SocialProofAsset>('proof', seed.PROOF);
export const croRepo = makeRepo<CROOpportunity>('cro', seed.CRO);
export const experimentsRepo = makeRepo<GrowthExperiment>('experiment', seed.EXPERIMENTS);
export const offersRepo = makeRepo<OfferTest>('offer', seed.OFFERS);
export const competitorsRepo = makeRepo<CompetitorInsight>('competitor', seed.COMPETITORS);
export const customerInsightsRepo = makeRepo<CustomerInsight>('customer-insight', seed.CUSTOMER_INSIGHTS);
export const brandVoiceRepo = makeRepo<BrandVoiceAsset>('brand-voice', seed.BRAND_VOICE);
export const assetsRepo = makeRepo<MarketingAsset>('asset', seed.ASSETS);
export const calendarRepo = makeRepo<MarketingCalendarItem>('calendar', seed.CALENDAR);
export const utmRepo = makeRepo<UTMLink>('utm', seed.UTM_LINKS);
export const metricsRepo = makeRepo<MarketingMetric>('metric', seed.METRICS);
export const tasksRepo = makeRepo<MarketingTask>('task', seed.TASKS);
export const recommendationsRepo = makeRepo<AIRecommendation>('recommendation', seed.RECOMMENDATIONS);
export const consentRepo = makeRepo<ConsentRecord>('consent', seed.CONSENT_RECORDS);
export const pixelsRepo = makeRepo<TrackingPixel>('pixel', seed.TRACKING_PIXELS);
export const attributionRepo = makeRepo<AttributionEvent>('attribution', seed.ATTRIBUTION_EVENTS);

/** Registry of writable record repositories, keyed by the API `kind`. */
export const RECORD_REPOS: Record<string, Repository<{ id: string }>> = {
  channel: channelsRepo as Repository<{ id: string }>,
  strategy: strategiesRepo as Repository<{ id: string }>,
  campaign: campaignsRepo as Repository<{ id: string }>,
  'paid-campaign': paidCampaignsRepo as Repository<{ id: string }>,
  content: contentRepo as Repository<{ id: string }>,
  social: socialRepo as Repository<{ id: string }>,
  'crm-message': crmMessagesRepo as Repository<{ id: string }>,
  automation: automationsRepo as Repository<{ id: string }>,
  creator: creatorsRepo as Repository<{ id: string }>,
  affiliate: affiliatesRepo as Repository<{ id: string }>,
  referral: referralsRepo as Repository<{ id: string }>,
  community: communityRepo as Repository<{ id: string }>,
  authority: authorityRepo as Repository<{ id: string }>,
  proof: proofRepo as Repository<{ id: string }>,
  cro: croRepo as Repository<{ id: string }>,
  experiment: experimentsRepo as Repository<{ id: string }>,
  offer: offersRepo as Repository<{ id: string }>,
  competitor: competitorsRepo as Repository<{ id: string }>,
  'customer-insight': customerInsightsRepo as Repository<{ id: string }>,
  asset: assetsRepo as Repository<{ id: string }>,
  task: tasksRepo as Repository<{ id: string }>,
  recommendation: recommendationsRepo as Repository<{ id: string }>,
};

/** True when any repo is DB-backed (Supabase configured). */
export function isGrowthPersistent(): boolean {
  return channelsRepo.isPersistent();
}

// ── Seeding (used by /api/growth/seed) ────────────────────────
/** All repos paired with their seed arrays, for one-time DB seeding. */
const ALL_SEEDS: Array<{ repo: Repository<{ id: string }>; items: Array<{ id: string }> }> = [
  { repo: channelsRepo as Repository<{ id: string }>, items: seed.CHANNELS },
  { repo: strategiesRepo as Repository<{ id: string }>, items: seed.STRATEGIES },
  { repo: campaignsRepo as Repository<{ id: string }>, items: seed.CAMPAIGNS },
  { repo: paidCampaignsRepo as Repository<{ id: string }>, items: seed.PAID_CAMPAIGNS },
  { repo: contentRepo as Repository<{ id: string }>, items: seed.CONTENT },
  { repo: socialRepo as Repository<{ id: string }>, items: seed.SOCIAL },
  { repo: lifecycleStagesRepo as Repository<{ id: string }>, items: seed.LIFECYCLE_STAGES },
  { repo: crmMessagesRepo as Repository<{ id: string }>, items: seed.CRM_MESSAGES },
  { repo: automationsRepo as Repository<{ id: string }>, items: seed.AUTOMATIONS },
  { repo: creatorsRepo as Repository<{ id: string }>, items: seed.CREATORS },
  { repo: affiliatesRepo as Repository<{ id: string }>, items: seed.AFFILIATES },
  { repo: referralsRepo as Repository<{ id: string }>, items: seed.REFERRALS },
  { repo: communityRepo as Repository<{ id: string }>, items: seed.COMMUNITY },
  { repo: authorityRepo as Repository<{ id: string }>, items: seed.AUTHORITY },
  { repo: proofRepo as Repository<{ id: string }>, items: seed.PROOF },
  { repo: croRepo as Repository<{ id: string }>, items: seed.CRO },
  { repo: experimentsRepo as Repository<{ id: string }>, items: seed.EXPERIMENTS },
  { repo: offersRepo as Repository<{ id: string }>, items: seed.OFFERS },
  { repo: competitorsRepo as Repository<{ id: string }>, items: seed.COMPETITORS },
  { repo: customerInsightsRepo as Repository<{ id: string }>, items: seed.CUSTOMER_INSIGHTS },
  { repo: brandVoiceRepo as Repository<{ id: string }>, items: seed.BRAND_VOICE },
  { repo: assetsRepo as Repository<{ id: string }>, items: seed.ASSETS },
  { repo: calendarRepo as Repository<{ id: string }>, items: seed.CALENDAR },
  { repo: utmRepo as Repository<{ id: string }>, items: seed.UTM_LINKS },
  { repo: metricsRepo as Repository<{ id: string }>, items: seed.METRICS },
  { repo: tasksRepo as Repository<{ id: string }>, items: seed.TASKS },
  { repo: recommendationsRepo as Repository<{ id: string }>, items: seed.RECOMMENDATIONS },
  { repo: consentRepo as Repository<{ id: string }>, items: seed.CONSENT_RECORDS },
  { repo: pixelsRepo as Repository<{ id: string }>, items: seed.TRACKING_PIXELS },
  { repo: attributionRepo as Repository<{ id: string }>, items: seed.ATTRIBUTION_EVENTS },
];

/** Upsert all seed records into the DB. Idempotent (upsert by id). */
export async function seedGrowthData(): Promise<{ seeded: number }> {
  let count = 0;
  for (const { repo, items } of ALL_SEEDS) {
    for (const item of items) {
      await repo.create(item);
      count += 1;
    }
  }
  return { seeded: count };
}

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
  persistent: boolean;
}

export async function getOverviewSnapshot(): Promise<OverviewSnapshot> {
  const [campaigns, content, recs, tasks, metrics, calendar, channels, experiments] = await Promise.all([
    campaignsRepo.list(), contentRepo.list(), recommendationsRepo.list(), tasksRepo.list(),
    metricsRepo.list(), calendarRepo.list(), channelsRepo.list(), experimentsRepo.list(),
  ]);
  const today = new Date('2026-06-03T00:00:00.000Z').getTime();

  return {
    counts: {
      channels: channels.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      experiments: experiments.length,
      contentInProgress: content.filter((c) => ['draft', 'in-review', 'brief'].includes(c.status)).length,
      openRecommendations: recs.filter((r) => r.status !== 'done' && r.status !== 'archived').length,
      openTasks: tasks.filter((t) => t.status !== 'done').length,
    },
    metrics,
    topRecommendations: recs.slice(0, 3),
    upcoming: calendar
      .filter((c) => new Date(c.date).getTime() >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5),
    persistent: isGrowthPersistent(),
  };
}
