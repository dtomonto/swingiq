import { getPublishingDirection, setPublishingDirection } from '../publishing-prefs';
import { DEFAULT_DIRECTION, DIRECTIONS } from '@/components/admin/publishing/directions';

// Minimal localStorage stub so the prefs helper can be tested in the default
// node environment (this project's Jest does not ship jest-environment-jsdom).
function fakeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
}

describe('admin/publishing-prefs', () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).window = { localStorage: fakeStorage() };
  });
  afterAll(() => {
    delete (globalThis as Record<string, unknown>).window;
  });

  it('defaults to the default direction when nothing is stored', () => {
    expect(getPublishingDirection()).toBe(DEFAULT_DIRECTION);
  });

  it('round-trips a persisted choice', () => {
    const target = DIRECTIONS.find((d) => d.id !== DEFAULT_DIRECTION)!.id;
    setPublishingDirection(target);
    expect(getPublishingDirection()).toBe(target);
    expect(
      (globalThis as { window: { localStorage: Storage } }).window.localStorage.getItem(
        'swingiq-publishingos-direction-v1',
      ),
    ).toBe(target);
  });

  it('persists every available direction', () => {
    for (const d of DIRECTIONS) {
      setPublishingDirection(d.id);
      expect(getPublishingDirection()).toBe(d.id);
    }
  });

  it('falls back to default for an unknown/corrupt stored value', () => {
    (globalThis as { window: { localStorage: Storage } }).window.localStorage.setItem(
      'swingiq-publishingos-direction-v1',
      'not-a-real-direction',
    );
    expect(getPublishingDirection()).toBe(DEFAULT_DIRECTION);
  });
});
