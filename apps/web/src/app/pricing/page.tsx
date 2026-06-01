import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Pricing | SwingIQ — Free AI Swing Analysis',
  description: 'SwingIQ is free to use. Analyze your swing, get personalized drills, and track progress at no cost.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-card">
      <div className="bg-primary text-primary-foreground py-16 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Simple, Honest Pricing</h1>
        <p className="text-primary-foreground/90 text-lg">Start free. No credit card required.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">

          {/* Free */}
          <div className="border-2 border-primary rounded-2xl p-8 text-center shadow-lg">
            <div className="text-primary font-bold text-sm uppercase tracking-wide mb-2">Free</div>
            <div className="text-5xl font-bold text-foreground mb-1">$0</div>
            <div className="text-muted-foreground text-sm mb-6">Forever free</div>
            <ul className="text-sm text-foreground space-y-2 text-left mb-8">
              {[
                'All 5 sports (golf, tennis, baseball, softball)',
                'AI swing analysis',
                'Diagnostic engine — priority issue detection',
                'Drill recommendations with YouTube search links',
                'Session history',
                'Progress tracking',
                'Data backup & restore',
                'Golf bag loft autofill',
                'Professional reference library (browse)',
                'Side-by-side swing comparison',
                'Local data storage (no account needed)',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="block w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3 rounded-xl transition-colors text-center">
              Start Free
            </Link>
          </div>

          {/* Pro — Coming Soon */}
          <div className="border border-border rounded-2xl p-8 text-center bg-muted">
            <div className="text-muted-foreground font-bold text-sm uppercase tracking-wide mb-2">Pro</div>
            <div className="text-3xl font-bold text-muted-foreground mb-1">Coming Soon</div>
            <div className="text-muted-foreground text-sm mb-6">Planned for future release</div>
            <ul className="text-sm text-muted-foreground space-y-2 text-left mb-8">
              {[
                'Everything in Free',
                'Cloud sync across devices',
                'Video storage & history',
                'OCR/image data extraction',
                'Verified professional swing library',
                'AI narrative coaching (unlimited)',
                'PDF reports',
                'Coach sharing',
                'Priority support',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 shrink-0">○</span>
                  {f}
                </li>
              ))}
            </ul>
            <button disabled className="w-full bg-muted text-muted-foreground font-semibold py-3 rounded-xl cursor-not-allowed">
              Coming Soon
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-12">
          Have questions? Contact us at{' '}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-primary font-semibold hover:underline">
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
