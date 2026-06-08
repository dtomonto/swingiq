import {
  compareActionItems,
  summarizeActions,
  type ActionItem,
} from '../types';
import { SERVER_ADAPTERS, collectServerActions, getActionSummary } from '../index';

const mk = (over: Partial<ActionItem>): ActionItem => ({
  id: 'x:1',
  source: 'x',
  sourceLabel: 'X',
  title: 't',
  severity: 'info',
  count: 1,
  href: '/admin',
  ...over,
});

describe('action item helpers', () => {
  it('sorts critical → warning → info → success, then by count desc', () => {
    const items = [
      mk({ id: 'a', severity: 'info', count: 1 }),
      mk({ id: 'b', severity: 'critical', count: 2 }),
      mk({ id: 'c', severity: 'warning', count: 9 }),
      mk({ id: 'd', severity: 'info', count: 5 }),
    ];
    const sorted = [...items].sort(compareActionItems).map((i) => i.id);
    expect(sorted).toEqual(['b', 'c', 'd', 'a']);
  });

  it('summarizes items, total and hasCritical', () => {
    const s = summarizeActions([
      mk({ count: 3, severity: 'warning' }),
      mk({ id: 'y:1', count: 2, severity: 'critical' }),
    ]);
    expect(s.items).toBe(2);
    expect(s.total).toBe(5);
    expect(s.hasCritical).toBe(true);
  });

  it('treats an empty inbox as all-clear', () => {
    const s = summarizeActions([]);
    expect(s).toEqual({ items: 0, total: 0, hasCritical: false });
  });
});

describe('server adapters', () => {
  it('registers well-formed adapters with unique ids', () => {
    expect(SERVER_ADAPTERS.length).toBeGreaterThan(0);
    const ids = SERVER_ADAPTERS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of SERVER_ADAPTERS) {
      expect(typeof a.label).toBe('string');
      expect(typeof a.collect).toBe('function');
    }
  });

  it('collects a severity-sorted inbox with unique item ids (never throws)', async () => {
    const items = await collectServerActions();
    expect(Array.isArray(items)).toBe(true);
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of items) {
      expect(['info', 'success', 'warning', 'critical']).toContain(i.severity);
      expect(typeof i.href).toBe('string');
      expect(i.href.startsWith('/admin')).toBe(true);
      expect(i.count).toBeGreaterThanOrEqual(0);
    }
    // Verify sort invariant holds across the whole list.
    for (let k = 1; k < items.length; k++) {
      expect(compareActionItems(items[k - 1], items[k])).toBeLessThanOrEqual(0);
    }
  });

  it('summary totals match the collected items', async () => {
    const [items, summary] = await Promise.all([collectServerActions(), getActionSummary()]);
    expect(summary.items).toBe(items.length);
    expect(summary.total).toBe(items.reduce((n, i) => n + i.count, 0));
  });
});
