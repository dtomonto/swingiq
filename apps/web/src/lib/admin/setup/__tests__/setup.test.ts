// ============================================================
// SwingVantage Admin — Setup hub: unit tests (pure logic + catalog integrity)
// ------------------------------------------------------------
// No env reads, no server-only imports — we build SetupSignals by hand and
// assert the resolver/summary/grouping behave, plus guard the hand-written
// catalog against typos (bad capability/derived keys, duplicate ids, etc.).
// ============================================================

import {
  resolveTask, resolveAll, summarize, groupByCategory, dedupeById,
  CATEGORY_ORDER, CATEGORY_META,
} from '../registry';
import { CATALOG } from '../catalog';
import { loadAllSetupTasks } from '../index';
import type { SetupTask, SetupSignal, CapabilityKey } from '../types';

const CAP_KEYS: CapabilityKey[] = ['auth', 'aiCoach', 'aiVision', 'ocr', 'email', 'billing', 'ads'];

// The derived booleans computeDerived() produces in status.ts. Kept in sync by
// the catalog-integrity test below (a typo'd `derived` key would never resolve).
const DERIVED_KEYS = new Set([
  'prod-urls', 'admin-protected', 'analytics-any', 'ai-budget',
  'rate-limit-redis', 'cron-secret', 'gsc-verify', 'gsc-search-analytics',
  'ghin-live',
]);

