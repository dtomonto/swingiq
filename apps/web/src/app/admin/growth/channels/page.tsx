import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { channelsRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Channel Portfolio | GrowthOS', robots: 'noindex, nofollow' };

export default function ChannelsPage() {
  return <RecordModulePage navKey="channels" definitionId="channels" records={channelsRepo.list()} />;
}
