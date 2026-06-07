// ============================================================
// SwingVantage — Feature Education Engine: Persistence Repository
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Everything the engine stores goes through one small interface so the
//   rest of the code never touches the database directly.
//
//   - With Supabase configured (service-role key present) it persists to
//     the `feature_education_*` tables (see supabase-feature-education.sql),
//     using the same "id + indexed columns + JSONB data" row shape as the
//     Video Studio repo.
//   - Without it, an in-memory repo keeps everything for the life of the
//     process — and SEEDS the Feature Registry from the committed snapshot
//     (apps/web/src/data/feature-registry.json) so the dashboard shows the
//     real, source-controlled registry even in local mode. The UI is HONEST
//     that generated assets are not durably saved until Supabase is connected.
//
//   Every Supabase call is defensive: a schema/permission error degrades to
//   a safe empty result and never crashes a page or route.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import REGISTRY_SNAPSHOT from '@/data/feature-registry.json';
import type {
  FeatureRecord,
  EducationAsset,
  AssetVersion,
  DriftFinding,
  FeeAuditLog,
} from './types';

/** Shape of the committed registry snapshot file. */
interface RegistrySnapshot {
  generatedAt: string;
  commitRange: string;
  features: FeatureRecord[];
}

const SNAPSHOT = REGISTRY_SNAPSHOT as unknown as RegistrySnapshot;

export interface FeatureEducationRepo {
  /** Whether writes are durably persisted (false for in-memory). */
  isPersistent(): boolean;
  backendLabel(): string;

  upsertFeatures(features: FeatureRecord[]): Promise<void>;
  listFeatures(): Promise<FeatureRecord[]>;
  getFeature(id: string): Promise<FeatureRecord | undefined>;

  saveAsset(asset: EducationAsset): Promise<void>;
  getAsset(id: string): Promise<EducationAsset | undefined>;
  listAssets(): Promise<EducationAsset[]>;
  listAssetsForFeature(featureId: string): Promise<EducationAsset[]>;

  saveVersion(v: AssetVersion): Promise<void>;
  listVersions(assetId: string): Promise<AssetVersion[]>;

  saveDrift(findings: DriftFinding[]): Promise<void>;
  listDrift(): Promise<DriftFinding[]>;
  clearDrift(): Promise<void>;

  appendAudit(log: FeeAuditLog): Promise<void>;
  listAudit(limit?: number): Promise<FeeAuditLog[]>;
}

// ── In-memory implementation ──────────────────────────────────

class InMemoryRepo implements FeatureEducationRepo {
  private features = new Map<string, FeatureRecord>();
  private assets = new Map<string, EducationAsset>();
  private versions: AssetVersion[] = [];
  private drift: DriftFinding[] = [];
  private audit: FeeAuditLog[] = [];

  constructor(seed = true) {
    if (seed) {
      for (const f of SNAPSHOT.features ?? []) this.features.set(f.id, f);
    }
  }

  isPersistent() {
    return false;
  }
  backendLabel() {
    return 'In-memory (registry seeded from snapshot; generated assets not durable — connect Supabase to persist)';
  }

  async upsertFeatures(features: FeatureRecord[]) {
    for (const f of features) this.features.set(f.id, f);
  }
  async listFeatures() {
    return [...this.features.values()];
  }
  async getFeature(id: string) {
    return this.features.get(id);
  }

  async saveAsset(asset: EducationAsset) {
    this.assets.set(asset.id, asset);
  }
  async getAsset(id: string) {
    return this.assets.get(id);
  }
  async listAssets() {
    return [...this.assets.values()];
  }
  async listAssetsForFeature(featureId: string) {
    return [...this.assets.values()].filter((a) => a.featureId === featureId);
  }

  async saveVersion(v: AssetVersion) {
    // Newest version of an asset becomes current; older ones flip to false.
    if (v.isCurrent) {
      this.versions = this.versions.map((old) =>
        old.assetId === v.assetId ? { ...old, isCurrent: false } : old,
      );
    }
    this.versions.push(v);
  }
  async listVersions(assetId: string) {
    return this.versions.filter((v) => v.assetId === assetId).sort((a, b) => b.version - a.version);
  }

