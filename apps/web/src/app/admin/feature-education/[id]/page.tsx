// ============================================================
// SwingVantage — Admin: Feature Education feature detail (server entry)
// ------------------------------------------------------------
// Generate / review / publish the learning package for one feature.
// ============================================================

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadFeatureDetail } from '@/lib/feature-education/server/data';
import { FeatureDetail } from '@/components/feature-education/admin/FeatureDetail';

export const metadata: Metadata = {
  title: 'Feature · Feature Education | Admin',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function FeatureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await loadFeatureDetail(id);
  if (!detail) notFound();
  return <FeatureDetail initial={detail} />;
}
