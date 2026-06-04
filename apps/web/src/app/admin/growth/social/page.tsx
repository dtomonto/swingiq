import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { socialRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Organic Social | GrowthOS', robots: 'noindex, nofollow' };

export default function SocialPage() {
  return <RecordModulePage navKey="social" definitionId="social" records={socialRepo.list()} />;
}
