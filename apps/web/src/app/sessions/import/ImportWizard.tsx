'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
import { useSwingIQStore } from '@/store';
import { useSport } from '@/contexts/SportContext';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

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
}

export function ImportWizard() {
  const { addSession } = useSwingIQStore();
  const { activeSport } = useSport();
  const [step, setStep] = useState<WizardStep>(1);
  const [brand, setBrand] = useState<LaunchMonitorBrand | null>(null);
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [missingCritical, setMissingCritical] = useState<string[]>([]);
  const [missingRecommended, setMissingRecommended] = useState<string[]>([]);
  const [normalizedShots, setNormalizedShots] = useState<NormalizedShot[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.headers.length === 0) return;

      const mapping = detectColumnMapping(parsed.headers, brand ?? 'manual');
      const critical = getMissingCriticalFields(mapping);
      const recommended = getMissingRecommendedFields(mapping);
      const shots = parsed.rows.map((row) => normalizeRow(row, mapping, brand ?? 'manual'));

      setFile({ headers: parsed.headers, rows: parsed.rows, raw: text });
      setColumnMapping(mapping);
      setMissingCritical(critical);
      setMissingRecommended(recommended);
      setNormalizedShots(shots);
      setSessionName(f.name.replace(/\.(csv|xlsx?)$/i, '').replace(/_/g, ' '));
      setStep(3);
    };
    reader.readAsText(f);
  }, [brand]);

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

  const UNIVERSAL_FIELDS = [
    { key: 'club', label: 'Club Name', critical: true },
    { key: 'carry_distance', label: 'Carry Distance', critical: true },
    { key: 'ball_speed', label: 'Ball Speed', critical: false },
    { key: 'club_speed', label: 'Club Speed', critical: false },
    { key: 'launch_angle', label: 'Launch Angle', critical: false },
    { key: 'spin_rate', label: 'Spin Rate', critical: false },
    { key: 'spin_axis', label: 'Spin Axis', critical: false },
    { key: 'face_to_path', label: 'Face-to-Path', critical: false },
    { key: 'club_path', label: 'Club Path', critical: false },
    { key: 'face_angle', label: 'Face Angle', critical: false },
    { key: 'attack_angle', label: 'Attack Angle', critical: false },
    { key: 'dynamic_loft', label: 'Dynamic Loft', critical: false },
    { key: 'smash_factor', label: 'Smash Factor', critical: false },
    { key: 'apex_height', label: 'Apex Height', critical: false },
    { key: 'side_carry', label: 'Side / Offline', critical: false },
    { key: 'total_distance', label: 'Total Distance', critical: false },
    { key: 'impact_location_lateral', label: 'Strike Location (X)', critical: false },
  ];

  // ── Import to local store ─────────────────────────────────

  const runImport = async () => {
    setImporting(true);
    await new Promise((r) => setTimeout(r, 600));

    // Convert NormalizedShots to Shot objects (NormalizedShot nests data under ball_data/club_data/strike_data)
    const shots = normalizedShots.map((ns, i) => ({
      id: `shot_${Date.now()}_${i}`,
      session_id: 'pending',
      user_id: 'local',
      club_id: null,
      club_name: ns.club_name || 'Unknown',
      club_category: inferClubCategory(ns.club_name || ''),
      shot_number: i + 1,
      date_time: new Date().toISOString(),
      swing_type: 'full' as const,
      intended_shot_shape: null,
      actual_shot_shape: ns.ball_data.shot_shape ?? null,
      is_outlier: false,
      user_notes: '',
      ball_data: {
        carry_distance: ns.ball_data.carry_distance,
        total_distance: ns.ball_data.total_distance,
        ball_speed: ns.ball_data.ball_speed,
        launch_angle_vertical: ns.ball_data.launch_angle_vertical,
        spin_rate: ns.ball_data.spin_rate,
        spin_axis: ns.ball_data.spin_axis,
        side_carry: ns.ball_data.side_carry,
        lateral_offline: ns.ball_data.lateral_offline ?? ns.ball_data.side_carry,
        apex_height: ns.ball_data.apex_height,
        smash_factor: ns.ball_data.smash_factor,
        roll_distance: ns.ball_data.roll_distance,
        descent_angle: ns.ball_data.descent_angle,
        launch_direction_horizontal: ns.ball_data.launch_direction_horizontal,
        flight_time: ns.ball_data.flight_time,
        curve: ns.ball_data.curve,
        shot_shape: ns.ball_data.shot_shape,
      },
      club_data: {
        club_speed: ns.club_data.club_speed,
        attack_angle: ns.club_data.attack_angle,
        club_path: ns.club_data.club_path,
        face_angle_to_target: ns.club_data.face_angle_to_target,
        face_to_path: ns.club_data.face_to_path,
        dynamic_loft: ns.club_data.dynamic_loft,
        spin_loft: ns.club_data.spin_loft,
        swing_plane_horizontal: ns.club_data.swing_plane_horizontal,
        swing_plane_vertical: ns.club_data.swing_plane_vertical,
        low_point_position: ns.club_data.low_point_position,
        low_point_height: ns.club_data.low_point_height,
        closure_rate: ns.club_data.closure_rate,
        swing_direction: ns.club_data.swing_direction,
        lie_angle_dynamic: ns.club_data.lie_angle_dynamic,
      },
      strike_data: {
        impact_location_lateral: ns.strike_data.impact_location_lateral,
        impact_location_vertical: ns.strike_data.impact_location_vertical,
      },
      created_at: new Date().toISOString(),
    }));

    // Detect primary club
    const clubCounts: Record<string, number> = {};
    shots.forEach((s) => { clubCounts[s.club_name] = (clubCounts[s.club_name] ?? 0) + 1; });
    const primaryClub = Object.entries(clubCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Mixed';

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

    setImporting(false);
    setImportDone(true);
    setStep(7);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Launch-Monitor Data</h1>
        <p className="text-gray-500 text-sm mt-1">
          Follow the steps below to import your session. The app will detect column names automatically.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto">
        {steps.map((label, i) => {
          const n = (i + 1) as WizardStep;
          const isActive = n === step;
          const isDone = n < step;
          return (
            <div key={n} className="flex items-center gap-1 flex-shrink-0">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isActive ? 'bg-green-600 text-white' : isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                )}
              >
                <span className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  isActive ? 'bg-white text-green-600' : isDone ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600',
                )}>
                  {isDone ? '✓' : n}
                </span>
                <span className="hidden sm:block">{label}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step 1 — Choose launch monitor */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Choose Your Launch Monitor</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
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
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-400'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50',
                )}
              >
                <p className="font-medium text-gray-900 text-sm">{lm.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{lm.notes}</p>
              </button>
            ))}
            <div className="pt-3 border-t">
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
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
            <p className="text-sm text-gray-500 mt-1">
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
                dragOver ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-green-50',
              )}
            >
              <Upload size={32} className="mx-auto mb-3 text-gray-400" />
              <p className="font-medium text-gray-700">Drag and drop your CSV file here</p>
              <p className="text-sm text-gray-500 mt-1">or</p>
              <label className="mt-3 inline-block cursor-pointer">
                <input type="file" accept=".csv,.xlsx" className="hidden" onChange={onFileInput} />
                <span className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  Browse for file
                </span>
              </label>
              <p className="text-xs text-gray-400 mt-3">Supports .csv and .xlsx files</p>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <p className="text-xs font-semibold text-gray-600 mb-2">How to export from your device:</p>
              <p className="text-xs text-gray-600 italic">
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
            <p className="text-sm text-gray-500 mt-1">
              The app detected {file.rows.length} shots and auto-mapped your columns. Adjust any mappings that look wrong.
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {UNIVERSAL_FIELDS.map(({ key, label, critical }) => (
                <div key={key} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
                  <div className="w-40 flex-shrink-0">
                    <span className="text-sm text-gray-700">{label}</span>
                    {critical && <Badge variant="danger" className="ml-2 text-xs">Required</Badge>}
                  </div>
                  <select
                    value={columnMapping[key] ?? ''}
                    onChange={(e) => setColumnMapping((m) => ({ ...m, [key]: e.target.value }))}
                    className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white"
                  >
                    <option value="">(not in file)</option>
                    {file.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  {columnMapping[key] ? (
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
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
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <p className="font-semibold text-red-700 text-sm">Missing Required Fields</p>
                </div>
                <p className="text-sm text-red-600">{missingCritical.join(', ')} — these fields are required. Go back and map them.</p>
              </div>
            )}

            {missingRecommended.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  <p className="font-semibold text-yellow-700 text-sm">Limited Diagnostic Data</p>
                </div>
                <p className="text-sm text-yellow-700">{getMissingFieldMessage(missingRecommended)}</p>
              </div>
            )}

            {missingCritical.length === 0 && missingRecommended.length === 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <p className="font-semibold text-green-700 text-sm">All key fields detected. Full diagnostic is available.</p>
                </div>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg border text-sm text-gray-600">
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
            <p className="text-sm text-gray-500 mt-1">First 10 shots shown. Verify the data looks correct before importing.</p>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-semibold text-gray-500">#</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-500">Club</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-500">Carry</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-500">Ball Spd</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-500">Launch°</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-500">Spin</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-500">F-to-P</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-500">Path</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedShots.slice(0, 10).map((shot, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 px-2 font-medium text-gray-900">{shot.club_name}</td>
                      <td className="py-2 px-2 text-right text-gray-700">
                        {shot.ball_data.carry_distance?.toFixed(0) ?? '—'}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-700">
                        {shot.ball_data.ball_speed?.toFixed(1) ?? '—'}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-700">
                        {shot.ball_data.launch_angle_vertical?.toFixed(1) ?? '—'}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-700">
                        {shot.ball_data.spin_rate?.toFixed(0) ?? '—'}
                      </td>
                      <td className={cn(
                        'py-2 px-2 text-right font-medium',
                        (shot.club_data.face_to_path ?? 0) > 3 ? 'text-red-600' :
                        (shot.club_data.face_to_path ?? 0) < -3 ? 'text-blue-600' : 'text-green-600',
                      )}>
                        {shot.club_data.face_to_path !== null ? `${(shot.club_data.face_to_path ?? 0).toFixed(1)}°` : '—'}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-700">
                        {shot.club_data.club_path !== null ? `${(shot.club_data.club_path ?? 0).toFixed(1)}°` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <label className="text-sm font-medium text-gray-700 block mb-1">Session Name</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g. Range Session — Driver, May 25"
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border text-sm space-y-1">
              <p className="font-semibold text-gray-700">Ready to import:</p>
              <p className="text-gray-600">{normalizedShots.length} shots · {brand}</p>
              <p className="text-gray-600">Clubs: {[...new Set(normalizedShots.map((s) => s.club_name))].join(', ')}</p>
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
            <CheckCircle size={48} className="mx-auto text-green-500" />
            <h2 className="text-xl font-bold text-gray-900">Session Imported!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
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
