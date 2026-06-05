// ============================================================
// SwingVantage — Video Studio: Persistence Repository
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Everything the video system stores goes through one small interface
//   so the rest of the code never touches the database directly.
//
//   - With Supabase configured (service-role key present) it persists to
//     the `video_*` tables (see supabase-video-studio.sql), using a
//     simple, robust "id + indexed columns + JSONB data" row shape.
//   - Without it, an in-memory repo keeps everything for the life of the
//     process. That's enough to demo the whole pipeline locally; the
//     admin UI is HONEST that nothing is durably saved until Supabase is
//     connected.
//
//   Every Supabase call is defensive: a schema/permission error degrades
//   to a safe empty result and never crashes a page or route.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type {
  VideoOpportunity,
  VideoCreativeBrief,
  VideoGenerationJob,
  VideoAsset,
  StudioPlacement,
  VideoPerformanceMetric,
  VideoReassessment,
  VideoAuditLog,
  VideoVersion,
  OpportunityStatus,
} from './types';
import type { RecordedEvent } from './analytics';

export interface StoredEvent extends RecordedEvent {
  id: string;
  assetId: string;
  placementId: string;
}

export interface VideoStudioRepo {
  /** Whether writes are durably persisted (false for in-memory). */
  isPersistent(): boolean;
  backendLabel(): string;

  saveOpportunities(opps: VideoOpportunity[]): Promise<void>;
  listOpportunities(): Promise<VideoOpportunity[]>;
  getOpportunity(id: string): Promise<VideoOpportunity | undefined>;
  updateOpportunityStatus(id: string, status: OpportunityStatus): Promise<void>;

  saveBrief(brief: VideoCreativeBrief): Promise<void>;
  getBrief(id: string): Promise<VideoCreativeBrief | undefined>;
  listBriefs(): Promise<VideoCreativeBrief[]>;

  saveJob(job: VideoGenerationJob): Promise<void>;
  getJob(id: string): Promise<VideoGenerationJob | undefined>;
  listJobs(): Promise<VideoGenerationJob[]>;

  saveAsset(asset: VideoAsset): Promise<void>;
  getAsset(id: string): Promise<VideoAsset | undefined>;
  listAssets(): Promise<VideoAsset[]>;
  listPublishedAssets(): Promise<VideoAsset[]>;

  upsertPlacement(p: StudioPlacement): Promise<void>;
  getPlacement(id: string): Promise<StudioPlacement | undefined>;
  listPlacements(): Promise<StudioPlacement[]>;

  appendEvents(events: StoredEvent[]): Promise<void>;
  listEventsForAsset(assetId: string): Promise<StoredEvent[]>;

  saveMetric(m: VideoPerformanceMetric): Promise<void>;
  listMetrics(): Promise<VideoPerformanceMetric[]>;

  saveReassessment(r: VideoReassessment): Promise<void>;
  listReassessments(): Promise<VideoReassessment[]>;

  saveVersion(v: VideoVersion): Promise<void>;
  listVersions(assetId: string): Promise<VideoVersion[]>;

  appendAudit(log: VideoAuditLog): Promise<void>;
  listAudit(limit?: number): Promise<VideoAuditLog[]>;
}

// ── In-memory implementation ──────────────────────────────────
// Module-level maps persist for the life of the process. Good enough for
// local/dev and tests; not shared across serverless instances (hence the
// honest isPersistent()=false).

class InMemoryRepo implements VideoStudioRepo {
  private opportunities = new Map<string, VideoOpportunity>();
  private briefs = new Map<string, VideoCreativeBrief>();
  private jobs = new Map<string, VideoGenerationJob>();
  private assets = new Map<string, VideoAsset>();
  private placements = new Map<string, StudioPlacement>();
  private events: StoredEvent[] = [];
  private metrics = new Map<string, VideoPerformanceMetric>();
  private reassessments: VideoReassessment[] = [];
  private versions: VideoVersion[] = [];
  private audit: VideoAuditLog[] = [];

  isPersistent() {
    return false;
  }
  backendLabel() {
    return 'In-memory (not durable — connect Supabase to persist)';
  }

