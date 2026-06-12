// ============================================================
// /admin/users — account management
// ============================================================

import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { NotConnected } from '@/components/admin/states/NotConnected';
import { EmptyState } from '@/components/ui/EmptyState';
import { listAdminUsers } from '@/lib/admin/data/users';
import { getSystemPipelineHealth } from '@/lib/admin/data/pipeline-health';
import { SystemPipelineHealthCard } from '@/components/admin/PipelineHealthCard';
import { UsersTable } from './UsersTable';

export const metadata: Metadata = { title: 'Users | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const [res, pipeline] = await Promise.all([listAdminUsers(), getSystemPipelineHealth()]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Users"
        icon={Users}
        description="Every SwingVantage account. Search, inspect a user's full journey, and review their sports, activity and status. Click a row to open the full profile."
        actions={
          res.connected ? (
            <StatusBadge tone="info">
              {res.total}{res.capped ? '+' : ''} account{res.total === 1 ? '' : 's'}
            </StatusBadge>
          ) : null
        }
      />

      {pipeline.connected && <SystemPipelineHealthCard health={pipeline} />}

      {!res.connected ? (
        <NotConnected detail={res.reason ?? 'Not connected.'} envVars={['SUPABASE_SERVICE_ROLE_KEY']} />
      ) : res.users.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="No accounts yet"
            description="When people sign up, they'll appear here with their sports, activity and status."
          />
        </SectionCard>
      ) : (
        <SectionCard>
          <UsersTable rows={res.users} />
        </SectionCard>
      )}

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> The directory of every account. Each row
          shows the user&apos;s email, the sports they&apos;ve set up, their self-reported skill level, whether
          they confirmed their email, and when they last signed in.
        </p>
        <p>
          <strong className="text-foreground">Privacy note.</strong> Swing videos are processed on each
          user&apos;s device and never uploaded, so you&apos;ll see a user&apos;s activity and analysis
          <em> metadata</em> — not their raw footage.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> Click any user to see their full journey
          — profile, sessions, analyses and engagement — in one place. Suspend/export actions live on the
          detail page and are audit-logged.
        </p>
      </HelpPanel>
    </div>
  );
}
