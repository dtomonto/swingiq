'use client';

import { AppShell } from '@/components/layout/AppShell';
import { TrainingContent } from './TrainingContent';
import { NonGolfTrainingContent } from './NonGolfTrainingContent';
import { useSport } from '@/contexts/SportContext';

export default function TrainingPage() {
  const { isGolf } = useSport();
  return (
    <AppShell>
      {isGolf ? <TrainingContent /> : <NonGolfTrainingContent />}
    </AppShell>
  );
}
