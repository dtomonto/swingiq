'use client';

// ============================================================
// SearchIntelligenceOS — Keyword import/export tools (client)
// ------------------------------------------------------------
// Import CSV (keywords / rankings / backlinks) into the local-first store and
// export the keyword table. Imported rows are honestly labeled `imported`;
// keyword imports carry verified volume/difficulty when the CSV supplies them.
// Persists in localStorage (zustand), so imports survive a live re-scan.
// ============================================================

import { useRef, useState } from 'react';
import { Upload, Trash2, FileUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { importByKind, type ImportKind, type CsvValue } from '@/lib/growth/search-intelligence/csv';
import { useSearchIntelStore } from '@/lib/growth/search-intelligence/store';
import { humanize } from '@/lib/growth/format';
import { Badge, DataSourceBadge } from '../../_components/ui';
import { accent } from '../_ui';
import { ExportCsvButton } from '../ExportCsvButton';

const KINDS: ImportKind[] = ['keywords', 'rankings', 'backlinks'];

const TEMPLATE: Record<ImportKind, string> = {
  keywords: 'keyword,volume,difficulty,intent,sport,url',
  rankings: 'keyword,url,position,device,checked_at',
  backlinks: 'source_url,target_url,anchor,nofollow,authority',
};

export function KeywordTools({ exportRows }: { exportRows: Record<string, CsvValue>[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<ImportKind>('keywords');
  const [summary, setSummary] = useState<{ ok: number; errors: string[]; kind: ImportKind } | null>(null);

  const imported = useSearchIntelStore((s) => s.imported);
  const addKeywords = useSearchIntelStore((s) => s.addImportedKeywords);
  const addRankings = useSearchIntelStore((s) => s.addImportedRankings);
  const addBacklinks = useSearchIntelStore((s) => s.addImportedBacklinks);
  const clearImported = useSearchIntelStore((s) => s.clearImported);

  async function onFile(file: File) {
    const text = await file.text();
    const res = importByKind(kind, text);
    if (res.kind === 'keywords') addKeywords(res.result.rows);
    else if (res.kind === 'rankings') addRankings(res.result.rows);
    else addBacklinks(res.result.rows);
    setSummary({ ok: res.result.rows.length, errors: res.result.errors, kind });
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-4">
      {/* Import / export toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Import</span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as ImportKind)}
          className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-success"
        >
          {KINDS.map((k) => <option key={k} value={k}>{humanize(k)}</option>)}
        </select>
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-success hover:bg-success text-white text-xs font-semibold px-2.5 py-1.5"
        >
          <Upload className="w-3.5 h-3.5" /> Choose CSV…
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        <span className="text-[11px] text-muted-foreground/70 font-mono hidden sm:inline">cols: {TEMPLATE[kind]}</span>
        <div className="ml-auto"><ExportCsvButton rows={exportRows} filename="swingvantage-keywords.csv" label="Export keywords" /></div>
      </div>

      {/* Import summary */}
      {summary ? (
        <div className={`rounded-lg border p-3 text-xs ${summary.errors.length ? 'border-primary/30 bg-primary/10 text-link' : 'border-success/30 bg-success/10 text-success-text'}`}>
          <p className="flex items-center gap-1.5 font-medium">
            {summary.errors.length ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Imported {summary.ok} {humanize(summary.kind).toLowerCase()} row(s){summary.errors.length ? `, skipped ${summary.errors.length}` : ''}.
          </p>
          {summary.errors.slice(0, 4).map((e, i) => <p key={i} className="text-[11px] mt-0.5 opacity-90">{e}</p>)}
        </div>
      ) : null}

      {/* Imported keywords */}
      {imported.keywords.length > 0 ? (
        <ImportedSection title={`Imported keywords (${imported.keywords.length})`} onClear={() => clearImported('keywords')}>
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground"><tr><th className="py-1">Keyword</th><th>Intent</th><th className="text-right">Vol</th><th className="text-right">Diff</th><th className="text-right">Opp.</th><th>URL</th><th>Source</th></tr></thead>
            <tbody className="divide-y divide-border">
              {imported.keywords.slice(0, 100).map((k) => (
                <tr key={k.id}>
                  <td className="py-1 text-foreground">{k.keyword}</td>
                  <td className="text-muted-foreground">{humanize(k.intent)}</td>
                  <td className="text-right tabular-nums text-muted-foreground">{k.volumeEstimate}</td>
                  <td className="text-right tabular-nums text-muted-foreground">{k.difficultyEstimate}</td>
                  <td className={`text-right tabular-nums font-semibold ${accent(k.opportunityScore)}`}>{k.opportunityScore}</td>
                  <td className="font-mono text-muted-foreground truncate max-w-[160px]">{k.targetUrl ?? '—'}</td>
                  <td><DataSourceBadge source={k.dataSource} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex justify-end">
            <ExportCsvButton rows={imported.keywords as unknown as Record<string, CsvValue>[]} filename="imported-keywords.csv" />
          </div>
        </ImportedSection>
      ) : null}

      {/* Imported rankings */}
      {imported.rankings.length > 0 ? (
        <ImportedSection title={`Imported rankings (${imported.rankings.length})`} onClear={() => clearImported('rankings')}>
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground"><tr><th className="py-1">Keyword</th><th>URL</th><th className="text-right">Pos</th><th>Device</th><th>Checked</th></tr></thead>
            <tbody className="divide-y divide-border">
              {imported.rankings.slice(0, 100).map((r) => (
                <tr key={r.id}><td className="py-1 text-foreground">{r.keyword}</td><td className="font-mono text-muted-foreground truncate max-w-[180px]">{r.url}</td><td className="text-right tabular-nums text-foreground">{r.position}</td><td className="text-muted-foreground">{r.device}</td><td className="text-muted-foreground">{r.checkedAt}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex justify-end"><ExportCsvButton rows={imported.rankings as unknown as Record<string, CsvValue>[]} filename="imported-rankings.csv" /></div>
        </ImportedSection>
      ) : null}

      {/* Imported backlinks */}
      {imported.backlinks.length > 0 ? (
        <ImportedSection title={`Imported backlinks (${imported.backlinks.length})`} onClear={() => clearImported('backlinks')}>
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground"><tr><th className="py-1">Source</th><th>Target</th><th>Anchor</th><th className="text-right">Authority</th><th>Nofollow</th></tr></thead>
            <tbody className="divide-y divide-border">
              {imported.backlinks.slice(0, 100).map((b) => (
                <tr key={b.id}><td className="py-1 font-mono text-foreground truncate max-w-[160px]">{b.sourceDomain}</td><td className="font-mono text-muted-foreground truncate max-w-[160px]">{b.targetUrl}</td><td className="text-muted-foreground truncate max-w-[120px]">{b.anchorText || '—'}</td><td className="text-right tabular-nums text-muted-foreground">{b.authorityEstimate ?? '—'}</td><td className="text-muted-foreground">{b.nofollow ? 'yes' : 'no'}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex justify-end"><ExportCsvButton rows={imported.backlinks as unknown as Record<string, CsvValue>[]} filename="imported-backlinks.csv" /></div>
        </ImportedSection>
      ) : null}
    </div>
  );
}

function ImportedSection({ title, onClear, children }: { title: string; onClear: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2"><FileUp className="w-3.5 h-3.5 text-success-text" /><h3 className="text-xs font-semibold text-foreground">{title}</h3><Badge className="text-link bg-primary/10 border-primary/30">imported</Badge></div>
        <button onClick={onClear} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-error-text"><Trash2 className="w-3 h-3" /> Clear</button>
      </div>
      <div className="p-4 overflow-x-auto">{children}</div>
    </div>
  );
}
