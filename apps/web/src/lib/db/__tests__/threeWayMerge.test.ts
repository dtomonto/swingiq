// ============================================================
// SwingVantage — 3-way merge (delete-sync) unit tests
// Guarantees deletions propagate across devices without resurrecting
// data, new items on either side survive, and absent cloud singletons
// don't clobber local ones.
// ============================================================

import { threeWayMerge } from '../threeWayMerge';
import { computeBase } from '../syncBase';
import {
  DEFAULT_SETTINGS, DEFAULT_TRAINING, DEFAULT_COMMUNITY_STATE,
  DEFAULT_TUTORIAL_PROGRESS, DEFAULT_AGENT_STATE, DEFAULT_SPORT_EQUIPMENT,
  type SwingVantageState, type LocalClub,
} from '@/store';

const club = (id: string, name = id): LocalClub => ({
  id, name, category: 'iron', brand: '', model: '', loft: null,
  typical_carry: null, typical_total: null, shaft_flex: '', notes: '', sort_order: 0, created_at: '',
});

function state(over: Partial<SwingVantageState>): SwingVantageState {
  return {
    profile: null,
    sportProfiles: {},
    clubs: [],
    sportEquipment: DEFAULT_SPORT_EQUIPMENT,
    sessions: [],
    video_analyses: [],
    training: DEFAULT_TRAINING,
    settings: DEFAULT_SETTINGS,
    community: DEFAULT_COMMUNITY_STATE,
    tutorialProgress: DEFAULT_TUTORIAL_PROGRESS,
    agent: DEFAULT_AGENT_STATE,
    setup_step: 'profile',
    ...over,
  };
}

const PRESENT = { training: true, settings: true, community: true, tutorial: true, agent: true };
const ids = (clubs: LocalClub[] | undefined) => (clubs ?? []).map((c) => c.id).sort();

describe('threeWayMerge — cross-device delete-sync', () => {
  it('drops an item deleted on THIS device (no resurrection from cloud)', () => {
    const base = computeBase(state({ clubs: [club('A'), club('B')] }));
    const local = state({ clubs: [club('A')] });          // B deleted here
    const cloud = state({ clubs: [club('A'), club('B')] }); // cloud still has B
    const merged = threeWayMerge(base, local, cloud, PRESENT);
    expect(ids(merged.clubs)).toEqual(['A']);
  });

  it('drops an item deleted on ANOTHER device', () => {
    const base = computeBase(state({ clubs: [club('A'), club('B')] }));
    const local = state({ clubs: [club('A'), club('B')] });
    const cloud = state({ clubs: [club('A')] });           // B deleted elsewhere
    const merged = threeWayMerge(base, local, cloud, PRESENT);
    expect(ids(merged.clubs)).toEqual(['A']);
  });

  it('keeps an item newly created on this device', () => {
    const base = computeBase(state({ clubs: [club('A')] }));
    const local = state({ clubs: [club('A'), club('C')] }); // C new here
    const cloud = state({ clubs: [club('A')] });
    const merged = threeWayMerge(base, local, cloud, PRESENT);
    expect(ids(merged.clubs)).toEqual(['A', 'C']);
  });

  it('adds an item newly created on another device', () => {
    const base = computeBase(state({ clubs: [club('A')] }));
    const local = state({ clubs: [club('A')] });
    const cloud = state({ clubs: [club('A'), club('D')] }); // D new elsewhere
    const merged = threeWayMerge(base, local, cloud, PRESENT);
    expect(ids(merged.clubs)).toEqual(['A', 'D']);
  });

  it('adopts a cloud edit when only the cloud changed', () => {
    const base = computeBase(state({ clubs: [club('A', 'old')] }));
    const local = state({ clubs: [club('A', 'old')] });     // unchanged here
    const cloud = state({ clubs: [club('A', 'new')] });      // edited elsewhere
    const merged = threeWayMerge(base, local, cloud, PRESENT);
    expect(merged.clubs?.[0].name).toBe('new');
  });

  it('prefers the local edit on a conflicting edit', () => {
    const base = computeBase(state({ clubs: [club('A', 'old')] }));
    const local = state({ clubs: [club('A', 'mine')] });
    const cloud = state({ clubs: [club('A', 'theirs')] });
    const merged = threeWayMerge(base, local, cloud, PRESENT);
    expect(merged.clubs?.[0].name).toBe('mine');
  });

  it('keeps the local singleton when the cloud has no row for it', () => {
    const base = computeBase(state({ settings: { ...DEFAULT_SETTINGS, units: 'meters' } }));
    const local = state({ settings: { ...DEFAULT_SETTINGS, units: 'meters' } });
    const cloud = state({ settings: DEFAULT_SETTINGS }); // default-filled, but absent
    const merged = threeWayMerge(base, local, cloud, { ...PRESENT, settings: false });
    expect(merged.settings?.units).toBe('meters');
  });

  it('propagates a deleted golf profile (not resurrected)', () => {
    const profile = { name: 'Sam', handedness: 'right' } as SwingVantageState['profile'];
    const base = computeBase(state({ profile }));
    const local = state({ profile: null }); // deleted here
    const cloud = state({ profile });        // cloud still has it
    const merged = threeWayMerge(base, local, cloud, PRESENT);
    expect(merged.profile).toBeNull();
  });
});
