// ============================================================
// SwingVantage — clubs slice: trend-based carry update + undo
// ------------------------------------------------------------
// applyCarryUpdate snapshots the prior carry baseline onto the club
// (so undo survives a reload via the persisted store), and
// undoCarryUpdate restores it exactly. A hand-edit clears the snapshot.
// ============================================================

import { useSwingVantageStore } from '@/store';

const store = () => useSwingVantageStore.getState();

function addClub(overrides: Partial<Parameters<ReturnType<typeof store>['addClub']>[0]> = {}) {
  store().addClub({
    name: '7 Iron',
    category: 'iron',
    brand: '',
    model: '',
    loft: null,
    typical_carry: 150,
    typical_total: 160,
    shaft_flex: '',
    notes: '',
    sort_order: 0,
    source_of_truth: 'user',
    ...overrides,
  });
  const clubs = store().clubs;
  return clubs[clubs.length - 1]!;
}

beforeEach(() => store().reset());

describe('applyCarryUpdate / undoCarryUpdate', () => {
  it('applies the trend carry and snapshots the prior baseline for undo', () => {
    const club = addClub({ typical_carry: 150, source_of_truth: 'user' });

    store().applyCarryUpdate(club.id, {
      typical_carry: 162,
      imported_carry_avg: 162,
      imported_shot_count: 9,
    });

    const updated = store().clubs.find((c) => c.id === club.id)!;
    expect(updated.typical_carry).toBe(162);
    expect(updated.imported_carry_avg).toBe(162);
    expect(updated.imported_shot_count).toBe(9);
    expect(updated.source_of_truth).toBe('imported');
    // Snapshot captured the prior, user-set baseline.
    expect(updated.carry_undo).toEqual({
      typical_carry: 150,
      imported_carry_avg: null,
      imported_shot_count: undefined,
      source_of_truth: 'user',
    });
  });

  it('undo restores the exact prior values and clears the snapshot', () => {
    const club = addClub({ typical_carry: 150, source_of_truth: 'user' });
    store().applyCarryUpdate(club.id, { typical_carry: 162, imported_carry_avg: 162, imported_shot_count: 9 });

    store().undoCarryUpdate(club.id);

    const reverted = store().clubs.find((c) => c.id === club.id)!;
    expect(reverted.typical_carry).toBe(150);
    expect(reverted.imported_carry_avg).toBe(null);
    expect(reverted.source_of_truth).toBe('user');
    expect(reverted.carry_undo).toBeNull();
  });

  it('undo is a no-op when there is no snapshot', () => {
    const club = addClub({ typical_carry: 150 });
    store().undoCarryUpdate(club.id);
    expect(store().clubs.find((c) => c.id === club.id)!.typical_carry).toBe(150);
  });

  it('dismissBagDetect persists the content signature and reset clears it', () => {
    expect(store().bagDetectDismissedSig).toBeNull();
    store().dismissBagDetect('n:7 Iron|u:club_1:162');
    expect(store().bagDetectDismissedSig).toBe('n:7 Iron|u:club_1:162');
    store().reset();
    expect(store().bagDetectDismissedSig).toBeNull();
  });

  it('a hand-edit (updateClub) can clear a pending undo snapshot', () => {
    const club = addClub({ typical_carry: 150 });
    store().applyCarryUpdate(club.id, { typical_carry: 162, imported_carry_avg: 162, imported_shot_count: 9 });

    store().updateClub(club.id, { typical_carry: 155, source_of_truth: 'user', carry_undo: null });

    const edited = store().clubs.find((c) => c.id === club.id)!;
    expect(edited.typical_carry).toBe(155);
    expect(edited.carry_undo).toBeNull();
  });
});
