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
        <div className="rounded-lg bg-card border border-border p-3 text-xs text-muted-foreground">
          Prioritized growth actions across every lever. Items are labeled <strong className="text-foreground">Data-backed</strong> (from real analytics)
          or <strong className="text-foreground">Strategic</strong> (from product context) — today they&apos;re strategic until analytics is connected.
        </div>
      }
    />
  );
}
