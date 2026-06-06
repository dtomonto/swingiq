'use client';

// ============================================================
// Recruiting — GuardianConsentPanel
// ------------------------------------------------------------
// For minors, a guardian gate sits in front of public exposure and
// outreach. Until consent is granted, the app keeps the profile
// private-by-default and blocks outreach approval. Consent is granular
// (public profile / outreach / contact display) and recorded in the
// audit log.
// ============================================================

import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useRecruitingStore, isMinor } from '@/lib/recruiting';

const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';

export function GuardianConsentPanel() {
  const profile = useRecruitingStore((s) => s.profile);
  const consent = useRecruitingStore((s) => s.guardianConsent);
  const setConsent = useRecruitingStore((s) => s.setGuardianConsent);

  const minor = isMinor(profile?.dateOfBirth);

  if (!minor) {
    return (
      <Card>
        <CardBody className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck size={16} className="text-success" />
          Adult athlete — guardian consent isn&apos;t required. (Add a date of birth in your profile to enable minor protections.)
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2"><ShieldAlert size={17} className="text-warning" /> Guardian consent (minor athlete)</CardTitle>
        <Badge variant={consent.granted ? 'success' : 'warning'}>{consent.granted ? 'On file' : 'Required'}</Badge>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Because this athlete is under 18, a parent or guardian controls what becomes public and whether outreach can be sent.
          Until consent is granted, the profile stays private and outreach can&apos;t be approved.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="text-sm font-medium text-foreground">Guardian name</span>
            <input className={inputCls} value={consent.guardianName ?? ''} onChange={(e) => setConsent({ guardianName: e.target.value })} />
          </label>
          <label className="block"><span className="text-sm font-medium text-foreground">Guardian email</span>
            <input type="email" className={inputCls} value={consent.guardianEmail ?? ''} onChange={(e) => setConsent({ guardianEmail: e.target.value })} />
          </label>
        </div>

        <div className="space-y-2">
          {([
            ['allowPublicProfile', 'Allow a public/shared recruiting profile'],
            ['allowOutreach', 'Allow outreach messages to coaches'],
            ['allowContactDisplay', 'Allow athlete contact info to appear on shared links'],
          ] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={consent[k]} onChange={(e) => setConsent({ [k]: e.target.checked })} />
              {label}
            </label>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-foreground border-t border-border pt-3">
          <input type="checkbox" checked={consent.granted} onChange={(e) => setConsent({ granted: e.target.checked })} />
          I am the parent/guardian and I grant the consent selected above.
        </label>
      </CardBody>
    </Card>
  );
}