  async saveOpportunities(opps: VideoOpportunity[]) {
    for (const o of opps) this.opportunities.set(o.id, o);
  }
  async listOpportunities() {
    return [...this.opportunities.values()];
  }
  async getOpportunity(id: string) {
    return this.opportunities.get(id);
  }
  async updateOpportunityStatus(id: string, status: OpportunityStatus) {
    const o = this.opportunities.get(id);
    if (o) this.opportunities.set(id, { ...o, status, updatedAt: new Date().toISOString() });
  }

  async saveBrief(brief: VideoCreativeBrief) {
    this.briefs.set(brief.id, brief);
  }
  async getBrief(id: string) {
    return this.briefs.get(id);
  }
  async listBriefs() {
    return [...this.briefs.values()];
  }

  async saveJob(job: VideoGenerationJob) {
    this.jobs.set(job.id, job);
  }
  async getJob(id: string) {
    return this.jobs.get(id);
  }
  async listJobs() {
    return [...this.jobs.values()];
  }

  async saveAsset(asset: VideoAsset) {
    this.assets.set(asset.id, asset);
  }
  async getAsset(id: string) {
    return this.assets.get(id);
  }
  async listAssets() {
    return [...this.assets.values()];
  }
  async listPublishedAssets() {
    return [...this.assets.values()].filter((a) => a.published);
  }

  async upsertPlacement(p: StudioPlacement) {
    this.placements.set(p.id, p);
  }
  async getPlacement(id: string) {
    return this.placements.get(id);
  }
  async listPlacements() {
    return [...this.placements.values()];
  }

  async appendEvents(events: StoredEvent[]) {
    this.events.push(...events);
  }
  async listEventsForAsset(assetId: string) {
    return this.events.filter((e) => e.assetId === assetId);
  }

  async saveMetric(m: VideoPerformanceMetric) {
    this.metrics.set(m.id, m);
  }
  async listMetrics() {
    return [...this.metrics.values()];
  }

  async saveReassessment(r: VideoReassessment) {
    this.reassessments.push(r);
  }
  async listReassessments() {
    return [...this.reassessments];
  }

  async saveVersion(v: VideoVersion) {
    this.versions.push(v);
  }
  async listVersions(assetId: string) {
    return this.versions.filter((v) => v.assetId === assetId);
  }

  async appendAudit(log: VideoAuditLog) {
    this.audit.unshift(log);
  }
  async listAudit(limit = 100) {
    return this.audit.slice(0, limit);
  }
}

// ── Supabase implementation ───────────────────────────────────
// Uses the "id + JSONB data" row shape so there is almost no column
// mapping to get wrong. Each method is wrapped so a failure degrades to a
// safe empty result rather than throwing into a page/route.

type Client = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

class SupabaseRepo implements VideoStudioRepo {
  constructor(private db: Client) {}

  isPersistent() {
    return true;
  }
  backendLabel() {
    return 'Supabase (durable)';
  }

