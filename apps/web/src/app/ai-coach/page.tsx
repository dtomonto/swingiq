import { AppShell } from '@/components/layout/AppShell';
import { AICoachChat } from './AICoachChat';

export const metadata = { title: 'AI Coach — SwingIQ' };

export default function AICoachPage() {
  return (
    <AppShell>
      <AICoachChat />
    </AppShell>
  );
}
