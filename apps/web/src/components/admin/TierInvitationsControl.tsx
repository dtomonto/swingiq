'use client';

// ============================================================
// TierInvitationsControl — admin surface for the calm tier-invitation strategy.
// ------------------------------------------------------------
// Live (no-redeploy) control over WHERE the zero-pressure early-access
// invitation appears: a global master switch, plus per-slot enable / target
// tier / gentle wording. Persists via /api/admin/intelligence/placements.
// ============================================================

import { useState } from 'react';
import { Loader2, Megaphone, Check, AlertCircle } from 'lucide-react';

type WaitlistTier = 'AI_SWING_REPORT' | 'PREMIUM_RETEST_PLAN';

interface SlotDef {
  id: string;
  label: string;
  description: string;
}
interface Setting {
  enabled: boolean;
  tier: WaitlistTier;
  headline: string | null;
}
export interface PlacementStateView {
  invitationsEnabled: boolean;
  slots: Record<string, Setting>;
  lastChangedBy: string | null;
  lastChangedAt: string | null;
  source: 'upstash' | 'memory';
}

const TIER_LABELS: Record<WaitlistTier, string> = {
  AI_SWING_REPORT: 'AI Swing Report',
  PREMIUM_RETEST_PLAN: 'Premium Retest Plan',
};

export function TierInvitationsControl({
  initial,
  slots,
}: {
  initial: PlacementStateView;
  slots: SlotDef[];
}) {
  const [state, setState] = useState<PlacementStateView>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: 'saved' | 'error'; msg?: string } | null>(null);

  async function post(tag: string, body: Record<string, unknown>) {
    setBusy(tag);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/intelligence/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setStatus({ kind: 'error', msg: data?.error ?? `HTTP ${res.status}` });
        return;
      }
      setState(data.state as PlacementStateView);
      setStatus({ kind: 'saved' });
    } catch (e) {
      setStatus({ kind: 'error', msg: e instanceof Error ? e.message : 'Network error' });
    } finally {
      setBusy(null);
    }
  }

  function patchSlot(id: string, change: Partial<Setting>) {
    void post(`slot-${id}`, { slots: { [id]: change } });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-link" />
        <p>
          Invitations are always calm and optional — informational, dismissible, and only ever shown
          for a tier still on the waitlist. There is no urgency or upgrade pressure. Use these
          controls to choose where they appear; changes go live immediately.
        </p>
      </div>

      {/* Master switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/60 p-4">
        <span>
          <span className="block text-sm font-medium text-foreground">Show tier invitations</span>
          <span className="text-xs text-muted-foreground">Master switch — off hides every invitation everywhere.</span>
        </span>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void post('master', { invitationsEnabled: !state.invitationsEnabled })}
          className={`relative h-6 w-11 rounded-full transition ${
            state.invitationsEnabled ? 'bg-link' : 'bg-border'
          }`}
          aria-pressed={state.invitationsEnabled}
          aria-label="Toggle tier invitations"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
              state.invitationsEnabled ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Per-slot placements */}
      <div className={`space-y-2 ${state.invitationsEnabled ? '' : 'opacity-50'}`}>
        {slots.map((slot) => {
          const s = state.slots[slot.id];
          if (!s) return null;
          return (
            <div key={slot.id} className="rounded-lg border border-border bg-background/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="block text-sm font-medium text-foreground">{slot.label}</span>
                  <span className="text-xs text-muted-foreground">{slot.description}</span>
                </span>
                <button
                  type="button"
                  disabled={busy !== null || !state.invitationsEnabled}
                  onClick={() => patchSlot(slot.id, { enabled: !s.enabled })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    s.enabled ? 'bg-success-text/10 text-success-text' : 'border border-border text-muted-foreground'
                  }`}
                >
                  {s.enabled ? 'Showing' : 'Hidden'}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Invite to</span>
                <select
                  value={s.tier}
                  disabled={busy !== null}
                  aria-label={`Invitation tier for ${slot.label}`}
                  onChange={(e) => patchSlot(slot.id, { tier: e.target.value as WaitlistTier })}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                >
                  <option value="AI_SWING_REPORT">{TIER_LABELS.AI_SWING_REPORT}</option>
                  <option value="PREMIUM_RETEST_PLAN">{TIER_LABELS.PREMIUM_RETEST_PLAN}</option>
                </select>
              </div>

              <div className="mt-2">
                <input
                  type="text"
                  defaultValue={s.headline ?? ''}
                  placeholder="Optional gentle headline (blank = calm default)"
                  maxLength={160}
                  disabled={busy !== null}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (s.headline ?? '')) patchSlot(slot.id, { headline: v || null });
                  }}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {state.source === 'upstash' ? 'Saved fleet-wide (Upstash)' : 'Saved on this instance (set Upstash for fleet-wide)'}
          {state.lastChangedBy ? ` · last by ${state.lastChangedBy}` : ''}
        </span>
        {busy && <span className="inline-flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>}
        {status?.kind === 'saved' && <span className="inline-flex items-center gap-1 text-success-text"><Check className="h-3.5 w-3.5" /> Saved</span>}
        {status?.kind === 'error' && <span className="inline-flex items-center gap-1 text-destructive"><AlertCircle className="h-3.5 w-3.5" /> {status.msg}</span>}
      </div>
    </div>
  );
}
