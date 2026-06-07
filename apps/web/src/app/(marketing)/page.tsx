import { buildMetadata } from '@/lib/seo/metadata';
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
    'Upload a swing video or import launch monitor data. Get a free AI-powered breakdown of your top swing fault, personalized drills, and a practice plan. Supports golf, tennis, baseball, and softball.',
  path: '/',
  keywords: ['swing analysis', 'golf swing', 'tennis swing', 'baseball swing', 'softball hitting', 'AI coaching', 'launch monitor', 'swing improvement'],
});

export default function HomePage() {
  return <LocalizedHome locale="en" />;
}
