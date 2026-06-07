'use client';

// Convenience overlay for mapping admin emails to finer roles. The
// SERVER still enforces via the ADMIN_ROLES env var — this overlay can
// never grant access, only document/plan the intended mapping.

import { useEffect, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useRoleAssignments } from '@/lib/admin/stores/role-assignments';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import { ROLES, ROLE_IDS, type RoleId } from '@/lib/admin/rbac';

export function RoleAssignmentsClient({ actor }: { actor: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const assignments = useRoleAssignments((s) => s.assignments);
  const setRole = useRoleAssignments((s) => s.setRole);
  const remove = useRoleAssignments((s) => s.remove);

  const [email, setEmail] = useState('');
  const [role, setRole_] = useState<RoleId>('content_manager');

  if (!mounted) return <p className="text-sm text-gray-500">Loading…</p>;

  function add() {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) return;
    setRole(e, role);
    recordAudit({ actor, action: 'role.assign', entityType: 'admin-role', entityId: e, summary: `Assigned ${ROLES[role].label} to ${e}` });
    setEmail('');
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="admin@email.com"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-amber-500"
        />
        <select
          value={role}
          onChange={(e) => setRole_(e.target.value as RoleId)}
          className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200"
        >
          {ROLE_IDS.map((r) => <option key={r} value={r}>{ROLES[r].label}</option>)}
        </select>
        <button onClick={add} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-gray-950 hover:bg-amber-400">
          <UserPlus className="h-4 w-4" /> Assign
        </button>
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-gray-500">
          No role overlays set. Everyone who passes the admin guard is a Super Admin until assigned a finer
          role here (and, for server enforcement, in <code className="text-gray-400">ADMIN_ROLES</code>).
        </p>
      ) : (
        <ul className="divide-y divide-gray-800 rounded-xl border border-gray-800">
          {assignments.map((a) => (
            <li key={a.email} className="flex items-center justify-between gap-3 p-3">
              <span className="min-w-0 truncate text-sm text-gray-200">{a.email}</span>
              <div className="flex items-center gap-2">
                <StatusBadge tone="accent">{ROLES[a.role]?.label ?? a.role}</StatusBadge>
                <button
                  onClick={() => { remove(a.email); recordAudit({ actor, action: 'role.remove', entityType: 'admin-role', entityId: a.email, summary: `Removed role overlay for ${a.email}`, severity: 'warning' }); }}
                  className="text-gray-500 hover:text-red-400"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
