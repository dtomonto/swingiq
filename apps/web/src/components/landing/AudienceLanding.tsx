import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { LeadSource } from '@/lib/email/capture';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGraph, serviceSchema } from '@/lib/seo/jsonLd';
import { EmailCapture } from '@/components/email/EmailCapture';
import { PrivacyAssuranceBlock } from '@/components/trust/PrivacyAssuranceBlock';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';

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
    <main className="min-h-screen bg-white">
      <section className="bg-[#1a3a2a] px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs
            items={[{ name: 'Home', path: '/' }, { name: config.name, path: `/${config.slug}` }]}
            className="mb-4 [&_*]:!text-green-200"
          />
          <h1 className="text-3xl font-bold md:text-4xl">{config.headline}</h1>
          <p className="mt-4 max-w-2xl text-lg text-green-100">{config.positioning}</p>
          <Link href="#get-started" className="mt-6 inline-block rounded-xl bg-green-500 px-7 py-3 font-bold text-white transition-colors hover:bg-green-400">
            {config.ctaLabel}
          </Link>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {config.benefits.map((b) => (
              <div key={b.title} className="rounded-2xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900">{b.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">How it works</h2>
          <ol className="mt-5 space-y-3">
            {config.how.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">{i + 1}</span>
                <span className="text-gray-700">{step}</span>
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
                <li key={p} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-green-600" aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          {config.showCoachNotice !== false && <NotCoachReplacementNotice />}
        </div>
      </section>

      <section id="get-started" className="scroll-mt-16 bg-[#1a3a2a] px-4 py-14 text-white">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-bold">{config.ctaLabel}</h2>
          <p className="mt-2 text-green-100">{config.captureSub}</p>
          <div className="mt-6 text-left">
            <EmailCapture source={config.leadSource} heading={config.captureHeading} subheading="We'll be in touch. No spam." />
          </div>
          <p className="mt-4 text-sm text-green-200">
            Prefer email? <a href="mailto:support@swingiq.app" className="underline">support@swingiq.app</a>
          </p>
        </div>
      </section>

      <JsonLd data={buildGraph(serviceSchema({ name: `SwingIQ for ${config.name}`, description: config.positioning }))} />
    </main>
  );
}
