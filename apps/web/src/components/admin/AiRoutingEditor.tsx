'use client';

// ============================================================
// AiRoutingEditor — the editable routing table on /admin/ai-provider.
// Posts per-task changes to /api/admin/ai/routing (admin + settings.manage).
// Each row = one AI task: its provider, model, and enabled state. Measurement
// is shown read-only (CV layer is locked by design). Persists fleet-wide with
// Upstash; otherwise applies to this server instance until restart (stated).
// ============================================================

import { useState } from 'react';
import { Save, Loader2, Check, AlertCircle, RotateCcw, AlertTriangle } from 'lucide-react';

type ProviderName = 'gemini' | 'openai' | 'anthropic' | 'mediapipe' | 'none';

interface TaskDef {
  id: string;
  label: string;
  stage: string;
  defaultProvider: ProviderName;
  description: string;
  allowedProviders: ProviderName[];
  reroutable: boolean;
}

interface Route {
  task: TaskDef;
  provider: ProviderName;
  model: string | null;
  enabled: boolean;
  overridden: boolean;
  reason: string;
  providerConfigured: boolean;
}

interface Props {
  initialRoutes: Route[];
  source: 'upstash' | 'memory';
}

const PROVIDER_LABEL: Record<ProviderName, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  anthropic: 'Claude',
  mediapipe: 'MediaPipe',
  none: 'Disabled',
};

export function AiRoutingEditor({ initialRoutes, source }: Props) {
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  // Per-stage local draft (provider/model/enabled) before saving.
  const [drafts, setDrafts] = useState<Record<string, { provider: ProviderName; model: string; enabled: boolean }>>(
    () =>
      Object.fromEntries(
        initialRoutes.map((r) => [r.task.stage, { provider: r.provider, model: r.model ?? '', enabled: r.enabled }]),
      ),
  );
  const [busyStage, setBusyStage] = useState<string | null>(null);
  const [status, setStatus] = useState<{ stage: string; kind: 'saved' | 'error'; msg?: string } | null>(null);

  function applySnapshot(next: Route[]) {
    setRoutes(next);
    setDrafts(
      Object.fromEntries(
        next.map((r) => [r.task.stage, { provider: r.provider, model: r.model ?? '', enabled: r.enabled }]),
      ),
    );
  }

  async function post(stage: string, payload: Record<string, unknown>) {
    setBusyStage(stage);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/ai/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ stage, kind: 'error', msg: data?.error ?? 'Could not save (check admin permissions).' });
        return;
      }
      if (Array.isArray(data.routes)) applySnapshot(data.routes as Route[]);
      setStatus({ stage, kind: 'saved' });
    } catch {
      setStatus({ stage, kind: 'error', msg: 'Network error — please try again.' });
    } finally {
      setBusyStage(null);
    }
  }

  return (
    <div className="space-y-3">
      {routes.map((r) => {
        const draft = drafts[r.task.stage];
        const locked = !r.task.reroutable;
        const dirty =
          !!draft &&
          (draft.provider !== r.provider ||
            (draft.model || '') !== (r.model ?? '') ||
            draft.enabled !== r.enabled);
        const rowStatus = status?.stage === r.task.stage ? status : null;

        return (
          <div
            key={r.task.id}
            className="rounded-lg border border-border bg-background p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{r.task.label}</span>
                  {r.overridden && (
                    <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-success-text">
                      Override
                    </span>
                  )}
                  {!r.enabled && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Off
                    </span>
                  )}
                  {r.enabled && r.provider !== 'none' && r.provider !== 'mediapipe' && !r.providerConfigured && (
                    <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning-text">
                      <AlertTriangle className="h-3 w-3" /> No key
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-prose text-xs text-muted-foreground">{r.task.description}</p>
              </div>
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                {r.task.stage}
              </code>
            </div>

            {locked ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Provider: <span className="font-medium text-foreground">{PROVIDER_LABEL[r.provider]}</span> —
                locked by design (objective biomechanics must come from the CV layer, never an LLM).
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap items-end gap-2.5">
                <label className="text-xs">
                  <span className="mb-1 block text-muted-foreground">Provider</span>
                  <select
                    value={draft?.provider ?? r.provider}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [r.task.stage]: { ...d[r.task.stage], provider: e.target.value as ProviderName } }))
                    }
                    className="w-32 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground focus:border-foreground/30 focus:outline-none"
                  >
                    {r.task.allowedProviders.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_LABEL[p]}
                        {p === r.task.defaultProvider ? ' (default)' : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs">
                  <span className="mb-1 block text-muted-foreground">Model id (blank = tier default)</span>
                  <input
                    type="text"
                    value={draft?.model ?? ''}
                    placeholder="e.g. gpt-4o / gemini-2.0-flash"
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [r.task.stage]: { ...d[r.task.stage], model: e.target.value } }))
                    }
                    className="w-56 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground focus:border-foreground/30 focus:outline-none"
                  />
                </label>

                <label className="flex items-center gap-1.5 pb-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={draft?.enabled ?? r.enabled}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [r.task.stage]: { ...d[r.task.stage], enabled: e.target.checked } }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  Enabled
                </label>

                <button
                  type="button"
                  disabled={busyStage === r.task.stage || !dirty}
                  onClick={() =>
                    post(r.task.stage, {
                      stage: r.task.stage,
                      provider: draft.provider,
                      model: draft.model.trim() === '' ? null : draft.model.trim(),
                      enabled: draft.enabled,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
                >
                  {busyStage === r.task.stage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>

                {r.overridden && (
                  <button
                    type="button"
                    disabled={busyStage === r.task.stage}
                    onClick={() => post(r.task.stage, { stage: r.task.stage, clear: true })}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-card disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset to default
                  </button>
                )}
              </div>
            )}

            {rowStatus && (
              <p className="mt-2 flex items-center gap-1.5 text-xs">
                {rowStatus.kind === 'saved' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success-text" />
                    <span className="text-muted-foreground">Saved.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-error" />
                    <span className="text-muted-foreground">{rowStatus.msg}</span>
                  </>
                )}
              </p>
            )}
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground">
        Changes persist{' '}
        {source === 'upstash' ? (
          <span className="font-medium text-foreground">fleet-wide (Upstash)</span>
        ) : (
          <span className="font-medium text-foreground">on this server instance until restart</span>
        )}
        . The env-driven model config remains the default — an override only layers on top of it.
      </p>
    </div>
  );
}
