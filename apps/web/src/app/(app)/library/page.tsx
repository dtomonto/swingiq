import type { Metadata } from 'next';
import { getLibraryItems, getLibraryStats } from '@/lib/library';
import { LibraryBrowser } from '@/components/library';

export const metadata: Metadata = {
  title: 'Video Library · SwingVantage',
  description:
    'The SwingVantage video library: short walkthroughs for every feature, plus training videos on swing path, using a launch monitor, drills, coaching, and film study.',
};

export default function LibraryPage() {
  const items = getLibraryItems();
  return <LibraryBrowser items={items} stats={getLibraryStats(items)} />;
}
