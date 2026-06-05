import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SwingVantage Community — Performance Network for Athletes',
  description:
    'Join the SwingVantage Community. Track your sports performance, earn achievement badges, compete in challenges, and protect your training history with exportable backups.',
  keywords: [
    'golf community', 'sports performance tracking', 'swing analysis challenges',
    'athlete progress tracking', 'sports data backup', 'improvement leaderboard',
    'golf improvement', 'tennis tracking', 'baseball analytics', 'softball performance',
  ],
  openGraph: {
    title: 'SwingVantage Community — Performance Network for Athletes',
    description: 'Turn session data into streaks, badges, challenges, and lasting progress. Export your data to protect your training history.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
