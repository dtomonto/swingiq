import type { Metadata } from 'next';
import { AthleticJourneyDashboard } from '@/components/athletic-journey/AthleticJourneyDashboard';

export const metadata: Metadata = {
  title: 'Athletic Journey | SwingVantage',
  description:
    'Your personalized athletic roadmap from beginner to professional-level performance. The ' +
    'Athletic Journey Engine classifies your stage from a blend of your profile, ratings, videos, ' +
    'logged play, and practice — explains the evidence for and against, shows what to improve next, ' +
    'and builds a weekly plan. Golf, Tennis, Pickleball, and Padel are live now; Baseball and Softball are in development.',
};

export default function AthleticJourneyPage() {
  return <AthleticJourneyDashboard />;
}
