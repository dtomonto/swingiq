import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { paidCampaignsRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Paid Media | GrowthOS', robots: 'noindex, nofollow' };

export default function PaidMediaPage() {
  return <RecordModulePage navKey="paid-media" definitionId="paid-media" records={paidCampaignsRepo.list()} />;
}
