import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { BILLING_TIERS } from '@/lib/billing/tiers';
import { PricingCTA } from './PricingCTA';

export const metadata: Metadata = {
  title: 'Pricing | SwingIQ — Free AI Swing Analysis',
  description:
    'SwingIQ is free to use — analyze your swing, get personalized drills, and track progress at no cost. Pro and Team plans add cloud sync, video storage, and coach tools.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-card">
      <div className="bg-primary text-primary-foreground py-16 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Simple, Honest Pricing</h1>
        <p className="text-primary-foreground/90 text-lg">Start free. No credit card required.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {BILLING_TIERS.map((tier) => {
            const isFree = tier.id === 'free';
            return (
              <div
                key={tier.id}
                className={`rounded-2xl p-8 flex flex-col ${
                  tier.popular ? 'border-2 border-primary shadow-lg' : 'border border-border bg-muted'
                }`}
              >
                <div className="text-center">
                  {tier.popular && (
                    <div className="inline-block mb-3 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Most popular
                    </div>
                  )}
                  <div className="text-primary font-bold text-sm uppercase tracking-wide mb-2">{tier.name}</div>
                  <div className="text-foreground mb-1">
                    {isFree ? (
                      <span className="text-5xl font-bold">$0</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">${tier.priceMonthly}</span>
                        <span className="text-muted-foreground text-base">/mo</span>
                      </>
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm mb-6">{tier.tagline}</div>
                </div>

                <ul className="text-sm text-foreground space-y-2 text-left mb-8 grow">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {isFree ? (
                  <Link
                    href="/dashboard"
                    className="block w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3 rounded-xl transition-colors text-center"
                  >
                    Start Free
                  </Link>
                ) : (
                  <PricingCTA tier={tier} />
                )}
              </div>
            );
          })}
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
