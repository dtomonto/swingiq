'use client';

// ============================================================
// SwingVantage Admin — support & feedback store (local-first)
// ------------------------------------------------------------
// localStorage `swingvantage-admin-support`. Holds support tickets and
// product feedback. Starts EMPTY — there is no inbound channel wired
// yet, so an operator logs items manually (or a future integration
// feeds them). The feedback→roadmap workflow lives in the statuses.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  subject: string;
  requester: string;
  sport: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  body: string;
  createdAt: string;
}

export type FeedbackType = 'ai_result' | 'page' | 'tutorial' | 'video' | 'bug' | 'feature' | 'ux';
export type FeedbackStatus = 'new' | 'triaged' | 'planned' | 'done' | 'dismissed';

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  summary: string;
  source: string;
  status: FeedbackStatus;
  createdAt: string;
}

interface SupportStore {
  tickets: SupportTicket[];
  feedback: FeedbackItem[];
  addTicket: (i: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => SupportTicket;
  setTicketStatus: (id: string, status: TicketStatus) => void;
  removeTicket: (id: string) => void;
  addFeedback: (i: Omit<FeedbackItem, 'id' | 'createdAt' | 'status'>) => FeedbackItem;
  setFeedbackStatus: (id: string, status: FeedbackStatus) => void;
  removeFeedback: (id: string) => void;
}

const ssrSafeStorage = () =>
  createJSONStorage(() => {
    if (typeof window === 'undefined') {
      return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
    }
    return localStorage;
  });

const rid = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const useSupport = create<SupportStore>()(
  persist(
    (set) => ({
      tickets: [],
      feedback: [],
      addTicket: (i) => {
        const t: SupportTicket = { ...i, id: rid('tkt'), status: 'open', createdAt: new Date().toISOString() };
        set((s) => ({ tickets: [t, ...s.tickets] }));
        return t;
      },
      setTicketStatus: (id, status) =>
        set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, status } : t)) })),
      removeTicket: (id) => set((s) => ({ tickets: s.tickets.filter((t) => t.id !== id) })),
      addFeedback: (i) => {
        const f: FeedbackItem = { ...i, id: rid('fb'), status: 'new', createdAt: new Date().toISOString() };
        set((s) => ({ feedback: [f, ...s.feedback] }));
        return f;
      },
      setFeedbackStatus: (id, status) =>
        set((s) => ({ feedback: s.feedback.map((f) => (f.id === id ? { ...f, status } : f)) })),
      removeFeedback: (id) => set((s) => ({ feedback: s.feedback.filter((f) => f.id !== id) })),
    }),
    { name: 'swingvantage-admin-support', storage: ssrSafeStorage(), version: 1 },
  ),
);
