import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { StartHereFlow } from '@/components/onboarding/StartHereFlow';
import { ReferralCapture } from '@/components/referral/ReferralCapture';

export const metadata = buildMetadata({
  title: 'Start Here — Your First Swing Result in Minutes',
  description:
    'New to SwingVantage? Pick your sport and get your top thing to work on, three beginner-safe drills, and a 7-day plan. No account, free, private by default.',
  path: '/start',
  keywords: [
    'swing analysis getting started',
    'free swing diagnosis',
    'golf tennis baseball softball practice plan',
    'beginner swing drills',
  ],
});

export default function StartHerePage() {
  return (
    <main className="min-h-screen bg-muted">
      <ReferralCapture />
      <div className="mx-auto max-w-2xl px-4 pt-8">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Start Here', path: '/start' }]} />
      </div>
      <StartHereFlow />
    </main>
  );
}
