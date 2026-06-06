import type { SwingVantageSlice, SwingVantageStore } from '../types';
import { newId } from '../types';
import type { DailyNote } from '@/lib/dailyNotes/types';

export const createDailyNotesSlice: SwingVantageSlice<
  Pick<SwingVantageStore, 'dailyNotes' | 'addDailyNote' | 'updateDailyNote' | 'removeDailyNote'>
> = (set) => ({
  dailyNotes: [],

  addDailyNote: (note) => {
    const newNote: DailyNote = {
      ...note,
      id: newId('note'),
      created_at: new Date().toISOString(),
    };
    set((s) => ({ dailyNotes: [newNote, ...s.dailyNotes] }));
  },
  updateDailyNote: (id, updates) =>
    set((s) => ({
      dailyNotes: s.dailyNotes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  removeDailyNote: (id) =>
    set((s) => ({ dailyNotes: s.dailyNotes.filter((n) => n.id !== id) })),
});
