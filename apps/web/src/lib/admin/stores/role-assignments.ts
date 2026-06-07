'use client';

// ============================================================
// SwingVantage Admin — role assignment overlay (local-first)
// ------------------------------------------------------------
// Operator-managed email → role map (localStorage
// `swingvantage-admin-roles`). This is a CONVENIENCE overlay for the
// /admin/security UI. The authoritative server-side resolution still
// uses the ADMIN_ROLES env var (see lib/admin/context.ts), so this
// client overlay can never escalate privileges on the server.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { RoleAssignment } from '../rbac';

interface RoleAssignmentStore {
  assignments: RoleAssignment[];
  setRole: (email: string, role: RoleAssignment['role']) => void;
  remove: (email: string) => void;
}

const ssrSafeStorage = () =>
  createJSONStorage(() => {
    if (typeof window === 'undefined') {
      return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
    }
    return localStorage;
  });

export const useRoleAssignments = create<RoleAssignmentStore>()(
  persist(
    (set) => ({
      assignments: [],
      setRole: (email, role) =>
        set((s) => {
          const norm = email.trim().toLowerCase();
          const others = s.assignments.filter((a) => a.email.trim().toLowerCase() !== norm);
          return { assignments: [...others, { email: norm, role }] };
        }),
      remove: (email) =>
        set((s) => ({
          assignments: s.assignments.filter(
            (a) => a.email.trim().toLowerCase() !== email.trim().toLowerCase(),
          ),
        })),
    }),
    { name: 'swingvantage-admin-roles', storage: ssrSafeStorage(), version: 1 },
  ),
);
