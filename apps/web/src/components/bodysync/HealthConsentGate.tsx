'use client';

import { useState } from 'react';
import { HeartPulse, Lock, Eye, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CATEGORY_META, NON_MEDICAL_DISCLAIMER } from '@/lib/bodysync';
import type { HealthCategory, HealthPermissions } from '@/lib/bodysync';

interface Props {
  permissions: HealthPermissions;
  onSetPermissions: (patch: Partial<HealthPermissions>) => void;
  onConsent: () => void;
}

const ORDER: HealthCategory[] = ['wellness', 'recovery', 'cardio', 'activity', 'mobility'];

/**
 * Privacy-first onboarding: explains what's collected, why it helps, what's
 * optional, and how to disconnect/delete — then captures explicit consent.
 */
export function HealthConsentGate({ permissions, onSetPermissions, onConsent }: Props) {
  const [agreed, setAgreed] = useState(false);
  const [age18, setAge18] = useState(false);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HeartPulse size={28} aria-hidden="true" />
        </div>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Meet BodySync</h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          SwingVantage can use how your body feels — sleep, energy, soreness, recovery — to tailor each day&apos;s
          coaching. Train hard on fresh days, ease off on tired ones, and understand why your swing changes.
          You stay in control of every piece of data.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <Lock size={16} />, t: 'Private', d: 'Never sold, never used for ads.' },
          { icon: <Eye size={16} />, t: 'Your choice', d: 'Pick exactly what we may use.' },
          { icon: <Trash2 size={16} />, t: 'Deletable', d: 'Erase it all in one tap.' },
        ].map((x) => (
          <div key={x.t} className="rounded-xl border border-border bg-card p-3 text-center">
            <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-muted text-primary">{x.icon}</span>
            <p className="mt-1.5 text-xs font-semibold text-foreground">{x.t}</p>
            <p className="text-3xs text-muted-foreground leading-tight">{x.d}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">What may SwingVantage use?</p>
        <p className="text-xs text-muted-foreground">Wellness check-ins are on by default — everything else is opt-in.</p>
        <div className="mt-3 space-y-2">
          {ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            const on = permissions[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSetPermissions({ [cat]: !on } as Partial<HealthPermissions>)}
                className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/40"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    on ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}
                  aria-hidden="true"
                >
                  {on && <Check size={13} />}
                </span>
                <span className="min-w-0">
                  <span className="text-sm font-medium text-foreground">{meta.label}</span>
                  <span className="block text-xs text-muted-foreground leading-relaxed">{meta.why}</span>
                  <span className="block text-3xs text-muted-foreground mt-0.5">{meta.examples}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3">
        <input
          type="checkbox"
          checked={age18}
          onChange={(e) => setAge18(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span className="text-2xs text-muted-foreground leading-relaxed">
          I confirm I am <strong className="text-foreground">18 years or older</strong>. BodySync is
          for adults only.
        </span>
      </label>

      <label className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span className="text-2xs text-muted-foreground leading-relaxed">
          I understand {NON_MEDICAL_DISCLAIMER}
        </span>
      </label>

      <Button onClick={onConsent} disabled={!agreed || !age18} className="w-full" size="lg">
        Turn on BodySync
      </Button>
      <p className="text-center text-2xs text-muted-foreground">
        You can disconnect devices or delete all health data anytime from this screen.
      </p>
    </div>
  );
}
