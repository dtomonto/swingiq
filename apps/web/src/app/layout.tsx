import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SwingIQ — Golf Performance System',
  description: 'Turn launch-monitor data into a complete player development system. Diagnose swing patterns, get training routines, and track improvement.',
  keywords: ['golf', 'launch monitor', 'swing analysis', 'golf training', 'golf performance'],
  openGraph: {
    title: 'SwingIQ — Golf Performance System',
    description: 'Turn launch-monitor data into actionable insights and training routines.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
