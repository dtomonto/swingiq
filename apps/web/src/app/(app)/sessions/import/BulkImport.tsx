'use client';

// ============================================================
// SwingVantage — Bulk / historical import (Phase 2)
// ------------------------------------------------------------
// Upload many session files at once (CSV / XLSX / JSON). Each file is
// analyzed deterministically (lib/import/process.analyzeFile): source
// auto-detected, columns mapped from LEARNED MEMORY first (Phase 3) then
// the deterministic detector, rows normalized. Duplicates (same shots,
// already in your record or earlier in this batch) are detected and
// skipped. You preview everything, deselect anything, then import — and
// the mappings used are remembered for next time.
// ============================================================

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Upload, CheckCircle, AlertTriangle, FileText, Copy, Loader2, X, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useSwingVantageStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import { analyzeFile, buildShotsWithIntent, primaryClubOf, inferClubCategory, shotsSignature, type AnalyzedFile } from '@/lib/import/process';
import { getSource } from '@/lib/import/sources';
import type { MappingConfidence } from '@/lib/import/mapping-memory';

type RowStatus = 'ready' | 'duplicate' | 'error' | 'low';

interface FileRow {
  id: string;
  fileName: string;
  analyzed: AnalyzedFile;
  status: RowStatus;
  include: boolean;
  sessionName: string;
  imported: boolean;
}

function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? '');
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsText(file);
  });
}

const CONF_BADGE: Record<MappingConfidence, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  high: { variant: 'success', label: 'High confidence' },
  medium: { variant: 'warning', label: 'Review' },
  low: { variant: 'danger', label: 'Needs mapping' },
};

