'use client';

// ============================================================
// SwingIQ — Import from Screenshot or Photo
// 4-step wizard: Upload → Extract & Review → Confirm → Analysis
// ============================================================

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSport } from '@/contexts/SportContext';
import type { ImageExtractionSource } from '@swingiq/core';

// ── Sport movement types ──────────────────────────────────────

const MOVEMENT_TYPES: Record<string, Array<{ value: string; label: string }>> = {
  golf: [
    { value: 'full_swing', label: 'Full Swing' },
    { value: 'iron_shot', label: 'Iron Shot' },
    { value: 'driver', label: 'Driver' },
    { value: 'wedge', label: 'Wedge / Short Game' },
    { value: 'putting', label: 'Putting' },
  ],
  tennis: [
    { value: 'forehand', label: 'Forehand Groundstroke' },
    { value: 'backhand', label: 'Backhand Groundstroke' },
    { value: 'serve', label: 'Serve' },
    { value: 'volley', label: 'Volley' },
    { value: 'overhead', label: 'Overhead / Smash' },
  ],
  baseball: [
    { value: 'batting', label: 'Batting / Full Swing' },
    { value: 'tee_work', label: 'Tee Work' },
    { value: 'soft_toss', label: 'Soft Toss' },
    { value: 'live_hitting', label: 'Live Hitting / BP' },
  ],
  softball_slow: [
    { value: 'batting', label: 'Batting / Full Swing' },
    { value: 'tee_work', label: 'Tee Work' },
    { value: 'live_hitting', label: 'Live Hitting' },
  ],
  softball_fast: [
    { value: 'batting', label: 'Batting / Full Swing' },
    { value: 'tee_work', label: 'Tee Work' },
    { value: 'live_hitting', label: 'Live Hitting / BP' },
  ],
};

// ── Data source options ───────────────────────────────────────

const DATA_SOURCES: Array<{ value: ImageExtractionSource; label: string }> = [
  { value: 'flightscope', label: 'FlightScope' },
  { value: 'trackman', label: 'TrackMan' },
  { value: 'foresight', label: 'Foresight / GCQuad' },
  { value: 'hittrax', label: 'HitTrax' },
  { value: 'rapsodo', label: 'Rapsodo' },
  { value: 'garmin', label: 'Garmin Approach' },
  { value: 'blast_motion', label: 'Blast Motion' },
  { value: 'zepp', label: 'Zepp Sensor' },
  { value: 'diamond_kinetics', label: 'Diamond Kinetics' },
  { value: 'tennis_sensor', label: 'Tennis Sensor' },
  { value: 'spreadsheet', label: 'Spreadsheet / Manual Table' },
  { value: 'generic', label: 'Other / Unknown' },
];

// ── Default column headers per source ───────────────────────

const DEFAULT_COLUMNS: Partial<Record<ImageExtractionSource, string[]>> = {
  flightscope: ['Club', 'Ball Speed (mph)', 'Club Speed (mph)', 'Launch Angle (deg)', 'Spin Rate (rpm)', 'Carry (yds)', 'Total (yds)', 'Club Path (deg)', 'Face Angle (deg)'],
  trackman: ['Club', 'Ball Speed', 'Club Speed', 'Launch Angle', 'Spin Rate', 'Carry', 'Total', 'Club Path', 'Face Angle', 'Attack Angle'],
  foresight: ['Club', 'Ball Speed', 'Club Speed', 'Launch Angle', 'Back Spin', 'Side Spin', 'Carry', 'Side'],
  hittrax: ['Exit Velocity (mph)', 'Launch Angle (deg)', 'Distance (ft)', 'Spray Angle (deg)', 'Result'],
  rapsodo: ['Ball Speed (mph)', 'Launch Angle (deg)', 'Carry (yds)', 'Total Spin (rpm)', 'Spin Axis (deg)'],
  garmin: ['Club', 'Carry (yds)', 'Total (yds)', 'Club Speed (mph)', 'Ball Speed (mph)', 'Launch Angle (deg)'],
  blast_motion: ['Bat Speed (mph)', 'Attack Angle (deg)', 'On-Plane %', 'Time to Contact (ms)', 'Peak Hand Speed (mph)'],
  zepp: ['Bat Speed (mph)', 'Attack Angle (deg)', 'Time to Contact (ms)', 'Zone Speed (mph)'],
  diamond_kinetics: ['Bat Speed (mph)', 'Attack Angle (deg)', 'Time to Contact (ms)', 'Impact Momentum'],
  tennis_sensor: ['Racquet Speed (mph)', 'Spin (rpm)', 'Efficiency %', 'Stroke Type'],
  spreadsheet: ['Column 1', 'Column 2', 'Column 3', 'Column 4'],
  generic: ['Column 1', 'Column 2', 'Column 3', 'Column 4'],
};

