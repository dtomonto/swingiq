// ============================================================
// /admin/users/[id] — full user journey
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, UserCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { NotConnected } from '@/components/admin/states/NotConnected';
import { getAdminUser } from '@/lib/admin/data/users';
import { sportLabel } from '@/lib/admin/sports';
import { formatDate, formatRelativeTime, titleize } from '@/lib/admin/format';
import { AdminUserActions } from './AdminUserActions';

export const metadata: Metadata = { title: 'User | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const GOLF_FIELDS = [
  'handicap', 'skill_level', 'scoring_average', 'low_round', 'primary_goal',
  'current_miss', 'desired_shot_shape', 'handedness', 'practice_frequency',
];

function KeyValues({ data, keys }: { data: Record<string, unknown>; keys: string[] }) {
  const shown = keys.filter((k) => data[k] !== undefined && data[k] !== null && data[k] !== '');
  if (shown.length === 0) return <p className="text-sm text-gray-500">No details recorded.</p>;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {shown.map((k) => (
        <div key={k}>
          <dt className="text-[11px] uppercase tracking-wide text-gray-600">{titleize(k)}</dt>
          <dd className="text-sm text-gray-200">{String(data[k])}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminUser(id);

  const back = (
    <Link href="/admin/users" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200">
      <ArrowLeft className="h-3.5 w-3.5" /> All users
    </Link>
  );

  if (!detail.connected) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        {back}
        <NotConnected detail={detail.reason ?? 'Not connected.'} envVars={['SUPABASE_SERVICE_ROLE_KEY']} />
      </div>
    );
  }

  if (!detail.user) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        {back}
        <SectionCard>
          <p className="py-6 text-center text-sm text-gray-400">User not found.</p>
        </SectionCard>
      </div>
    );
  }

  const u = detail.user;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {back}
      <PageHeader
        title={u.email ?? 'User'}
        icon={UserCircle2}
        description={`Account ${u.id}`}
        actions={
          <AdminUserActions userId={u.id} email={u.email} suspended={u.suspended} exportData={detail} />
        }
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge tone={u.suspended ? 'danger' : 'success'}>
            {u.suspended ? 'Suspended' : 'Active'}
          </StatusBadge>
          <StatusBadge tone={u.confirmed ? 'success' : 'warning'}>
            {u.confirmed ? 'Email confirmed' : 'Email unconfirmed'}
          </StatusBadge>
          {u.provider && <StatusBadge tone="neutral">via {u.provider}</StatusBadge>}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Joined" value={u.createdAt ? formatDate(u.createdAt) : '—'} />
        <MetricStat label="Last seen" value={u.lastSignInAt ? formatRelativeTime(u.lastSignInAt) : 'never'} />
        <MetricStat label="Sessions" value={detail.sessions.length} />
        <MetricStat label="Analyses" value={detail.analyses.length} />
      </div>

      {detail.golfProfile && (
        <SectionCard title="Golf profile">
          <KeyValues data={detail.golfProfile} keys={GOLF_FIELDS} />
        </SectionCard>
      )}

      {detail.sportProfiles.length > 0 && (
        <SectionCard title="Sport profiles" description="Non-golf profiles this athlete has set up.">
          <div className="space-y-4">
            {detail.sportProfiles.map((sp) => (
              <div key={sp.sport}>
                <p className="mb-1 text-sm font-medium text-amber-300">{sportLabel(sp.sport)}</p>
                <KeyValues data={sp.data} keys={Object.keys(sp.data).slice(0, 9)} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Recent sessions" description={`${detail.sessions.length} shown (latest 50).`}>
        {detail.sessions.length === 0 ? (
          <p className="text-sm text-gray-500">No practice sessions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-gray-500">
                <tr><th className="pb-2 pr-3">Session</th><th className="pb-2 pr-3">Sport</th><th className="pb-2 pr-3">Date</th><th className="pb-2 pr-3">Shots</th><th className="pb-2">Score</th></tr>
              </thead>
              <tbody className="text-gray-300">
                {detail.sessions.map((s) => (
                  <tr key={s.id} className="border-t border-gray-800">
                    <td className="max-w-[12rem] truncate py-2 pr-3 text-gray-200">{s.name || '—'}</td>
                    <td className="py-2 pr-3">{sportLabel(s.sport)}</td>
                    <td className="py-2 pr-3 text-gray-500">{s.date || (s.created_at ? formatDate(s.created_at) : '—')}</td>
                    <td className="py-2 pr-3 tabular-nums">{s.shot_count}</td>
                    <td className="py-2 tabular-nums">{s.swing_score ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Recent analyses" description="Metadata only — videos are processed privately and never stored.">
        {detail.analyses.length === 0 ? (
          <p className="text-sm text-gray-500">No swing analyses recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-gray-500">
                <tr><th className="pb-2 pr-3">Sport</th><th className="pb-2 pr-3">File</th><th className="pb-2 pr-3">Score</th><th className="pb-2 pr-3">Primary issue</th><th className="pb-2">When</th></tr>
              </thead>
              <tbody className="text-gray-300">
                {detail.analyses.map((a) => (
                  <tr key={a.id} className="border-t border-gray-800">
                    <td className="py-2 pr-3">{sportLabel(a.sport)}</td>
                    <td className="max-w-[10rem] truncate py-2 pr-3 text-gray-400">{a.file_name || '—'}</td>
                    <td className="py-2 pr-3 tabular-nums">{a.overall_score ?? '—'}</td>
                    <td className="max-w-[12rem] truncate py-2 pr-3 text-gray-400">{a.primary_issue ?? '—'}</td>
                    <td className="py-2 text-gray-500">{a.created_at ? formatRelativeTime(a.created_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {detail.community && (
        <SectionCard title="Engagement">
          <MetricStat label="XP total" value={detail.community.xp_total} tone="success" />
        </SectionCard>
      )}

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> Everything SwingVantage knows about this
          account in one place — profile, sessions, analyses and engagement — so you can understand their
          journey at a glance.
        </p>
        <p>
          <strong className="text-gray-300">Actions.</strong> <em>Export data</em> downloads a JSON copy of
          this view (useful for data-access requests). <em>Suspend</em> blocks sign-in without deleting data
          and is fully reversible. Both are recorded in the audit log.
        </p>
      </HelpPanel>
    </div>
  );
}
