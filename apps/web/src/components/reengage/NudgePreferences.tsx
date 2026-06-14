'use client';

// ============================================================
// SwingVantage — Re-engagement OS: reminder preferences
// ------------------------------------------------------------
// Opt-in channel controls + quiet hours. Honest about push limits:
// browser reminders only fire while the app is open until background
// push infra is configured (see practice-reminders.ts SERVER_PUSH_NOTE).
// ============================================================

import { Bell, Mail, Moon, Smartphone } from 'lucide-react';
import { useReengage } from '@/lib/reengage';
import { SERVER_PUSH_NOTE } from '@/lib/notifications/practice-reminders';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

export function NudgePreferences() {
  const { state, setPrefs, pushPermission, enablePush } = useReengage();
  const { prefs } = state;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <Bell size={18} className="text-primary" aria-hidden="true" /> Reminder preferences
      </h2>

      <Row icon={<Smartphone size={16} />} label="In-app nudges" hint="One gentle, well-timed prompt when it helps.">
        <Toggle checked={prefs.inApp} onChange={(v) => setPrefs({ inApp: v })} />
      </Row>

      <Row icon={<Bell size={16} />} label="Browser reminders" hint="Local notifications while SwingVantage is open.">
        {pushPermission === 'granted' ? (
          <Toggle checked={prefs.push} onChange={(v) => setPrefs({ push: v })} />
        ) : (
          <button
            type="button"
            onClick={enablePush}
            disabled={pushPermission === 'unsupported' || pushPermission === 'denied'}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {pushPermission === 'denied' ? 'Blocked in browser' : pushPermission === 'unsupported' ? 'Not supported' : 'Enable'}
          </button>
        )}
      </Row>

      <Row icon={<Mail size={16} />} label="Email reminders" hint="Occasional comeback emails (only when you’re away).">
        <Toggle checked={prefs.email} onChange={(v) => setPrefs({ email: v })} />
      </Row>

      <Row icon={<Moon size={16} />} label="Quiet hours" hint={`No reminders ${prefs.quietHours.startHour}:00–${prefs.quietHours.endHour}:00.`}>
        <Toggle
          checked={prefs.quietHours.enabled}
          onChange={(v) => setPrefs({ quietHours: { ...prefs.quietHours, enabled: v } })}
        />
      </Row>

      <p className="border-t border-border pt-3 text-2xs text-muted-foreground">{SERVER_PUSH_NOTE}</p>
    </div>
  );
}

function Row({
  icon, label, hint, children,
}: { icon: React.ReactNode; label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
