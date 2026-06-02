import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SwingIQ Blog | Swing Tips, Analysis Guides & Training Advice',
  description:
    'Free guides and tips on golf swing analysis, tennis technique, baseball hitting, and softball swing mechanics. Powered by SwingIQ\'s AI coaching platform.',
  alternates: { canonical: '/blog' },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
