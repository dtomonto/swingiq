'use client';

// ============================================================
// PrivacyControls — user-facing data rights + personalization
// ------------------------------------------------------------
// Lets a user see what CentralIntelligence remembers, control how their
// data is used (personalization + anonymized product-improvement
// toggles, recorded as consent), export their CentralIntelligence data,
// and delete it. Honest scope: this manages the CentralIntelligence
// memory layer; full-account export/delete is linked where it lives.
// ============================================================

import { useState } from 'react';
import { Download, Trash2, ShieldCheck } from 'lucide-react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import {
  useCentralIntelligenceData,
  setPrivacyPreference,
  recordConsent,
  clearMemories,
  type PrivacyPreferences,
} from '@/lib/central-intelligence/store';
import { DATA_ETHICS } from '@/lib/central-intelligence';

function Toggle({
  label, description, checked, onChange,
}: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border bg-background p-3">
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'left-4' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export function PrivacyControls() {
  const ci = useCentralIntelligenceData();
  const [deleted, setDeleted] = useState(false);

  const update = (key: keyof PrivacyPreferences, value: boolean) => {
    setPrivacyPreference(key, value);
    recordConsent(
      key === 'personalization' ? 'personalization' : 'product_improvement',
      value ? 'granted' : 'revoked',
    );
  };

  const exportData = () => {
    track(ANALYTICS_EVENTS.DATA_EXPORT_REQUESTED, { scope: 'central_intelligence' });
    const payload = {
      exportedAt: new Date().toISOString(),
      privacy: ci.privacy,
      consents: ci.consents,
      memories: ci.memories,
      achievementsEarned: ci.achievementsEarned,
      founding: ci.foundingClaim,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swingvantage-my-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteData = () => {
    if (!window.confirm('Delete the coaching memory SwingVantage has learned on this device? This cannot be undone.')) return;
    track(ANALYTICS_EVENTS.DATA_DELETE_REQUESTED, { scope: 'central_intelligence' });
    clearMemories();
    setDeleted(true);
    setTimeout(() => setDeleted(false), 4000);
  };

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4" aria-label="Privacy and data controls">
      <header>
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          Privacy &amp; your data
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{DATA_ETHICS.ownExperience} {DATA_ETHICS.neverSold}</p>
      </header>

      <div className="space-y-2">
        <Toggle
          label="Personalize my coaching"
          description="Use my profile, sessions and history to tailor diagnoses, drills and recommendations to me."
          checked={ci.privacy.personalization}
          onChange={(v) => update('personalization', v)}
        />
        <Toggle
          label="Help improve SwingVantage"
          description="Contribute anonymized, aggregated insights so the product gets better for everyone. Never identifies you."
          checked={ci.privacy.productImprovement}
          onChange={(v) => update('productImprovement', v)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={exportData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Export my data
        </button>
        <button
          type="button"
          onClick={deleteData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-background px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete coaching memory
        </button>
        {deleted && <span className="text-xs text-emerald-600 dark:text-emerald-400" role="status">Coaching memory cleared.</span>}
      </div>

      <p className="text-xs text-muted-foreground">{DATA_ETHICS.rights}</p>
    </section>
  );
}
