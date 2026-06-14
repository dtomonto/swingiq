'use client';

// ============================================================
// SwingVantage — SwingLab 2.0: personalized lab experience
// ------------------------------------------------------------
// Smart client wrapper that computes the user's real personalization
// (recommended next station, resume, per-station status, guided path)
// and renders it. Offers two views of the same lab:
//   • Map  — top-down isometric floor plan (Phase 2)
//   • Walk — true-WebGL first-person walkthrough (Phase 4 v2)
// Keeps the map/walk components presentational. Until the store
// hydrates, the neutral preview shows, then it upgrades.
// ============================================================

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Compass, Cpu, Map as MapIcon, RotateCcw } from 'lucide-react';
import { useLabPersonalization } from '@/lib/swinglab/useLabPersonalization';
import { InteractiveLabMap } from './InteractiveLabMap';
import { FirstPersonLab } from './FirstPersonLab';
import { GuidedFlow } from './GuidedFlow';
import { LabSystems } from './LabSystems';

// The true-WebGL walk (three.js) is code-split and client-only, so its
// bundle loads only when the Walk view is opened — never on the server or
// any public page. FirstPersonLab (CSS) is the instant loading placeholder
// and also the no-WebGL / reduced-motion fallback inside WebGLLab.
const WebGLLab = dynamic(() => import('./WebGLLab').then((m) => m.WebGLLab), {
  ssr: false,
  loading: () => <FirstPersonLab />,
});

type View = 'map' | 'walk' | 'systems';

export function LabExperience() {
  const { ready, personalization, guidedPath, labSystems } = useLabPersonalization();
  const [view, setView] = useState<View>('map');
  const resume = ready ? personalization.resume : null;

  const tab = (v: View, label: string, Icon: typeof MapIcon) => (
    <button
      type="button"
      onClick={() => setView(v)}
      aria-pressed={view === v}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stage ${
        view === v ? 'bg-emerald-500 text-stage' : 'text-stage-foreground hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon size={15} aria-hidden="true" /> {label}
    </button>
  );

  return (
    <div>
      {ready && guidedPath.length > 0 && <GuidedFlow steps={guidedPath} />}

      {resume && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] p-4">
          <p className="text-sm text-stage-foreground">
            Welcome back. <span className="font-semibold text-white">{resume.label}.</span>
          </p>
          <Link
            href={resume.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-bold text-stage transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stage"
          >
            <RotateCcw size={15} aria-hidden="true" /> Resume
          </Link>
        </div>
      )}

      {/* View toggle: Map (isometric) · Walk (first-person) · Systems (ecosystem) */}
      <div className="mb-4 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1" role="group" aria-label="Lab view">
        {tab('map', 'Map', MapIcon)}
        {tab('walk', 'Walk', Compass)}
        {tab('systems', 'Systems', Cpu)}
      </div>

      {view === 'map' && <InteractiveLabMap personalization={personalization} />}
      {view === 'walk' && <WebGLLab personalization={personalization} />}
      {view === 'systems' &&
        (labSystems ? (
          <LabSystems model={labSystems} />
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-stage-muted">
            Connecting your systems…
          </p>
        ))}
    </div>
  );
}
