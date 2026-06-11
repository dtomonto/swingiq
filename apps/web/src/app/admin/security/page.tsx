// ============================================================
// /admin/security — roles, permissions & security posture
// ============================================================

import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { adminEmails } from '@/lib/auth/admin-allowlist';
import { isConfigured, isSupabaseConfigured } from '@/lib/capabilities';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { ROLES, ROLE_IDS, PERMISSIONS } from '@/lib/admin/rbac';
import { RoleAssignmentsClient } from './RoleAssignmentsClient';

export const metadata: Metadata = { title: 'Security & Roles | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminSecurityPage() {
  const user = await getAuthenticatedUser();
  const actor = user?.email ?? 'admin';

  const posture: { label: string; ok: boolean; detail: string }[] = [
    { label: 'Admin allowlist (ADMIN_EMAILS)', ok: adminEmails().length > 0, detail: 'Restricts admin access to specific emails. Without it, only the secret header (or dev) grants access.' },
    { label: 'Admin secret header (ADMIN_SECRET)', ok: isConfigured(process.env.ADMIN_SECRET), detail: 'Optional proxy/tooling access path. In production with neither this nor an allowlist, the area is closed.' },
    { label: 'Server role map (ADMIN_ROLES)', ok: isConfigured(process.env.ADMIN_ROLES), detail: 'Enforces finer roles server-side. Optional — default is Super Admin for allowlisted users.' },
    { label: 'Accounts (Supabase auth)', ok: isSupabaseConfigured, detail: 'Real sessions so the allowlist can identify the logged-in admin.' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Security & Roles"
        icon={ShieldCheck}
        description="Who can access the admin area, what each role may do, and how access is enforced. Server-side checks are the source of truth; the UI only ever narrows access."
      />

      <SectionCard title="Security posture" description="How admin access is currently locked down.">
        <ul className="divide-y divide-border">
          {posture.map((p) => (
            <li key={p.label} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{p.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.detail}</p>
              </div>
              <StatusBadge tone={p.ok ? 'success' : 'warning'}>{p.ok ? 'On' : 'Off'}</StatusBadge>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Roles & permissions" description={`${ROLE_IDS.length} roles · ${PERMISSIONS.length} permissions.`}>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLE_IDS.map((id) => {
            const r = ROLES[id];
            const all = r.permissions === '*';
            const perms = all ? [] : (r.permissions as readonly string[]);
            return (
              <div key={id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{r.label}</p>
                  <StatusBadge tone={all ? 'danger' : 'neutral'}>{all ? 'All' : `${perms.length}`}</StatusBadge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
                {!all && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {perms.slice(0, 10).map((p) => (
                      <code key={p} className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">{p}</code>
                    ))}
                    {perms.length > 10 && <span className="text-[10px] text-muted-foreground/70">+{perms.length - 10}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Role assignments" description="Map admin emails to finer roles (convenience overlay).">
        <RoleAssignmentsClient actor={actor} />
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> The admin permission model. Anyone who
          clears the front-door guard is a Super Admin by default; finer roles remove capabilities.
        </p>
        <p>
          <strong className="text-foreground">Server is the source of truth.</strong> Real enforcement uses
          <code> ADMIN_EMAILS</code> (who&apos;s an admin) and <code>ADMIN_ROLES</code> (their role). The
          assignment list here is a convenience/plan — it can&apos;t grant access on its own.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> Keep the allowlist tight, set
          <code> ADMIN_ROLES</code> for least-privilege, and review the posture items above.
        </p>
      </HelpPanel>
    </div>
  );
}
