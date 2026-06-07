import Link from 'next/link';

const FOOTER_COLUMNS = [
  {
    heading: 'Sports',
    links: [
      { label: 'Golf', href: '/golf-swing-analysis' },
      { label: 'Tennis', href: '/tennis-swing-analysis' },
      { label: 'Pickleball', href: '/pickleball' },
      { label: 'Padel', href: '/padel' },
      { label: 'Baseball', href: '/baseball-swing-analysis' },
      { label: 'Softball', href: '/softball-swing-analysis' },
    ],
  },
  {
    heading: 'Learn',
    links: [
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Methodology', href: '/methodology' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Glossary', href: '/glossary' },
      { label: 'Benchmarks', href: '/benchmarks' },
      { label: 'Blog', href: '/blog' },
      { label: 'Updates', href: '/updates' },
      { label: 'Developer Updates', href: '/dev-updates' },
    ],
  },
  {
    heading: 'Free Tools',
    links: [
      { label: 'All Free Tools', href: '/tools' },
      { label: 'Golf Slice Fixer', href: '/tools/golf-slice-fixer' },
      { label: 'Swing Mistake Quiz', href: '/tools/swing-mistake-quiz' },
      { label: 'Practice Plan Generator', href: '/tools/practice-plan-generator' },
      { label: 'Challenges', href: '/challenges' },
    ],
  },
  {
    heading: 'For You',
    links: [
      { label: 'Parents', href: '/parents' },
      { label: 'Coaches', href: '/coaches' },
      { label: 'Teams', href: '/teams' },
      { label: 'Creators', href: '/creators' },
      { label: 'Facilities & Partners', href: '/partners' },
    ],
  },
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Sign Up Free', href: '/signup' },
      { label: 'Sample Report', href: '/sample-report' },
    ],
  },
  {
    heading: 'Trust',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Trust & Safety', href: '/trust' },
      { label: 'Vulnerability Disclosure', href: '/vulnerability-disclosure' },
    ],
  },
];

interface PublicFooterProps {
  className?: string;
}

export function PublicFooter({ className }: PublicFooterProps) {
  return (
    <footer
      className={`bg-secondary text-muted-foreground pt-12 pb-8 px-4 ${className ?? ''}`}
      aria-label="Site footer"
    >
      <div className="max-w-5xl mx-auto">
        {/* Logo + tagline */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm" aria-hidden="true">SV</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg">SwingVantage</span>
            <p className="text-muted-foreground text-xs">AI Swing Analysis — Golf, Tennis, Baseball &amp; Softball</p>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-10">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-white text-sm font-semibold mb-3">{col.heading}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* AI disclaimer + copyright */}
        <div className="border-t border-gray-800 pt-6 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
            <strong className="text-muted-foreground">AI Disclaimer:</strong> SwingVantage&apos;s AI coaching helps
            identify swing patterns and prioritize practice. It is not a substitute for a qualified
            professional coach. SwingVantage is not a medical device — consult a sports medicine professional
            if you experience pain.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} SwingVantage. All rights reserved.</span>
            <span>Your data is private to you. We do not sell your personal information.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
