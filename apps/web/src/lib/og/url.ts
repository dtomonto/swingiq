// ============================================================
// SwingVantage — Open Graph card URL helper (pure, no JSX)
// ------------------------------------------------------------
// Kept separate from card.tsx so lib/seo/metadata (imported by every page) can
// build the card URL without pulling the Satori/JSX renderer into the bundle.
// ============================================================

export interface OgCardInput {
  /** Small accent line above the title (e.g. the group or sport). */
  eyebrow?: string;
  /** The headline. */
  title: string;
  /** One-line supporting text under the title. */
  subtitle?: string;
}

/**
 * Site-relative URL for the generic OG card route, for
 * `buildMetadata({ ogImage: ogCardUrl({ ... }) })`. Params are URL-encoded.
 */
export function ogCardUrl(input: OgCardInput): string {
  const p = new URLSearchParams();
  p.set('title', input.title);
  if (input.eyebrow) p.set('eyebrow', input.eyebrow);
  if (input.subtitle) p.set('subtitle', input.subtitle);
  return `/api/og/card?${p.toString()}`;
}
