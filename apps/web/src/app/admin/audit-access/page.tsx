// ============================================================
// /admin/audit-access — External Auditor Access
// ------------------------------------------------------------
// Turn on (and manage) read-only access for an external auditor — e.g.
// ChatGPT's browsing tool — so it can fetch a single JSON packet that
// clears the barriers a logged-out browser hits: the verbatim sitemap +
// robots, a map of the logged-in app surface, the analytics overview, and
// an honest list of what still needs a manual upload.
//
// Security: the access token lives only in AUDIT_ACCESS_TOKEN (server env);
// this page shows the URL TEMPLATE (with a placeholder), never the secret.
// ============================================================

import type { Metadata } from 'next';
import { ScanSearch, CheckCircle2, CircleDashed, Upload, ShieldCheck, Lock, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { MetricStat } from '@/components/admin/MetricStat';
import { CopyButton } from '@/components/admin/setup/CopyButton';
import { isAuditAccessConfigured } from '@/lib/audit-access/token';
import {
  AUDIT_BARRIERS, APP_SURFACE, STILL_CANNOT_PROVIDE, barrierSummary,
} from '@/lib/audit-access/barriers';
import type { BarrierStatus } from '@/lib/audit-access/types';
import { PUBLISHED_SEO_PAGES } from '@/content/seoPages';
import { SITE_URL } from '@/config/site';
import sitemap from '@/app/sitemap';

export const metadata: Metadata = { title: 'External Auditor Access | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<BarrierStatus, { tone: BadgeTone; label: string; Icon: typeof CheckCircle2 }> = {
  cleared: { tone: 'success', label: 'Cleared', Icon: CheckCircle2 },
  partial: { tone: 'info', label: 'Partially cleared', Icon: CircleDashed },
  manual: { tone: 'warning', label: 'Manual upload', Icon: Upload },
};

export default async function AdminAuditAccessPage() {
  const enabled = isAuditAccessConfigured();
  const summary = barrierSummary();

  let sitemapEntryCount = 0;
  try {
    sitemapEntryCount = (await sitemap()).length;
  } catch {
    sitemapEntryCount = 0;
  }

  const urlTemplate = `${SITE_URL}/api/audit?token=YOUR_TOKEN`;
  const shareablePrompt =
    `Please audit my web app, SwingVantage. I've enabled read-only audit access for you. ` +
    `Fetch this URL and use the JSON it returns as ground truth — it contains the verbatim robots.txt and ` +
    `sitemap.xml (mirrored, since your browser may block those paths), a map of the logged-in app surface, ` +
    `the analytics overview, and a list of what still needs a manual upload:\n\n${urlTemplate}\n\n` +
    `Then give me a complete analysis: SEO/indexing, the public funnel (home → pricing → signup), the ` +
    `logged-in experience, analytics gaps, and anything I should fix first.`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="External Auditor Access"
        icon={ScanSearch}
        description="Give an external auditor (e.g. ChatGPT's browsing tool) read-only access to a single JSON packet that clears the things a logged-out browser can't see — so it can audit the whole app on request."
        actions={
          <StatusBadge tone={enabled ? 'success' : 'neutral'}>
            {enabled ? (
              <><ShieldCheck className="h-3 w-3" /> Enabled</>
            ) : (
              <><Lock className="h-3 w-3" /> Disabled</>
            )}
          </StatusBadge>
        }
      />

      <HelpPanel>
        <p>
          An external auditor reported it could read your public pages but <em>couldn&apos;t</em> see the
          logged-in dashboard, your analytics, or even open <code>/sitemap.xml</code> and{' '}
          <code>/robots.txt</code> directly. This page exposes one secure, read-only endpoint
          (<code>/api/audit</code>) that bundles all of that into a single JSON response the auditor can fetch.
        </p>
        <p>
          It is <strong>aggregate &amp; structural only</strong> — no user personal data, no raw sessions, no
          secrets — and <strong>off by default</strong>. It turns on only when you set an access token, and a
          wrong/missing token is rejected.
        </p>
      </HelpPanel>

      {/* ── Enable / token ─────────────────────────────────────── */}
      <SectionCard
        title="1 · Turn it on"
        description="Set one server environment variable to a long random secret. Until then, the endpoint returns 404 (fully off)."
      >
        {enabled ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> AUDIT_ACCESS_TOKEN is set — audit access is live.
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            <Lock className="h-4 w-4" /> Not set yet — the endpoint is disabled (404) until you add the token.
          </div>
        )}

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 font-mono text-xs text-gray-300">
            <span className="flex items-center gap-2"><KeyRound className="h-3.5 w-3.5 text-amber-400" /> AUDIT_ACCESS_TOKEN</span>
            <CopyButton text="AUDIT_ACCESS_TOKEN" label="env var name" />
          </div>
          <p className="text-gray-500">
            Generate a strong value (any long random string), e.g.:
          </p>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 font-mono text-xs text-gray-300">
            <span>openssl rand -hex 32</span>
            <CopyButton text="openssl rand -hex 32" label="generate command" />
          </div>
          <p className="text-gray-500">
            Add it in your host (Vercel → Project → Settings → Environment Variables) and redeploy. Rotate it any
            time by changing the value — old links stop working immediately.
          </p>
        </div>
      </SectionCard>

      {/* ── Share with the auditor ─────────────────────────────── */}
      <SectionCard
        title="2 · Share with your auditor"
        description="Replace YOUR_TOKEN with the value you set, then paste this into ChatGPT (or any auditor)."
      >
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 font-mono text-xs text-gray-300">
            <span className="truncate">{urlTemplate}</span>
            <CopyButton text={urlTemplate} label="audit URL" />
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Ready-to-paste prompt</span>
              <CopyButton text={shareablePrompt} label="auditor prompt" />
            </div>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-400">{shareablePrompt}</p>
          </div>
          <p className="text-gray-500">
            The token can be passed as <code>?token=…</code> (shown above) or as an{' '}
            <code>Authorization: Bearer …</code> header.
          </p>
        </div>
      </SectionCard>

      {/* ── Barriers cleared ───────────────────────────────────── */}
      <SectionCard
        title="Barriers this clears"
        description={`${summary.cleared} cleared · ${summary.partial} partially cleared · ${summary.manual} still need a manual upload`}
      >
        <ul className="space-y-3">
          {AUDIT_BARRIERS.map((b) => {
            const s = STATUS_BADGE[b.status];
            return (
              <li key={b.id} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-200">{b.barrier}</p>
                  <StatusBadge tone={s.tone}><s.Icon className="h-3 w-3" /> {s.label}</StatusBadge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{b.resolution}</p>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      {/* ── What's in the packet (preview) ─────────────────────── */}
      <SectionCard
        title="What the packet contains"
        description="A live preview of the structural data the auditor receives. No personal data or secrets."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricStat label="Sitemap entries" value={String(sitemapEntryCount)} />
          <MetricStat label="Published SEO pages" value={String(PUBLISHED_SEO_PAGES.length)} />
          <MetricStat label="Logged-in routes mapped" value={String(APP_SURFACE.length)} />
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Logged-in app surface (described for the auditor)
          </h3>
          <ul className="divide-y divide-gray-800 rounded-lg border border-gray-800">
            {APP_SURFACE.map((r) => (
              <li key={r.path} className="flex items-start gap-3 px-3 py-2">
                <code className="shrink-0 text-xs text-amber-400">{r.path}</code>
                <span className="text-xs text-gray-400">{r.purpose}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          Also included: verbatim robots.txt &amp; sitemap.xml, boolean capability flags, public route list, and —
          when a PostHog read key is configured — the aggregate web analytics overview. GA4 &amp; Search Console
          exports remain a manual upload.
        </p>
      </SectionCard>

      {/* ── Still manual ───────────────────────────────────────── */}
      <SectionCard
        title="Still needs a manual upload"
        description="Honest limits — these can't be served as JSON. Hand them to the auditor directly."
      >
        <ul className="space-y-1.5 text-sm text-gray-400">
          {STILL_CANNOT_PROVIDE.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Upload className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /> {item}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
