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
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-xs text-green-200/90">
            <strong className="text-green-300">Backlink opportunities are auto-discovered</strong> by the{' '}
            <Link href="/admin/growth/link-intelligence" className="underline underline-offset-2">Link Intelligence Agent</Link>{' '}
            (look for ones owned by &ldquo;Link Intelligence Agent&rdquo;). Draft white-hat outreach with the AI Strategist; the agent never sends anything automatically.
          </div>
          <div className="rounded-lg bg-gray-900 border border-gray-800 p-3 text-xs text-gray-400">
            Authority-building only. <strong className="text-gray-300">Never fabricate</strong> press mentions, endorsements, awards, or results —
            track real opportunities through to a verifiable backlink or placement.
          </div>
        </div>
      }
    />
  );
}
