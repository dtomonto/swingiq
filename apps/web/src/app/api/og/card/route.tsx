import { ImageResponse } from 'next/og';
import { renderOgCard, OG_SIZE } from '@/lib/og/card';

// Generic branded share card driven by query params, so any page can get a
// per-page Open Graph image via buildMetadata({ ogImage: '/api/og/card?...' }):
//   /api/og/card?title=Golf%20Swing%20Analysis&eyebrow=Golf&subtitle=...
// Public (middleware PUBLIC_PREFIXES). Inputs are length-clamped in renderOgCard.
export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'SwingVantage';
  const eyebrow = searchParams.get('eyebrow') || undefined;
  const subtitle = searchParams.get('subtitle') || undefined;
  return new ImageResponse(renderOgCard({ eyebrow, title, subtitle }), OG_SIZE);
}
