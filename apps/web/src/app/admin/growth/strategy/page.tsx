import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { strategiesRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Strategy Hub | GrowthOS', robots: 'noindex, nofollow' };

export default function StrategyPage() {
  return <RecordModulePage navKey="strategy" definitionId="strategy" records={strategiesRepo.list()} />;
}
