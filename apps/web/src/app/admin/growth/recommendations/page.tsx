import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { recommendationsRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Recommendations | GrowthOS', robots: 'noindex, nofollow' };

export default function RecommendationsPage() {
  return (
    <RecordModulePage
      navKey="recommendations"
      definitionId="recommendations"
      records={recommendationsRepo.list()}
      intro={
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-3 text-xs text-gray-400">
          Prioritized growth actions across every lever. Items are labeled <strong className="text-gray-300">Data-backed</strong> (from real analytics)
          or <strong className="text-gray-300">Strategic</strong> (from product context) — today they're strategic until analytics is connected.
        </div>
      }
    />
  );
}
