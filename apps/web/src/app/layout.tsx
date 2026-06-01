import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Analytics } from '@/components/analytics/Analytics';

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

// Pre-paint theme bootstrap: applies the persisted curated theme to <html>
// before React hydrates so there is no flash of the default theme. Kept in
// sync with lib/theme/themes (theme ids) and ThemeApplicator.
const THEME_BOOTSTRAP = `(function(){try{var ids=['standard','dark-performance','coach-mode','heritage-club','field-court','arcade-practice','bird-print'];var t='standard';var raw=localStorage.getItem('swingiq-store');if(raw){var s=JSON.parse(raw);var c=s&&s.state&&s.state.settings&&s.state.settings.colorTheme;if(ids.indexOf(c)!==-1){t=c;}}var el=document.documentElement;el.setAttribute('data-theme',t);if(t==='dark-performance'){el.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="standard">
      <head>
        {/* Trusted, developer-authored static constant (THEME_BOOTSTRAP) with no
            user input — not an XSS sink; safe to inline. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background min-h-screen`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
