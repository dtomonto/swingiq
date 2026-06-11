import type { Metadata } from 'next';
import Link from 'next/link';
import { RecordModulePage } from '../_components/RecordModulePage';
import { authorityRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Digital PR | GrowthOS', robots: 'noindex, nofollow' };

export default function PrPage() {
  return (
    <RecordModulePage
      navKey="pr"
      definitionId="pr"
      records={authorityRepo.list()}
      intro={
        <div className="space-y-2">
          <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-xs text-success-text/90">
            <strong className="text-success-text">Backlink opportunities are auto-discovered</strong> by the{' '}
            <Link href="/admin/growth/link-intelligence" className="underline underline-offset-2">Link Intelligence Agent</Link>{' '}
            (look for ones owned by &ldquo;Link Intelligence Agent&rdquo;). Draft white-hat outreach with the AI Strategist; the agent never sends anything automatically.
          </div>
          <div className="rounded-lg bg-card border border-border p-3 text-xs text-muted-foreground">
            Authority-building only. <strong className="text-foreground">Never fabricate</strong> press mentions, endorsements, awards, or results —
            track real opportunities through to a verifiable backlink or placement.
          </div>
        </div>
      }
    />
  );
}
