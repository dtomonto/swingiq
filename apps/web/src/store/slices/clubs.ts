import type { SwingVantageSlice, SwingVantageStore, LocalClub, CarryUndoSnapshot } from '../types';
import { newId } from '../types';

export const createClubsSlice: SwingVantageSlice<
  Pick<
    SwingVantageStore,
    | 'clubs'
    | 'bagDetectDismissedSig'
    | 'addClub'
    | 'updateClub'
    | 'removeClub'
    | 'reorderClubs'
    | 'applyCarryUpdate'
    | 'undoCarryUpdate'
    | 'dismissBagDetect'
  >
> = (set, get) => ({
  clubs: [],
  bagDetectDismissedSig: null,

  addClub: (club) => {
    const newClub: LocalClub = {
      ...club,
      id: newId('club'),
      created_at: new Date().toISOString(),
    };
    set((s) => ({ clubs: [...s.clubs, newClub] }));
    get().computeSetupStep();
  },
  updateClub: (id, updates) =>
    set((s) => ({ clubs: s.clubs.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
  removeClub: (id) => set((s) => ({ clubs: s.clubs.filter((c) => c.id !== id) })),
  reorderClubs: (clubs) => set({ clubs }),

  applyCarryUpdate: (id, next) =>
    set((s) => ({
      clubs: s.clubs.map((c) => {
        if (c.id !== id) return c;
        // Snapshot the prior carry baseline so the change can be reverted exactly,
        // even after a reload (the snapshot persists on the club record).
        const carry_undo: CarryUndoSnapshot = {
          typical_carry: c.typical_carry,
          imported_carry_avg: c.imported_carry_avg ?? null,
          imported_shot_count: c.imported_shot_count,
          source_of_truth: c.source_of_truth,
        };
        return {
          ...c,
          typical_carry: next.typical_carry,
          imported_carry_avg: next.imported_carry_avg,
          imported_shot_count: next.imported_shot_count,
          source_of_truth: 'imported',
          carry_undo,
        };
      }),
    })),

  undoCarryUpdate: (id) =>
    set((s) => ({
      clubs: s.clubs.map((c) => {
        if (c.id !== id || !c.carry_undo) return c;
        const { carry_undo, ...rest } = c;
        return { ...rest, ...carry_undo, carry_undo: null };
      }),
    })),

  dismissBagDetect: (sig) => set({ bagDetectDismissedSig: sig }),
});
