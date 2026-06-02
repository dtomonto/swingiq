import { AppShell } from '@/components/layout/AppShell';
import { AvatarViewer } from './AvatarViewer';

export const metadata = { title: '3D Swing Avatar — SwingIQ' };

export default function AvatarPage() {
  return (
    <AppShell>
      <AvatarViewer />
    </AppShell>
  );
}
