import type { Metadata } from 'next';
import { AcademyNav } from '@/components/academy/AcademyNav';
import { AcademyToaster } from '@/components/academy/AcademyToaster';

export const metadata: Metadata = {
  title: 'SwingVantage Academy',
  robots: 'noindex, nofollow',
};

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AcademyNav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <AcademyToaster />
    </div>
  );
}
