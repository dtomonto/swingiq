import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { croRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'CRO Lab | GrowthOS', robots: 'noindex, nofollow' };

export default function CroPage() {
  return <RecordModulePage navKey="cro" definitionId="cro" records={croRepo.list()} />;
}
