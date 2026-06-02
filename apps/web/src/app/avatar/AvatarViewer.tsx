'use client';

import { Suspense, useState, useMemo } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Info, Upload } from 'lucide-react';
import Link from 'next/link';
import { useSwingIQStore } from '@/store';
import { runDiagnosticEngine } from '@swingiq/core';
import type { Shot } from '@swingiq/core';

const SWING_PHASES = [
  'Address',
  'Takeaway',
  'Club Parallel Back',
  'Lead Arm Parallel',
  'Top of Backswing',
  'Transition',
  'Shaft Parallel Down',
  'Impact',
  'Post-Impact',
  'Finish',
];

const FAULT_TOGGLES = [
  { id: 'open_face', label: 'Open Face at Impact' },
  { id: 'over_top', label: 'Over-the-Top Path' },
  { id: 'early_extension', label: 'Early Extension' },
  { id: 'casting', label: 'Casting / Early Release' },
  { id: 'heel_strike', label: 'Heel Strike Delivery' },
  { id: 'reverse_pivot', label: 'Reverse Pivot' },
  { id: 'steep', label: 'Steep Downswing' },
];

/** Map diagnosis id → likely faults the avatar should show */
const DIAGNOSIS_FAULTS: Record<string, string[]> = {
  slice_weak_fade: ['open_face', 'over_top', 'steep'],
  hook_overdraw: ['casting'],
  low_smash_factor: ['heel_strike', 'early_extension'],
  high_spin_driver: ['steep', 'over_top'],
  steep_attack_angle: ['steep', 'over_top'],
  early_extension: ['early_extension', 'reverse_pivot'],
};

function Avatar3DPlaceholder({ phase, fault }: { phase: number; fault: string | null }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-linear-to-b from-slate-800 to-slate-900 rounded-xl">
      <div className="text-center">
        <svg width="120" height="240" viewBox="0 0 120 240" className="mx-auto mb-4">
          {/* Head */}
          <circle cx="60" cy="30" r="18" fill="#86efac" />
          {/* Body */}
          <rect x="48" y="48" width="24" height="60" rx="8" fill="#4ade80" />
          {/* Arms — animated by phase */}
          <line
            x1="48" y1="70"
            x2={phase < 4 ? '20' : phase < 7 ? '15' : '25'}
            y2={phase < 4 ? '110' : phase < 7 ? '40' : '90'}
            stroke="#4ade80" strokeWidth="8" strokeLinecap="round"
          />
          <line
            x1="72" y1="70"
            x2={phase < 4 ? '100' : phase < 7 ? '105' : '90'}
            y2={phase < 4 ? '60' : phase < 7 ? '30' : '60'}
            stroke="#4ade80" strokeWidth="8" strokeLinecap="round"
          />
          {/* Legs */}
          <line x1="55" y1="108" x2="45" y2="180" stroke="#4ade80" strokeWidth="8" strokeLinecap="round" />
          <line x1="65" y1="108" x2="75" y2="180" stroke="#4ade80" strokeWidth="8" strokeLinecap="round" />
          {/* Club shaft */}
          <line
            x1="72" y1="70"
            x2={phase < 4 ? '115' : phase < 7 ? '30' : '85'}
            y2={phase < 4 ? '45' : phase < 7 ? '10' : '140'}
            stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"
          />
          {/* Ground line */}
          <line x1="10" y1="185" x2="110" y2="185" stroke="#6b7280" strokeWidth="2" />
        </svg>
        <p className="text-white font-semibold">{SWING_PHASES[phase]}</p>
        {fault && (
          <div className="mt-2 px-3 py-1 bg-error/20 border border-error/50 rounded-lg">
            <p className="text-red-300 text-xs">{FAULT_TOGGLES.find((f) => f.id === fault)?.label}</p>
          </div>
        )}
        <p className="text-slate-400 text-xs mt-3 max-w-xs">
          Full 3D model renders in a future update.
          This placeholder shows estimated phase position.
        </p>
      </div>
    </div>
  );
}

