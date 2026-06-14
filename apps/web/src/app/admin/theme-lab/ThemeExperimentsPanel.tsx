'use client';

// Theme Lab — experiments + segment defaults (#3 step 4). Local-first operator
// config over lib/theme-lab/experiments, with a deterministic bucketing preview
// (reuses resolve.bucketVariant). Governance: an experiment only affects users
// once started (status → running); explicit user picks are never enrolled.

import { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Play, Square, Trash2 } from 'lucide-react';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import { THEMES, type ThemeId } from '@/lib/theme/themes';
import { THEME_LAB_REGISTRY, bucketVariant } from '@/lib/theme-lab';
import {
  readExperiments,
  upsertExperiment,
  removeExperiment,
  setExperimentStatus,
  activeRunningExperiment,
  readSegmentDefaults,
  setSegmentDefault,
  EXPERIMENTS_CHANGE_EVENT,
  type ThemeExperimentConfig,
  type ExperimentStatus,
  type SegmentDefaults,
} from '@/lib/theme-lab';

const STATUS_TONE: Record<ExperimentStatus, BadgeTone> = {
  draft: 'neutral',
  running: 'success',
  stopped: 'warning',
};

const SEGMENTS = ['athletes', 'coaches', 'parents', 'juniors'] as const;
const ACTIVE_THEMES = THEME_LAB_REGISTRY.filter((e) => e.status === 'active');
const themeName = (id: ThemeId) => THEMES.find((t) => t.id === id)?.name ?? id;

