// ============================================================
// /admin/security-os/runbooks — security docs & runbooks index
// ------------------------------------------------------------
// Surfaces the docs/security/* runbooks in-app with plain-English summaries
// and the concrete "what to do if…" playbooks, so an operator can act in an
// incident without leaving the dashboard. The canonical, editable source is
// the repo markdown; this page mirrors the index + key checklists.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ArrowLeft, AlertTriangle, KeyRound, UserX, Bot, PackageOpen, Megaphone, Rocket } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { requireSecurityAccess } from '@/lib/security-os/access.server';

export const metadata: Metadata = { title: 'Runbooks | securityOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const DOCS: { file: string; title: string; blurb: string }[] = [
  { file: 'docs/security/securityOS.md', title: 'securityOS overview', blurb: 'How the security operating system works, its scoring model and how to use it.' },
  { file: 'docs/security/threat-model.md', title: 'Threat model', blurb: 'Major assets, the threats against each (STRIDE-style) and current mitigations.' },
  { file: 'docs/security/incident-response-runbook.md', title: 'Incident response runbook', blurb: 'Step-by-step playbooks for the incidents most likely to hit this product.' },
  { file: 'docs/security/admin-audit-logging.md', title: 'Admin audit logging', blurb: 'What is logged, redaction guarantees and how to review the trail.' },
  { file: 'docs/security/ai-security.md', title: 'AI security', blurb: 'Prompt-injection, output safety, AI cost abuse and data-leakage controls.' },
  { file: 'docs/security/file-upload-security.md', title: 'File upload security', blurb: 'Validation, storage permissions and media-handling controls.' },
  { file: 'docs/security/security-testing.md', title: 'Security testing', blurb: 'Dependency/secret/SAST scanning, smoke tests and how to run them.' },
  { file: 'docs/security/data-governance.md', title: 'Data governance', blurb: 'Data inventory, minimization, retention and the never-sell ethic.' },
  { file: 'docs/security/secure-development-checklist.md', title: 'Secure development checklist', blurb: 'The pre-merge and pre-launch security checklist.' },
];

const PLAYBOOKS: { icon: typeof AlertTriangle; title: string; steps: string[] }[] = [
  {
    icon: KeyRound,
    title: 'A secret/API key is exposed',
    steps: [
      'Rotate the key at the provider immediately; revoke the old one.',
      'Update the value in the environment (Vercel/host) and redeploy.',
      'Search git history for the secret; if committed, treat the whole key as burned.',
      'Confirm secret scanning (Gitleaks) is on so it can’t recur, and record a finding.',
    ],
  },
  {
    icon: UserX,
    title: 'An admin account is compromised',
    steps: [
      'Remove the email from ADMIN_EMAILS and rotate ADMIN_SECRET.',
      'Invalidate sessions (rotate Supabase keys if needed) and re-deploy.',
      'Review the audit logs for actions taken by the account.',
      'Re-grant access with least-privilege ADMIN_ROLES once verified.',
    ],
  },
  {
    icon: Bot,
    title: 'The AI system leaks sensitive data',
    steps: [
      'Disable the affected AI route (feature flag / env) to stop the bleed.',
      'Identify the prompt/path; add a red-team test that reproduces it safely.',
      'Add output redaction / system-prompt hardening; verify the test passes.',
      'Record a finding and review AI logging for over-collection.',
    ],
  },
  {
    icon: PackageOpen,
    title: 'A dependency vulnerability is found',
    steps: [
      'Check exploitability and whether it’s reachable in our code.',
      'Patch to a fixed version (npm audit fix / manual bump); test.',
      'If no fix exists, apply a mitigation or accept-risk with justification here.',
      'Confirm the dependency-audit CI job would catch a regression.',
    ],
  },
  {
    icon: Rocket,
    title: 'Before launching a new feature',
    steps: [
      'Confirm auth/role on any new route or API; add a denial test.',
      'Validate + rate-limit any new public input; never trust client data.',
      'Check no secrets or admin-only data reach the client bundle.',
      'Run the secure-development checklist and re-scan securityOS.',
    ],
  },
  {
    icon: Megaphone,
    title: 'Before launching a growth campaign',
    steps: [
      'Confirm public pages have security headers and no data leakage.',
      'Ensure forms validate + rate-limit and have privacy disclosure.',
      'Verify analytics/ad scripts are safe and consent-aware.',
      'Run the (Phase 3) Growth Launch Security Gate when available.',
    ],
  },
];

export default async function SecurityRunbooksPage() {
  await requireSecurityAccess();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <Link href="/admin/security-os" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300">
        <ArrowLeft className="h-3.5 w-3.5" /> securityOS
      </Link>
      <PageHeader
        title="Runbooks & security docs"
        icon={BookOpen}
        description="Incident playbooks and the security documentation set. The canonical, editable source lives in the repo under docs/security; the playbooks below are the fast path when something is on fire."
      />

      <SectionCard title="Incident playbooks" description="What to do, in order, when it matters most.">
        <div className="grid gap-3 sm:grid-cols-2">
          {PLAYBOOKS.map((p) => (
            <div key={p.title} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-100"><p.icon className="h-4 w-4 text-amber-400" /> {p.title}</p>
              <ol className="list-decimal space-y-1 pl-5">
                {p.steps.map((s, i) => (
                  <li key={i} className="text-xs text-gray-400">{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Documentation set" description="The full docs/security library.">
        <ul className="divide-y divide-gray-800">
          {DOCS.map((d) => (
            <li key={d.file} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-200">{d.title}</p>
                <p className="text-xs text-gray-500">{d.blurb}</p>
              </div>
              <code className="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[10px] text-gray-400">{d.file}</code>
            </li>
          ))}
        </ul>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">Keep these current.</strong> A runbook is only useful if it
          matches reality — update rotation steps, contacts and env names whenever they change, and do a quick
          tabletop walk-through periodically.
        </p>
      </HelpPanel>
    </div>
  );
}
