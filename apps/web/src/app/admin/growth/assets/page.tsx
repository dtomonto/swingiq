import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { assetsRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Asset Library | GrowthOS', robots: 'noindex, nofollow' };

export default function AssetsPage() {
  return <RecordModulePage navKey="assets" definitionId="assets" records={assetsRepo.list()} />;
}
