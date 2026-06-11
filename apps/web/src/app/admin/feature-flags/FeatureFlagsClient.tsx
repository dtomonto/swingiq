'use client';

// Feature flag manager. Reads the registry + local-first overrides,
// lets an operator toggle, set a rollout % and segments, and reset.
// High-risk toggles require confirmation. Every change is audit-logged.

import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useFeatureFlags, flagRows } from '@/lib/admin/stores/feature-flags';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import { formatRelativeTime } from '@/lib/admin/format';
import type { FlagRisk } from '@/lib/admin/flags';

const RISK_TONE: Record<FlagRisk, BadgeTone> = { low: 'neutral', medium: 'warning', high: 'danger' };

export function FeatureFlagsClient({ actor }: { actor: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const overrides = useFeatureFlags((s) => s.overrides);
  const toggle = useFeatureFlags((s) => s.toggle);
  const setFlag = useFeatureFlags((s) => s.setFlag);
  const reset = useFeatureFlags((s) => s.reset);

  const [pending, setPending] = useState<string | null>(null); // key awaiting confirm (high risk)

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading flags…</p>;

  const rows = flagRows(overrides);

  function doToggle(key: string, label: string) {
    const next = toggle(key, actor);
    recordAudit({
      actor, action: 'flag.toggle', entityType: 'feature-flag', entityId: key,
      summary: `Turned "${label}" ${next ? 'ON' : 'OFF'}`,
      severity: next ? 'info' : 'warning',
    });
  }

  return (
    <div className="space-y-3">
      {rows.map(({ def, override, enabled }) => (
        <div key={def.key} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{def.label}</p>
                <StatusBadge tone={RISK_TONE[def.risk]}>{def.risk} risk</StatusBadge>
                <StatusBadge tone={def.status === 'wired' ? 'success' : 'neutral'}>{def.status}</StatusBadge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">{def.key} · {def.group} · {def.owner}</p>
            </div>

            {/* Toggle switch */}
            <button
              role="switch"
              aria-checked={enabled}
              onClick={() => (def.risk === 'high' && !enabled ? setPending(def.key) : doToggle(def.key, def.label))}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-success' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Rollout + segments */}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Rollout %
              <input
                type="number" min={0} max={100}
                value={override?.rolloutPct ?? (enabled ? 100 : 0)}
                onChange={(e) => setFlag(def.key, { rolloutPct: Math.max(0, Math.min(100, Number(e.target.value))) }, actor)}
                className="w-16 rounded border border-border bg-background px-2 py-1 text-foreground"
              />
            </label>
            <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
              Segments
              <input
                type="text"
                defaultValue={(override?.segments ?? []).join(', ')}
                placeholder="e.g. beginners, golf"
                onBlur={(e) => setFlag(def.key, { segments: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }, actor)}
                className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-foreground"
              />
            </label>
            {override && (
              <button
                onClick={() => { reset(def.key); recordAudit({ actor, action: 'flag.reset', entityType: 'feature-flag', entityId: def.key, summary: `Reset "${def.label}" to default` }); }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
          {override && (
            <p className="mt-2 text-[11px] text-muted-foreground/70">
              Changed by {override.updatedBy} · {formatRelativeTime(override.updatedAt)}
            </p>
          )}
        </div>
      ))}

      <ConfirmDialog
        open={pending !== null}
        danger
        title="Enable a high-risk feature?"
        description="High-risk flags can affect safety or publishing behaviour. Confirm you want to turn this on."
        confirmLabel="Enable"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const def = rows.find((r) => r.def.key === pending)?.def;
          if (def) doToggle(def.key, def.label);
          setPending(null);
        }}
      />
    </div>
  );
}
