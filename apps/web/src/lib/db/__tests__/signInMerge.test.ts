// ============================================================
// SwingVantage — sign-in merge + round-trip integration tests
//
// Exercises the real data pipeline that runs the first time a guest signs in:
//   loadAll → mergeOnSignIn → reconcile → loadAll
// against an in-memory fake of the Supabase query surface. This is the one
// place a bug would silently destroy a user's on-device progress, so we assert
// the three documented branches end-to-end:
//   • empty account     → local data migrates up (nothing required to keep it)
//   • returning device  → a delete on this device propagates (no resurrection)
//   • first sign-in here → union; data on BOTH sides survives
// Plus countResidualUserRows (the cascade-delete safety check).
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SwingVantageState, LocalClub } from '@/store';
import {
  loadAll, reconcile, freshCaches, primeCaches, fillDefaults,
  deleteAllForUser, countResidualUserRows,
} from '../cloud-repo';
import { mergeOnSignIn } from '../sign-in-merge';
import { computeBase } from '../sync-base';

// ── Minimal in-memory fake of the Supabase query surface used by the repo ──
type Row = Record<string, unknown>;

class FakeQuery {
  private op: 'select' | 'upsert' | 'delete' = 'select';
  private filters: Array<[string, unknown]> = [];
  private inFilter: [string, unknown[]] | null = null;
  private payload: Row | Row[] | null = null;
  private conflict: string[] = ['id'];
  private head = false;

  constructor(private db: Record<string, Row[]>, private table: string) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    this.op = 'select';
    if (opts?.head) this.head = true;
    return this;
  }
  upsert(rows: Row | Row[], opts?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = rows;
    if (opts?.onConflict) this.conflict = opts.onConflict.split(',');
    return this;
  }
  delete() { this.op = 'delete'; return this; }
  eq(col: string, val: unknown) { this.filters.push([col, val]); return this; }
  in(col: string, vals: unknown[]) { this.inFilter = [col, vals]; return this; }
  order() { return this; }

  private rows(): Row[] { return (this.db[this.table] ??= []); }
  private matches(r: Row): boolean {
    for (const [c, v] of this.filters) if (r[c] !== v) return false;
    if (this.inFilter) { const [c, vals] = this.inFilter; if (!vals.includes(r[c])) return false; }
    return true;
  }

  private run() {
    if (this.op === 'select') {
      const found = this.rows().filter((r) => this.matches(r));
      return { data: this.head ? null : found.map((r) => ({ ...r })), error: null, count: found.length };
    }
    if (this.op === 'upsert') {
      const incoming = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      const arr = this.rows();
      for (const row of incoming) {
        const i = arr.findIndex((e) => this.conflict.every((k) => e[k] === row[k]));
        if (i >= 0) arr[i] = { ...row }; else arr.push({ ...row });
      }
      return { data: null, error: null, count: null };
    }
    this.db[this.table] = this.rows().filter((r) => !this.matches(r));
    return { data: null, error: null, count: null };
  }

  // Thenable: awaiting the chain runs it against the in-memory db.
  then<T>(resolve: (v: ReturnType<FakeQuery['run']>) => T) { return resolve(this.run()); }
}

function fakeClient(): SupabaseClient {
  const db: Record<string, Row[]> = {};
  return { from: (table: string) => new FakeQuery(db, table) } as unknown as SupabaseClient;
}

const UID = 'user-1';

function club(id: string, over: Partial<LocalClub> = {}): LocalClub {
  return {
    id, name: id, category: 'iron', brand: 'B', model: 'M',
    loft: null, typical_carry: null, typical_total: null,
    shaft_flex: '', notes: '', sort_order: 0, created_at: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

const stateWith = (...clubs: LocalClub[]): SwingVantageState => fillDefaults({ clubs });
const clubIds = (s: { clubs?: LocalClub[] }): string[] => (s.clubs ?? []).map((c) => c.id).sort();

/** Apply a sign-in merge result the way the provider does (setState over local). */
async function syncSignIn(
  client: SupabaseClient, local: SwingVantageState, base: ReturnType<typeof computeBase> | null,
) {
  const load = await loadAll(client, UID);
  const { apply, cloudFull } = mergeOnSignIn(local, load, base);
  const merged = apply ? ({ ...local, ...apply } as SwingVantageState) : local;
  const caches = freshCaches();
  if (cloudFull) primeCaches(cloudFull, UID, caches);
  await reconcile(client, UID, merged, caches);
  return merged;
}

describe('mergeOnSignIn (pure)', () => {
  it('empty account → keeps local untouched (apply null) so it migrates up', () => {
    const local = stateWith(club('A'));
    const res = mergeOnSignIn(local, { state: {}, caches: freshCaches(), isEmpty: true,
      presence: { training: false, settings: false, community: false, tutorial: false, agent: false } }, null);
    expect(res.apply).toBeNull();
    expect(res.cloudFull).toBeNull();
  });
});

describe('sign-in round-trip (loadAll → mergeOnSignIn → reconcile → loadAll)', () => {
  it('empty account: local data is migrated up and persists', async () => {
    const client = fakeClient();
    await syncSignIn(client, stateWith(club('A')), null);
    const after = await loadAll(client, UID);
    expect(clubIds(after.state)).toEqual(['A']);
  });

  it('returning device: a local delete propagates (no resurrection); new item kept', async () => {
    const client = fakeClient();
    // Cloud + device last agreed on {A, B}.
    await reconcile(client, UID, stateWith(club('A'), club('B')), freshCaches());
    const base = computeBase(stateWith(club('A'), club('B')));
    // On this device since then: A was deleted, C was added → local {B, C}.
    await syncSignIn(client, stateWith(club('B'), club('C')), base);
    const after = await loadAll(client, UID);
    expect(clubIds(after.state)).toEqual(['B', 'C']); // A is gone everywhere, not revived
  });

  it('first sign-in (no base): union — data on both sides survives', async () => {
    const client = fakeClient();
    await reconcile(client, UID, stateWith(club('B')), freshCaches()); // cloud has B
    await syncSignIn(client, stateWith(club('A')), null);              // device has A
    const after = await loadAll(client, UID);
    expect(clubIds(after.state)).toEqual(['A', 'B']); // nothing lost
  });
});

describe('countResidualUserRows (cascade-delete safety check)', () => {
  it('counts owned rows and reads 0 after every owned row is removed', async () => {
    const client = fakeClient();
    await reconcile(client, UID, stateWith(club('A'), club('B')), freshCaches());
    expect(await countResidualUserRows(client, UID)).toBeGreaterThan(0);
    await deleteAllForUser(client, UID);
    expect(await countResidualUserRows(client, UID)).toBe(0);
  });
});
