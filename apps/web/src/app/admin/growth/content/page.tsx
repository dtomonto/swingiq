import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { contentRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Content Studio | GrowthOS', robots: 'noindex, nofollow' };

export default function ContentPage() {
  return <RecordModulePage navKey="content" definitionId="content" records={contentRepo.list()} />;
}