  async saveDrift(findings: DriftFinding[]) {
    this.drift = findings;
  }
  async listDrift() {
    return [...this.drift];
  }
  async clearDrift() {
    this.drift = [];
  }

  async appendAudit(log: FeeAuditLog) {
    this.audit.unshift(log);
  }
  async listAudit(limit = 100) {
    return this.audit.slice(0, limit);
  }
}

// ── Supabase implementation ───────────────────────────────────
// "id + JSONB data" row shape (mirrors lib/video-studio/repo.ts). Each
// method degrades to a safe empty result rather than throwing.

type Client = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

class SupabaseRepo implements FeatureEducationRepo {
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
      await this.db
        .from(table)
        .upsert({ id: row.id, data: row, ...extra, updated_at: new Date().toISOString() });
    } catch {
      /* best-effort */
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

  async upsertFeatures(features: FeatureRecord[]) {
    for (const f of features) {
      await this.upsert('feature_records', f, {
        slug: f.slug,
        category: f.category,
        status: f.status,
      });
    }
  }
  async listFeatures() {
    const stored = await this.all<FeatureRecord>('feature_records');
    // Fall back to the committed snapshot if nothing has been persisted yet.
    return stored.length > 0 ? stored : (SNAPSHOT.features ?? []);
  }
  async getFeature(id: string) {
    const row = await this.one<FeatureRecord>('feature_records', id);
    return row ?? (SNAPSHOT.features ?? []).find((f) => f.id === id);
  }

  saveAsset(asset: EducationAsset) {
    return this.upsert('feature_education_assets', asset, {
      feature_id: asset.featureId,
      type: asset.type,
      status: asset.status,
    });
  }
  getAsset(id: string) {
    return this.one<EducationAsset>('feature_education_assets', id);
  }
  listAssets() {
    return this.all<EducationAsset>('feature_education_assets');
  }
  async listAssetsForFeature(featureId: string) {
    return (await this.all<EducationAsset>('feature_education_assets')).filter(
      (a) => a.featureId === featureId,
    );
  }

  saveVersion(v: AssetVersion) {
    return this.upsert('feature_education_versions', v, { asset_id: v.assetId, version: v.version });
  }
  async listVersions(assetId: string) {
    return (await this.all<AssetVersion>('feature_education_versions'))
      .filter((v) => v.assetId === assetId)
      .sort((a, b) => b.version - a.version);
  }

  async saveDrift(findings: DriftFinding[]) {
    for (const f of findings) await this.upsert('feature_education_drift', f, { feature_id: f.featureId });
  }
  listDrift() {
    return this.all<DriftFinding>('feature_education_drift');
  }
  async clearDrift() {
    try {
      await this.db.from('feature_education_drift').delete().neq('id', '');
    } catch {
      /* best-effort */
    }
  }

  async appendAudit(log: FeeAuditLog) {
    await this.upsert('feature_education_audit', log, { action: log.action, target_id: log.targetId });
  }
  async listAudit(limit = 100) {
    const all = await this.all<FeeAuditLog>('feature_education_audit');
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }
}

// ── Selection ─────────────────────────────────────────────────

let memo: FeatureEducationRepo | null = null;

/**
 * Get the active repo: Supabase when the service-role key is configured,
 * otherwise the snapshot-seeded in-memory repo. Memoized per process.
 */
export function getRepo(): FeatureEducationRepo {
  if (memo) return memo;
  const client = createSupabaseAdminClient();
  memo = client ? new SupabaseRepo(client) : new InMemoryRepo();
  return memo;
}

/** Test seam: force a fresh, EMPTY in-memory repo (no snapshot seed). */
export function __setInMemoryRepoForTests(): FeatureEducationRepo {
  memo = new InMemoryRepo(false);
  return memo;
}

/** Read the committed registry snapshot directly (server + scripts). */
export function getSnapshot(): RegistrySnapshot {
  return SNAPSHOT;
}
