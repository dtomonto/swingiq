// ============================================================
// /admin/learning — Admin Academy (operator onboarding)
// ------------------------------------------------------------
// Beginner-friendly enablement for a brand-new admin: a getting-started
// checklist, per-section playbooks generated from the nav model, and a
// plain-English glossary.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { NAV_ITEMS } from '@/lib/admin/nav';

export const metadata: Metadata = { title: 'Admin Academy | Admin', robots: 'noindex, nofollow' };

const CHECKLIST = [
  { title: 'Read the Command Center', detail: 'Start every day here. Work the alert cards top-down.', href: '/admin' },
  { title: 'Connect your data', detail: 'Set the Supabase service role so Users/Athletes/Media/AI load live.', href: '/admin/integrations' },
  { title: 'Review users', detail: 'Open a user to see their full journey in under a minute.', href: '/admin/users' },
  { title: 'Triage AI quality', detail: 'Use the score queues to spot analyses worth a human look.', href: '/admin/ai-analyses' },
  { title: 'Guard generated pages', detail: 'Approve only strong, distinct fix pages; reject the rest.', href: '/admin/content/generated-fixes' },
  { title: 'Tighten security', detail: 'Keep the admin allowlist small and set finer roles.', href: '/admin/security' },
];

const GLOSSARY = [
  ['SEO', 'Search Engine Optimization — being found on Google.'],
  ['AEO', 'Answer Engine Optimization — being quoted by ChatGPT-style answer engines (direct answers + FAQs).'],
  ['GEO', 'Generative Engine Optimization — showing up in AI-generated overviews.'],
  ['RLS', 'Row Level Security — the database rule that keeps each user able to see only their own rows.'],
  ['Service role', 'A server-only key that lets the admin read across all users (bypasses RLS). Never exposed to the browser.'],
  ['Feature flag', 'A switch to turn a feature on/off without changing code.'],
  ['Audit log', 'The record of who changed what and when.'],
  ['House ads', 'Self-promotions shown when no paid ad network is connected.'],
  ['Relevance gate', 'The scoring step that blocks off-topic/unsafe pages before they publish.'],
];

export default function AdminLearningPage() {
  // Build playbook cards from the built sections only.
  const playbooks = NAV_ITEMS.filter((i) => i.built && i.id !== 'staff-academy');

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Admin Academy"
        icon={GraduationCap}
        description="New to running SwingVantage? Start here. This is your guided tour, a getting-started checklist, and a plain-English glossary — no prior experience needed."
      />

      <SectionCard title="Getting started" description="Work through these in order.">
        <ol className="space-y-2">
          {CHECKLIST.map((c, i) => (
            <li key={c.href} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground">{i + 1}</span>
              <div>
                <Link href={c.href} className="text-sm font-medium text-foreground hover:text-link">{c.title}</Link>
                <p className="text-xs text-muted-foreground">{c.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard title="Section playbooks" description="What each area is for, at a glance.">
        <div className="grid gap-2 sm:grid-cols-2">
          {playbooks.map((p) => {
            const Icon = p.icon;
            return (
              <Link key={p.id} href={p.href} className="flex items-start gap-2.5 rounded-lg border border-border bg-background p-3 hover:border-border">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-link" />
                <span>
                  <span className="block text-sm font-medium text-foreground">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">{p.blurb}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Glossary" description="Plain-English definitions.">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {GLOSSARY.map(([term, def]) => (
            <div key={term}>
              <dt className="text-sm font-semibold text-link">{term}</dt>
              <dd className="text-xs text-muted-foreground">{def}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      <HelpPanel title="How the dashboard is designed">
        <p>
          Every page answers the same questions: <em>what is this, why it matters, what to look at first, and
          what to do next.</em> Look for the &ldquo;What is this&rdquo; panel at the bottom of each screen.
        </p>
        <p>
          <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-success-text" />
          Honesty first: where live data needs a connection that isn&apos;t set up, you&apos;ll see a clear
          prompt — never a fake number.
        </p>
        <p>
          Full written docs live in <code>docs/ADMIN_DASHBOARD.md</code> in the repository.
        </p>
      </HelpPanel>
    </div>
  );
}
