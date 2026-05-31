import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SwingIQ — AI Swing Performance Platform',
  description:
    'AI-powered swing analysis for golf, tennis, baseball, and softball. Upload a video or import launch monitor data to identify your top swing fault, get personalized drills, and track improvement.',
  keywords: [
    'swing analysis',
    'AI swing coach',
    'golf swing analysis',
    'tennis swing analysis',
    'baseball swing analysis',
    'softball swing analysis',
    'launch monitor',
    'swing improvement',
    'golf training',
  ],
  metadataBase: new URL('https://swingiq.app'),
  openGraph: {
    title: 'SwingIQ — AI Swing Performance Platform',
    description:
      'Upload a swing video or import launch monitor data. Get a free AI diagnosis, personalized drills, and a practice plan — golf, tennis, baseball, and softball.',
    type: 'website',
    url: 'https://swingiq.app',
  },
  // PWA / installability hints
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'SwingIQ',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1a3a2a',
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
