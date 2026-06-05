import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found | SwingVantage',
  description: 'The page you are looking for does not exist.',
  robots: 'noindex, nofollow',
};

const SPORT_LINKS = [
  { href: '/golf-swing-analysis', label: '⛳ Golf Swing Analysis' },
  { href: '/tennis-swing-analysis', label: '🎾 Tennis Swing Analysis' },
  { href: '/baseball-swing-analysis', label: '⚾ Baseball Swing Analysis' },
  { href: '/softball-swing-analysis', label: '🥎 Softball Swing Analysis' },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm">SQ</span>
          </div>
          <span className="text-foreground font-bold text-xl">SwingVantage</span>
        </Link>

        {/* Error */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xs mb-6">
          <p className="text-5xl font-black text-gray-200 mb-4">404</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground text-sm">
            This page doesn&apos;t exist or may have moved. Use the links below to get back on track.
          </p>
        </div>

        {/* Primary recovery */}
        <div className="space-y-3 mb-6">
          <Link
            href="/"
            className="block w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Go to SwingVantage Home
          </Link>
          <Link
            href="/dashboard"
            className="block w-full border border-border hover:border-primary/50 text-foreground font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Open My Dashboard
          </Link>
        </div>

        {/* Sport links */}
        <div className="bg-card border border-border rounded-xl p-5 text-left">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Swing Analysis by Sport
          </p>
          <ul className="space-y-2">
            {SPORT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-primary hover:text-primary hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer nav */}
        <nav className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Link href="/how-it-works" className="hover:text-muted-foreground">How It Works</Link>
          <Link href="/faq" className="hover:text-muted-foreground">FAQ</Link>
          <Link href="/updates" className="hover:text-muted-foreground">Updates</Link>
          <Link href="/privacy" className="hover:text-muted-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-muted-foreground">Terms</Link>
        </nav>
      </div>
    </div>
  );
}
