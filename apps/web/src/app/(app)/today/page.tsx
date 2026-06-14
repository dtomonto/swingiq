'use client';

import { Sun } from 'lucide-react';
import { useSport } from '@/contexts/SportContext';
import { TodayView } from '@/components/today/TodayView';

export default function TodayPage() {
  const { activeSport } = useSport();
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Sun className="text-foreground" size={22} aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">Today</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          The few things worth your attention today — tailored to where you are. Deeper insights stay
          tucked away until you want them.
        </p>
      </div>
      <TodayView sport={activeSport} />
    </div>
  );
}
