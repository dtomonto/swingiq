'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Upload,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { IntakeQualityHint } from '@/components/agents/IntakeQualityHint';
import { cn } from '@/lib/utils';
import {
  parseCSV,
  detectColumnMapping,
  getMissingCriticalFields,
  getMissingRecommendedFields,
  getMissingFieldMessage,
  normalizeRow,
  type NormalizedShot,
} from '@swingiq/core';
import type { LaunchMonitorBrand, ClubCategory } from '@swingiq/core';

/** Best-effort mapping from a club name string to a typed ClubCategory. */
function inferClubCategory(clubName: string): ClubCategory {
  const n = clubName.toLowerCase();
  if (n.includes('driver') || n === 'dr' || n === '1w') return 'driver';
  if (n.includes('fairway') || /[2-5]w/.test(n)) return 'fairway_wood';
  if (n.includes('hybrid') || /[2-5]h/.test(n)) return 'hybrid';
  if (/^(2|3|4)\s?i(ron)?$/.test(n) || n === '2-iron' || n === '3-iron' || n === '4-iron') return 'long_iron';
  if (/^(5|6|7)\s?i(ron)?$/.test(n) || n === '5-iron' || n === '6-iron' || n === '7-iron') return 'mid_iron';
  if (/^(8|9)\s?i(ron)?$/.test(n) || n.includes('pw') || n.includes('pitching')) return 'short_iron';
  if (n.includes('wedge') || n.includes('aw') || n.includes('sw') || n.includes('lw') || n.includes('gap')) return 'wedge';
  if (n.includes('putter') || n === 'pt') return 'putter';
  // fall back to mid_iron as the most common default
  return 'mid_iron';
}
import { useSwingVantageStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import { schemaFingerprint, mappingConfidence } from '@/lib/import/mapping-memory';
import { detectSource, getSource } from '@/lib/import/sources';
import { buildShotsWithIntent, primaryClubOf, classifyNormalizedShots, summarizeShotMix } from '@/lib/import/process';
import type { ShotIntent } from '@/lib/shot-intent/classify';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const INTENT_LABEL: Record<ShotIntent, string> = {
  chip: 'chip', pitch: 'pitch', half: 'half', three_quarter: '¾', full: 'full', punch: 'punch', mishit: 'mishit',
};

const LAUNCH_MONITORS: { value: LaunchMonitorBrand; label: string; notes: string }[] = [
  { value: 'flightscope', label: 'FlightScope (Mevo, Mevo+, X3)', notes: 'Export from FS Golf app → Sessions → Export CSV' },
  { value: 'trackman', label: 'TrackMan (TM4, iO, Range)', notes: 'Export from TrackMan app → Session → Export to CSV' },
  { value: 'foresight', label: 'Foresight / Bushnell (GCQuad, GC3, Launch Pro)', notes: 'Export from FSX → File → Export Data' },
  { value: 'skytrak', label: 'SkyTrak / SkyTrak+', notes: 'Export from SkyTrak app → Session → Download CSV' },
  { value: 'uneekor', label: 'Uneekor (Eye Mini, Eye XO, Eye XR)', notes: 'Export from View software → Reports → CSV Export' },
  { value: 'garmin', label: 'Garmin Approach R10', notes: 'Export from Garmin Golf app → Activity → Export' },
  { value: 'rapsodo', label: 'Rapsodo (MLM, MLM2PRO)', notes: 'Export from Rapsodo app → History → Export CSV' },
  { value: 'full_swing', label: 'Full Swing KIT', notes: 'Export from Full Swing app' },
  { value: 'manual', label: 'Manual Entry / Other', notes: 'I will map my own columns' },
];

interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
  raw: string;
  /** What the robust parser had to do to read the file — shown for transparency. */
  meta: {
    delimiter: string;
    headerRowIndex: number;
    preambleCount: number;
    droppedSummaryRows: number;
    unitsRowSkipped: boolean;
  };
}

/** Human label for a detected delimiter. */
function delimiterLabel(d: string): string {
  if (d === '\t') return 'tab';
  if (d === ';') return 'semicolon';
  if (d === '|') return 'pipe';
  return 'comma';
}

