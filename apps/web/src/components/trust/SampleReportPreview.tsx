import Link from 'next/link';

/**
 * A static, illustrative preview of what a SwingIQ report looks
 * like. Uses clearly-labeled example data — not a real user's
 * results and not a guaranteed outcome. Place near CTAs so users
 * know what they'll get before they start.
 */
export function SampleReportPreview({
  className = '',
  href = '/dashboard',
}: {
  className?: string;
  href?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
        <span className="text-sm font-bold text-gray-900">Sample report</span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
          Example
        </span>
      </div>

      <div className="space-y-4 p-5">
        {/* Top priority issue */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Top priority</p>
          <p className="mt-1 font-bold text-gray-900">Out-to-in club path</p>
          <p className="mt-1 text-sm text-gray-600">
            Your path is producing a left-to-right ball flight (a slice). Fixing this first unlocks the
            most distance and accuracy.
          </p>
        </div>

        {/* Drills */}
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">Your first 3 drills</p>
          <ul className="space-y-1.5 text-sm text-gray-600">
            <li>1. Headcover gate drill (path correction)</li>
            <li>2. Split-hand release drill (face control)</li>
            <li>3. Slow-motion swing rehearsal (tempo)</li>
          </ul>
        </div>

        {/* Practice plan */}
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">7-day practice plan</p>
          <p className="mt-1 text-sm text-gray-600">
            Short, focused sessions building from feel to full speed, with a retest at day 7.
          </p>
        </div>

        <p className="text-[11px] italic text-gray-400">
          Illustrative example using sample data. Your actual report is based on your own swing and
          results are not guaranteed.
        </p>

        <Link
          href={href}
          className="block w-full rounded-xl bg-green-600 py-3 text-center font-semibold text-white transition-colors hover:bg-green-700"
        >
          Analyze My Swing Free
        </Link>
      </div>
    </div>
  );
}
