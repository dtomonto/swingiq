'use client';

import { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { SignalRadarConfig, ScoringWeights, AdapterStatus } from '@/lib/signal-radar/types';
import { ADAPTER_STATE_LABEL, ADAPTER_STATE_TONE } from '@/lib/signal-radar/labels';
import { Btn, INPUT_CLS } from './ui';

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
        {saved && <p className="mb-3 text-xs text-emerald-400">Saved — existing signals were re-classified and re-scored.</p>}
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
            <label key={k} className="text-xs text-gray-400">
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

      <SectionCard title="AI classification" description="Optional enhancement layer over the always-on rules classifier.">
        <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/40 px-3 py-2.5">
          <p className="text-sm text-gray-300">
            Rules-based classification is active and keyless. AI refinement is a scaffolded seam — it stays off until an AI provider is configured, so nothing here depends on a key.
          </p>
          <StatusBadge tone={config.aiClassificationEnabled ? 'success' : 'neutral'}>{config.aiClassificationEnabled ? 'AI on' : 'Rules only'}</StatusBadge>
        </div>
      </SectionCard>

      <SectionCard title="Source adapters" description="Every source, its live state and exactly how to enable it. Secrets are never shown — only whether a variable is set.">
        <ul className="space-y-2">
          {adapters.map((a) => (
            <li key={a.id} className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-200">{a.name}</p>
                <StatusBadge tone={ADAPTER_STATE_TONE[a.state]}>{ADAPTER_STATE_LABEL[a.state]}</StatusBadge>
              </div>
              <p className="mt-1 text-xs text-gray-500">{a.setupInstructions}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {a.envVars.length > 0 ? a.envVars.map((v) => (
                  <code key={v} className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">{v}{a.hasCredentials ? ' ✓' : ''}</code>
                )) : <span className="text-[10px] text-gray-600">No credentials required</span>}
                <span className="text-[10px] text-gray-600">· dedup: {a.dedupeStrategy}</span>
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
    <label className="text-xs text-gray-400">
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={`${INPUT_CLS} mt-1`} placeholder="comma or newline separated" />
    </label>
  );
}