export function AvatarViewer() {
  const { sessions } = useSwingIQStore();
  const [phase, setPhase] = useState(7);
  const [activeFault, setActiveFault] = useState<string | null>(null);

  // Get most recent session with shots
  const sessionWithShots = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .find((s) => s.shots.length > 0) ?? null;
  }, [sessions]);

  // Run engine to get live stats and top diagnosis
  const liveData = useMemo(() => {
    if (!sessionWithShots || sessionWithShots.shots.length < 3) return null;
    try {
      const result = runDiagnosticEngine(
        sessionWithShots.shots as Shot[],
        sessionWithShots.club_category || 'mid_iron',
        sessionWithShots.id,
        'local',
      );
      return { stats: result.stats, topDiagnosis: result.diagnoses[0] ?? null };
    } catch {
      return null;
    }
  }, [sessionWithShots]);

  // Auto-activate faults suggested by primary diagnosis
  const suggestedFaults = useMemo(() => {
    const diagId = liveData?.topDiagnosis?.rule?.id ?? '';
    return DIAGNOSIS_FAULTS[diagId] ?? [];
  }, [liveData]);

  // Impact data points from real stats
  const impactData = useMemo(() => {
    const s = liveData?.stats;
    return [
      {
        label: 'Face-to-Path',
        value: s?.avg_face_to_path != null ? `${s.avg_face_to_path.toFixed(1)}°` : '—',
        bad: s?.avg_face_to_path != null && Math.abs(s.avg_face_to_path) > 3,
      },
      {
        label: 'Club Path',
        value: s?.avg_club_path != null ? `${s.avg_club_path.toFixed(1)}°` : '—',
        bad: s?.avg_club_path != null && Math.abs(s.avg_club_path) > 4,
      },
      {
        label: 'Attack Angle',
        value: s?.avg_attack_angle != null ? `${s.avg_attack_angle.toFixed(1)}°` : '—',
        bad: false,
      },
      {
        label: 'Dynamic Loft',
        value: s?.avg_dynamic_loft != null ? `${s.avg_dynamic_loft.toFixed(1)}°` : '—',
        bad: false,
      },
    ];
  }, [liveData]);

  // Pattern description from real diagnosis — returns structured data, not HTML
  const patternDescription = useMemo(() => {
    if (!liveData?.topDiagnosis) return null;
    const d = liveData.topDiagnosis;
    return { name: d.rule.name.toLowerCase(), cause: d.rule.likely_cause };
  }, [liveData]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">3D Swing Avatar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Educational swing model based on your launch-monitor data pattern.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg mb-5">
        <Info size={16} className="text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-warning">
          <strong>Estimated pattern only.</strong> This avatar shows the likely movement pattern based on
          launch-monitor data. It is NOT an exact recreation of your body position unless motion-capture
          or video keypoint data is available.
        </p>
      </div>

      {/* No data state */}
      {!sessionWithShots && (
        <div className="mb-5 p-4 bg-muted border border-border rounded-xl text-center">
          <p className="text-muted-foreground text-sm mb-3">No session data yet. Import data to personalize the avatar.</p>
          <Link href="/sessions/import">
            <Button size="sm" variant="outline"><Upload size={14} /> Import Session</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D viewer */}
        <div className="lg:col-span-2">
          <div className="h-96 rounded-xl overflow-hidden">
            <Suspense fallback={
              <div className="h-full bg-slate-800 rounded-xl flex items-center justify-center text-white">
                Loading...
              </div>
            }>
              <Avatar3DPlaceholder phase={phase} fault={activeFault} />
            </Suspense>
          </div>

          {/* Phase scrubber */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Swing Phase</p>
              <p className="text-sm font-bold text-foreground">{SWING_PHASES[phase]}</p>
            </div>
            <input
              type="range"
              min={0}
              max={SWING_PHASES.length - 1}
              value={phase}
              onChange={(e) => setPhase(parseInt(e.target.value))}
              className="w-full accent-green-600"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">Address</span>
              <span className="text-xs text-muted-foreground">Impact</span>
              <span className="text-xs text-muted-foreground">Finish</span>
            </div>
          </div>

          {/* Data overlay — real data */}
          <Card className="mt-4">
            <CardBody>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {sessionWithShots
                  ? `Impact Data — ${sessionWithShots.name}`
                  : 'Impact Data (no session loaded)'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {impactData.map((d) => (
                  <div
                    key={d.label}
                    className={`rounded-lg p-2 ${d.bad ? 'bg-error/10 border border-error/30' : 'bg-muted border border-border'}`}
                  >
                    <p className="text-xs text-muted-foreground">{d.label}</p>
                    <p className={`font-bold text-sm ${d.bad ? 'text-error' : 'text-foreground'}`}>{d.value}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Fault Visualization</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              <p className="text-xs text-muted-foreground mb-1">Click a fault to see how it appears in the avatar:</p>
              {FAULT_TOGGLES.map((fault) => (
                <button
                  key={fault.id}
                  onClick={() => setActiveFault(activeFault === fault.id ? null : fault.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                    activeFault === fault.id
                      ? 'bg-error/10 border-error/50 text-error font-semibold'
                      : suggestedFaults.includes(fault.id)
                      ? 'border-warning/30 bg-warning/10 text-warning hover:border-warning/50'
                      : 'border-border text-foreground hover:border-error/40 hover:bg-error/10'
                  }`}
                >
                  {suggestedFaults.includes(fault.id) && (
                    <span className="text-xs mr-1">⚠</span>
                  )}
                  {fault.label}
                </button>
              ))}
              {activeFault && (
                <Button variant="ghost" size="sm" onClick={() => setActiveFault(null)} className="w-full text-muted-foreground">
                  Clear fault
                </Button>
              )}
              {suggestedFaults.length > 0 && (
                <p className="text-xs text-warning mt-1">⚠ = suggested by your diagnosis</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Your Likely Pattern</CardTitle></CardHeader>
            <CardBody>
              {patternDescription ? (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Based on your data, the avatar is showing a likely{' '}
                    <strong>{patternDescription.name}</strong> pattern.{' '}
                    {patternDescription.cause}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Estimated mechanical pattern — not a confirmed analysis.
                  </p>
                  <Link href="/diagnose" className="mt-3 block">
                    <Button size="sm" variant="outline" className="w-full">
                      Full Diagnosis →
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Import a session and run the diagnostic engine to see your likely pattern.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
