import type { Metadata } from 'next';

// Athlete recruiting profiles must never be indexed — they are private,
// shared by link only. noindex/nofollow on the whole /player/* surface.
export const metadata: Metadata = {
  title: 'Recruiting Profile · SwingVantage',
  robots: { index: false, follow: false, nocache: true },
};

export default function PlayerPublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
