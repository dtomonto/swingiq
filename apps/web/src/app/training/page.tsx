import { AppShell } from '@/components/layout/AppShell';
import { TrainingContent } from './TrainingContent';

export const metadata = { title: 'Training Routines — SwingIQ' };

export default function TrainingPage() {
  return (
    <AppShell>
      <TrainingContent />
    </AppShell>
  );
}
