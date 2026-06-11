'use client';

// Theme Lab — library + generation + publishing-center + ops recommendations
// (#3 steps 3/6/8). Operator surface over the pure cores. Local-first; every
// mutation is audit-logged and broadcast so everything re-renders live.

import { useEffect, useMemo, useState } from 'react';
import { Library, Sparkles, Send, Lightbulb, Trash2, RotateCcw, Archive } from 'lucide-react';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import { THEMES, type ThemeId } from '@/lib/theme/themes';
import { THEME_LAB_REGISTRY } from '@/lib/theme-lab';
import {
  getLibraryCatalog,
  readDrafts,
  addDrafts,
  removeDraft,
  setDraftStatus,
  libraryStats,
  THEME_LIBRARY_CHANGE_EVENT,
  type LibraryTheme,
} from '@/lib/theme-lab';
import { generateThemeVariants } from '@/lib/theme-lab';
import {
  readPublishRecords,
  createPublishDraft,
  publishRecord,
  rollbackRecord,
  removePublishRecord,
  assessPublishRisk,
  THEME_PUBLISH_CHANGE_EVENT,
  type ThemePublishRecord,
  type PublishScope,
  type PublishRisk,
} from '@/lib/theme-lab';
import { readExperiments, EXPERIMENTS_CHANGE_EVENT } from '@/lib/theme-lab';
import { buildThemeOpsRecommendations, type ThemeOpsAction } from '@/lib/theme-lab';

const RISK_TONE: Record<PublishRisk, BadgeTone> = { low: 'success', medium: 'warning', high: 'danger' };
const PUB_STATUS_TONE: Record<string, BadgeTone> = { draft: 'neutral', published: 'success', 'rolled-back': 'warning' };
const LIB_STATUS_TONE: Record<string, BadgeTone> = { live: 'success', draft: 'warning', retired: 'neutral' };
const REC_TONE: Record<ThemeOpsAction, BadgeTone> = {
  rollback: 'danger', expand: 'success', pause: 'neutral', retire: 'neutral', promote: 'warning', 'needs-data': 'warning',
};

const ACTIVE_THEMES = THEME_LAB_REGISTRY.filter((e) => e.status === 'active');
const SCOPES: PublishScope[] = ['all', 'segment', 'percent', 'sport', 'page'];

