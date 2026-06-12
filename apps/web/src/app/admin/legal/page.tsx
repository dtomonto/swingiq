// ============================================================
// /admin/legal — legal, privacy & compliance
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';

export const metadata: Metadata = { title: 'Legal & Privacy | Admin', robots: 'noindex, nofollow' };

const POLICIES = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Trust & Safety', href: '/trust' },
  { label: 'Vulnerability Disclosure', href: '/vulnerability-disclosure' },
  { label: 'Contact', href: '/contact' },
];

export default function AdminLegalPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Legal & Privacy"
        icon={Scale}
        description="The policies, disclaimers and data-rights workflows that keep SwingVantage compliant and honest with users."
      />

      <SectionCard title="Published policies" description="Live legal pages on the site.">
        <ul className="divide-y divide-border">
          {POLICIES.map((p) => (
            <li key={p.href} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
              <span className="text-sm text-foreground">{p.label}</span>
              <a href={p.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-link hover:underline">
                View <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Data rights workflows">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="text-foreground">Data export</span> — available now from any{' '}
            <Link href="/admin/users" className="text-link hover:underline">user&apos;s detail page</Link>{' '}
            (downloads a JSON copy; audit-logged).
          </li>
          <li>
            <span className="text-foreground">Account suspension</span> — reversible, on the user detail page.
          </li>
          <li>
            <span className="text-foreground">Data deletion</span> — accounts cascade-delete their data via
            database rules when removed; a self-serve admin delete action can be added with a confirmation +
            audit (kept manual for now to avoid accidents).
          </li>
          <li>
            <span className="text-foreground">Consent</span> — usage category (adult / parent / coach / minor) is
            captured during onboarding and stored per account; it gates youth-safety behaviour (e.g. no paid
            ads to minors).
          </li>
        </ul>
      </SectionCard>

      <SectionCard title="Disclaimers & AI disclosure">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <span className="text-foreground">Coaching estimates</span> — SwingVantage presents heuristic estimates with honest confidence language, not medical or guaranteed advice.</li>
          <li>• <span className="text-foreground">Per-sport evidence notes</span> — each sport states how its benchmarks were derived (see <Link href="/admin/sports" className="text-link hover:underline">Sports</Link>).</li>
          <li>• <span className="text-foreground">Youth safety</span> — sensitive surfaces never carry paid ads; minors never see personalized ads.</li>
          <li>• <span className="text-foreground">Video privacy</span> — the full swing video stays on the user&apos;s device and is never uploaded to SwingVantage. When AI analysis is on, only sampled still frames are sent to a third-party AI provider (e.g. Google or OpenAI) for processing in its cloud; Motion Lab analysis is fully on-device.</li>
        </ul>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> Your compliance control panel — links to
          every live policy and the workflows for honoring user data rights.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> Keep policy pages current (they&apos;re
          versioned in code), and use the user detail page to fulfill export/suspension requests. Every such
          action is recorded in the audit log.
        </p>
      </HelpPanel>
    </div>
  );
}
