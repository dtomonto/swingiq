// ============================================================
// SwingVantage — Motion Lab: Export
// ------------------------------------------------------------
// Offline, local-first exports (no server round-trip): a full JSON
// record and a flat CSV of metrics. The original video is never part
// of any export — only the analysis.
// ============================================================

import type { MotionSession } from './types';

function triggerDownload(filename: string, content: string, mime: string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function stamp(session: MotionSession): string {
  return `${session.capture.sport}-${session.capture.motionType}-${session.createdAt.slice(0, 10)}`;
}

export function downloadSessionJson(session: MotionSession): boolean {
  const payload = {
    exportedFrom: 'SwingVantage Motion Lab',
    exportedAt: new Date().toISOString(),
    analysisVersion: session.analysisVersion,
    modelVersion: session.modelVersion,
    disclaimer:
      'Estimated 3D motion analysis from a single-camera video. Directional, not a lab measurement. No medical or injury claims.',
    session,
  };
  return triggerDownload(`swingiq-motionlab-${stamp(session)}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

function csvEscape(v: string | number | null): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadSessionCsv(session: MotionSession): boolean {
  const header = ['metric_id', 'name', 'value', 'unit', 'normalized_score', 'confidence', 'basis', 'phase'];
  const rows = session.metrics.map((m) =>
    [m.id, m.name, m.value, m.unit, m.normalizedScore, m.confidence, m.basis, m.phase].map(csvEscape).join(','),
  );
  const meta = [
    `# SwingVantage Motion Lab export`,
    `# sport,${session.capture.sport}`,
    `# motion,${session.capture.motionType}`,
    `# overall,${session.scoreboard.overall}`,
    `# confidence,${session.scoreboard.confidence}`,
    `# created,${session.createdAt}`,
  ];
  if (session.kineticChain && session.kineticChain.comparableLinks > 0) {
    const c = session.kineticChain;
    meta.push(`# kinetic_chain_sequence,${c.sequenceQuality}`);
    meta.push(`# kinetic_chain_overall,${c.overall}`);
    meta.push(`# kinetic_chain_leaks,${csvEscape(c.powerLeakFlags.map((f) => f.id).join('; '))}`);
  }
  if (session.objectTracking?.available) {
    const o = session.objectTracking;
    meta.push(`# implement_path,${o.implement}`);
    meta.push(`# implement_approach,${o.swingPath.approach}`);
    meta.push(`# implement_confidence,${o.confidence}`);
  }
  if (session.temporal && session.temporal.confidence > 0) {
    const t = session.temporal;
    meta.push(`# tempo_ratio,${t.tempoRatio ?? ''}`);
    meta.push(`# load_ms,${t.loadDurationMs ?? ''}`);
    meta.push(`# transition_ms,${t.transitionDurationMs ?? ''}`);
    meta.push(`# acceleration_ms,${t.accelerationDurationMs ?? ''}`);
    meta.push(`# contact_window_stability,${t.contactWindowStability ?? ''}`);
    meta.push(`# deceleration_control,${t.decelerationControl ?? ''}`);
  }
  meta.push(`# note,Estimated proxies from single-camera video — not lab-measured.`);
  const csv = [...meta, header.join(','), ...rows].join('\n');
  return triggerDownload(`swingiq-motionlab-${stamp(session)}.csv`, csv, 'text/csv');
}
