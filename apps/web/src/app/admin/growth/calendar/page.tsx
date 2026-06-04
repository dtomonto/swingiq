// ============================================================
// /admin/growth/calendar — Marketing Calendar (§26)
// ------------------------------------------------------------
// Unified launch + publishing calendar across all channels.
// Server component: fetches items then delegates to <CalendarView>.
// ============================================================

import type { Metadata } from 'next';
import { CalendarDays } from 'lucide-react';
import { calendarRepo } from '@/lib/growth/repository';
import { ModuleHeader, MockDataNote } from '../_components/ui';
import CalendarView from './CalendarView';

export const metadata: Metadata = {
  title: 'Marketing Calendar | GrowthOS',
  robots: 'noindex, nofollow',
};

export default function CalendarPage() {
  const items = calendarRepo.list();

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={CalendarDays}
        title="Marketing Calendar"
        description="Unified launch + publishing calendar across channels."
      />

      <MockDataNote>
        <strong>Demo data.</strong> Items shown are realistic seed records (June–July 2026).
        Connect your project management or campaign tool to replace them with live scheduled events.
      </MockDataNote>

      <CalendarView items={items} />
    </div>
  );
}