export function BulkImport() {
  const { addSession, sessions, clubs, importMappings, rememberImportMapping } = useSwingVantageStore();
  const { activeSport } = useSport();
  const bagCarryByName = useMemo(
    () => Object.fromEntries(clubs.map((c) => [c.name, c.typical_carry])),
    [clubs],
  );
  const [rows, setRows] = useState<FileRow[]>([]);
  const [reading, setReading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  // Signatures of sessions already in the athlete record — for dedupe.
  const existingSignatures = useMemo(
    () => new Set(sessions.map((s) => shotsSignature(s.shots))),
    [sessions],
  );

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setReading(true);
    setImportedCount(null);

    // Dedupe within this batch too (a user may drop the same file twice).
    const batchSignatures = new Set<string>(existingSignatures);
    const next: FileRow[] = [];

    for (const file of files) {
      let analyzed: AnalyzedFile;
      try {
        const text = await readText(file);
        analyzed = analyzeFile(file.name, text, {
          lookupSaved: (fp) => importMappings[fp],
        });
      } catch {
        analyzed = {
          fileName: file.name, ok: false, error: 'Could not read this file.',
          headers: [], rows: [], meta: { delimiter: ',', headerRowIndex: 0, preambleCount: 0, droppedSummaryRows: 0, unitsRowSkipped: false, format: 'csv' },
          fingerprint: 'empty', detectedSourceId: null, brand: 'manual', mapping: {}, confidence: 'low', reusedSavedMapping: false, normalizedShots: [], signature: 'empty',
        };
      }

      let status: RowStatus;
      if (!analyzed.ok) status = 'error';
      else if (batchSignatures.has(analyzed.signature)) status = 'duplicate';
      else if (analyzed.confidence === 'low') status = 'low';
      else status = 'ready';

      if (analyzed.ok && status !== 'duplicate') batchSignatures.add(analyzed.signature);

      next.push({
        id: `${file.name}_${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        analyzed,
        status,
        include: status === 'ready' || status === 'low',
        sessionName: file.name.replace(/\.(csv|xlsx?|json)$/i, '').replace(/_/g, ' '),
        imported: false,
      });
    }

    setRows((prev) => [...prev, ...next]);
    setReading(false);
  }, [existingSignatures, importMappings]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const toggleInclude = (id: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, include: !r.include } : r)));
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));
  const clearAll = () => { setRows([]); setImportedCount(null); };

  const selected = rows.filter((r) => r.include && r.analyzed.ok && !r.imported);

  const runImport = () => {
    let count = 0;
    for (const r of selected) {
      const a = r.analyzed;
      // Classify each shot's intent against the athlete's history + this file.
      const shots = buildShotsWithIntent(a.normalizedShots, { priorSessions: sessions, bagCarryByName });
      const primaryClub = primaryClubOf(shots);
      addSession({
        name: r.sessionName || `Session ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        sport: activeSport,
        club_name: primaryClub,
        club_category: inferClubCategory(primaryClub),
        launch_monitor: a.brand,
        indoor_outdoor: 'outdoor',
        mat_or_grass: 'mat',
        notes: '',
        shot_count: shots.length,
        shots,
        diagnoses: [],
        swing_score: null,
      });
      // Remember the mapping used so the same layout never needs remapping.
      if (Object.keys(a.mapping).length > 0) {
        rememberImportMapping({
          fingerprint: a.fingerprint,
          sourceId: a.detectedSourceId ?? a.brand,
          mapping: a.mapping,
          headers: a.headers,
        });
      }
      count++;
    }
    setRows((prev) => prev.map((r) => (r.include && r.analyzed.ok && !r.imported ? { ...r, imported: true } : r)));
    setImportedCount(count);
  };

  const totals = useMemo(() => {
    const ready = rows.filter((r) => r.status === 'ready' || r.status === 'low').length;
    const dupes = rows.filter((r) => r.status === 'duplicate').length;
    const errors = rows.filter((r) => r.status === 'error').length;
    const shots = selected.reduce((sum, r) => sum + r.analyzed.normalizedShots.length, 0);
    return { ready, dupes, errors, shots };
  }, [rows, selected]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Layers size={24} className="text-primary" /> Bulk Import
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Drop in a whole history at once — CSV, Excel, or JSON. SwingVantage detects each file&rsquo;s
          source, reuses any mapping it has learned, skips duplicates, and lets you review before saving.
        </p>
      </div>

      {/* Dropzone. Drag-and-drop is a pointer-only progressive enhancement; the
          keyboard-accessible path is the "Browse for files" <input type="file"> below. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
        )}
      >
        <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
        <p className="font-medium text-foreground">Drag and drop multiple files</p>
        <p className="text-sm text-muted-foreground mt-1">or</p>
        <label className="mt-2 inline-block cursor-pointer">
          <input type="file" accept=".csv,.xlsx,.json" multiple className="hidden" onChange={onFileInput} />
          <span className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            Browse for files
          </span>
        </label>
        <p className="text-xs text-muted-foreground mt-2">Supports .csv, .xlsx, and .json — many at once</p>
        {reading && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-primary">
            <Loader2 size={15} className="animate-spin" /> Reading files…
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{rows.length} file{rows.length === 1 ? '' : 's'}</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{totals.ready} ready</span>
              {totals.dupes > 0 && <span className="text-warning">{totals.dupes} duplicate</span>}
              {totals.errors > 0 && <span className="text-error">{totals.errors} error</span>}
              <button onClick={clearAll} className="text-muted-foreground hover:text-foreground underline">Clear</button>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            {rows.map((r) => {
              const src = r.analyzed.detectedSourceId ? getSource(r.analyzed.detectedSourceId) : null;
              return (
                <div
                  key={r.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3',
                    r.imported ? 'border-success/40 bg-success/10' :
                    r.status === 'error' ? 'border-error/30 bg-error/5' :
                    r.status === 'duplicate' ? 'border-warning/30 bg-warning/5' : 'border-border',
                  )}
                >
                  {r.status !== 'error' && !r.imported && (
                    <input
                      type="checkbox"
                      checked={r.include}
                      onChange={() => toggleInclude(r.id)}
                      aria-label={`Include ${r.fileName}`}
                      className="size-4 shrink-0 accent-[var(--color-primary)]"
                    />
                  )}
                  <FileText size={18} className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.fileName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.status === 'error'
                        ? r.analyzed.error
                        : `${r.analyzed.normalizedShots.length} shots · ${src?.name ?? r.analyzed.brand}`}
                      {r.analyzed.reusedSavedMapping && r.status !== 'error' && ' · reused saved mapping'}
                    </p>
                  </div>
                  {/* Status badge */}
                  {r.imported ? (
                    <Badge variant="success" className="shrink-0"><CheckCircle size={12} className="mr-1" /> Imported</Badge>
                  ) : r.status === 'error' ? (
                    <Badge variant="danger" className="shrink-0"><AlertTriangle size={12} className="mr-1" /> Error</Badge>
                  ) : r.status === 'duplicate' ? (
                    <Badge variant="warning" className="shrink-0"><Copy size={12} className="mr-1" /> Duplicate</Badge>
                  ) : (
                    <Badge variant={CONF_BADGE[r.analyzed.confidence].variant} className="shrink-0">
                      {CONF_BADGE[r.analyzed.confidence].label}
                    </Badge>
                  )}
                  {!r.imported && (
                    <button onClick={() => removeRow(r.id)} aria-label={`Remove ${r.fileName}`} className="shrink-0 text-muted-foreground hover:text-foreground">
                      <X size={15} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Low-confidence note: route to the guided wizard to map by hand. */}
            {rows.some((r) => r.status === 'low' && !r.imported) && (
              <p className="flex items-start gap-1.5 pt-1 text-xs text-warning">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span>
                  Some files need column mapping. You can import them now (distance + club only) or use the
                  guided importer to map them in detail — once mapped, that layout is remembered here too.
                </span>
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Import action / summary */}
      {importedCount !== null ? (
        <Card>
          <CardBody className="py-8 text-center space-y-3">
            <CheckCircle size={40} className="mx-auto text-success" />
            <h2 className="text-lg font-bold text-foreground">
              Imported {importedCount} session{importedCount === 1 ? '' : 's'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {totals.dupes > 0 && `${totals.dupes} duplicate file${totals.dupes === 1 ? '' : 's'} skipped. `}
              Your athlete record now reflects the new data.
            </p>
            <div className="flex justify-center gap-3 pt-1">
              <Link href="/sessions"><Button>View Sessions</Button></Link>
              <Link href="/progress"><Button variant="outline">See Progress</Button></Link>
            </div>
          </CardBody>
        </Card>
      ) : rows.length > 0 ? (
        <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{selected.length}</strong> selected ·{' '}
            <strong className="text-foreground">{totals.shots}</strong> shots
          </p>
          <Button onClick={runImport} disabled={selected.length === 0}>
            Import {selected.length} session{selected.length === 1 ? '' : 's'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