export function ThemeExperimentsPanel({ actor }: { actor: string }) {
  const [mounted, setMounted] = useState(false);
  const [experiments, setExperiments] = useState<ThemeExperimentConfig[]>([]);
  const [segments, setSegments] = useState<SegmentDefaults>({});

  // New-experiment form.
  const [name, setName] = useState('');
  const [variantA, setVariantA] = useState<ThemeId>('dark-performance');
  const [variantB, setVariantB] = useState<ThemeId>('standard');
  const [sampleId, setSampleId] = useState('user-123');

  useEffect(() => {
    // Mount gate + initial read of the device-local config (client-only).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const sync = () => {
      setExperiments(readExperiments());
      setSegments(readSegmentDefaults());
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(EXPERIMENTS_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(EXPERIMENTS_CHANGE_EVENT, sync);
    };
  }, []);

  const running = useMemo(() => activeRunningExperiment(experiments), [experiments]);
  const sampleVariant = running ? bucketVariant(sampleId || 'anon', running) : null;

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading experiments…</p>;

  function create() {
    const trimmed = name.trim();
    if (!trimmed || variantA === variantB) return;
    const id = `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}-${Date.now().toString(36)}`;
    upsertExperiment({
      id,
      name: trimmed,
      status: 'draft',
      createdAt: new Date().toISOString(),
      variants: [
        { themeId: variantA, weight: 50 },
        { themeId: variantB, weight: 50 },
      ],
    });
    recordAudit({
      actor,
      action: 'theme.experiment.create',
      entityType: 'theme-experiment',
      entityId: id,
      summary: `Created theme experiment "${trimmed}" (${themeName(variantA)} vs ${themeName(variantB)})`,
    });
    setName('');
  }

  function changeStatus(exp: ThemeExperimentConfig, status: ExperimentStatus) {
    setExperimentStatus(exp.id, status);
    recordAudit({
      actor,
      action: `theme.experiment.${status}`,
      entityType: 'theme-experiment',
      entityId: exp.id,
      summary: `Experiment "${exp.name}" → ${status}`,
      severity: status === 'running' ? 'warning' : 'info',
    });
  }

  function destroy(exp: ThemeExperimentConfig) {
    removeExperiment(exp.id);
    recordAudit({
      actor,
      action: 'theme.experiment.delete',
      entityType: 'theme-experiment',
      entityId: exp.id,
      summary: `Deleted experiment "${exp.name}"`,
      severity: 'warning',
    });
  }

  function changeSegment(segment: string, themeId: ThemeId | null) {
    setSegmentDefault(segment, themeId);
    recordAudit({
      actor,
      action: 'theme.segment.default',
      entityType: 'theme-segment',
      entityId: segment,
      summary: themeId
        ? `Segment "${segment}" default → ${themeName(themeId)}`
        : `Cleared "${segment}" default`,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-link" />
        <h3 className="text-sm font-semibold text-foreground">Experiments &amp; segments</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        A/B test themes across the population still on the default (explicit picks are never
        enrolled). Bucketing is deterministic per visitor. Nothing affects users until you press
        Start.
      </p>

      {/* New experiment */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          New 50/50 experiment
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dark vs Standard"
              className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span>Variant A</span>
            <ThemeOptionSelect
              ariaLabel="Variant A theme"
              value={variantA}
              onChange={(v) => v && setVariantA(v)}
            />
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span>Variant B</span>
            <ThemeOptionSelect
              ariaLabel="Variant B theme"
              value={variantB}
              onChange={(v) => v && setVariantB(v)}
            />
          </div>
          <button
            onClick={create}
            disabled={!name.trim() || variantA === variantB}
            className="rounded-lg bg-success/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-success disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create draft
          </button>
        </div>
        {variantA === variantB && (
          <p className="mt-1.5 text-2xs text-link">Pick two different themes.</p>
        )}
      </div>

      {/* Experiment list */}
      {experiments.length === 0 ? (
        <p className="text-xs text-muted-foreground/70">No experiments yet.</p>
      ) : (
        <div className="space-y-2">
          {experiments.map((exp) => (
            <div key={exp.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{exp.name}</p>
                    <StatusBadge tone={STATUS_TONE[exp.status]}>{exp.status}</StatusBadge>
                  </div>
                  <p className="mt-1 flex flex-wrap gap-1.5 text-2xs text-muted-foreground">
                    {exp.variants.map((v) => (
                      <span key={v.themeId} className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                        {themeName(v.themeId)} {v.weight}%
                      </span>
                    ))}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {exp.status !== 'running' ? (
                    <button
                      onClick={() => changeStatus(exp, 'running')}
                      className="inline-flex items-center gap-1 rounded-lg border border-success/40 bg-success/10 px-2.5 py-1 text-xs text-success-text hover:bg-success/20"
                    >
                      <Play className="h-3 w-3" /> Start
                    </button>
                  ) : (
                    <button
                      onClick={() => changeStatus(exp, 'stopped')}
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-link hover:bg-primary/20"
                    >
                      <Square className="h-3 w-3" /> Stop
                    </button>
                  )}
                  <button
                    onClick={() => destroy(exp)}
                    aria-label={`Delete ${exp.name}`}
                    className="inline-flex items-center rounded-lg p-1 text-muted-foreground hover:text-error-text"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bucketing preview */}
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bucketing preview</p>
        {running ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <input
              value={sampleId}
              onChange={(e) => setSampleId(e.target.value)}
              className="rounded border border-border bg-card px-2 py-1 text-sm text-foreground"
            />
            <span className="text-muted-foreground">→</span>
            <StatusBadge tone="neutral">{sampleVariant ? themeName(sampleVariant) : '—'}</StatusBadge>
            <span className="font-mono text-2xs text-muted-foreground/70">in &ldquo;{running.id}&rdquo;</span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground/70">No experiment is running.</p>
        )}
      </div>

      {/* Segment defaults */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Segment defaults</h4>
        <p className="text-xs text-muted-foreground">
          A fallback theme for a segment (mapped from the visitor&apos;s usage type). Applies only to
          users without an explicit pick, below any running experiment.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SEGMENTS.map((seg) => (
            <div
              key={seg}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground"
            >
              <span className="capitalize">{seg}</span>
              <ThemeOptionSelect
                ariaLabel={`${seg} default theme`}
                value={segments[seg] ?? ''}
                onChange={(v) => changeSegment(seg, (v as ThemeId) || null)}
                allowNone
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A select of active themes (optionally with a "None" entry). */
function ThemeOptionSelect({
  value,
  onChange,
  allowNone = false,
  ariaLabel,
}: {
  value: ThemeId | '';
  onChange: (v: ThemeId | '') => void;
  allowNone?: boolean;
  ariaLabel?: string;
}) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value as ThemeId | '')}
      className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
    >
      {allowNone && <option value="">None</option>}
      {ACTIVE_THEMES.map((e) => (
        <option key={e.themeId} value={e.themeId}>
          {e.name}
        </option>
      ))}
    </select>
  );
}
