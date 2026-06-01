import { CheckCircle2 } from 'lucide-react';

const TIPS = [
  'A clear side-on or face-on view of a single swing works best.',
  'You do not need special equipment — a phone video is fine.',
  'Only upload videos of yourself, or others who have given consent.',
  'For young athletes, a parent or guardian should help with the upload.',
];

/**
 * Compact "how to upload safely + what we need" helper. Place
 * inside the upload flow to reduce friction and build confidence.
 */
export function SafeUploadExplainer({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-green-200 bg-green-50 p-6 ${className}`}>
      <h3 className="mb-3 text-base font-bold text-gray-900">Before you upload</h3>
      <ul className="space-y-2">
        {TIPS.map((tip) => (
          <li key={tip} className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-green-600" aria-hidden="true" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
