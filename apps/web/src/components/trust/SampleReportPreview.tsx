import Link from 'next/link';

/**
 * A static, illustrative preview of what a SwingVantage report looks
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
    <div className={`overflow-hidden rounded-2xl border border-border bg-card shadow-xs ${className}`}>
      <div className="flex items-center justify-between border-b border-border bg-muted px-5 py-3">
        <span className="text-sm font-bold text-foreground">Sample report</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          Example
        </span>
      </div>

      <div className="space-y-4 p-5">
        {/* Top priority issue */}
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <p className="text-2xs font-semibold uppercase tracking-wide text-warning-text">Top priority</p>
          <p className="mt-1 font-bold text-foreground">Out-to-in club path</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your path is producing a left-to-right ball flight (a slice). Fixing this first unlocks the
            most distance and accuracy.
          </p>
        </div>

        {/* Drills */}
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Your first 3 drills</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>1. Headcover gate drill (path correction)</li>
            <li>2. Split-hand release drill (face control)</li>
            <li>3. Slow-motion swing rehearsal (tempo)</li>
          </ul>
        </div>

        {/* Practice plan */}
        <div className="rounded-xl bg-muted p-4">
          <p className="text-sm font-semibold text-foreground">7-day practice plan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Short, focused sessions building from feel to full speed, with a retest at day 7.
          </p>
        </div>

        <p className="text-2xs italic text-muted-foreground">
          Illustrative example using sample data. Your actual report is based on your own swing and
          results are not guaranteed.
        </p>

        <Link
          href={href}
          className="block w-full rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Analyze My Swing Free
        </Link>
      </div>
    </div>
  );
}
