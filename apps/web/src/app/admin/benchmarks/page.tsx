// ============================================================
// /admin/benchmarks — review + tune the profile-aware grading benchmarks
// ============================================================

import type { Metadata } from 'next';
import { Gauge } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { BenchmarksClient } from './BenchmarksClient';

export const metadata: Metadata = { title: 'Grading Benchmarks | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function AdminBenchmarksPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Grading Benchmarks"
        icon={Gauge}
        description="The per-profile, per-dimension scores that golf sessions are graded against. Players are graded relative to THEIR level (Beginner → Professional), not tour pros."
      />

      <SectionCard
        title="Benchmark table"
        description="Edit the expected score for each profile × dimension. Saving stores an override on THIS device so you can preview its effect on grades immediately."
      >
        <BenchmarksClient />
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">How grading uses this.</strong> A session's 0–100 dimension
          scores are compared to the row for the player's profile. Meeting the benchmark is a B; clearing
          it by ~10 is an A; falling short drops to C/D/F — all relative to their level.
        </p>
        <p>
          <strong className="text-gray-300">Local vs global.</strong> There is no benchmark backend, so an
          edit here is an operator override on this device (handy for tuning + preview). To roll a change
          out to everyone, use <em>Copy as JSON</em> and commit it as the new default in
          <code className="mx-1 rounded bg-gray-800 px-1">lib/grading/profiles.ts</code>.
        </p>
      </HelpPanel>
    </div>
  );
}
