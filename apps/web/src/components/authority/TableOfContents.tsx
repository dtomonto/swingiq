/**
 * Lightweight on-page table of contents. Pure anchor links to the section ids
 * used by <AuthoritySection>. Server-rendered (crawlable, no JS) and hidden on
 * the smallest screens where it adds clutter rather than orientation.
 */
export function TableOfContents({
  items,
  label = 'On this page',
}: {
  items: { id: string; label: string }[];
  label?: string;
}) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label={label}
      className="mt-6 rounded-xl border border-border bg-card/60 p-4 text-sm sm:hidden md:block"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 md:block md:space-y-1.5">
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className="text-primary hover:underline">
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
