// BodySync — insight generation tests
import { generateInsights } from '../insights';
import type { ManualCheckin } from '../types';

let seq = 0;
function checkin(over: Partial<ManualCheckin>): ManualCheckin {
  seq += 1;
  const d = new Date(2026, 5, 6 - seq); // descending real dates
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    id: `c${seq}`, date, createdAt: `${date}T08:00:00Z`,
    sleepHours: null, sleepQuality: null, energy: null, soreness: null, pain: null,
    painAreas: [], stress: null, hydration: null, mentalFocus: null, warmupQuality: null,
    practiceIntensity: null, illness: false, travelFatigue: false, alcohol: false, notes: '',
    ...over,
  };
}

beforeEach(() => { seq = 0; });

it('returns nothing with too little history', () => {
  expect(generateInsights([checkin({}), checkin({})])).toEqual([]);
});

it('finds the sleep → energy pattern', () => {
  const good = Array.from({ length: 4 }, () => checkin({ sleepHours: 8, energy: 5 }));
  const poor = Array.from({ length: 4 }, () => checkin({ sleepHours: 5, energy: 2 }));
  const insights = generateInsights([...good, ...poor]);
  const sleepInsight = insights.find((i) => /sleep/i.test(i.title) && i.category === 'recovery');
  expect(sleepInsight).toBeTruthy();
  expect(sleepInsight?.kind).toBe('correlation');
});

it('flags recurring discomfort by region', () => {
  const list = [
    checkin({ pain: 3, painAreas: ['elbow'] }),
    checkin({ pain: 3, painAreas: ['elbow'] }),
    checkin({ pain: 1 }),
  ];
  const insights = generateInsights(list);
  expect(insights.some((i) => /elbow/i.test(i.title) && i.kind === 'risk')).toBe(true);
});

it('correlates sleep with swing performance when joined by date', () => {
  const goodDays = Array.from({ length: 3 }, () => checkin({ sleepHours: 8 }));
  const poorDays = Array.from({ length: 3 }, () => checkin({ sleepHours: 5 }));
  const all = [...goodDays, ...poorDays];
  const performance = all.map((c, i) => ({ date: c.date, swingScore: i < 3 ? 85 : 70 }));
  const insights = generateInsights(all, performance);
  expect(insights.some((i) => i.category === 'performance' && /sleep/i.test(i.title))).toBe(true);
});
