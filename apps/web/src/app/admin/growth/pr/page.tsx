import type { Metadata } from 'next';
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
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-3 text-xs text-gray-400">
          Authority-building only. <strong className="text-gray-300">Never fabricate</strong> press mentions, endorsements, awards, or results —
          track real opportunities through to a verifiable backlink or placement.
        </div>
      }
    />
  );
}
