import { AppShell } from '@/components/layout/AppShell';
import { ImportWizard } from './ImportWizard';

export const metadata = { title: 'Import Launch-Monitor Data — SwingIQ' };

export default function ImportPage() {
  return (
    <AppShell>
      <ImportWizard />
    </AppShell>
  );
}
