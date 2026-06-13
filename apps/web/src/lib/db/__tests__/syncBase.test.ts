// ============================================================
// SwingVantage — sync base load/validation tests
//
// Runs in the node test env, so we install a minimal in-memory localStorage on
// a fake `window` (loadBase/saveBase read `window` directly). The point of
// these tests is the corruption guard: a truncated/corrupt base must degrade to
// `null` (→ non-destructive union on the next sign-in) rather than reach the
// 3-way merge, which indexes base.clubs[id] / base.training directly and would
// throw on a malformed blob.
// ============================================================

import { computeBase, loadBase, saveBase } from '../sync-base';
import { fillDefaults } from '../cloud-repo';

const UID = 'user-1';

function installLocalStorage() {
  const store: Record<string, string> = {};
  (globalThis as unknown as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    },
  };
  return store;
}

let store: Record<string, string>;
const key = `swingiq.syncBase.${UID}`;

beforeEach(() => { store = installLocalStorage(); });
afterEach(() => { delete (globalThis as unknown as { window?: unknown }).window; });

describe('loadBase', () => {
  it('returns null when nothing is stored', () => {
    expect(loadBase(UID)).toBeNull();
  });

  it('round-trips a valid base written by saveBase', () => {
    const base = computeBase(fillDefaults({}));
    saveBase(UID, base);
    expect(loadBase(UID)).toEqual(base);
  });

  it('returns null for non-JSON garbage', () => {
    store[key] = 'not json {{{';
    expect(loadBase(UID)).toBeNull();
  });

  it('returns null for the wrong version', () => {
    store[key] = JSON.stringify({ v: 2, clubs: {} });
    expect(loadBase(UID)).toBeNull();
  });

  it('returns null for a truncated v:1 blob missing required fields', () => {
    // The dangerous case: valid JSON, correct version, but structurally
    // incomplete — would make the 3-way merge throw on base.clubs[id].
    store[key] = JSON.stringify({ v: 1 });
    expect(loadBase(UID)).toBeNull();
  });

  it('returns null when a record field is the wrong type', () => {
    const base = computeBase(fillDefaults({})) as unknown as Record<string, unknown>;
    saveBase(UID, { ...base, clubs: 'oops' } as never);
    expect(loadBase(UID)).toBeNull();
  });
});
