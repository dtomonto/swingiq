import { CheckCircle2 } from 'lucide-react';
import type { LeadSource } from '@/lib/email/capture';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGraph, serviceSchema } from '@/lib/seo/jsonLd';
import { EmailCapture } from '@/components/email/EmailCapture';
import { PrivacyAssuranceBlock } from '@/components/trust/PrivacyAssuranceBlock';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
import { BenefitGrid } from '@/components/marketing/BenefitGrid';
import { CtaLink } from '@/components/marketing/CtaLink';

export interface AudienceConfig {
  slug: string;
  name: string;
  leadSource: LeadSource;
  headline: string;
  positioning: string;
  benefits: { title: string; desc: string }[];
  how: string[];
  ctaLabel: string;
  captureHeading: string;
  captureSub: string;
  showCoachNotice?: boolean;
}

export function AudienceLanding({ config }: { config: AudienceConfig }) {
  return (
    <main className="min-h-screen bg-card">
      <section className="bg-primary px-4 py-16 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs
            items={[{ name: 'Home', path: '/' }, { name: config.name, path: `/${config.slug}` }]}
            className="mb-4 **:text-primary-foreground/90!"
          />
          <h1 className="text-3xl font-bold md:text-4xl">{config.headline}</h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/90">{config.positioning}</p>
          <CtaLink href="#get-started" variant="inverse" className="mt-6">
            {config.ctaLabel}
          </CtaLink>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <BenefitGrid items={config.benefits} />
        </div>
      </section>

      <section className="bg-muted px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground">How it works</h2>
          <ol className="mt-5 space-y-3">
            {config.how.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                <span className="text-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <PrivacyAssuranceBlock />
            <ul className="space-y-2">
              {['No cost to start', 'Web-based — nothing to install', 'Privacy-first, youth-safe by default', 'Works alongside your existing coaching'].map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          {config.showCoachNotice !== false && <NotCoachReplacementNotice />}
        </div>
      </section>

      <section id="get-started" className="scroll-mt-16 bg-primary px-4 py-14 text-primary-foreground">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-bold">{config.ctaLabel}</h2>
          <p className="mt-2 text-primary-foreground/90">{config.captureSub}</p>
          <div className="mt-6 text-left">
            <EmailCapture source={config.leadSource} heading={config.captureHeading} subheading="We'll be in touch. No spam." />
          </div>
          <p className="mt-4 text-sm text-primary-foreground/90">
            Prefer email? <a href="mailto:support@swingvantage.com" className="underline">support@swingvantage.com</a>
          </p>
        </div>
      </section>

      <JsonLd data={buildGraph(serviceSchema({ name: `SwingVantage for ${config.name}`, description: config.positioning }))} />
    </main>
  );
}
