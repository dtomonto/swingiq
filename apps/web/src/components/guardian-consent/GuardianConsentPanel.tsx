'use client';

// ============================================================
// SwingVantage — Guardian Consent Panel
// ------------------------------------------------------------
// The youth-safety workflow: a parent/guardian picks the athlete's age band
// and, for a minor, records consent — affirming they're the guardian, that
// SwingVantage gives practice guidance (not medical advice), and that they'll
// supervise. Honest-first: disclaimers are kept (as affirmations), the record
// is dated + versioned, and the guardian can withdraw it at any time.
// ============================================================
import { useState, type ReactNode } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useGuardianConsent,
  consentRequirementFor,
  consentGaps,
  emptyConsent,
  CONSENT_TERMS_VERSION,
  type AgeBand,
  type GuardianConsentRecord,
} from '@/lib/guardian-consent';

const AGE_OPTIONS: { value: AgeBand; label: string }[] = [
  { value: '18_plus', label: '18 or older' },
  { value: '13_17', label: '13–17 (young athlete)' },
  { value: 'under_13', label: 'Under 13' },
];

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded-sm border-border text-primary"
      />
      <span className="leading-snug">{children}</span>
    </label>
  );
}

function ConsentForm({
  initial,
  savedRecord,
  onSave,
  onClear,
}: {
  initial: GuardianConsentRecord;
  savedRecord: GuardianConsentRecord | null;
  onSave: (r: GuardianConsentRecord) => void;
  onClear: () => void;
}) {
  const [ageBand, setAgeBand] = useState<AgeBand>(initial.ageBand === 'unknown' ? '18_plus' : initial.ageBand);
  const [guardianName, setGuardianName] = useState(initial.guardianName);
  const [guardianEmail, setGuardianEmail] = useState(initial.guardianEmail);
  const [guardianAffirmed, setGuardianAffirmed] = useState(initial.guardianAffirmed);
  const [acknowledgedNotMedical, setAcknowledgedNotMedical] = useState(initial.acknowledgedNotMedical);
  const [agreesToSupervise, setAgreesToSupervise] = useState(initial.agreesToSupervise);
  const [injuryLimitations, setInjuryLimitations] = useState(initial.injuryLimitations);
  const [justSaved, setJustSaved] = useState(false);

  const req = consentRequirementFor(ageBand);
  const draft: GuardianConsentRecord = {
    version: 1,
    ageBand,
    guardianAffirmed,
    guardianName,
    guardianEmail,
    acknowledgedNotMedical,
    agreesToSupervise,
    injuryLimitations,
    consentedAt: null,
    termsVersion: CONSENT_TERMS_VERSION,
  };
  const gaps = consentGaps(draft, ageBand);
  const recorded = Boolean(savedRecord?.consentedAt) && savedRecord?.ageBand === ageBand;

  const inputClass =
    'w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-hidden bg-card text-foreground';

  const handleSave = () => {
    onSave({ ...draft, consentedAt: new Date().toISOString() });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground block mb-1">Who is the athlete using this account?</label>
        <select
          value={ageBand}
          onChange={(e) => setAgeBand(e.target.value as AgeBand)}
          className={inputClass}
        >
          {AGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {!req.required ? (
        <p className="text-sm text-muted-foreground">
          No guardian consent is needed for an adult athlete. If a young athlete will use this
          account, choose their age above and a parent or guardian can record consent here.
        </p>
      ) : (
        <>
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{req.reason}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Parent / guardian name</label>
            <input
              type="text"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              className={inputClass}
              placeholder="Your full name"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Parent / guardian email{req.needsGuardianEmail ? '' : ' (optional)'}
            </label>
            <input
              type="email"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Check checked={guardianAffirmed} onChange={setGuardianAffirmed}>
              I am this athlete&apos;s parent or legal guardian, and I&apos;m setting up and managing this account.
            </Check>
            <Check checked={acknowledgedNotMedical} onChange={setAcknowledgedNotMedical}>
              I understand SwingVantage gives practice guidance and educational feedback — not medical
              advice — and does not guarantee performance outcomes.
            </Check>
            <Check checked={agreesToSupervise} onChange={setAgreesToSupervise}>
              I&apos;ll supervise practice in an age-appropriate way and keep it safe and fun.
            </Check>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Any injuries or physical limitations to keep in mind? (optional)
            </label>
            <textarea
              value={injuryLimitations}
              onChange={(e) => setInjuryLimitations(e.target.value)}
              className={`${inputClass} min-h-[64px]`}
              placeholder="e.g. recovering from a wrist injury — avoid high-rep drills"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} disabled={gaps.length > 0}>
              <ShieldCheck className="w-4 h-4" />
              {recorded ? 'Update consent' : 'Record consent'}
            </Button>
            {justSaved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            )}
            {recorded && (
              <Button variant="ghost" className="text-error hover:bg-error/10" onClick={onClear}>
                Withdraw
              </Button>
            )}
          </div>

          {gaps.length > 0 && (
            <p className="text-xs text-muted-foreground">Still needed: {gaps.join(', ')}.</p>
          )}

          {recorded && savedRecord?.consentedAt && (
            <p className="text-xs text-muted-foreground">
              Consent recorded {new Date(savedRecord.consentedAt).toLocaleDateString()} by{' '}
              <span className="font-medium text-foreground">{savedRecord.guardianName}</span>. You can
              update or withdraw it anytime.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function GuardianConsentPanel() {
  const { ready, record, defaultAgeBand, save, clear } = useGuardianConsent();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Youth athlete &amp; guardian consent
          </span>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-xs text-muted-foreground mb-4">
          If a young athlete uses SwingVantage, a parent or guardian records consent here. It&apos;s
          kept with your private settings and you can withdraw it anytime.
        </p>
        {!ready ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ConsentForm
            key={record?.consentedAt ?? `new-${defaultAgeBand}`}
            initial={record ?? emptyConsent(defaultAgeBand)}
            savedRecord={record}
            onSave={save}
            onClear={clear}
          />
        )}
      </CardBody>
    </Card>
  );
}
