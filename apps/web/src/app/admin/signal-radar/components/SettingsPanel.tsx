'use client';

import { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { SignalRadarConfig, ScoringWeights, AdapterStatus, NotificationSeverity, SignalNotificationKind } from '@/lib/signal-radar/types';
import { ADAPTER_STATE_LABEL, ADAPTER_STATE_TONE, NOTIFICATION_KIND_LABEL } from '@/lib/signal-radar/labels';
import { Btn, INPUT_CLS } from './ui';

const ALERT_SEVERITIES: NotificationSeverity[] = ['low', 'medium', 'high', 'critical'];
const ALERT_KINDS = Object.keys(NOTIFICATION_KIND_LABEL) as SignalNotificationKind[];

const WEIGHT_LABELS: Record<keyof ScoringWeights, string> = {
  directBrandMention: 'Direct brand mention',
  hasLink: 'Includes a link',
  sentimentRisk: 'Negative / risk sentiment',
  sourceAuthority: 'Source authority',
  audienceRelevance: 'Audience relevance',
  recency: 'Recency',
  demandSignal: 'Product-market demand',
  competitorMention: 'Competitor mentioned',
  sportMapped: 'Maps to a sport',
};

const toList = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
const fromList = (a: string[]) => a.join(', ');

export function SettingsPanel({ config, adapters, onUpdate, onReset, onReprocess }: {
  config: SignalRadarConfig;
  adapters: AdapterStatus[];
  onUpdate: (patch: Partial<SignalRadarConfig>) => void;
  onReset: () => void;
  onReprocess: () => void;
}) {
  // Local drafts so we don't re-score on every keystroke.
  const [brand, setBrand] = useState(fromList(config.brandTerms));
  const [misspell, setMisspell] = useState(fromList(config.brandMisspellings));
  const [domain, setDomain] = useState(fromList(config.domainTerms));
  const [oldBrand, setOldBrand] = useState(fromList(config.oldBrandTerms));
  const [handles, setHandles] = useState(fromList(config.founderHandles));
  const [demand, setDemand] = useState(fromList(config.demandTerms));
  const [risk, setRisk] = useState(fromList(config.riskTerms));
  const [spam, setSpam] = useState(fromList(config.spamTerms));
  const [weights, setWeights] = useState<ScoringWeights>(config.weights);
  const [saved, setSaved] = useState(false);

  const save = () => {
    onUpdate({
      brandTerms: toList(brand),
      brandMisspellings: toList(misspell),
      domainTerms: toList(domain),
      oldBrandTerms: toList(oldBrand),
      founderHandles: toList(handles),
      demandTerms: toList(demand),
      riskTerms: toList(risk),
      spamTerms: toList(spam),
      weights,
    });
    onReprocess();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Monitoring vocabulary"
        description="The words SignalRadar watches for. Changes re-classify + re-score your existing signals when you save."
        actions={
          <div className="flex gap-2">
            <Btn size="sm" onClick={onReset} title="Reset to defaults"><RotateCcw className="h-3.5 w-3.5" /> Reset</Btn>
            <Btn size="sm" tone="primary" onClick={save}><Save className="h-3.5 w-3.5" /> Save &amp; re-score</Btn>
          </div>
        }
      >
        {saved && <p className="mb-3 text-xs text-success-text">Saved — existing signals were re-classified and re-scored.</p>}
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Brand terms" value={brand} onChange={setBrand} />
          <Field label="Brand misspellings" value={misspell} onChange={setMisspell} />
          <Field label="Domain terms" value={domain} onChange={setDomain} />
          <Field label="Old brand terms" value={oldBrand} onChange={setOldBrand} />
          <Field label="Founder / brand handles" value={handles} onChange={setHandles} />
          <Field label="Demand keywords" value={demand} onChange={setDemand} />
          <Field label="Risk / negative keywords" value={risk} onChange={setRisk} />
          <Field label="Spam keywords" value={spam} onChange={setSpam} />
        </div>
      </SectionCard>

      <SectionCard title="Priority scoring weights" description="Priority is a transparent weighted sum — tune what matters most. Save to apply.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(WEIGHT_LABELS) as (keyof ScoringWeights)[]).map((k) => (
            <label key={k} className="text-xs text-muted-foreground">
              {WEIGHT_LABELS[k]}
              <input
                type="number" min={0} max={40} value={weights[k]}
                onChange={(e) => setWeights({ ...weights, [k]: Math.max(0, Math.min(40, Number(e.target.value) || 0)) })}
                className={`${INPUT_CLS} mt-1`}
              />
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Alerts" description="Choose which derived notifications surface on the dashboard. Applies immediately.">
        <label className="block text-xs text-muted-foreground">
          Minimum severity to fire
          <select
            value={config.alertMinSeverity}
            onChange={(e) => onUpdate({ alertMinSeverity: e.target.value as NotificationSeverity })}
            className={`${INPUT_CLS} mt-1 sm:w-48`}
          >
            {ALERT_SEVERITIES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)} and above</option>)}
          </select>
        </label>
        <p className="mb-2 mt-4 text-xs text-muted-foreground">Mute specific alert types</p>
        <div className="flex flex-wrap gap-1.5">
          {ALERT_KINDS.map((kind) => {
            const muted = config.mutedAlertKinds.includes(kind);
            return (
              <button
                key={kind}
                onClick={() =>
                  onUpdate({
                    mutedAlertKinds: muted
                      ? config.mutedAlertKinds.filter((k) => k !== kind)
                      : [...config.mutedAlertKinds, kind],
                  })
                }
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  muted
                    ? 'border-border bg-background/40 text-muted-foreground/70 line-through'
                    : 'border-primary/40 bg-primary/15 text-link'
                }`}
                title={muted ? 'Muted — click to enable' : 'Active — click to mute'}
              >
                {NOTIFICATION_KIND_LABEL[kind]}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="AI classification" description="Optional enhancement layer over the always-on rules classifier.">
        <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5">
          <p className="text-sm text-foreground">
            Rules-based classification is active and keyless. AI refinement is a scaffolded seam — it stays off until an AI provider is configured, so nothing here depends on a key.
          </p>
          <StatusBadge tone={config.aiClassificationEnabled ? 'success' : 'neutral'}>{config.aiClassificationEnabled ? 'AI on' : 'Rules only'}</StatusBadge>
        </div>
      </SectionCard>

      <SectionCard title="Source adapters" description="Every source, its live state and exactly how to enable it. Secrets are never shown — only whether a variable is set.">
        <p className="mb-3 text-xs text-muted-foreground">Turning automated collection on (durable store, webhook, scheduled feeds) lives in the <strong className="text-foreground">Automation</strong> tab.</p>
        <ul className="space-y-2">
          {adapters.map((a) => (
            <li key={a.id} className="rounded-lg border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{a.name}</p>
                <StatusBadge tone={ADAPTER_STATE_TONE[a.state]}>{ADAPTER_STATE_LABEL[a.state]}</StatusBadge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{a.setupInstructions}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {a.envVars.length > 0 ? a.envVars.map((v) => (
                  <code key={v} className="rounded bg-muted px-1.5 py-0.5 text-3xs text-muted-foreground">{v}{a.hasCredentials ? ' ✓' : ''}</code>
                )) : <span className="text-3xs text-muted-foreground/70">No credentials required</span>}
                <span className="text-3xs text-muted-foreground/70">· dedup: {a.dedupeStrategy}</span>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-xs text-muted-foreground">
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={`${INPUT_CLS} mt-1`} placeholder="comma or newline separated" />
    </label>
  );
}

