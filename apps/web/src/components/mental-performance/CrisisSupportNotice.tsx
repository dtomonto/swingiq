import { LifeBuoy, Phone } from 'lucide-react';
import type { CrisisReferral } from '@/lib/mental-performance/types';

/**
 * Calm, supportive crisis / medical-redirect notice. Shown INSTEAD of coaching
 * when the safety screen flags input. Deliberately warm, not alarming — and it
 * never attempts to counsel; it routes to real help.
 */
export function CrisisSupportNotice({ referral }: { referral: CrisisReferral }) {
  if (!referral.flagged) return null;
  const urgent = referral.severity === 'urgent';
  return (
    <div
      role="alert"
      className={`rounded-2xl border p-5 ${
        urgent ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/40'
      }`}
    >
      <div className="flex items-center gap-2 text-foreground">
        <LifeBuoy size={20} aria-hidden="true" className="text-primary" />
        <h3 className="text-lg font-bold">{referral.heading}</h3>
      </div>
      <p className="mt-2 text-foreground/90">{referral.message}</p>
      <ul className="mt-4 space-y-3">
        {referral.resources.map((r) => (
          <li key={r.label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Phone size={15} aria-hidden="true" className="text-primary" />
              {r.label}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
            <p className="mt-1 text-sm font-medium text-primary">{r.contact}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        SwingVantage is a sport-performance tool and does not provide crisis or mental-health services.
      </p>
    </div>
  );
}
