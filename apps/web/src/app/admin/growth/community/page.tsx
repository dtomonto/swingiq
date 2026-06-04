import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { communityRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Community Growth | GrowthOS', robots: 'noindex, nofollow' };

export default function CommunityPage() {
  return <RecordModulePage navKey="community" definitionId="community" records={communityRepo.list()} />;
}
