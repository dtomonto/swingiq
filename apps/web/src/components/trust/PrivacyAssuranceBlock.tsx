import Link from 'next/link';
import { Lock, Trash2, Download, EyeOff } from 'lucide-react';

const POINTS = [
  { icon: Lock, text: 'Your data is stored locally in your browser by default — not on a remote server.' },
  { icon: EyeOff, text: 'Swing videos are analyzed in your browser and are not shared publicly by default.' },
  { icon: Download, text: 'You can export everything SwingIQ knows about you at any time.' },
  { icon: Trash2, text: 'You can delete any record — or everything — instantly from Settings.' },
];

/**
 * Reassures users about data handling. Place near upload/analyze
 * flows and on sport/parent/coach landing pages.
 */
export function PrivacyAssuranceBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 ${className}`}>
      <h3 className="mb-4 text-base font-bold text-foreground">Your data stays yours</h3>
      <ul className="space-y-3">
        {POINTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm text-muted-foreground">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <Icon size={15} className="text-success" aria-hidden="true" />
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <Link href="/trust" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        Read how SwingIQ protects you →
      </Link>
    </div>
  );
}
