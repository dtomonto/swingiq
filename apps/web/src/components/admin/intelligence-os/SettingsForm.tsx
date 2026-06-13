'use client';

// Editable Intelligence OS settings — thresholds, cache TTL, retention and
// safety gates. Persists via the admin-guarded records API.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { IntelligenceSettings } from '@/lib/intelligence-os/types';

type NumKey = keyof Pick<IntelligenceSettings,
  'autoServeThreshold' | 'semanticMatchThreshold' | 'knowledgePromotionThreshold' |
  'cacheTtlDays' | 'keepRawAiEventsDays' | 'summarizeAfterDays' | 'archiveAfterDays'>;

const FIELDS: Array<{ key: NumKey; label: string; hint: string; step: number; max: number }> = [
  { key: 'autoServeThreshold', label: 'Auto-serve confidence', hint: 'Min confidence to serve without a model call', step: 0.05, max: 1 },
  { key: 'semanticMatchThreshold', label: 'Semantic match threshold', hint: 'Min similarity to treat as the same question', step: 0.05, max: 1 },
  { key: 'knowledgePromotionThreshold', label: 'Knowledge promotion threshold', hint: 'Min confidence to promote a candidate', step: 0.05, max: 1 },
  { key: 'cacheTtlDays', label: 'Cache TTL (days)', hint: 'How long cached answers stay reusable', step: 1, max: 365 },
  { key: 'keepRawAiEventsDays', label: 'Keep raw AI events (days)', hint: 'Hot tier before summarization', step: 1, max: 365 },
  { key: 'summarizeAfterDays', label: 'Summarize after (days)', hint: 'Warm tier: keep summaries, drop bodies', step: 1, max: 730 },
  { key: 'archiveAfterDays', label: 'Archive after (days)', hint: 'Cold tier: archive stale records', step: 1, max: 1095 },
];

export function SettingsForm({ initial }: { initial: IntelligenceSettings }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await fetch('/api/admin/intelligence-os/records', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'intelligence_settings', id: values.id, patch: values }),
      });
      if (res.ok) { setMsg('Saved.'); router.refresh(); } else { setMsg(`Save failed (${res.status}).`); }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={f.key} className="block text-sm font-medium text-foreground">{f.label}</label>
            <input
              id={f.key}
              type="number"
              step={f.step}
              min={0}
              max={f.max}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: Number(e.target.value) }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
            />
            <p className="mt-0.5 text-xs text-muted-foreground">{f.hint}</p>
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.requireReviewForSensitive}
          onChange={(e) => setValues((v) => ({ ...v, requireReviewForSensitive: e.target.checked }))}
          className="accent-primary"
        />
        Require human review for youth / medical / legal / privacy / personalized answers
      </label>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" disabled={pending} onClick={save}>{pending ? 'Saving…' : 'Save settings'}</Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
