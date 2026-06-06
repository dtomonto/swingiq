'use client';

import { useMemo } from 'react';
import { useRecruitingStore, computeProfileStrength } from '@/lib/recruiting';
import { ProfileBuilderForm, ProfileStrengthMeter } from '@/components/recruiting';

export default function ProfileBuilderPage() {
  const state = useRecruitingStore();
  const strength = useMemo(() => computeProfileStrength(state), [state]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="order-2 lg:order-1"><ProfileBuilderForm /></div>
      <div className="order-1 lg:order-2 lg:sticky lg:top-4 self-start"><ProfileStrengthMeter strength={strength} /></div>
    </div>
  );
}
