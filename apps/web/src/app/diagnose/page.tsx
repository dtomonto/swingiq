import { AppShell } from '@/components/layout/AppShell';
import { DiagnoseContent } from './DiagnoseContent';

export const metadata = { title: 'Diagnose My Swing — SwingIQ' };

export default function DiagnosePage() {
  return (
    <AppShell>
      <DiagnoseContent />
    </AppShell>
  );
}
