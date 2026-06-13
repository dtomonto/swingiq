/**
 * Editorial responsibility line for authority/educational content: who stands
 * behind the page, when it was last reviewed, and how long it takes to read.
 * Builds E-E-A-T signals for search and AI engines without inventing author
 * credentials we cannot substantiate.
 */
export function EditorialMeta({
  lastReviewed,
  readingTime,
  author = 'SwingVantage Editorial',
  className = '',
}: {
  /** Human-readable date, e.g. "June 13, 2026". */
  lastReviewed: string;
  /** e.g. "7 min read". */
  readingTime?: string;
  author?: string;
  className?: string;
}) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground ${className}`}>
      <span>
        By <span className="font-medium text-foreground">{author}</span>
      </span>
      <span aria-hidden="true">·</span>
      <span>Last reviewed {lastReviewed}</span>
      {readingTime && (
        <>
          <span aria-hidden="true">·</span>
          <span>{readingTime}</span>
        </>
      )}
    </p>
  );
}
