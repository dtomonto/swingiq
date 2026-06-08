// ============================================================
// Coach Mix — local-first store tests
// Runs in-memory (the store keeps a module cache even without a DOM),
// so these exercise the real reducers. clearCoachMixStore() resets
// between cases.
// ============================================================

import {
  SEED_COACH_PROFILES,
  SWINGVANTAGE_DEFAULT_COACH_ID,
} from '..';
import {
  applyOverride,
  mergeProfiles,
  getAllProfiles,
  setProfileOverride,
  addCustomProfile,
  addSource,
  removeSource,
  getSources,
  extractFromSource,
  getConcepts,
  decideConcept,
  saveMix,
  deleteMix,
  getMixes,
  getActiveMix,
  setActiveMixId,
  getActiveMixId,
  clearCoachMixStore,
  type ProfileOverride,
} from '../store';
import type { CoachProfile, CoachMix, LearningSource } from '../types';

const seed = SEED_COACH_PROFILES[1]; // a coach-inspired profile

const sourceInput = (over: Partial<Omit<LearningSource, 'id' | 'createdAt'>> = {}): Omit<LearningSource, 'id' | 'createdAt'> => ({
  coachProfileId: seed.id,
  title: 'Approved note',
  urlOrUploadRef: 'internal://note',
  type: 'admin_notes',
  sport: 'golf',
  topic: 'shallowing',
  techniqueCategory: 'pivot-driven movement',
  drillCategory: 'rotation & sequencing',
  permissionStatus: 'public',
  copyrightStatus: 'cleared',
  approvedForLearning: true,
  ...over,
});

const mixInput = (over: Partial<CoachMix> = {}): Omit<CoachMix, 'id' | 'createdAt'> => ({
  name: 'My Mix',
  description: '',
  sport: 'golf',
  entries: [{ coachProfileId: seed.id, weightPct: 50 }],
  visibility: 'admin_only',
  userLabelMode: 'style_only',
  ...over,
});

beforeEach(() => clearCoachMixStore());

describe('Coach Mix store — profiles + overrides', () => {
  it('applyOverride is immutable and patches only given fields', () => {
    const override: ProfileOverride = { visibility: 'beta' };
    const out = applyOverride(seed, override);
    expect(out.visibility).toBe('beta');
    expect(seed.visibility).toBe('admin_only'); // original untouched
    expect(out.needsReview).toBe(seed.needsReview);
  });

  it('mergeProfiles always includes the seeds (SSR-safe) and appends custom', () => {
    const merged = mergeProfiles([], {});
    expect(merged).toHaveLength(SEED_COACH_PROFILES.length);
    const custom: CoachProfile = { ...seed, id: 'custom_x', name: 'Custom' };
    const withCustom = mergeProfiles([custom], {});
    expect(withCustom.some((p) => p.id === 'custom_x')).toBe(true);
  });

  it('persists profile overrides through the store', () => {
    setProfileOverride(seed.id, { visibility: 'user_visible' });
    const stored = getAllProfiles().find((p) => p.id === seed.id);
    expect(stored?.visibility).toBe('user_visible');
  });

  it('adds custom profiles', () => {
    addCustomProfile({ ...seed, id: 'custom_y', name: 'Y' });
    expect(getAllProfiles().some((p) => p.id === 'custom_y')).toBe(true);
  });
});

describe('Coach Mix store — sources + extraction', () => {
  it('adds a source with a generated id', () => {
    const s = addSource(sourceInput());
    expect(s.id).toBeTruthy();
    expect(getSources()).toHaveLength(1);
  });

  it('extracts only from cleared sources, into pending concepts', () => {
    const ok = addSource(sourceInput());
    const blocked = addSource(sourceInput({ approvedForLearning: false }));
    expect(extractFromSource(ok.id).length).toBeGreaterThan(0);
    expect(extractFromSource(blocked.id)).toEqual([]);
    expect(getConcepts().every((c) => c.reviewStatus === 'pending')).toBe(true);
  });

  it('removing a source cascades to its concepts', () => {
    const s = addSource(sourceInput());
    extractFromSource(s.id);
    expect(getConcepts().length).toBeGreaterThan(0);
    removeSource(s.id);
    expect(getSources()).toHaveLength(0);
    expect(getConcepts()).toHaveLength(0);
  });
});

describe('Coach Mix store — review decisions persist', () => {
  it('approve/reject update the stored concept', () => {
    const s = addSource(sourceInput());
    const [c1] = extractFromSource(s.id);
    decideConcept(c1.id, 'approve');
    expect(getConcepts().find((c) => c.id === c1.id)?.reviewStatus).toBe('approved');
    decideConcept(c1.id, 'reject');
    expect(getConcepts().find((c) => c.id === c1.id)?.reviewStatus).toBe('rejected');
  });
});

describe('Coach Mix store — mixes + active selection', () => {
  it('saveMix assigns a real id (never the preview id) and upserts', () => {
    const m = saveMix({ ...mixInput(), id: 'admin_preview' });
    expect(m.id).not.toBe('admin_preview');
    expect(getMixes()).toHaveLength(1);
    const updated = saveMix({ ...mixInput({ name: 'Renamed' }), id: m.id });
    expect(getMixes()).toHaveLength(1); // upsert, not duplicate
    expect(updated.name).toBe('Renamed');
  });

  it('set/get active mix, and delete clears the active pointer', () => {
    const m = saveMix(mixInput());
    setActiveMixId(m.id);
    expect(getActiveMixId()).toBe(m.id);
    expect(getActiveMix()?.id).toBe(m.id);
    deleteMix(m.id);
    expect(getActiveMixId()).toBeNull();
    expect(getActiveMix()).toBeNull();
  });
});
