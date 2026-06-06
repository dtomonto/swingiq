// BodySync — store mutations (check-in upsert, deletion, consent, permissions)
// Runs in the default (node) jest env with a tiny in-memory localStorage
// polyfill, so it needs no jsdom dependency.

import {
  saveCheckin, deleteCheckin, consent, setPermissions, clearAllHealthData,
  exportBodySync, todayKey,
} from '../store';

// ── minimal window + localStorage polyfill ──
const mem: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = String(v); },
  removeItem: (k: string) => { delete mem[k]; },
  clear: () => { for (const k of Object.keys(mem)) delete mem[k]; },
};

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  g.window = {
    localStorage: localStorageMock,
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  g.localStorage = localStorageMock;
  g.Event = class { type: string; constructor(t: string) { this.type = t; } };
  g.StorageEvent = class { type: string; constructor(t: string) { this.type = t; } };
});

beforeEach(() => {
  localStorageMock.clear();
  clearAllHealthData();
});

const base = {
  sleepHours: 7, sleepQuality: 4, energy: 4, soreness: 2, pain: 1, painAreas: [] as never[],
  stress: 2, hydration: 4, mentalFocus: 4, warmupQuality: null, practiceIntensity: 3,
  illness: false, travelFatigue: false, alcohol: false, notes: '',
};

it('consent enables BodySync and stamps a date', () => {
  consent();
  const s = exportBodySync();
  expect(s.settings.enabled).toBe(true);
  expect(s.settings.consentedAt).toBeTruthy();
});

it('saveCheckin upserts by date (one row per day, id preserved)', () => {
  saveCheckin({ ...base, date: todayKey() });
  const firstId = exportBodySync().checkins[0].id;
  saveCheckin({ ...base, date: todayKey(), sleepHours: 8, notes: 'updated' });
  const after = exportBodySync().checkins;
  expect(after).toHaveLength(1);
  expect(after[0].id).toBe(firstId);
  expect(after[0].sleepHours).toBe(8);
  expect(after[0].notes).toBe('updated');
});

it('persists pain areas it is given', () => {
  saveCheckin({ ...base, date: '2026-06-01', pain: 4, painAreas: ['shoulder'] as never });
  expect(exportBodySync().checkins[0].painAreas).toEqual(['shoulder']);
});

it('deleteCheckin removes a day', () => {
  saveCheckin({ ...base, date: '2026-06-02' });
  deleteCheckin('2026-06-02');
  expect(exportBodySync().checkins).toHaveLength(0);
});

it('setPermissions merges granular consent', () => {
  setPermissions({ recovery: true });
  expect(exportBodySync().permissions.recovery).toBe(true);
  expect(exportBodySync().permissions.wellness).toBe(true);
});

it('clearAllHealthData erases everything (the deletion workflow)', () => {
  consent();
  saveCheckin({ ...base, date: '2026-06-03' });
  clearAllHealthData();
  const s = exportBodySync();
  expect(s.checkins).toHaveLength(0);
  expect(s.settings.enabled).toBe(false);
  expect(s.settings.consentedAt).toBeNull();
});
