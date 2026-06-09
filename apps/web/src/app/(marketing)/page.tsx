import { buildMetadata } from '@/lib/seo/metadata';
import { ogCardUrl } from '@/lib/og/url';
import { LocalizedHome } from '@/components/marketing/LocalizedHome';

// Single source of truth: the English homepage renders from the marketing
// dictionary via the same component as /es and /fr (at locale="en"), so the
// English copy and its translations can't drift. English-only interactive
// sections (persona cards, theme strip, sample-report preview, proof, trust)
// render inside LocalizedHome only for locale="en". Edit copy in
// content/marketing/i18n/en.json (then `npm run i18n:bless`).
export const metadata = buildMetadata({
  title: 'SwingVantage — Free AI Swing Analysis for Golf, Tennis, Baseball & Softball',
  description:
    'Upload a swing video or import launch monitor data for a free AI breakdown of your top fault, personalized drills, and a practice plan — golf, tennis, baseball & softball.',
  path: '/',
  keywords: ['swing analysis', 'golf swing', 'tennis swing', 'baseball swing', 'softball hitting', 'AI coaching', 'launch monitor', 'swing improvement'],
  ogImage: ogCardUrl({
    eyebrow: 'Free AI swing analysis',
    title: 'Find the one fix holding your swing back',
    subtitle: 'Upload a video or launch-monitor data — golf, tennis, baseball, softball & more.',
  }),
});

export default function HomePage() {
  return <LocalizedHome locale="en" />;
}