function signal(over: Partial<SetupSignal> = {}): SetupSignal {
  return {
    caps: { auth: false, aiCoach: false, aiVision: false, ocr: false, email: false, billing: false, ads: false },
    env: {},
    derived: {},
    generatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

const task = (over: Partial<SetupTask>): SetupTask => ({
  id: 't', title: 'T', plainEnglish: 'why', category: 'go-live',
  priority: 'required', detect: { kind: 'manual' }, steps: ['do it'], ...over,
});

describe('resolveTask — detection kinds', () => {
  it('capability: done when the live cap is true', () => {
    const t = task({ detect: { kind: 'capability', cap: 'aiVision' } });
    expect(resolveTask(t, signal({ caps: { ...signal().caps, aiVision: true } }), new Set()).status).toBe('done');
    expect(resolveTask(t, signal(), new Set()).status).toBe('action-needed');
  });

  it('env: done when ANY listed var is set', () => {
    const t = task({ detect: { kind: 'env', anyOf: ['A', 'B'] }, priority: 'recommended' });
    expect(resolveTask(t, signal({ env: { B: true } }), new Set()).status).toBe('done');
    expect(resolveTask(t, signal({ env: { A: false, B: false } }), new Set()).status).toBe('action-needed');
  });

  it('derived: reads the named boolean', () => {
    const t = task({ detect: { kind: 'derived', key: 'prod-urls' } });
    expect(resolveTask(t, signal({ derived: { 'prod-urls': true } }), new Set()).status).toBe('done');
  });

  it('optional + not satisfied → optional-todo (not action-needed)', () => {
    const t = task({ priority: 'optional', detect: { kind: 'capability', cap: 'ads' } });
    expect(resolveTask(t, signal(), new Set()).status).toBe('optional-todo');
  });

  it('info → always reference, never counted', () => {
    const t = task({ detect: { kind: 'info' } });
    expect(resolveTask(t, signal(), new Set()).status).toBe('reference');
  });
});

describe('resolveTask — live signal vs acknowledgement', () => {
  it('manual task is done only when acknowledged', () => {
    const t = task({ id: 'm', detect: { kind: 'manual' } });
    expect(resolveTask(t, signal(), new Set()).status).toBe('action-needed');
    expect(resolveTask(t, signal(), new Set(['m'])).status).toBe('done');
  });

  it('auto task IGNORES acknowledgement — the live signal always wins', () => {
    const t = task({ id: 'a', detect: { kind: 'capability', cap: 'auth' } });
    // Acknowledged but not actually configured → still action-needed (no faking).
    expect(resolveTask(t, signal(), new Set(['a'])).status).toBe('action-needed');
  });

  it('autoDetected flag is only true for satisfied auto tasks', () => {
    const t = task({ detect: { kind: 'capability', cap: 'auth' } });
    expect(resolveTask(t, signal({ caps: { ...signal().caps, auth: true } }), new Set()).autoDetected).toBe(true);
    expect(resolveTask(t, signal(), new Set()).autoDetected).toBe(false);
    const m = task({ id: 'm', detect: { kind: 'manual' } });
    expect(resolveTask(m, signal(), new Set(['m'])).autoDetected).toBe(false);
  });
});

describe('resolveAll — ordering', () => {
  it('sorts action-needed → optional-todo → done → reference, then by priority', () => {
    const tasks: SetupTask[] = [
      task({ id: 'done', detect: { kind: 'capability', cap: 'auth' } }),
      task({ id: 'ref', detect: { kind: 'info' } }),
      task({ id: 'opt', priority: 'optional', detect: { kind: 'manual' } }),
      task({ id: 'req', priority: 'required', detect: { kind: 'manual' } }),
      task({ id: 'rec', priority: 'recommended', detect: { kind: 'manual' } }),
    ];
    const order = resolveAll(tasks, signal({ caps: { ...signal().caps, auth: true } }), new Set()).map((t) => t.id);
    expect(order).toEqual(['req', 'rec', 'opt', 'done', 'ref']);
  });
});

describe('dedupeById', () => {
  it('keeps the first occurrence (catalog wins over generated)', () => {
    const out = dedupeById([task({ id: 'x', title: 'Catalog' }), task({ id: 'x', title: 'Generated' })]);
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('Catalog');
  });
});

describe('summarize', () => {
  it('counts essentials vs optional and excludes reference cards', () => {
    const tasks: SetupTask[] = [
      task({ id: 'r1', priority: 'required', detect: { kind: 'capability', cap: 'auth' } }),    // done
      task({ id: 'r2', priority: 'required', detect: { kind: 'manual' } }),                      // outstanding
      task({ id: 'o1', priority: 'optional', detect: { kind: 'manual' } }),                      // optional todo
      task({ id: 'i1', detect: { kind: 'info' } }),                                              // reference (ignored)
    ];
    const s = summarize(resolveAll(tasks, signal({ caps: { ...signal().caps, auth: true } }), new Set()));
    expect(s.essentialsTotal).toBe(2);
    expect(s.essentialsDone).toBe(1);
    expect(s.optionalTotal).toBe(1);
    expect(s.requiredOutstanding).toBe(1);
  });
});

describe('groupByCategory', () => {
  it('returns groups in CATEGORY_ORDER and drops empty ones', () => {
    const tasks = resolveAll(
      [task({ id: 'a', category: 'ai', detect: { kind: 'manual' } }),
       task({ id: 'b', category: 'go-live', detect: { kind: 'manual' } })],
      signal(), new Set(),
    );
    const cats = groupByCategory(tasks).map((g) => g.category);
    expect(cats).toEqual(['go-live', 'ai']); // go-live precedes ai in CATEGORY_ORDER
  });

  it('every category has display metadata', () => {
    for (const c of CATEGORY_ORDER) {
      expect(CATEGORY_META[c]?.label).toBeTruthy();
      expect(CATEGORY_META[c]?.blurb).toBeTruthy();
    }
  });
});

describe('catalog integrity', () => {
  it('has unique task ids', () => {
    const ids = CATALOG.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every task has plain-English text and at least one step', () => {
    for (const t of CATALOG) {
      expect(t.plainEnglish.trim().length).toBeGreaterThan(0);
      expect(t.steps.length).toBeGreaterThan(0);
      expect(CATEGORY_ORDER).toContain(t.category);
    }
  });

  it('capability detections reference real capability keys', () => {
    for (const t of CATALOG) {
      if (t.detect.kind === 'capability') expect(CAP_KEYS).toContain(t.detect.cap);
    }
  });

  it('derived detections reference keys computeDerived() actually produces', () => {
    for (const t of CATALOG) {
      if (t.detect.kind === 'derived') expect(DERIVED_KEYS.has(t.detect.key)).toBe(true);
    }
  });

  it('env detections list at least one variable', () => {
    for (const t of CATALOG) {
      if (t.detect.kind === 'env') expect(t.detect.anyOf.length).toBeGreaterThan(0);
    }
  });

  it('there is at least one required go-live task', () => {
    expect(CATALOG.some((t) => t.category === 'go-live' && t.priority === 'required')).toBe(true);
  });
});

describe('loadAllSetupTasks (catalog + generated)', () => {
  it('includes the catalog and yields unique ids after de-dupe', () => {
    const all = dedupeById(loadAllSetupTasks());
    const ids = new Set(all.map((t) => t.id));
    expect(ids.size).toBe(all.length);
    // Catalog essentials are present.
    expect(ids.has('admin-protect')).toBe(true);
    expect(ids.has('supabase-connect')).toBe(true);
  });

  it('generated schema tasks (if any) are well-formed', () => {
    for (const t of loadAllSetupTasks()) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.title).toBe('string');
      expect(t.detect).toBeTruthy();
    }
  });
});
