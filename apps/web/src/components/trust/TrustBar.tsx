import { Lock, ShieldCheck, Zap, UserX } from 'lucide-react';

const ITEMS = [
  { icon: UserX, label: 'No account required' },
  { icon: Zap, label: '100% free' },
  { icon: Lock, label: 'Private by default' },
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
      aria-label="SwingIQ trust signals"
    >
      {ITEMS.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2">
          <Icon size={16} className="flex-shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
