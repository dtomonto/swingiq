import type { Metadata } from 'next';
import { RecordModulePage } from '../_components/RecordModulePage';
import { offersRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Offers / Monetization | GrowthOS', robots: 'noindex, nofollow' };

export default function OffersPage() {
  return <RecordModulePage navKey="offers" definitionId="offers" records={offersRepo.list()} />;
}
