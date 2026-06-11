// ============================================================
// /admin/athletes — per-sport athlete profile directory
// ============================================================

import type { Metadata } from 'next';
import { Activity } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { NotConnected } from '@/components/admin/states/NotConnected';
import { EmptyState } from '@/components/ui/EmptyState';
import { listAthletes } from '@/lib/admin/data/athletes';
import { sportLabel } from '@/lib/admin/sports';
import { AthletesTable } from './AthletesTable';

export const metadata: Metadata = { title: 'Athletes | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminAthletesPage() {
  const res = await listAthletes();
  const sportEntries = Object.entries(res.bySport).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Athletes"
        icon={Activity}
        description="Every athlete profile across all seven sports — one row per sport a user has set up. Inspect skill level, goals and recency; click through to the athlete's full journey."
        actions={res.connected ? <StatusBadge tone="info">{res.rows.length} profiles</StatusBadge> : null}
      />

      {!res.connected ? (
        <NotConnected detail={res.reason ?? 'Not connected.'} envVars={['SUPABASE_SERVICE_ROLE_KEY']} />
      ) : res.rows.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="No athlete profiles yet"
            description="Profiles appear here as users set up golf, tennis, pickleball, padel, baseball or softball."
          />
        </SectionCard>
      ) : (
        <>
          {sportEntries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sportEntries.map(([sport, count]) => (
                <span key={sport} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
                  <span className="text-foreground">{sportLabel(sport)}</span>{' '}
                  <span className="font-semibold tabular-nums text-link">{count}</span>
                </span>
              ))}
            </div>
          )}
          <SectionCard>
            <AthletesTable rows={res.rows} />
          </SectionCard>
        </>
      )}

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> A directory of athletic profiles. SwingVantage
          stores a structured golf profile and a flexible per-sport profile for the other six sports — each
          becomes a row here.
        </p>
        <p>
          <strong className="text-foreground">What good looks like.</strong> Profiles with a skill level and a
          goal let the AI coach personalize. Sparse profiles are a prompt to encourage onboarding completion.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> Click any athlete to open their full
          journey (every sport profile, sessions and analyses in one place).
        </p>
      </HelpPanel>
    </div>
  );
}