/**
 * Ask the AI CSV agent to map columns this file's headers + a few sample
 * rows. Returns {} on any failure or when no AI provider is configured —
 * callers keep their deterministic mapping in that case.
 */
async function fetchAiMapping(
  headers: string[],
  rows: Record<string, string>[],
): Promise<Record<string, string>> {
  try {
    const sampleRows = rows.slice(0, 8).map((r) => headers.map((h) => r[h] ?? ''));
    const res = await fetch('/api/agents/csv-map', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headers, sampleRows }),
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { mapping?: Record<string, string> };
    return data && typeof data.mapping === 'object' && data.mapping ? data.mapping : {};
  } catch {
    return {};
  }
}

/** Plain-English note explaining what the robust parser had to clean up. */
function ParseMetaNote({ meta }: { meta: ParsedFile['meta'] }) {
  const bits: string[] = [];
  if (meta.delimiter !== ',') bits.push(`read ${delimiterLabel(meta.delimiter)}-separated values`);
  if (meta.preambleCount > 0)
    bits.push(`skipped ${meta.preambleCount} title/metadata row${meta.preambleCount > 1 ? 's' : ''}`);
  if (meta.unitsRowSkipped) bits.push('skipped a units row');
  if (meta.droppedSummaryRows > 0)
    bits.push(`dropped ${meta.droppedSummaryRows} summary row${meta.droppedSummaryRows > 1 ? 's' : ''} (Average/Std Dev)`);
  if (bits.length === 0) return null;
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
      <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>Cleaned your file automatically: {bits.join(', ')}.</span>
    </p>
  );
}

