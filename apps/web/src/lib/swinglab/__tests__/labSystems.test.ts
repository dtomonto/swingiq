import { buildLabSystems } from '../labSystems';
import type { LabSignals } from '../labState';

const empty: LabSignals = { hasProfile: false, captures: 0, planStatus: 'none', clubCount: 0, lastActivityAt: null };
const active: LabSignals = { hasProfile: true, captures: 3, planStatus: 'in_progress', clubCount: 10, lastActivityAt: 'x' };
const complete: LabSignals = { hasProfile: true, captures: 5, planStatus: 'completed', clubCount: 10, lastActivityAt: 'x' };

const conn = (m: ReturnType<typeof buildLabSystems>, from: string, to: string) =>
  m.connections.find((c) => c.from === from && c.to === to);
const sys = (m: ReturnType<typeof buildLabSystems>, id: string) => m.systems.find((s) => s.stationId === id);

describe('buildLabSystems', () => {
  it('reports a powered-down lab for a brand-new user', () => {
    const m = buildLabSystems(empty, 'player-profile-wall');
    expect(m.onlineCount).toBe(0);
    expect(m.summary.toLowerCase()).toContain('powered down');
    expect(m.connections.every((c) => !c.active)).toBe(true);
    expect(sys(m, 'recruiting-studio')!.online).toBe(false);
  });

  it('activates loop links and systems from real signals', () => {
    const m = buildLabSystems(active, 'training-plan-lab');
    expect(conn(m, 'player-profile-wall', 'motion-capture-studio')!.active).toBe(true); // hasProfile
    expect(conn(m, 'motion-capture-studio', 'ai-coach-console')!.active).toBe(true); // captures
    expect(conn(m, 'ai-coach-console', 'training-plan-lab')!.active).toBe(true); // plan
    expect(conn(m, 'training-plan-lab', 'film-room')!.active).toBe(false); // plan not completed
    expect(sys(m, 'equipment-bay')!.online).toBe(true); // clubs
    expect(sys(m, 'recovery-readiness-dock')!.online).toBe(false); // no signal — honest standby
    expect(m.onlineCount).toBeGreaterThan(3);
    expect(m.summary).toContain('Training Plan Lab'); // recommended station named
  });

  it('closes the loop only when the plan is completed', () => {
    const m = buildLabSystems(complete, null);
    expect(conn(m, 'training-plan-lab', 'film-room')!.active).toBe(true);
    expect(conn(m, 'film-room', 'player-profile-wall')!.active).toBe(true);
  });

  it('always reports all ten systems', () => {
    expect(buildLabSystems(empty, null).totalSystems).toBe(10);
    expect(buildLabSystems(empty, null).systems).toHaveLength(10);
  });
});
