'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { IntelligenceSettings } from '@/lib/intelligence-os/types';

const NUMBER_FIELDS: { key: keyof IntelligenceSettings; label: string; hint: string; step: number; max?: number }[] = [
  { key: 'autoServeConfidenceThreshold', label: 'Auto-serve confidence', hint: 'Min confidence to auto-serve a canonical/knowledge answer (0–1).', step: 0.05, max: 1 },
  { key: 'semanticMatchThreshold', label: 'Semantic match threshold', hint: 'Min lexical similarity to reuse a match (0–1).', step: 0.05, max: 1 },
  { key: 'knowledgePromotionThreshold', label: 'Knowledge promotion threshold', hint: 'Min confidence to promote an AI output to a knowledge candidate (0–1).', step: 0.05, max: 1 },
  { key: 'cacheTtlHours', label: 'Cache TTL (hours)', hint: 'How long cached answers stay valid. 0 = no expiry.', step: 1 },
  { key: 'dailyTokenBudgetAlertCents', label: 'Daily budget alert (cents)', hint: 'Alert when daily AI spend exceeds this. 0 = off.', step: 10 },
  { key: 'maxCostPerFeatureCents', label: 'Max cost per feature (cents)', hint: 'Per-feature daily cap. 0 = off.', step: 10 },
  { key: 'rawEventRetentionDays', label: 'Raw event retention (days)', hint: 'Keep raw AI events this long before summarizing. 0 = keep.', step: 1 },
  { key: 'lowValueArchiveDays', label: 'Low-value archive (days)', hint: 'Archive low-value events after this many days. 0 = keep.', step: 1 },
];

export function SettingsForm({ initial }: { initial: IntelligenceSettings }) {
  const [settings, setSettings] = useState<IntelligenceSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function setField(key: keyof IntelligenceSettings, value: number | boolean | string[]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/intelligence-os/settings', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.ok) { setSettings(json.settings); setMsg('Saved.'); }
      else setMsg(json.error ?? 'Save failed.');
    } catch { setMsg('Save failed.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {NUMBER_FIELDS.map((f) => (
          <label key={String(f.key)} className="block">
            <span className="text-sm font-medium text-foreground">{f.label}</span>
            <input
              type="number" step={f.step} min={0} max={f.max}
              value={settings[f.key] as number}
              onChange={(e) => setField(f.key, Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <span className="mt-0.5 block text-xs text-muted-foreground">{f.hint}</span>
          </label>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox" checked={settings.requireReviewBeforeAutoServe}
          onChange={(e) => setField('requireReviewBeforeAutoServe', e.target.checked)}
        />
        Require admin review before any canonical answer can auto-serve
      </label>

      <label className="block">
        <span className="text-sm font-medium text-foreground">Privacy exclusion keywords</span>
        <textarea
          value={settings.privacyExclusionKeywords.join(', ')}
          onChange={(e) => setField('privacyExclusionKeywords', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          rows={3}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <span className="mt-0.5 block text-xs text-muted-foreground">
          Comma-separated. Requests containing any of these are treated as personalized/privacy-sensitive and are never globally cached or reused.
        </span>
      </label>

      <div className="flex items-center gap-3">
        <Button onClick={save} loading={saving}>Save settings</Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
