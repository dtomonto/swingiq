// ============================================================
// Motion Lab validation benchmark — runs the labelled fixtures through
// the real engine and enforces the brief's acceptance gates. Also the
// body of `npm run motion:benchmark` (prints the table to the log).
// ============================================================

import {
  runMotionBenchmark,
  buildDefaultFixtures,
  formatBenchmarkTable,
  benchmarkPassed,
  type BenchmarkRow,
} from '../motion-bench';

const rows: BenchmarkRow[] = runMotionBenchmark(buildDefaultFixtures());

beforeAll(() => {
  console.log(`\nMotion Lab benchmark\n${formatBenchmarkTable(rows)}\n`);
});

describe('motion benchmark', () => {
  it('runs at least one fixture', () => {
    expect(rows.length).toBeGreaterThan(0);
  });

  it.each(rows.map((r) => [r.name, r] as const))('%s — meets its gates', (_name, row) => {
    expect(row.failures).toEqual([]);
    expect(row.pass).toBe(true);
  });

  it('no fixture crashes, returns a blank result, or omits guidance', () => {
    for (const r of rows) {
      expect(r.failures.join(' ')).not.toMatch(/crashed/i);
      expect(r.guidance).toBe(true);
    }
  });

  it('the whole suite passes', () => {
    expect(benchmarkPassed(rows)).toBe(true);
  });
});
