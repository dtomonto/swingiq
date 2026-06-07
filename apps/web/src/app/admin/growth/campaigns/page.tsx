import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { campaignsRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Campaigns | GrowthOS', robots: 'noindex, nofollow' };

export default function CampaignsPage() {
  return <RecordModulePage navKey="campaigns" definitionId="campaigns" records={campaignsRepo.list()} />;
}
