'use client';

import { Suspense, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Info } from 'lucide-react';

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

function Avatar3DPlaceholder({ phase, fault }: { phase: number; fault: string | null }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl">
      <div className="text-center">
        {/* Simple SVG golfer silhouette placeholder */}
        <svg width="120" height="240" viewBox="0 0 120 240" className="mx-auto mb-4">
          {/* Head */}
          <circle cx="60" cy="30" r="18" fill="#86efac" />
          {/* Body */}
          <rect x="48" y="48" width="24" height="60" rx="8" fill="#4ade80" />
          {/* Arms - rotated based on phase */}
          <line x1="48" y1="70" x2={phase < 4 ? '20' : phase < 7 ? '15' : '25'} y2={phase < 4 ? '110' : phase < 7 ? '40' : '90'} stroke="#4ade80" strokeWidth="8" strokeLinecap="round" />
          <line x1="72" y1="70" x2={phase < 4 ? '100' : phase < 7 ? '105' : '90'} y2={phase < 4 ? '60' : phase < 7 ? '30' : '60'} stroke="#4ade80" strokeWidth="8" strokeLinecap="round" />
          {/* Legs */}
          <line x1="55" y1="108" x2="45" y2="180" stroke="#4ade80" strokeWidth="8" strokeLinecap="round" />
          <line x1="65" y1="108" x2="75" y2="180" stroke="#4ade80" strokeWidth="8" strokeLinecap="round" />
          {/* Club shaft */}
          <line x1="72" y1="70" x2={phase < 4 ? '115' : phase < 7 ? '30' : '85'} y2={phase < 4 ? '45' : phase < 7 ? '10' : '140'} stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
          {/* Ground line */}
          <line x1="10" y1="185" x2="110" y2="185" stroke="#6b7280" strokeWidth="2" />
        </svg>
        <p className="text-white font-semibold">{SWING_PHASES[phase]}</p>
        {fault && (
          <div className="mt-2 px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-lg">
            <p className="text-red-300 text-xs">{FAULT_TOGGLES.find((f) => f.id === fault)?.label}</p>
          </div>
        )}
        <p className="text-slate-400 text-xs mt-3 max-w-48">
          Full 3D model renders here in MVP 4.
          This placeholder shows the phase position.
        </p>
      </div>
    </div>
  );
}

export function AvatarViewer() {
  const [phase, setPhase] = useState(7); // Impact position by default
  const [activeFault, setActiveFault] = useState<string | null>('open_face');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">3D Swing Avatar</h1>
        <p className="text-gray-500 text-sm mt-1">
          Educational swing model based on your launch-monitor data pattern.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-5">
        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Estimated pattern only.</strong> This avatar shows the likely movement pattern based on launch-monitor data.
          It is NOT an exact recreation of your body position unless motion-capture or video keypoint data is available.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 3D viewer */}
        <div className="col-span-2">
          <div className="h-96 rounded-xl overflow-hidden">
            <Suspense fallback={<div className="h-full bg-slate-800 rounded-xl flex items-center justify-center text-white">Loading...</div>}>
              <Avatar3DPlaceholder phase={phase} fault={activeFault} />
            </Suspense>
          </div>

          {/* Phase scrubber */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Swing Phase</p>
              <p className="text-sm font-bold text-gray-900">{SWING_PHASES[phase]}</p>
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
              <span className="text-xs text-gray-400">Address</span>
              <span className="text-xs text-gray-400">Impact</span>
              <span className="text-xs text-gray-400">Finish</span>
            </div>
          </div>

          {/* Data overlay */}
          <Card className="mt-4">
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Data at Impact (from your last session)
              </p>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Face-to-Path', value: '+4.8°', bad: true },
                  { label: 'Club Path', value: '-1.2°', bad: false },
                  { label: 'Attack Angle', value: '+1.8°', bad: false },
                  { label: 'Dynamic Loft', value: '14.5°', bad: false },
                ].map((d) => (
                  <div key={d.label} className={`rounded-lg p-2 ${d.bad ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <p className="text-xs text-gray-500">{d.label}</p>
                    <p className={`font-bold text-sm ${d.bad ? 'text-red-700' : 'text-gray-900'}`}>{d.value}</p>
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
              <p className="text-xs text-gray-500">Click a fault to see how it appears in the avatar:</p>
              {FAULT_TOGGLES.map((fault) => (
                <button
                  key={fault.id}
                  onClick={() => setActiveFault(activeFault === fault.id ? null : fault.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                    activeFault === fault.id
                      ? 'bg-red-50 border-red-400 text-red-700 font-semibold'
                      : 'border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  {fault.label}
                </button>
              ))}
              {activeFault && (
                <Button variant="ghost" size="sm" onClick={() => setActiveFault(null)} className="w-full text-gray-500">
                  Clear fault
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Your Likely Pattern</CardTitle></CardHeader>
            <CardBody>
              <p className="text-xs text-gray-600 leading-relaxed">
                Based on your data (face-to-path +4.8°, path -1.2°, heel-biased strike), the avatar
                is showing a likely <strong>open face at impact</strong> with a slightly outside-in club path.
              </p>
              <p className="text-xs text-gray-500 mt-2 italic">
                This is an estimated mechanical pattern — not a confirmed analysis.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
