'use client';

// ============================================================
// OperatingModeControl — switch the GAI platform posture from /admin/operating-mode.
// Toggles Default AI Mode ↔ Cost-Saving Mode, plus the global force-heuristic and
// kill-switch safety controls, and which tiers may use AI while Cost-Saving Mode
// is active. Persists fleet-wide via Upstash (else this instance until restart,
// stated honestly). POSTs to /api/admin/intelligence/operating-mode
// (admin + settings.manage). A confirm gate guards enabling Cost-Saving Mode.
// ============================================================

import { useState } from 'react';
import { Loader2, Check, AlertCircle, Gauge, ShieldAlert, Power } from 'lucide-react';

type OperatingMode = 'DEFAULT_AI_MODE' | 'COST_SAVING_MODE';
type IntelligenceTier = 'INSTANT_ESTIMATE' | 'AI_SWING_REPORT' | 'PREMIUM_RETEST_PLAN';

export interface OperatingModeStateView {
  mode: OperatingMode;
  costSavingAiTiers: IntelligenceTier[];
  forceHeuristic: boolean;
  killSwitch: boolean;
  lastChangedBy: string | null;
  lastChangedAt: string | null;
  source: 'upstash' | 'memory';
}

const TIER_LABELS: Record<IntelligenceTier, string> = {
  INSTANT_ESTIMATE: 'Instant Estimate',
  AI_SWING_REPORT: 'AI Swing Report',
  PREMIUM_RETEST_PLAN: 'Premium Retest Plan',
};

export function OperatingModeControl({ initial }: { initial: OperatingModeStateView }) {
  const [state, setState] = useState<OperatingModeStateView>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: 'saved' | 'error'; msg?: string } | null>(null);

  async function post(key: string, payload: Record<string, unknown>) {
    setBusy(key);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/intelligence/operating-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: 'error', msg: data?.error ?? 'Could not save (check admin permissions).' });
        return;
      }
      if (data.state) setState(data.state as OperatingModeStateView);
      setStatus({ kind: 'saved' });
    } catch {
      setStatus({ kind: 'error', msg: 'Network error — please try again.' });
    } finally {
      setBusy(null);
    }
  }

  function switchMode(next: OperatingMode) {
    if (next === state.mode) return;
    if (next === 'COST_SAVING_MODE') {
      const ok = window.confirm(
        'Enable Cost-Saving Mode?\n\nFree and Instant Estimate analyses will be served by deterministic GAI (no paid AI). Deeper tiers use AI only where you allow it below. Core flows are preserved.',
      );
      if (!ok) return;
    }
    void post('mode', { mode: next });
  }

  function toggleTier(tier: IntelligenceTier) {
    const set = new Set(state.costSavingAiTiers);
    if (set.has(tier)) set.delete(tier);
    else set.add(tier);
    void post(`tier-${tier}`, { costSavingAiTiers: [...set] });
  }

  const costSaving = state.mode === 'COST_SAVING_MODE';

  return (
    <div className="space-y-5">
      {/* Mode switch */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => switchMode('DEFAULT_AI_MODE')}
          disabled={busy !== null}
          className={`rounded-xl border p-4 text-left transition ${
            !costSaving ? 'border-primary/50 bg-primary/[0.06] ring-1 ring-primary/30' : 'border-border bg-card/60 hover:border-primary/30'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Gauge className="h-4 w-4 text-link" /> Default AI Mode
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Uses configured GAI routing for the best available analysis quality, while still applying
            heuristics and cache where they improve speed, reliability, or cost.
          </p>
        </button>

        <button
          type="button"
          onClick={() => switchMode('COST_SAVING_MODE')}
          disabled={busy !== null}
          className={`rounded-xl border p-4 text-left transition ${
            costSaving ? 'border-primary/50 bg-primary/[0.06] ring-1 ring-primary/30' : 'border-border bg-card/60 hover:border-primary/30'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldAlert className="h-4 w-4 text-link" /> Cost-Saving Mode
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Protects API spend by prioritizing deterministic GAI logic, cached recommendations, and
            safe fallback — while preserving every core user flow.
          </p>
        </button>
      </div>

      {/* Cost-Saving AI overrides */}
      {costSaving && (
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <div className="text-sm font-medium text-foreground">Allow AI for these tiers while Cost-Saving Mode is on</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Free and Instant Estimate requests never use paid AI in this mode, regardless of the toggles below.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['AI_SWING_REPORT', 'PREMIUM_RETEST_PLAN'] as IntelligenceTier[]).map((tier) => {
              const on = state.costSavingAiTiers.includes(tier);
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => toggleTier(tier)}
                  disabled={busy !== null}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    on ? 'border-primary/50 bg-primary/[0.1] text-foreground' : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {on ? '✓ ' : ''}
                  {TIER_LABELS[tier]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Safety controls */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <label htmlFor="gai-force-heuristic" className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              id="gai-force-heuristic"
              type="checkbox"
              checked={state.forceHeuristic}
              disabled={busy !== null}
              onChange={(e) => void post('forceHeuristic', { forceHeuristic: e.target.checked })}
              className="h-4 w-4"
            />
            <Power className="h-4 w-4 text-link" /> Force heuristic everywhere
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Serve deterministic GAI for every request, all tiers. Useful during a provider incident.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-4">
          <label htmlFor="gai-kill-switch" className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              id="gai-kill-switch"
              type="checkbox"
              checked={state.killSwitch}
              disabled={busy !== null}
              onChange={(e) => void post('killSwitch', { killSwitch: e.target.checked })}
              className="h-4 w-4"
            />
            <ShieldAlert className="h-4 w-4 text-destructive" /> Kill switch (no paid AI)
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Hard stop on every paid AI call. Heuristic + cache only until turned off.
          </p>
        </div>
      </div>

      {/* Footer status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {state.source === 'upstash' ? 'Fleet-wide (durable)' : 'This instance only (set Upstash for fleet-wide)'}
          {state.lastChangedAt && ` · last changed ${new Date(state.lastChangedAt).toLocaleString()}`}
          {state.lastChangedBy && ` by ${state.lastChangedBy}`}
        </span>
        <span className="flex items-center gap-1">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {!busy && status?.kind === 'saved' && (
            <span className="flex items-center gap-1 text-success-text">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          {!busy && status?.kind === 'error' && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {status.msg}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