  private async upsert<T extends { id: string }>(
    table: string,
    row: T,
    extra: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await this.db.from(table).upsert({ id: row.id, data: row, ...extra, updated_at: new Date().toISOString() });
    } catch {
      /* degrade silently — caller treats as best-effort */
    }
  }

  private async all<T>(table: string): Promise<T[]> {
    try {
      const { data } = await this.db.from(table).select('data');
      return (data ?? []).map((r: { data: T }) => r.data);
    } catch {
      return [];
    }
  }

  private async one<T>(table: string, id: string): Promise<T | undefined> {
    try {
      const { data } = await this.db.from(table).select('data').eq('id', id).maybeSingle();
      return (data as { data: T } | null)?.data;
    } catch {
      return undefined;
    }
  }

  async saveOpportunities(opps: VideoOpportunity[]) {
    for (const o of opps) {
      await this.upsert('video_opportunities', o, {
        surface_id: o.surfaceId,
        status: o.status,
        priority: o.priorityScore,
      });
    }
  }
  listOpportunities() {
    return this.all<VideoOpportunity>('video_opportunities');
  }
  getOpportunity(id: string) {
    return this.one<VideoOpportunity>('video_opportunities', id);
  }
  async updateOpportunityStatus(id: string, status: OpportunityStatus) {
    const o = await this.getOpportunity(id);
    if (o) await this.saveOpportunities([{ ...o, status, updatedAt: new Date().toISOString() }]);
  }

  saveBrief(brief: VideoCreativeBrief) {
    return this.upsert('video_briefs', brief, { opportunity_id: brief.opportunityId, version: brief.version });
  }
  getBrief(id: string) {
    return this.one<VideoCreativeBrief>('video_briefs', id);
  }
  listBriefs() {
    return this.all<VideoCreativeBrief>('video_briefs');
  }

  saveJob(job: VideoGenerationJob) {
    return this.upsert('video_jobs', job, { status: job.status, brief_id: job.briefId });
  }
  getJob(id: string) {
    return this.one<VideoGenerationJob>('video_jobs', id);
  }
  listJobs() {
    return this.all<VideoGenerationJob>('video_jobs');
  }

  saveAsset(asset: VideoAsset) {
    return this.upsert('video_assets', asset, {
      published: asset.published,
      lifecycle: asset.lifecycle,
      opportunity_id: asset.opportunityId,
    });
  }
  getAsset(id: string) {
    return this.one<VideoAsset>('video_assets', id);
  }
  listAssets() {
    return this.all<VideoAsset>('video_assets');
  }
  async listPublishedAssets() {
    return (await this.all<VideoAsset>('video_assets')).filter((a) => a.published);
  }

  upsertPlacement(p: StudioPlacement) {
    return this.upsert('video_placements', p, { surface_id: p.surfaceId, page: p.page, enabled: p.enabled });
  }
  getPlacement(id: string) {
    return this.one<StudioPlacement>('video_placements', id);
  }
  listPlacements() {
    return this.all<StudioPlacement>('video_placements');
  }

  async appendEvents(events: StoredEvent[]) {
    if (events.length === 0) return;
    try {
      await this.db
        .from('video_events')
        .insert(events.map((e) => ({ id: e.id, asset_id: e.assetId, placement_id: e.placementId, data: e })));
    } catch {
      /* best-effort */
    }
  }
  async listEventsForAsset(assetId: string) {
    try {
      const { data } = await this.db.from('video_events').select('data').eq('asset_id', assetId);
      return (data ?? []).map((r: { data: StoredEvent }) => r.data);
    } catch {
      return [];
    }
  }

  saveMetric(m: VideoPerformanceMetric) {
    return this.upsert('video_metrics', m, { asset_id: m.assetId, placement_id: m.placementId });
  }
  listMetrics() {
    return this.all<VideoPerformanceMetric>('video_metrics');
  }

  async saveReassessment(r: VideoReassessment) {
    await this.upsert('video_reassessments', r, { asset_id: r.assetId });
  }
  listReassessments() {
    return this.all<VideoReassessment>('video_reassessments');
  }

  async saveVersion(v: VideoVersion) {
    await this.upsert('video_versions', v, { asset_id: v.assetId, version: v.version });
  }
  async listVersions(assetId: string) {
    return (await this.all<VideoVersion>('video_versions')).filter((v) => v.assetId === assetId);
  }

  async appendAudit(log: VideoAuditLog) {
    await this.upsert('video_audit_logs', log, { action: log.action, target_id: log.targetId });
  }
  async listAudit(limit = 100) {
    const all = await this.all<VideoAuditLog>('video_audit_logs');
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }
}

// ── Selection ─────────────────────────────────────────────────

let memo: VideoStudioRepo | null = null;

/**
 * Get the active repo: Supabase when the service-role key is configured,
 * otherwise the in-memory repo. Memoized per process.
 */
export function getRepo(): VideoStudioRepo {
  if (memo) return memo;
  const client = createSupabaseAdminClient();
  memo = client ? new SupabaseRepo(client) : new InMemoryRepo();
  return memo;
}

/** Test seam: force a fresh in-memory repo. */
export function __setInMemoryRepoForTests(): VideoStudioRepo {
  memo = new InMemoryRepo();
  return memo;
}
