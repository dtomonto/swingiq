'use client';

// ============================================================
// SwingVantage — Feature Education: feature detail (client)
// ------------------------------------------------------------
// Generate the learning package for a feature, then review every asset
// (quality score + security scan shown), approve / send back / regenerate,
// and publish. Every action hits /api/feature-education/* and refreshes.
// ============================================================

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Sparkles, Check, RotateCcw, Send, Upload, ChevronDown, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import {
  ASSET_TYPE_LABELS,
  CATEGORY_LABELS,
  type FeatureRecord,
  type EducationAsset,
  type AssetVersion,
  type AssetType,
  type AssetStatus,
  type ContentGap,
} from '@/lib/feature-education/types';

interface DetailData {
  feature: FeatureRecord;
  assets: EducationAsset[];
  versionsByAsset: Record<string, AssetVersion[]>;
  warranted: AssetType[];
  gap: ContentGap | null;
}

const STATUS_TONE: Record<AssetStatus, BadgeTone> = {
  detected: 'neutral',
  draft: 'neutral',
  'needs-review': 'warning',
  approved: 'info',
  published: 'success',
  updated: 'accent',
  deprecated: 'danger',
  archived: 'neutral',
};

export function FeatureDetail({ initial }: { initial: DetailData }) {
  const router = useRouter();
  const { feature, warranted } = initial;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assetByType = new Map(initial.assets.map((a) => [a.type, a]));

  async function call(path: string, body: unknown, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(`/api/feature-education/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? `Request failed (${res.status}).`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setBusy(null);
    }
  }

  const generatePackage = () => call('generate', { featureId: feature.id }, 'generate');
  const generateType = (t: AssetType) => call('generate', { featureId: feature.id, types: [t] }, `gen-${t}`);
  const review = (assetId: string, decision: 'approve' | 'reject' | 'regenerate') =>
    call('review', { assetId, decision }, `${decision}-${assetId}`);
  const publish = (assetId: string) => call('publish', { assetId }, `publish-${assetId}`);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <Link href="/admin/feature-education" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-amber-400">
        <ArrowLeft className="h-4 w-4" /> Feature Education
      </Link>

      <PageHeader
        title={feature.name}
        description={feature.description}
        actions={
          <button
            onClick={generatePackage}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-stage hover:bg-amber-400 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" /> {busy === 'generate' ? 'Generating…' : 'Generate package'}
          </button>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge tone="info">{CATEGORY_LABELS[feature.category]}</StatusBadge>
          <StatusBadge tone={feature.status === 'removed' ? 'danger' : 'neutral'}>{feature.status}</StatusBadge>
          <StatusBadge tone={feature.needsHumanReview ? 'warning' : 'success'}>confidence {feature.confidence}</StatusBadge>
          {feature.audiences.map((a) => <StatusBadge key={a} tone="neutral">{a}</StatusBadge>)}
        </div>
      </PageHeader>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      {/* What it touches (grounding) */}
      <SectionCard title="What it touches" description="The real surfaces this feature is grounded in (anti-hallucination).">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Meta label="Routes" values={feature.routes} />
          <Meta label="API endpoints" values={feature.apiEndpoints} />
          <Meta label="Admin controls" values={feature.adminControls} />
          <Meta label="Components" values={feature.components} />
          <Meta label="Feature flags" values={feature.featureFlags} />
          <Meta label="Permissions" values={feature.permissions} />
          <Meta label="DB tables" values={feature.dbTables} />
          <Meta label="Detected from" values={feature.detectedFrom} />
        </dl>
      </SectionCard>

      {/* Coverage matrix */}
      <SectionCard title="Coverage" description="The learning assets this feature warrants, and where each one stands.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {warranted.map((t) => {
            const a = assetByType.get(t);
            const status = a?.status;
            return (
              <div key={t} className="rounded-lg border border-border p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{ASSET_TYPE_LABELS[t]}</span>
                  {status ? (
                    <StatusBadge tone={STATUS_TONE[status]}>{status}</StatusBadge>
                  ) : (
                    <button
                      onClick={() => generateType(t)}
                      disabled={busy !== null}
                      className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-amber-400 hover:bg-muted disabled:opacity-50"
                    >
                      {busy === `gen-${t}` ? '…' : 'Generate'}
                    </button>
                  )}
                </div>
                {a?.quality && (
                  <p className={`mt-1 text-[11px] ${a.quality.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                    quality {a.quality.overall}/100
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Assets */}
      <SectionCard title={`Generated assets (${initial.assets.length})`} description="Review, approve and publish. Nothing is public until you publish it.">
        {initial.assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assets yet — click <strong>Generate package</strong> to draft everything this feature warrants.</p>
        ) : (
          <div className="space-y-3">
            {initial.assets.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                versions={initial.versionsByAsset[a.id] ?? []}
                busy={busy}
                onApprove={() => review(a.id, 'approve')}
                onReject={() => review(a.id, 'reject')}
                onRegenerate={() => review(a.id, 'regenerate')}
                onPublish={() => publish(a.id)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-muted-foreground">Generate</strong> drafts every asset this feature warrants, each grounded in
          the real surfaces above, then quality-scored and security-scanned. <strong className="text-muted-foreground">Approve</strong>{' '}
          a draft once it reads well, then <strong className="text-muted-foreground">Publish</strong> it. Video scripts publish
          straight into the Video Studio pipeline; release notes show a ready-to-paste <code>Update:</code> trailer.
        </p>
      </HelpPanel>
    </div>
  );
}

function Meta({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-muted-foreground">{values.length ? values.join(', ') : <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

function AssetCard({
  asset, versions, busy, onApprove, onReject, onRegenerate, onPublish,
}: {
  asset: EducationAsset;
  versions: AssetVersion[];
  busy: string | null;
  onApprove: () => void;
  onReject: () => void;
  onRegenerate: () => void;
  onPublish: () => void;
}) {
  const [open, setOpen] = useState(false);
  const q = asset.quality;
  const sec = asset.security;
  const secBlocked = sec?.findings.some((f) => f.severity === 'block') ?? false;
  const canApprove = ['draft', 'needs-review', 'updated'].includes(asset.status);
  const canPublish = asset.status === 'approved';

  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
        <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 items-center gap-2 text-left">
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground">{ASSET_TYPE_LABELS[asset.type]}</span>
            <span className="block truncate text-xs text-muted-foreground">{asset.title}</span>
          </span>
        </button>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge tone={STATUS_TONE[asset.status]}>{asset.status}</StatusBadge>
          {q && <StatusBadge tone={q.passed ? 'success' : 'warning'}>Q {q.overall}</StatusBadge>}
          <StatusBadge tone={secBlocked ? 'danger' : 'success'}>
            {secBlocked ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
            {secBlocked ? 'blocked' : 'safe'}
          </StatusBadge>
          <span className="text-[11px] text-muted-foreground">v{asset.version}</span>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border p-3">
          <p className="text-sm text-muted-foreground">{asset.summary}</p>

          {asset.sections.map((s, i) => (
            <div key={i}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.heading}</h4>
              <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                {s.body.map((line, j) => <p key={j} className="whitespace-pre-wrap">{line}</p>)}
              </div>
            </div>
          ))}

          {asset.faqs && asset.faqs.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Q&amp;A</h4>
              <ul className="mt-1 space-y-1.5 text-sm">
                {asset.faqs.map((f, i) => (
                  <li key={i}><span className="text-foreground">{f.q}</span><br /><span className="text-muted-foreground">{f.a}</span></li>
                ))}
              </ul>
            </div>
          )}

          {asset.seo && (
            <div className="rounded bg-background p-2 text-xs text-muted-foreground">
              <p><span className="text-muted-foreground">SEO title:</span> {asset.seo.title}</p>
              <p><span className="text-muted-foreground">Slug:</span> /{asset.seo.slug}</p>
              <p><span className="text-muted-foreground">Schema:</span> {asset.seo.schema.join(', ')}</p>
            </div>
          )}

          {q && !q.passed && q.reasons.length > 0 && (
            <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300">
              <strong>Quality notes:</strong> {q.reasons.join(' ')}
            </div>
          )}
          {sec && sec.findings.length > 0 && (
            <div className="rounded border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
              <strong>Security:</strong> {sec.findings.map((f) => `${f.type} (${f.severity})`).join(', ')}
            </div>
          )}

          {versions.length > 0 && (
            <p className="text-[11px] text-muted-foreground">{versions.length} version(s) · published target: {asset.publishTarget ?? '—'}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={onApprove} disabled={!canApprove || busy !== null} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/80 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-40">
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
            <button onClick={onPublish} disabled={!canPublish || busy !== null} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-stage hover:bg-amber-400 disabled:opacity-40">
              <Upload className="h-3.5 w-3.5" /> Publish
            </button>
            <button onClick={onReject} disabled={busy !== null} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-40">
              <Send className="h-3.5 w-3.5" /> Send back
            </button>
            <button onClick={onRegenerate} disabled={busy !== null} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-40">
              <RotateCcw className="h-3.5 w-3.5" /> Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
