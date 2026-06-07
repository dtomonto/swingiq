'use client';

// ============================================================
// SwingVantage Admin — local-first audit log store
// ------------------------------------------------------------
// Standalone persisted store (localStorage `swingvantage-admin-audit`),
// separate from the cloud-synced athlete store — admin activity is
// operator data, not athlete data. Optional Supabase mirroring can be
// layered on later via an admin_audit_log table (deferred schema).
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AUDIT_LOG_CAP, makeAuditEntry, type AuditEntry, type NewAuditEntry } from '../audit';

interface AuditLogStore {
  entries: AuditEntry[];
  record: (entry: NewAuditEntry) => AuditEntry;
  clear: () => void;
}

const ssrSafeStorage = () =>
  createJSONStorage(() => {
    if (typeof window === 'undefined') {
      return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
    }
    return localStorage;
  });

export const useAuditLog = create<AuditLogStore>()(
  persist(
    (set) => ({
      entries: [],
      record: (input) => {
        const entry = makeAuditEntry(input);
        set((s) => ({ entries: [entry, ...s.entries].slice(0, AUDIT_LOG_CAP) }));
        return entry;
      },
      clear: () => set({ entries: [] }),
    }),
    { name: 'swingvantage-admin-audit', storage: ssrSafeStorage(), version: 1 },
  ),
);

/**
 * Imperative helper for non-React call sites (event handlers, utilities).
 * Records an audit entry without needing the hook.
 */
export const recordAudit = (entry: NewAuditEntry): AuditEntry =>
  useAuditLog.getState().record(entry);
