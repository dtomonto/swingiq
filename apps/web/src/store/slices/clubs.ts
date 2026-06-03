import type { SwingIQSlice, SwingIQStore, LocalClub } from '../types';
import { newId } from '../types';

export const createClubsSlice: SwingIQSlice<
  Pick<SwingIQStore, 'clubs' | 'addClub' | 'updateClub' | 'removeClub' | 'reorderClubs'>
> = (set, get) => ({
  clubs: [],

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
});