// ── Step indicator ────────────────────────────────────────────

const STEPS = ['Upload', 'Review Data', 'Confirm', 'Analysis'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                  done ? 'bg-green-600 border-green-600 text-white' : '',
                  active ? 'bg-white border-green-600 text-green-700' : '',
                  !done && !active ? 'bg-white border-gray-300 text-gray-400' : '',
                ].join(' ')}
              >
                {done ? '✓' : stepNum}
              </div>
              <span
                className={[
                  'text-xs mt-1 font-medium hidden sm:block',
                  active ? 'text-green-700' : done ? 'text-green-600' : 'text-gray-400',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'h-0.5 w-8 sm:w-12 mx-1 mt-0 sm:-mt-4 transition-colors',
                  done ? 'bg-green-600' : 'bg-gray-200',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Confidence badge ──────────────────────────────────────────

function ConfidenceBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-red-100 text-red-700',
    unreviewed: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${styles[level] ?? styles.unreviewed}`}>
      {level}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function ImageImportPage() {
  const { activeSport, sportName } = useSport();

  // Wizard state
  const [step, setStep] = useState(1);

  // Step 1 state
  const [sport, setSport] = useState(activeSport);
  const [movementType, setMovementType] = useState('');
  const [dataSource, setDataSource] = useState<ImageExtractionSource>('generic');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<string[][]>([]);
  const warnings = [
    'Automatic extraction is not yet enabled. Please enter your data manually below.',
    'Upload your image for reference, then type your values into the table.',
  ];

  // Step 4 state
  const [saved, setSaved] = useState(false);

  const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

  // ── File handling ─────────────────────────────────────────

  const handleFileSelect = useCallback((file: File) => {
    setFileSizeError(null);
    if (file.size > MAX_FILE_BYTES) {
      setFileSizeError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB. Please resize your image and try again.`);
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  }, []);

  const onInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragOver(false), []);

  // ── Step transitions ──────────────────────────────────────

  const goToStep2 = useCallback(() => {
    // Initialize column headers from selected source
    const defaultCols = DEFAULT_COLUMNS[dataSource] ?? ['Column 1', 'Column 2', 'Column 3'];
    setColumnHeaders(defaultCols);
    setTableRows([Array(defaultCols.length).fill('')]);
    setStep(2);
  }, [dataSource]);

  const addRow = useCallback(() => {
    setTableRows((prev) => [...prev, Array(columnHeaders.length).fill('')]);
  }, [columnHeaders.length]);

  const deleteRow = useCallback((i: number) => {
    setTableRows((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const updateCell = useCallback((rowIdx: number, colIdx: number, val: string) => {
    setTableRows((prev) =>
      prev.map((row, ri) =>
        ri === rowIdx ? row.map((cell, ci) => (ci === colIdx ? val : cell)) : row,
      ),
    );
  }, []);

  const updateHeader = useCallback((colIdx: number, val: string) => {
    setColumnHeaders((prev) => prev.map((h, i) => (i === colIdx ? val : h)));
  }, []);

  const addColumn = useCallback(() => {
    const newHeader = `Column ${columnHeaders.length + 1}`;
    setColumnHeaders((prev) => [...prev, newHeader]);
    setTableRows((prev) => prev.map((row) => [...row, '']));
  }, [columnHeaders.length]);

  const hasAtLeastOneRow = tableRows.some((row) => row.some((cell) => cell.trim() !== ''));

  const handleSave = useCallback(() => {
    // In a full implementation this would persist to Supabase / local store
    setSaved(true);
    setStep(4);
  }, []);

  const movementOptions = MOVEMENT_TYPES[sport] ?? MOVEMENT_TYPES['golf']!;
  const sportOptions: Array<{ value: string; label: string }> = [
    { value: 'golf', label: 'Golf' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'baseball', label: 'Baseball' },
    { value: 'softball_slow', label: 'Slow Pitch Softball' },
    { value: 'softball_fast', label: 'Fast Pitch Softball' },
  ];

  // ── Render ────────────────────────────────────────────────

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Import from Screenshot or Photo</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload a photo of your launch monitor screen or stats table, then enter your data manually.
          </p>
        </div>

        <StepIndicator current={step} />

        {/* ── STEP 1: Upload ── */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1 — Select sport, source & upload image</CardTitle>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Sport selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                <select
                  value={sport}
                  onChange={(e) => {
                    setSport(e.target.value as typeof activeSport);
                    setMovementType('');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {sportOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Movement type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Movement / Shot Type</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— Select —</option>
                  {movementOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Data source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Source / Device</label>
                <select
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value as ImageExtractionSource)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {DATA_SOURCES.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Upload area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image (optional but recommended)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  className={[
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                    isDragOver ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {imagePreviewUrl ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreviewUrl}
                        alt="Uploaded preview"
                        className="max-h-48 mx-auto rounded-lg object-contain border border-gray-200"
                      />
                      <p className="text-sm text-gray-600 font-medium">{imageFile?.name}</p>
                      <p className="text-xs text-gray-400">Click to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📷</div>
                      <p className="text-sm font-medium text-gray-700">
                        Drag & drop or click to upload
                      </p>
                      <p className="text-xs text-gray-400">
                        JPEG, PNG, WebP, HEIC — max 10 MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  onChange={onInputChange}
                  className="hidden"
                  aria-label="Upload image file"
                />
                {fileSizeError && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {fileSizeError}
                  </p>
                )}
              </div>

              {/* Next button */}
              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={goToStep2}
                  disabled={!movementType}
                  className="gap-2"
                >
                  Next: Review Data →
                </Button>
              </div>
              {!movementType && (
                <p className="text-xs text-gray-400 text-right -mt-4">
                  Please select a movement type to continue.
                </p>
              )}
            </CardBody>
          </Card>
        )}

        {/* ── STEP 2: Extract & Review ── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Notice banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-amber-800">Auto-extract is coming soon.</p>
              <p className="text-sm text-amber-700">
                Please type your values into the table below. Your uploaded image is shown for reference.
              </p>
            </div>

            {/* Warnings */}
            {warnings.map((w, i) => (
              <div key={i} className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                {w}
              </div>
            ))}

            <div className="flex flex-col lg:flex-row gap-4">
              {/* Image reference panel */}
              {imagePreviewUrl && (
                <div className="lg:w-80 flex-shrink-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Reference Image</CardTitle>
                    </CardHeader>
                    <CardBody>
                      <img
                        src={imagePreviewUrl}
                        alt="Reference"
                        className="w-full rounded-lg object-contain border border-gray-100 max-h-64 lg:max-h-96"
                      />
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* Table entry panel */}
              <div className="flex-1 min-w-0">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-sm">Manual Data Entry</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={addColumn}>
                          + Column
                        </Button>
                        <Button variant="outline" size="sm" onClick={addRow}>
                          + Row
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Edit column headers by clicking them. Add rows as needed.
                    </p>
                  </CardHeader>
                  <CardBody className="overflow-x-auto p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-3 py-2 text-left text-xs text-gray-500 w-10">#</th>
                          {columnHeaders.map((header, ci) => (
                            <th key={ci} className="px-2 py-2 text-left min-w-28">
                              <input
                                value={header}
                                onChange={(e) => updateHeader(ci, e.target.value)}
                                className="w-full text-xs font-semibold text-gray-700 bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-green-500 py-0.5"
                              />
                              <div className="mt-1">
                                <ConfidenceBadge level="high" />
                              </div>
                            </th>
                          ))}
                          <th className="px-2 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, ri) => (
                          <tr key={ri} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs text-gray-400">{ri + 1}</td>
                            {columnHeaders.map((_, ci) => (
                              <td key={ci} className="px-2 py-1">
                                <input
                                  value={row[ci] ?? ''}
                                  onChange={(e) => updateCell(ri, ci, e.target.value)}
                                  placeholder="—"
                                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                              </td>
                            ))}
                            <td className="px-2 py-1">
                              <button
                                onClick={() => deleteRow(ri)}
                                disabled={tableRows.length === 1}
                                className="text-gray-300 hover:text-red-500 disabled:opacity-30 text-xs"
                                aria-label="Delete row"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(3)}
                disabled={!hasAtLeastOneRow}
              >
                Next: Confirm →
              </Button>
            </div>
            {!hasAtLeastOneRow && (
              <p className="text-xs text-gray-400 text-right -mt-2">
                Add at least one row of data to continue.
              </p>
            )}
          </div>
        )}

        {/* ── STEP 3: Confirm ── */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review your data before saving</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500">Sport</p>
                    <p className="font-semibold text-gray-900 text-sm">{sportName}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500">Movement Type</p>
                    <p className="font-semibold text-gray-900 text-sm capitalize">
                      {movementType.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500">Rows</p>
                    <p className="font-semibold text-gray-900 text-sm">{tableRows.filter((r) => r.some((c) => c.trim())).length}</p>
                  </div>
                </div>

                {/* Read-only table */}
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs text-gray-500 w-10">#</th>
                        {columnHeaders.map((h, i) => (
                          <th key={i} className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, ri) => (
                        <tr key={ri} className="border-b border-gray-100">
                          <td className="px-3 py-2 text-xs text-gray-400">{ri + 1}</td>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-2 text-gray-900">
                              {cell || <span className="text-gray-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Privacy notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-3">
                  <span className="text-blue-600 text-lg flex-shrink-0">🔒</span>
                  <p className="text-sm text-blue-800">
                    <strong>Privacy first:</strong> Your data stays in your browser. Nothing is uploaded to our servers until you explicitly save a session.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" size="md" onClick={() => setStep(2)}>
                    ← Back to Edit
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSave}
                  >
                    Save &amp; Analyze →
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* ── STEP 4: Analysis ── */}
        {step === 4 && saved && (
          <div className="space-y-4">
            <Card>
              <CardBody className="text-center py-12 space-y-4">
                <div className="text-5xl">✅</div>
                <h2 className="text-xl font-bold text-gray-900">Import Successful</h2>
                <p className="text-gray-600 text-sm max-w-sm mx-auto">
                  Your data has been saved. Head to sessions to review, or run a full AI analysis now.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-sm mx-auto text-left mt-4">
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500">Sport</p>
                    <p className="font-semibold text-sm text-gray-900">{sportName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500">Rows saved</p>
                    <p className="font-semibold text-sm text-gray-900">{tableRows.filter((r) => r.some((c) => c.trim())).length}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg px-4 py-3 col-span-2 sm:col-span-1">
                    <p className="text-xs text-green-700">Status</p>
                    <p className="font-semibold text-sm text-green-800">Saved</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Link href="/sessions">
                    <Button variant="outline" size="lg">View Sessions</Button>
                  </Link>
                  <Link href="/diagnose">
                    <Button variant="primary" size="lg">Run Diagnosis →</Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
