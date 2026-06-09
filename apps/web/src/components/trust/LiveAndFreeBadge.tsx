/**
 * Small inline badge signalling the product is live and free.
 * Use near headlines and CTAs.
 */
export function LiveAndFreeBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/15 px-3 py-1 text-xs font-semibold text-primary-foreground ${className}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      Live now · Free to use
    </span>
  );
}
