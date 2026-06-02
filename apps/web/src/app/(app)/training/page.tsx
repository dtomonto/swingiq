'use client';

import { TrainingContent } from './TrainingContent';
import { NonGolfTrainingContent } from './NonGolfTrainingContent';
import { useSport } from '@/contexts/SportContext';

export default function TrainingPage() {
  const { isGolf } = useSport();
  return (
    <>
      {isGolf ? <TrainingContent /> : <NonGolfTrainingContent />}
    </>
  );
}
