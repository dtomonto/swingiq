import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { experimentsRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Experiments | GrowthOS', robots: 'noindex, nofollow' };

export default function ExperimentsPage() {
  return <RecordModulePage navKey="experiments" definitionId="experiments" records={experimentsRepo.list()} />;
}
