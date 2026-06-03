import type { SwingIQSlice, SwingIQStore, LocalSession } from '../types';
import { newId } from '../types';

export const createSessionsSlice: SwingIQSlice<
  Pick<SwingIQStore, 'sessions' | 'addSession' | 'updateSession' | 'removeSession' | 'getSessionById'>
> = (set, get) => ({
  sessions: [],

  addSession: (session) => {
    const newSession: LocalSession = {
      ...session,
      id: newId('session'),
      created_at: new Date().toISOString(),
    };
    set((s) => ({ sessions: [newSession, ...s.sessions] }));
    get().computeSetupStep();
  },
  updateSession: (id, updates) =>
    set((s) => ({ sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, ...updates } : sess)) })),
  removeSession: (id) => set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) })),
  getSessionById: (id) => get().sessions.find((s) => s.id === id),
});
