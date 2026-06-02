'use client';

import { AppShell } from '@/components/layout/AppShell';
import { ImportWizard } from './ImportWizard';
import { useSport } from '@/contexts/SportContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ImportPage() {
  const { isGolf } = useSport();
  const router = useRouter();

  useEffect(() => {
    if (!isGolf) {
      router.replace('/sessions/log');
    }
  }, [isGolf, router]);

  if (!isGolf) return null;

  return (
    <AppShell>
      <ImportWizard />
    </AppShell>
  );
}