export function ThemeLibraryPanel({ actor }: { actor: string }) {
  const [mounted, setMounted] = useState(false);
  const [drafts, setDraftsState] = useState<LibraryTheme[]>([]);
  const [publishRecords, setPublishRecords] = useState<ThemePublishRecord[]>([]);
  const [experiments, setExperiments] = useState(readExperiments());

  // Generation form
  const [genBase, setGenBase] = useState<ThemeId>('dark-performance');
  const [genCount, setGenCount] = useState(3);
  // Publish form
  const [pubTheme, setPubTheme] = useState<ThemeId>('dark-performance');
  const [pubScope, setPubScope] = useState<PublishScope>('segment');
  const [pubTarget, setPubTarget] = useState('coaches');
  const [pubPercent, setPubPercent] = useState(25);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const sync = () => {
      setDraftsState(readDrafts());
      setPublishRecords(readPublishRecords());
      setExperiments(readExperiments());
    };
    sync();
    for (const ev of [THEME_LIBRARY_CHANGE_EVENT, THEME_PUBLISH_CHANGE_EVENT, EXPERIMENTS_CHANGE_EVENT, 'storage']) {
      window.addEventListener(ev, sync);
    }
    return () => {
      for (const ev of [THEME_LIBRARY_CHANGE_EVENT, THEME_PUBLISH_CHANGE_EVENT, EXPERIMENTS_CHANGE_EVENT, 'storage']) {
        window.removeEventListener(ev, sync);
      }
    };
  }, []);

  const catalog = useMemo(() => getLibraryCatalog(THEME_LAB_REGISTRY, drafts), [drafts]);
  const stats = useMemo(() => libraryStats(catalog), [catalog]);
  const recs = useMemo(
    () => buildThemeOpsRecommendations({ experiments, catalog, publishRecords }),
    [experiments, catalog, publishRecords],
  );
  const pubRisk = assessPublishRisk(pubTheme, pubScope, pubPercent);

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading library…</p>;

  function doGenerate() {
    const variants = generateThemeVariants(genBase, { count: genCount });
    addDrafts(variants);
    recordAudit({ actor, action: 'theme.generate', entityType: 'theme', entityId: genBase,
      summary: `Generated ${variants.length} draft variant(s) from ${genBase}` });
  }
  function dropDraft(t: LibraryTheme) {
    removeDraft(t.id);
    recordAudit({ actor, action: 'theme.library.remove', entityType: 'theme', entityId: t.id, summary: `Removed draft "${t.name}"`, severity: 'warning' });
  }
  function retireDraft(t: LibraryTheme) {
    setDraftStatus(t.id, t.status === 'retired' ? 'draft' : 'retired');
    recordAudit({ actor, action: 'theme.library.status', entityType: 'theme', entityId: t.id, summary: `Draft "${t.name}" → ${t.status === 'retired' ? 'draft' : 'retired'}` });
  }
  function doCreatePublish() {
    const rec = createPublishDraft({
      themeId: pubTheme, scope: pubScope,
      target: pubScope === 'all' || pubScope === 'percent' ? '' : pubTarget,
      rolloutPercent: pubScope === 'percent' ? pubPercent : undefined,
    });
    recordAudit({ actor, action: 'theme.publish.draft', entityType: 'theme-publish', entityId: rec.id,
      summary: `Drafted publish of ${pubTheme} → ${pubScope}${rec.target ? ` "${rec.target}"` : ''} (${rec.risk} risk)`, severity: rec.risk === 'high' ? 'warning' : 'info' });
  }
  function doPublish(r: ThemePublishRecord) {
    publishRecord(r.id);
    recordAudit({ actor, action: 'theme.publish', entityType: 'theme-publish', entityId: r.id, summary: `Published ${r.themeId} → ${r.scope}`, severity: 'warning' });
  }
  function doRollback(id: string, themeId?: string) {
    rollbackRecord(id);
    recordAudit({ actor, action: 'theme.publish.rollback', entityType: 'theme-publish', entityId: id, summary: `Rolled back publish ${themeId ?? id}` });
  }

  return (
    <div className="space-y-8">
      {/* ── Recommendations ─────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-link" />
          <h3 className="text-sm font-semibold text-foreground">Recommendations</h3>
        </div>
        {recs.length === 0 ? (
          <p className="text-xs text-muted-foreground/70">Nothing to act on — no running experiments, drafts, or risky publishes.</p>
        ) : (
          <div className="space-y-2">
            {recs.map((r) => {
              const pubId = r.action === 'rollback' ? r.id.split(':')[1] : null;
              return (
                <div key={r.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-card p-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={REC_TONE[r.action]}>{r.action}</StatusBadge>
                      <p className="text-sm font-medium text-foreground">{r.title}</p>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{r.confidence}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.reason}</p>
                  </div>
                  {pubId && (
                    <button onClick={() => doRollback(pubId, r.subject)}
                      className="inline-flex items-center gap-1 rounded-lg border border-error/40 bg-error/10 px-2.5 py-1 text-xs text-error-text hover:bg-error/20">
                      <RotateCcw className="h-3 w-3" /> Roll back
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Library gallery + generation ────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 text-link" />
            <h3 className="text-sm font-semibold text-foreground">Theme library</h3>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground/70">
            {stats.total} total · {stats.live} live · {stats.draft} draft · {stats.generated} generated
          </p>
        </div>

        {/* Generate variants */}
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Generate from
            <select value={genBase} onChange={(e) => setGenBase(e.target.value as ThemeId)}
              className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground">
              {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Count
            <input type="number" min={1} max={12} value={genCount}
              onChange={(e) => setGenCount(Math.max(1, Math.min(12, Number(e.target.value))))}
              className="w-16 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground" />
          </label>
          <button onClick={doGenerate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary">
            <Sparkles className="h-3.5 w-3.5" /> Generate drafts
          </button>
          <p className="w-full text-[11px] text-muted-foreground/70">Hue-rotated candidates (contrast preserved). Drafts never auto-publish — refine in the builder, export, commit.</p>
        </div>

        {/* Gallery */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-1.5" aria-hidden>
                {[t.swatches.bg, t.swatches.surface, t.swatches.text, t.swatches.primary, t.swatches.accent].map((c, i) => (
                  <span key={i} className="h-5 w-5 rounded-full border border-black/30" style={{ background: c }} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <StatusBadge tone={t.source === 'published' ? 'neutral' : 'warning'}>{t.source}</StatusBadge>
                <StatusBadge tone={LIB_STATUS_TONE[t.status] ?? 'neutral'}>{t.status}</StatusBadge>
              </div>
              {t.source !== 'published' && (
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => retireDraft(t)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Archive className="h-3 w-3" /> {t.status === 'retired' ? 'Unretire' : 'Retire'}
                  </button>
                  <button onClick={() => dropDraft(t)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-error-text">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Publishing-center ───────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-success-text" />
          <h3 className="text-sm font-semibold text-foreground">Publishing center</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Declare who gets a theme (all / segment / % / sport / page). Records are draft until you
          publish, always reversible, and audit-logged. Risk is high until the theme is a live,
          contrast-gated theme.
        </p>

        {/* Create publish */}
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Theme
            <select value={pubTheme} onChange={(e) => setPubTheme(e.target.value as ThemeId)}
              className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground">
              {ACTIVE_THEMES.map((e) => <option key={e.themeId} value={e.themeId}>{e.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Scope
            <select value={pubScope} onChange={(e) => setPubScope(e.target.value as PublishScope)}
              className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground">
              {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          {pubScope === 'percent' ? (
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Rollout %
              <input type="number" min={0} max={100} value={pubPercent}
                onChange={(e) => setPubPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-16 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground" />
            </label>
          ) : pubScope !== 'all' ? (
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Target ({pubScope})
              <input value={pubTarget} onChange={(e) => setPubTarget(e.target.value)}
                placeholder={pubScope === 'sport' ? 'golf' : pubScope === 'page' ? '/dashboard' : 'coaches'}
                className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground" />
            </label>
          ) : null}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            risk <StatusBadge tone={RISK_TONE[pubRisk]}>{pubRisk}</StatusBadge>
          </span>
          <button onClick={doCreatePublish}
            className="inline-flex items-center gap-1.5 rounded-lg bg-success/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-success">
            <Send className="h-3.5 w-3.5" /> Create draft
          </button>
        </div>

        {/* Records */}
        {publishRecords.length === 0 ? (
          <p className="text-xs text-muted-foreground/70">No publish records yet.</p>
        ) : (
          <div className="space-y-2">
            {publishRecords.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{r.themeId}</p>
                    <span className="text-xs text-muted-foreground">→ {r.scope}{r.target ? ` "${r.target}"` : ''}{r.rolloutPercent != null ? ` ${r.rolloutPercent}%` : ''}</span>
                    <StatusBadge tone={RISK_TONE[r.risk]}>{r.risk}</StatusBadge>
                    <StatusBadge tone={PUB_STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</StatusBadge>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.status === 'draft' && (
                    <button onClick={() => doPublish(r)} className="rounded-lg border border-success/40 bg-success/10 px-2.5 py-1 text-xs text-success-text hover:bg-success/20">Publish</button>
                  )}
                  {r.status === 'published' && (
                    <button onClick={() => doRollback(r.id, r.themeId)} className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-link hover:bg-primary/20">
                      <RotateCcw className="h-3 w-3" /> Roll back
                    </button>
                  )}
                  <button onClick={() => { removePublishRecord(r.id); recordAudit({ actor, action: 'theme.publish.remove', entityType: 'theme-publish', entityId: r.id, summary: `Removed publish record ${r.themeId}`, severity: 'warning' }); }}
                    aria-label="Remove record" className="rounded-lg p-1 text-muted-foreground hover:text-error-text">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
