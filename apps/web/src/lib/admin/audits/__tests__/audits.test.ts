import { AUDITS, findAudit, nextRun } from '../registry';
import {
  loadFindings,
  summarizeFindings,
  loadAuditSources,
  reportMeta,
} from '../data';
import {
  readStatusOverrides,
  setFindingStatus,
  canWriteAuditStatus,
} from '../status-store';

// Non-destructive: reads the real synced snapshot + overrides file, and only
// exercises setFindingStatus paths that return BEFORE writing (invalid input,
// read-only env) so no test ever mutates audit-status-overrides.json.

describe('audit registry', () => {
  it('has unique, well-formed audit definitions', () => {
    expect(AUDITS.length).toBeGreaterThan(0);
    const ids = AUDITS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of AUDITS) {
      expect(typeof a.label).toBe('string');
      expect(a.label.length).toBeGreaterThan(0);
      expect(typeof a.blurb).toBe('string');
      expect(typeof a.cadence).toBe('string');
    }
  });

  it('looks up an audit by id', () => {
    expect(findAudit('seo-aeo-geo')?.label).toBe('SEO / AEO / GEO');
    expect(findAudit('nope')).toBeUndefined();
  });

  it('computes the next monthly run after the given date', () => {
    const seo = findAudit('seo-aeo-geo')!; // cron "7 9 1 * *"
    const from = new Date('2026-06-15T12:00:00');
    const next = nextRun(seo, from);
    expect(next).not.toBeNull();
    // Next 1st-of-month after Jun 15 is Jul 1.
    expect(next!.getDate()).toBe(1);
    expect(next!.getMonth()).toBe(6); // July (0-indexed)
  });

  it('computes the next weekly run (Mondays)', () => {
    const build = findAudit('build-health')!; // cron "47 8 * * 1"
    const from = new Date('2026-06-03T12:00:00'); // a Wednesday
    const next = nextRun(build, from);
    expect(next).not.toBeNull();
    expect(next!.getDay()).toBe(1); // Monday
    expect(next!.getTime()).toBeGreaterThan(from.getTime());
  });

  it('returns null next-run for non-scheduled audits', () => {
    const security = findAudit('security')!; // cron null
    expect(nextRun(security)).toBeNull();
  });
});

describe('audit data layer', () => {
  const findings = loadFindings();

  it('loads findings with a tracking status overlay', () => {
    expect(Array.isArray(findings)).toBe(true);
    for (const f of findings) {
      expect(['open', 'in-progress', 'done']).toContain(f.trackStatus);
      expect(typeof f.id).toBe('string');
    }
  });

  it('defaults resolved findings to done and open findings to open', () => {
    const resolved = findings.find((f) => f.status.toLowerCase() === 'resolved');
    if (resolved && !resolved.trackedByOwner) expect(resolved.trackStatus).toBe('done');
    const open = findings.find((f) => f.status.toLowerCase() === 'open');
    if (open && !open.trackedByOwner) expect(open.trackStatus).toBe('open');
  });

  it('summarizes counts that add up to the total', () => {
    const s = summarizeFindings(findings);
    expect(s.total).toBe(findings.length);
    expect(s.open + s.inProgress + s.done).toBe(s.total);
    expect(s.openCritical).toBeLessThanOrEqual(s.open + s.inProgress);
  });

  it('joins the registry with live last-run/next-run', () => {
    const sources = loadAuditSources();
    expect(sources.length).toBe(AUDITS.length);
    const seo = sources.find((a) => a.id === 'seo-aeo-geo');
    expect(seo).toBeDefined();
    // The seeded snapshot has a seo-aeo-geo report; lastRunDate may be a date.
    expect(seo!).toHaveProperty('lastReport');
  });

  it('exposes report metadata', () => {
    const meta = reportMeta();
    expect(typeof meta.syncedAt).toBe('string');
    expect(typeof meta.writable).toBe('boolean');
  });
});

describe('status store', () => {
  it('reads overrides as a (possibly empty) plain object', () => {
    const overrides = readStatusOverrides();
    expect(typeof overrides).toBe('object');
    expect(Array.isArray(overrides)).toBe(false);
  });

  it('rejects an invalid status without writing', () => {
    // @ts-expect-error - intentionally invalid status
    const res = setFindingStatus('F-01', 'bogus');
    expect(res).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects an empty finding id without writing', () => {
    const res = setFindingStatus('', 'done');
    expect(res).toEqual({ ok: false, reason: 'invalid' });
  });

  it('refuses to write in production (read-only FS)', () => {
    const orig = process.env.NODE_ENV;
    const origAllow = process.env.ALLOW_AUDIT_WRITE;
    try {
      // @ts-expect-error - override for the duration of the test
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_AUDIT_WRITE;
      expect(canWriteAuditStatus()).toBe(false);
      const res = setFindingStatus('F-01', 'done');
      expect(res).toEqual({ ok: false, reason: 'read-only' });
    } finally {
      // @ts-expect-error - restore
      process.env.NODE_ENV = orig;
      if (origAllow === undefined) delete process.env.ALLOW_AUDIT_WRITE;
      else process.env.ALLOW_AUDIT_WRITE = origAllow;
    }
  });
});
