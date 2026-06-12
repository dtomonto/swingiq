'use client';

// ============================================================
// AiFeatureSwitchboard — the per-feature on/off panel on /admin/ai-provider.
// Turns USER-FACING AI features on/off (durable) via /api/admin/ai/features
// (admin + settings.manage). A master "turn all off / on" sits on top of the
// per-feature toggles. ADMIN AI tools are NOT controlled here — they are gated
// separately and stay on. Persists fleet-wide with Upstash; otherwise on this
// server instance until restart (stated honestly).
// ============================================================

import { useState } from 'react';
import { Loader2, Check, AlertCircle, RotateCcw, Power, PowerOff, ShieldCheck } from 'lucide-react';

interface FeatureState {
  id: string;
  label: string;
  description: string;
  group: string;
  routes: string[];
  enabled: boolean;
  overridden: boolean;
}

interface Snapshot {
  features: FeatureState[];
  defaultEnabled: boolean;
  enabledCount: number;
  source: 'upstash' | 'memory';
}

interface Props {
  initialSnapshot: Snapshot;
}

export function AiFeatureSwitchboard({ initialSnapshot }: Props) {
  const [snap, setSnap] = useState<Snapshot>(initialSnapshot);
  const [busy, setBusy] = useState<string | null>(null); // feature id | 'all-on' | 'all-off' | 'reset'
  const [status, setStatus] = useState<{ kind: 'saved' | 'error'; msg?: string } | null>(null);

  async function post(key: string, payload: Record<string, unknown>) {
    setBusy(key);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/ai/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: 'error', msg: data?.error ?? 'Could not save (check admin permissions).' });
        return;
      }
      if (data.snapshot) setSnap(data.snapshot as Snapshot);
      setStatus({ kind: 'saved' });
    } catch {
      setStatus({ kind: 'error', msg: 'Network error — please try again.' });
    } finally {
      setBusy(null);
    }
  }

  const total = snap.features.length;
  const on = snap.enabledCount;
  const allOff = on === 0;

  return (
    <div className="space-y-4">
      {/* Master controls */}
      <div
        className={`rounded-lg border p-4 ${
          allOff ? 'border-error/40 bg-error/5' : 'border-border bg-background'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              {allOff ? <PowerOff className="h-4 w-4 text-error" /> : <Power className="h-4 w-4 text-success-text" />}
              Athlete-facing AI is{' '}
              {allOff ? (
                <span className="text-error">OFF</span>
              ) : on === total ? (
                <span className="text-success-text">fully ON</span>
              ) : (
                <span className="text-warning-text">
                  partly on ({on}/{total})
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Master switch for the {total} user-facing AI features below. Toggle any one back on individually.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={busy != null}
              onClick={() => post('all-off', { all: false })}
              className="inline-flex items-center gap-1.5 rounded-md bg-error px-3 py-1.5 text-sm font-medium text-error-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy === 'all-off' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4" />}
              Turn all OFF
            </button>
            <button
              type="button"
              disabled={busy != null}
              onClick={() => post('all-on', { all: true })}
              className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-sm font-medium text-success-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy === 'all-on' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              Turn all ON
            </button>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success-text" />
          Admin AI tools (Copilot, Social, Feature Education, Growth) are gated separately and stay on.
        </p>
      </div>

      {/* Per-feature toggles */}
      <div className="space-y-2.5">
        {snap.features.map((f) => (
          <div key={f.id} className="rounded-lg border border-border bg-background p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{f.label}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {f.group}
                  </span>
                  {f.enabled ? (
                    <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-success-text">
                      On
                    </span>
                  ) : (
                    <span className="rounded bg-error/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-error">
                      Off
                    </span>
                  )}
                  {f.overridden && (
                    <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Override
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-prose text-xs text-muted-foreground">{f.description}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {f.routes.map((r) => (
                    <code key={r} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {r}
                    </code>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {f.overridden && (
                  <button
                    type="button"
                    disabled={busy != null}
                    title="Revert to the default baseline"
                    onClick={() => post(f.id, { id: f.id, clear: true })}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-card disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy != null}
                  onClick={() => post(f.id, { id: f.id, enabled: !f.enabled })}
                  className={`inline-flex w-24 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition hover:opacity-90 disabled:opacity-50 ${
                    f.enabled
                      ? 'border border-border text-muted-foreground'
                      : 'bg-success text-success-foreground'
                  }`}
                >
                  {busy === f.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : f.enabled ? (
                    <>
                      <PowerOff className="h-4 w-4" /> Turn off
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4" /> Turn on
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {status?.kind === 'saved' && <Check className="h-3.5 w-3.5 text-success-text" />}
        {status?.kind === 'error' && <AlertCircle className="h-3.5 w-3.5 text-error" />}
        <span>
          {status?.kind === 'saved' ? 'Saved. ' : status?.kind === 'error' ? `${status.msg} ` : ''}
          Changes persist{' '}
          {snap.source === 'upstash' ? (
            <span className="font-medium text-foreground">fleet-wide (Upstash)</span>
          ) : (
            <span className="font-medium text-foreground">on this server instance until restart</span>
          )}
          . The baseline is set by <code className="rounded bg-muted px-1 text-foreground">AI_USER_FEATURES_DEFAULT</code>; a
          per-feature override layers on top.
        </span>
      </p>
    </div>
  );
}
