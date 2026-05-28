import { AppShell } from '@/components/layout/AppShell';
import { BagManager } from './BagManager';

export const metadata = { title: 'Golf Bag — SwingIQ' };

export default function BagPage() {
  return (
    <AppShell>
      <BagManager />
    </AppShell>
  );
}