export function ImportWizard() {
  const { addSession, sessions, clubs, importMappings, rememberImportMapping } = useSwingVantageStore();
  const { activeSport } = useSport();
  const bagCarryByName = useMemo(
    () => Object.fromEntries(clubs.map((c) => [c.name, c.typical_carry])),
    [clubs],
  );
  const [step, setStep] = useState<WizardStep>(1);
  const [brand, setBrand] = useState<LaunchMonitorBrand | null>(null);
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  // Learned-mapping memory (Phase 3): fingerprint this file's layout, detect its
  // source, reuse a remembered mapping, and remember/learn on import.
  const [fingerprint, setFingerprint] = useState('');
  const [detectedSourceId, setDetectedSourceId] = useState<string | null>(null);
  const [reusedSaved, setReusedSaved] = useState(false);
  const [corrected, setCorrected] = useState(false);
  // Derived from the mapping — recompute whenever the file or mapping changes,
  // so manual remapping (step 3) and AI re-reads (step 5) reflect immediately
  // in the preview and warnings.
  const normalizedShots = useMemo<NormalizedShot[]>(
    () => (file ? file.rows.map((row) => normalizeRow(row, columnMapping, brand ?? 'manual')) : []),
    [file, columnMapping, brand],
  );
  const missingCritical = useMemo(() => getMissingCriticalFields(columnMapping), [columnMapping]);
  const missingRecommended = useMemo(() => getMissingRecommendedFields(columnMapping), [columnMapping]);
  // Shot-intent mix for the preview (Phase 6): chip/half/¾/full/punch/mishit.
  const shotMix = useMemo(() => {
    if (normalizedShots.length === 0) return null;
    return summarizeShotMix(classifyNormalizedShots(normalizedShots, { priorSessions: sessions, bagCarryByName }));
  }, [normalizedShots, sessions, bagCarryByName]);
  const [sessionName, setSessionName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // AI CSV agent + parse feedback
  const [aiAssisting, setAiAssisting] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [parseError, setParseError] = useState('');

  const steps = [
    'Choose launch monitor',
    'Upload file',
    'Map columns',
    'Review warnings',
    'Preview shots',
    'Name session',
    'Import',
  ];

  // ── File handling ─────────────────────────────────────────

  const handleFile = useCallback((f: File) => {
    setParseError('');
    setAiMessage('');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setParseError(
          "We couldn't find clear rows of shot data in this file. Make sure it's a CSV exported from your launch monitor — " +
          'or upload it anyway and use “This data looks wrong?” on the preview step to have our AI re-read it.',
        );
        return;
      }

      setFile({
        headers: parsed.headers,
        rows: parsed.rows,
        raw: text,
        meta: {
          delimiter: parsed.delimiter,
          headerRowIndex: parsed.headerRowIndex,
          preambleCount: parsed.preamble.length,
          droppedSummaryRows: parsed.droppedSummaryRows,
          unitsRowSkipped: parsed.unitsRow !== null,
        },
      });
      setSessionName(f.name.replace(/\.(csv|xlsx?|json)$/i, '').replace(/_/g, ' '));
      setAiUsed(false);

      // Fingerprint the layout + auto-detect the source (Phase 2/3).
      const fp = schemaFingerprint(parsed.headers);
      const detection = detectSource(parsed.headers, f.name);
      setFingerprint(fp);
      setDetectedSourceId(detection?.sourceId ?? null);
      setCorrected(false);

      // Reuse a remembered mapping for this exact layout — no remapping needed.
      const saved = importMappings[fp];
      if (saved && Object.keys(saved.mapping).length > 0) {
        setReusedSaved(true);
        setColumnMapping(saved.mapping);
        // High confidence → skip the mapping screen, jump straight to preview.
        setStep(mappingConfidence(saved.mapping) === 'high' ? 5 : 3);
        return;
      }
      setReusedSaved(false);

      let mapping = detectColumnMapping(parsed.headers, brand ?? 'manual');

      // Auto AI-assist: if the deterministic detector can't even find the
      // critical fields, let the AI agent read the headers + sample rows and
      // fill the gaps. Deterministic matches always win where they exist.
      if (getMissingCriticalFields(mapping).length > 0) {
        setAiAssisting(true);
        const ai = await fetchAiMapping(parsed.headers, parsed.rows);
        setAiAssisting(false);
        if (Object.keys(ai).length > 0) {
          mapping = { ...ai, ...mapping };
          setAiUsed(true);
        }
      }

      // The live effect below recomputes shots + missing fields from mapping.
      setColumnMapping(mapping);
      setStep(3);
    };
    reader.readAsText(f);
  }, [brand]);

  // "This data looks wrong?" — hand the file to the AI agent and let it
  // override the current mapping. Used on the preview step.
  const reReadWithAI = useCallback(async () => {
    if (!file) return;
    setAiMessage('');
    setAiAssisting(true);
    const ai = await fetchAiMapping(file.headers, file.rows);
    setAiAssisting(false);
    if (Object.keys(ai).length > 0) {
      setColumnMapping((prev) => ({ ...prev, ...ai }));
      setAiUsed(true);
      setAiMessage('Our AI re-read your file and updated the column mapping. Check the preview below.');
    } else {
      setAiMessage(
        "Our AI couldn't confidently re-map this file (it may need an API key, or the columns are very unusual). " +
        'Use “Fix the columns myself” to map them by hand.',
      );
    }
  }, [file]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  // ── Column mapping editor ─────────────────────────────────

  // Full universal data-point set (covers documented FlightScope + TrackMan
  // parameters) so every column can be mapped by hand if needed.
  const UNIVERSAL_FIELDS = [
    { key: 'club', label: 'Club Name', critical: true },
    { key: 'carry_distance', label: 'Carry Distance', critical: true },
    { key: 'total_distance', label: 'Total Distance', critical: false },
    { key: 'roll_distance', label: 'Roll / Run', critical: false },
    { key: 'ball_speed', label: 'Ball Speed', critical: false },
    { key: 'club_speed', label: 'Club Speed', critical: false },
    { key: 'smash_factor', label: 'Smash Factor', critical: false },
    { key: 'launch_angle', label: 'Launch Angle (vert.)', critical: false },
    { key: 'launch_direction', label: 'Launch Direction (horiz.)', critical: false },
    { key: 'spin_rate', label: 'Spin Rate', critical: false },
    { key: 'spin_axis', label: 'Spin Axis / Side Spin', critical: false },
    { key: 'apex_height', label: 'Apex / Max Height', critical: false },
    { key: 'descent_angle', label: 'Descent / Landing Angle', critical: false },
    { key: 'curve', label: 'Curve', critical: false },
    { key: 'hang_time', label: 'Hang / Flight Time', critical: false },
    { key: 'side_carry', label: 'Side Carry (offline)', critical: false },
    { key: 'lateral_offline', label: 'Total Offline / Side', critical: false },
    { key: 'attack_angle', label: 'Attack Angle', critical: false },
    { key: 'club_path', label: 'Club Path', critical: false },
    { key: 'face_angle', label: 'Face Angle (to target)', critical: false },
    { key: 'face_to_path', label: 'Face-to-Path', critical: false },
    { key: 'dynamic_loft', label: 'Dynamic Loft', critical: false },
    { key: 'spin_loft', label: 'Spin Loft', critical: false },
    { key: 'swing_plane_vertical', label: 'Swing Plane (vert.)', critical: false },
    { key: 'swing_plane_horizontal', label: 'Swing Plane (horiz.)', critical: false },
    { key: 'swing_direction', label: 'Swing Direction', critical: false },
    { key: 'closure_rate', label: 'Face Closure Rate', critical: false },
    { key: 'dynamic_lie', label: 'Dynamic Lie', critical: false },
    { key: 'low_point', label: 'Low Point', critical: false },
    { key: 'impact_location_lateral', label: 'Strike Location (toe/heel)', critical: false },
    { key: 'impact_location_vertical', label: 'Strike Location (high/low)', critical: false },
  ];

  // ── Import to local store ─────────────────────────────────

  const runImport = async () => {
    setImporting(true);
    await new Promise((r) => setTimeout(r, 600));

    // Build Shot[] with per-shot intent classification (Phase 6), learning
    // baselines from the athlete's history + this file. Shared with bulk import.
    const shots = buildShotsWithIntent(normalizedShots, { priorSessions: sessions, bagCarryByName });
    const primaryClub = primaryClubOf(shots);

    addSession({
      name: sessionName || `Session ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      sport: activeSport,
      club_name: primaryClub,
      club_category: inferClubCategory(primaryClub),
      launch_monitor: brand ?? 'manual',
      indoor_outdoor: 'outdoor',
      mat_or_grass: 'mat',
      notes: '',
      shot_count: shots.length,
      shots,
      diagnoses: [],
      swing_score: null,
    });

    // Remember the mapping for this layout so a future upload of the same
    // export skips remapping (Phase 3). A manual edit (corrected) is sticky.
    if (fingerprint && Object.keys(columnMapping).length > 0) {
      rememberImportMapping({
        fingerprint,
        sourceId: detectedSourceId ?? brand ?? 'manual',
        mapping: columnMapping,
        headers: file?.headers ?? [],
        corrected,
      });
    }

    setImporting(false);
    setImportDone(true);
    setStep(7);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Import Launch-Monitor Data</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Follow the steps below to import your session. The app will detect column names automatically.
        </p>
      </div>

      {/* Pre-analysis quality hint (agent layer) */}
      <div className="mb-6 empty:hidden">
        <IntakeQualityHint />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto">
        {steps.map((label, i) => {
          const n = (i + 1) as WizardStep;
          const isActive = n === step;
          const isDone = n < step;
          return (
            <div key={n} className="flex items-center gap-1 shrink-0">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isActive ? 'bg-primary text-white' : isDone ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                <span className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  isActive ? 'bg-card text-primary' : isDone ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
                )}>
                  {isDone ? '✓' : n}
                </span>
                <span className="hidden sm:block">{label}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step 1 — Choose launch monitor */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Choose Your Launch Monitor</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Select the brand and model you used. This helps the app recognize your column names automatically.
            </p>
          </CardHeader>
          <CardBody className="space-y-2">
            {LAUNCH_MONITORS.map((lm) => (
              <button
                key={lm.value}
                onClick={() => setBrand(lm.value)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                  brand === lm.value
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
                    : 'border-border hover:border-primary/40 hover:bg-primary/10',
                )}
              >
                <p className="font-medium text-foreground text-sm">{lm.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{lm.notes}</p>
              </button>
            ))}
            <div className="pt-3 border-t">
              <div className="flex items-start gap-2 p-3 bg-accent-secondary/10 rounded-lg">
                <Info size={16} className="text-accent-secondary shrink-0 mt-0.5" />
                <p className="text-xs text-accent-secondary">
                  <strong>Don&rsquo;t see your device?</strong> Choose &ldquo;Manual Entry / Other&rdquo; — you&rsquo;ll map the columns yourself in Step 3.
                </p>
              </div>
            </div>
            <Button onClick={() => setStep(2)} disabled={!brand} className="w-full mt-2">
              Next: Upload File <ChevronRight size={16} />
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Step 2 — Upload file */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Step 2: Upload Your CSV File</CardTitle>
              <Badge variant="info">{LAUNCH_MONITORS.find((lm) => lm.value === brand)?.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Export a CSV from your launch monitor software, then drag it here or click to browse.
            </p>
          </CardHeader>
          <CardBody>
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={cn(
                'border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer',
                dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-primary/10',
              )}
            >
              <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground">Drag and drop your CSV file here</p>
              <p className="text-sm text-muted-foreground mt-1">or</p>
              <label className="mt-3 inline-block cursor-pointer">
                <input type="file" accept=".csv,.xlsx" className="hidden" onChange={onFileInput} />
                <span className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary">
                  Browse for file
                </span>
              </label>
              <p className="text-xs text-muted-foreground mt-3">Supports .csv and .xlsx files</p>
            </div>

            {aiAssisting && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
                <Sparkles size={16} className="animate-pulse shrink-0" />
                Reading your file with AI to figure out the columns…
              </div>
            )}
            {parseError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            <div className="mt-4 p-4 bg-muted rounded-lg border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">How to export from your device:</p>
              <p className="text-xs text-muted-foreground italic">
                {LAUNCH_MONITORS.find((lm) => lm.value === brand)?.notes}
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft size={16} /> Back
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 3 — Map columns */}
      {step === 3 && file && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Confirm Column Mapping</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              The app detected {file.rows.length} shots and auto-mapped your columns. Adjust any mappings that look wrong.
            </p>
            {reusedSaved && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <CheckCircle size={13} aria-hidden="true" /> Reused the mapping you saved for this file layout — no remapping needed.
              </p>
            )}
            {aiUsed && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Wand2 size={13} aria-hidden="true" /> AI helped map unfamiliar columns — double-check the matches below.
              </p>
            )}
            {detectedSourceId && (
              <p className="mt-2 text-xs text-muted-foreground">
                Detected source:{' '}
                <strong className="text-foreground">{getSource(detectedSourceId)?.name ?? detectedSourceId}</strong>
              </p>
            )}
            <ParseMetaNote meta={file.meta} />
          </CardHeader>
          <CardBody>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {UNIVERSAL_FIELDS.map(({ key, label, critical }) => (
                <div key={key} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                  <div className="w-40 shrink-0">
                    <span className="text-sm text-foreground">{label}</span>
                    {critical && <Badge variant="danger" className="ml-2 text-xs">Required</Badge>}
                  </div>
                  <select
                    value={columnMapping[key] ?? ''}
                    onChange={(e) => {
                      setCorrected(true);
                      setColumnMapping((m) => ({ ...m, [key]: e.target.value }));
                    }}
                    className="flex-1 text-sm border border-border rounded-md px-2 py-1.5 bg-card"
                  >
                    <option value="">(not in file)</option>
                    {file.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  {columnMapping[key] ? (
                    <CheckCircle size={16} className="text-primary shrink-0" />
                  ) : (
                    <div className="w-4" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={missingCritical.length > 0}
                className="flex-1"
              >
                Next: Review Warnings <ChevronRight size={16} />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 4 — Warnings */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Review Warnings</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {missingCritical.length > 0 && (
              <div className="p-4 bg-error/10 rounded-lg border border-error/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-error" />
                  <p className="font-semibold text-error text-sm">Missing Required Fields</p>
                </div>
                <p className="text-sm text-error">{missingCritical.join(', ')} — these fields are required. Go back and map them.</p>
              </div>
            )}

            {missingRecommended.length > 0 && (
              <div className="p-4 bg-warning/10 rounded-lg border border-warning/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-warning" />
                  <p className="font-semibold text-warning text-sm">Limited Diagnostic Data</p>
                </div>
                <p className="text-sm text-warning">{getMissingFieldMessage(missingRecommended)}</p>
              </div>
            )}

            {missingCritical.length === 0 && missingRecommended.length === 0 && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" />
                  <p className="font-semibold text-primary text-sm">All key fields detected. Full diagnostic is available.</p>
                </div>
              </div>
            )}

            <div className="p-4 bg-muted rounded-lg border text-sm text-muted-foreground">
              <p><strong>{normalizedShots.length}</strong> shots detected.</p>
              <p className="mt-1">Clubs found: {[...new Set(normalizedShots.map((s) => s.club_name))].join(', ')}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button onClick={() => setStep(5)} className="flex-1">
                Next: Preview Shots <ChevronRight size={16} />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 5 — Preview */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 5: Preview Shots</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">First 10 shots shown. Verify the data looks correct before importing.</p>
            {shotMix && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Shot types inferred from your distances:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(shotMix) as [ShotIntent, number][])
                    .filter(([, n]) => n > 0)
                    .map(([intent, n]) => (
                      <span key={intent} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {n} {INTENT_LABEL[intent]}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold text-muted-foreground">#</th>
                    <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Club</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Carry</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Ball Spd</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Launch°</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Spin</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground">F-to-P</th>
                    <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Path</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedShots.slice(0, 10).map((shot, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted">
                      <td className="py-2 px-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 px-2 font-medium text-foreground">{shot.club_name}</td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {shot.ball_data.carry_distance?.toFixed(0) ?? '—'}
                      </td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {shot.ball_data.ball_speed?.toFixed(1) ?? '—'}
                      </td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {shot.ball_data.launch_angle_vertical?.toFixed(1) ?? '—'}
                      </td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {shot.ball_data.spin_rate?.toFixed(0) ?? '—'}
                      </td>
                      <td className={cn(
                        'py-2 px-2 text-right font-medium',
                        (shot.club_data.face_to_path ?? 0) > 3 ? 'text-error' :
                        (shot.club_data.face_to_path ?? 0) < -3 ? 'text-accent-secondary' : 'text-primary',
                      )}>
                        {shot.club_data.face_to_path !== null ? `${(shot.club_data.face_to_path ?? 0).toFixed(1)}°` : '—'}
                      </td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {shot.club_data.club_path !== null ? `${(shot.club_data.club_path ?? 0).toFixed(1)}°` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* "This data looks wrong?" — recovery path: AI re-read or manual fix. */}
            <div className="mt-5 rounded-xl border border-warning/30 bg-warning/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                <AlertTriangle size={16} className="shrink-0" /> Does this data look wrong?
              </p>
              <p className="mt-1 text-sm text-warning">
                If the numbers look off or a column landed in the wrong place, let our AI re-read your file —
                or fix the columns yourself.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button onClick={reReadWithAI} loading={aiAssisting} className="gap-1.5">
                  <Sparkles size={15} /> Re-read my file with AI
                </Button>
                <Button variant="outline" onClick={() => setStep(3)} className="gap-1.5">
                  <Wand2 size={15} /> Fix the columns myself
                </Button>
              </div>
              {aiMessage && <p className="mt-2 text-xs text-warning">{aiMessage}</p>}
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(4)}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button onClick={() => setStep(6)} className="flex-1">
                Next: Name Session <ChevronRight size={16} />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 6 — Name session */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 6: Name Your Session</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label htmlFor="import-session-name" className="text-sm font-medium text-foreground block mb-1">Session Name</label>
              <input
                id="import-session-name"
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="e.g. Range Session — Driver, May 25"
              />
            </div>

            <div className="p-4 bg-muted rounded-lg border text-sm space-y-1">
              <p className="font-semibold text-foreground">Ready to import:</p>
              <p className="text-muted-foreground">{normalizedShots.length} shots · {brand}</p>
              <p className="text-muted-foreground">Clubs: {[...new Set(normalizedShots.map((s) => s.club_name))].join(', ')}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(5)}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button onClick={runImport} loading={importing} className="flex-1">
                Import Session
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 7 — Done */}
      {step === 7 && importDone && (
        <Card>
          <CardBody className="py-12 text-center space-y-4">
            <CheckCircle size={48} className="mx-auto text-primary" />
            <h2 className="text-xl font-bold text-foreground">Session Imported!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {normalizedShots.length} shots have been saved. The diagnostic engine is ready to analyze your data.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/diagnose">
                <Button>Run Diagnostic Engine</Button>
              </Link>
              <Link href="/sessions">
                <Button variant="outline">View Session</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
