import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { referralsRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Referral Engine | GrowthOS', robots: 'noindex, nofollow' };

export default function ReferralPage() {
  return (
    <RecordModulePage
      navKey="referral"
      definitionId="referral"
      records={referralsRepo.list()}
      intro={
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-3 text-xs text-gray-400">
          Referral design here is <strong className="text-gray-300">ethical by policy</strong> — transparent rewards, honest invite copy,
          and no spammy or deceptive mechanics. Track referred users + an estimated K-factor as loops go live.
        </div>
      }
    />
  );
}
