import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { proofRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Reputation / Social Proof | GrowthOS', robots: 'noindex, nofollow' };

export default function ReputationPage() {
  return (
    <RecordModulePage
      navKey="reputation"
      definitionId="reputation"
      records={proofRepo.list()}
      intro={
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
          <strong>Safeguard:</strong> proof is only usable when permission is <em>granted</em> and risk isn't <em>unusable</em>.
          Never invent testimonials, exaggerate outcomes, or imply endorsement without permission.
        </div>
      }
    />
  );
}
