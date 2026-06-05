import { Sparkles } from 'lucide-react';

/**
 * Confident expectation-setting. SwingVantage is the everyday improvement
 * edge: data-backed guidance you can act on now. We still name what it
 * is (a smart estimate that sharpens with more data) and that it pairs
 * with a coach for injury/advanced work — but framed as a strength, not
 * a warning. Use on sport pages, tool results, and report views.
 */
export function NotCoachReplacementNotice({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 ${className}`}
      role="note"
    >
      <Sparkles size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
      <p className="text-sm text-foreground">
        <span className="font-semibold">Your swing, decoded — coaching in your pocket.</span>{' '}
        SwingVantage reads your data and hands you the one fix that matters most, with confident,
        data-backed guidance you can use today. Findings are heuristic estimates — smart reads
        that sharpen with every swing you add — and they pair perfectly with a coach for injury
        concerns or advanced technique work, so you show up to those sessions already ahead.
      </p>
    </div>
  );
}
