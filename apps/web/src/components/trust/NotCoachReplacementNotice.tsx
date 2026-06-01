import { AlertTriangle } from 'lucide-react';

/**
 * Honest expectation-setting: SwingIQ supports, but does not
 * replace, qualified coaching or medical advice. Use on sport
 * pages, tool results, and report views.
 */
export function NotCoachReplacementNotice({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 ${className}`}
      role="note"
    >
      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-700" aria-hidden="true" />
      <p className="text-sm text-amber-900">
        <span className="font-semibold">SwingIQ supports your practice — it does not replace a coach.</span>{' '}
        Analysis is a heuristic estimate, not certified instruction or medical advice, and no specific
        result is guaranteed. For injury concerns or advanced technique work, work with a qualified
        professional.
      </p>
    </div>
  );
}
