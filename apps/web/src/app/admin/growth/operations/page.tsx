import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { tasksRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Operations | GrowthOS', robots: 'noindex, nofollow' };

export default function OperationsPage() {
  return <RecordModulePage navKey="operations" definitionId="operations" records={tasksRepo.list()} />;
}
