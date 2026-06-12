import {
  taskKey,
  todayStr,
  loadDoneTaskKeys,
  toggleTodayTask,
} from '../today-tasks';

const KEY = 'swingiq-today-tasks-v1';

// The store is SSR-safe and only touches window.localStorage. The repo runs Jest
// in the node environment (no jsdom), so we stub a minimal localStorage instead
// of pulling in a new test dependency.
const mem = new Map<string, string>();
const localStorageStub = {
  getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
};

beforeAll(() => {
  (globalThis as unknown as { window: unknown }).window = { localStorage: localStorageStub };
});
afterAll(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});
beforeEach(() => mem.clear());

describe('today-tasks store', () => {
  it('builds a stable key, preferring drillId over the cue', () => {
    expect(taskKey('golf', 'lead hip first', 'drill_42')).toBe('golf::drill_42');
    expect(taskKey('tennis', 'unit turn', null)).toBe('tennis::unit turn');
  });

  it('toggles a task on and off for today', () => {
    const k = taskKey('baseball', 'hip-fire', 'd1');
    expect(loadDoneTaskKeys().has(k)).toBe(false);
    toggleTodayTask(k);
    expect(loadDoneTaskKeys().has(k)).toBe(true);
    toggleTodayTask(k);
    expect(loadDoneTaskKeys().has(k)).toBe(false);
  });

  it('persists multiple done keys', () => {
    toggleTodayTask('a');
    toggleTodayTask('b');
    const done = loadDoneTaskKeys();
    expect(done.has('a')).toBe(true);
    expect(done.has('b')).toBe(true);
    expect(done.size).toBe(2);
  });

  it('auto-resets when the stored day is not today (daily checklist)', () => {
    mem.set(KEY, JSON.stringify({ version: 1, date: '2020-01-01', doneKeys: ['stale1', 'stale2'] }));
    expect(loadDoneTaskKeys().size).toBe(0);
  });

  it("keeps today's checkmarks across reads", () => {
    mem.set(KEY, JSON.stringify({ version: 1, date: todayStr(), doneKeys: ['keep'] }));
    expect(loadDoneTaskKeys().has('keep')).toBe(true);
  });

  it('ignores corrupt storage without throwing', () => {
    mem.set(KEY, '{not json');
    expect(() => loadDoneTaskKeys()).not.toThrow();
    expect(loadDoneTaskKeys().size).toBe(0);
  });
});
