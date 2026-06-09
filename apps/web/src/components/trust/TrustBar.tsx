import { Lock, ShieldCheck, Zap, UserX, EyeOff } from 'lucide-react';

const ITEMS = [
  { icon: UserX, label: 'No account required' },
  { icon: Zap, label: '100% free' },
  { icon: Lock, label: 'Private by default' },
  // True by default and with the recommended cookieless analytics (Plausible):
  // no third-party tracking cookies, so no consent banner is needed.
  { icon: EyeOff, label: 'No tracking cookies' },
  { icon: ShieldCheck, label: 'No credit card' },
];

/**
 * Compact, scannable row of trust signals. Place directly under a
 * primary CTA (homepage hero, upload flow, sport landing pages).
 */
export function TrustBar({ className = '' }: { className?: string }) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm ${className}`}
      aria-label="SwingVantage trust signals"
    >
      {ITEMS.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2">
          <Icon size={16} className="shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
