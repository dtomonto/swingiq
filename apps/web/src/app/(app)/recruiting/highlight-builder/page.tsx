'use client';

import { useRecruitingStore } from '@/lib/recruiting';
import { HighlightReelBuilder } from '@/components/recruiting';

export default function HighlightBuilderPage() {
  const sport = useRecruitingStore((s) => s.profile?.primarySport ?? 'golf');
  return <HighlightReelBuilder sport={sport} />;
}
