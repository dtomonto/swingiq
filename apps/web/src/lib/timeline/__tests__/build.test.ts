import { buildTimeline, summarizeTimeline, filterTimeline, type TimelineInput } from '../build';
import type { LocalSession, LocalVideoAnalysis, LocalClub } from '@/store';
import type { DailyNote } from '@/lib/dailyNotes/types';

const session = (over: Partial<LocalSession>): LocalSession => ({
  id: 'x', name: 'Range', date: '2026-02-01T10:00:00Z', sport: 'golf',
  club_name: 'Driver', club_category: 'driver', launch_monitor: 'trackman',
  indoor_outdoor: 'outdoor', mat_or_grass: 'mat', notes: '', shot_count: 20,
  shots: [], diagnoses: [], swing_score: null, created_at: '2026-02-01T10:00:00Z',
  ...over,
});

const EMPTY: TimelineInput = {
  sessions: [], videoAnalyses: [], dailyNotes: [], clubs: [],
  onboardingCompletedAt: null, onboardingRole: null,
};

describe('buildTimeline', () => {
  it('returns nothing for an empty record', () => {
    expect(buildTimeline(EMPTY)).toEqual([]);
  });

  it('creates a session event, plus a diagnosis event when one exists', () => {
    const input: TimelineInput = {
      ...EMPTY,
      sessions: [
        session({ id: 's1', diagnoses: [{ rule: { name: 'Over-the-top', likely_cause: 'out-to-in path' } }] as unknown as LocalSession['diagnoses'] }),
      ],
    };
    const events = buildTimeline(input);
    expect(events.map((e) => e.type).sort()).toEqual(['diagnosis', 'session']);
    expect(events.find((e) => e.type === 'diagnosis')!.title).toContain('Over-the-top');
    expect(events.find((e) => e.type === 'session')!.title).toContain('Imported 20');
  });

  it('merges all sources and sorts newest-first', () => {
    const input: TimelineInput = {
      sessions: [session({ id: 's1', date: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', diagnoses: [] })],
      videoAnalyses: [{ id: 'v1', created_at: '2026-03-01T00:00:00Z', sport: 'golf', primary_issue: 'early extension', overall_score: 72 } as unknown as LocalVideoAnalysis],
      dailyNotes: [{ id: 'n1', date: '2026-02-15', created_at: '2026-02-15T00:00:00Z', sport: 'golf', feel: 'good', text: 'striped it', faults: [], context: '' } as unknown as DailyNote],
      clubs: [{ id: 'c1', name: '7 Iron', category: 'iron', typical_carry: 160, created_at: '2026-02-20T00:00:00Z', source_of_truth: 'imported' } as unknown as LocalClub],
      onboardingCompletedAt: '2026-01-05T00:00:00Z',
      onboardingRole: 'athlete',
    };
    const events = buildTimeline(input);
    expect(events).toHaveLength(5); // session, video, note, equipment, onboarding
    // newest first: video (Mar) → club (Feb 20) → note (Feb 15) → onboarding (Jan 5) → session (Jan 1)
    expect(events[0]!.type).toBe('video');
    expect(events[events.length - 1]!.type).toBe('session');
  });

  it('skips events with missing/invalid dates', () => {
    const input: TimelineInput = {
      ...EMPTY,
      sessions: [session({ id: 's1', date: '', created_at: '' })],
    };
    expect(buildTimeline(input)).toEqual([]);
  });
});

describe('summarizeTimeline + filterTimeline', () => {
  const input: TimelineInput = {
    sessions: [
      session({ id: 's1', sport: 'golf', date: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', diagnoses: [] }),
      session({ id: 's2', sport: 'tennis', date: '2026-02-01T00:00:00Z', created_at: '2026-02-01T00:00:00Z', diagnoses: [] }),
    ],
    videoAnalyses: [], dailyNotes: [], clubs: [], onboardingCompletedAt: null, onboardingRole: null,
  };
  const events = buildTimeline(input);

  it('summarizes counts, range, and sports', () => {
    const s = summarizeTimeline(events);
    expect(s.total).toBe(2);
    expect(s.byType.session).toBe(2);
    expect(s.sports.sort()).toEqual(['golf', 'tennis']);
    expect(s.lastDate).toBe('2026-02-01T00:00:00.000Z');
    expect(s.firstDate).toBe('2026-01-01T00:00:00.000Z');
  });

  it('filters by sport and type', () => {
    expect(filterTimeline(events, { sport: 'golf' })).toHaveLength(1);
    expect(filterTimeline(events, { type: 'session' })).toHaveLength(2);
    expect(filterTimeline(events, { type: 'video' })).toHaveLength(0);
    expect(filterTimeline(events, { sport: 'all', type: 'all' })).toHaveLength(2);
  });
});
