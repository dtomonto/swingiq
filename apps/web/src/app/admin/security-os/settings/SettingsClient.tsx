'use client';

// ============================================================
// securityOS — settings (CLIENT)
// ------------------------------------------------------------
// Edits the local-first SecuritySettings: per-category score weights, the
// score-drop alert threshold, severity due-days, audit-log retention and AI
// strictness. Changes persist immediately and write an audit entry.
// ============================================================

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { useSecurityOS } from '@/lib/security-os/useSecurityOS';
import { SCORE_CATEGORIES, type Severity } from '@/lib/security-os/types';

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'informational'];

export function SettingsClient({ actor }: { actor: string }) {
  const sec = useSecurityOS();
  useEffect(() => {
    if (actor) sec.setActor(actor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  if (!sec.ready) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const s = sec.settings;

  return (
    <div className="space-y-5">
      {/* Weights */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Score weights</h2>
          <button onClick={sec.resetSettings} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /> Reset defaults</button>
        </div>
        <ul className="space-y-3">
          {SCORE_CATEGORIES.map((c) => (
            <li key={c.id} className="grid grid-cols-[1fr,auto] items-center gap-3">
              <div>
                <p className="text-sm text-foreground">{c.label}</p>
                <p className="text-2xs text-muted-foreground">{c.blurb}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={s.weights[c.id] ?? c.weight}
                  onChange={(e) => sec.setWeight(c.id, Number(e.target.value))}
                  className="w-36 accent-primary"
                />
                <span className="w-9 text-right text-xs tabular-nums text-foreground">{s.weights[c.id] ?? c.weight}%</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Rules */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Rules</h2>
        <div className="space-y-4">
          <Row label="Score-drop alert (points)" hint="Flag when the overall score falls by at least this much.">
            <NumberInput value={s.scoreDropAlert} min={1} max={50} onChange={(v) => sec.updateSettings({ scoreDropAlert: v })} />
          </Row>
          <Row label="Audit-log retention (entries)" hint="How many security audit entries to keep locally.">
            <NumberInput value={s.auditLogRetention} min={50} max={1000} step={50} onChange={(v) => sec.updateSettings({ auditLogRetention: v })} />
          </Row>
          <Row label="AI-security strictness" hint="Strict treats partial AI checks as failures.">
            <select
              value={s.aiStrictness}
              onChange={(e) => sec.updateSettings({ aiStrictness: e.target.value as 'standard' | 'strict' })}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none"
            >
              <option value="standard">Standard</option>
              <option value="strict">Strict</option>
            </select>
          </Row>
          <Row label="Fill empty states with sample findings" hint="Clearly-labelled demo data for empty views (dev aid).">
            <Toggle on={s.includeSeedData} onClick={() => sec.updateSettings({ includeSeedData: !s.includeSeedData })} />
          </Row>
        </div>
      </section>

      {/* Due days */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Finding due-date rules</h2>
        <p className="mb-3 text-2xs text-muted-foreground">Days-to-due by severity for newly derived findings.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SEVERITIES.map((sev) => (
            <label key={sev} className="block">
              <span className="text-2xs capitalize text-muted-foreground">{sev}</span>
              <NumberInput
                value={s.dueDays[sev]}
                min={0}
                max={90}
                onChange={(v) => sec.updateSettings({ dueDays: { ...s.dueDays, [sev]: v } })}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        {hint && <p className="text-2xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function NumberInput({ value, min, max, step = 1, onChange }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
      className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
    />
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-warning' : 'bg-muted'}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
