'use client';

// ============================================================
// SwingVantage — /reminders · Re-engagement OS (user surface)
// Your current nudge + how SwingVantage reminds you to keep going.
// ============================================================

import { Bell } from 'lucide-react';
import { ReengageNudgeCard } from '@/components/reengage/ReengageNudgeCard';
import { NudgePreferences } from '@/components/reengage/NudgePreferences';
import { PushToggle } from '@/components/notifications/PushToggle';
import { useReengage } from '@/lib/reengage';

export default function RemindersPage() {
  const { nudge } = useReengage();

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bell size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Reminders</h1>
          <p className="text-xs text-muted-foreground">Gentle nudges that help you keep improving</p>
        </div>
      </div>

      {nudge ? (
        <ReengageNudgeCard />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <p className="text-sm font-medium text-foreground">You’re all caught up 🎉</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No nudges right now. We’ll only reach out when a small step would genuinely help.
          </p>
        </div>
      )}

      {/* Browser push toggle — self-hides until the deployment configures VAPID. */}
      <PushToggle />

      <NudgePreferences />
    </div>
  );
}
