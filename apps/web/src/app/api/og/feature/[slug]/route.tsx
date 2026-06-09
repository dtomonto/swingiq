import { ImageResponse } from 'next/og';
import { getFeature } from '@/content/features';
import { renderOgCard, OG_SIZE } from '@/lib/og/card';

// Per-feature social share card (1200×630). Public (middleware PUBLIC_PREFIXES)
// so social crawlers can fetch it without a session. Design lives in lib/og/card.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = getFeature(slug);
  return new ImageResponse(
    renderOgCard({
      eyebrow: feature?.group ?? 'AI Swing Analysis',
      title: feature?.name ?? 'SwingVantage',
      subtitle: feature?.summary ?? 'Free AI swing analysis for every sport.',
    }),
    OG_SIZE,
  );
}
