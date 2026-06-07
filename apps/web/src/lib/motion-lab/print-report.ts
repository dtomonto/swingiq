// ============================================================
// SwingVantage — Motion Lab: Printable PDF Report
// ------------------------------------------------------------
// Builds a clean, branded, self-contained HTML report and opens it in
// a new window for the browser's native "Save as PDF" / print. No PDF
// library, no server round-trip — and the video is never included,
// only the analysis. Honest disclaimers are printed on every report.
// ============================================================

import type { MotionSession } from './types';
import { skillLabel } from './reference-ranges';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scoreColor(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 50) return '#d97706';
  return '#dc2626';
}

function buildHtml(s: MotionSession): string {
  const date = new Date(s.createdAt).toLocaleString();
  const skill = skillLabel(s.capture.skillLevel ?? 'intermediate');

  const components = s.scoreboard.components
    .map(
      (c) => `
      <div class="comp">
        <div class="comp-head"><span>${esc(c.label)}</span><b style="color:${scoreColor(c.score)}">${c.score}</b></div>
        <div class="bar"><div style="width:${c.score}%;background:${scoreColor(c.score)}"></div></div>
      </div>`,
    )
    .join('');

  const fixes = s.report.topFixes
    .map(
      (f) => `<li><b>${esc(f.title)}.</b> ${esc(f.problem)} <i>Fix:</i> ${esc(f.fix)}</li>`,
    )
    .join('');

  const metricsRows = s.metrics
    .filter((m) => m.value != null)
    .map(
      (m) => `<tr>
        <td>${esc(m.name)}</td>
        <td class="num">${m.value}${esc(m.unit)}</td>
        <td class="num">${m.normalizedScore ?? '—'}</td>
        <td>${esc(m.target ?? '—')}</td>
        <td class="num">${Math.round(m.confidence * 100)}%</td>
      </tr>`,
    )
    .join('');

  const phases = s.report.phaseBreakdown
    .map((p) => `<tr><td>${esc(p.label)}</td><td>${esc(p.note)}</td><td class="num">${Math.round(p.confidence * 100)}%</td></tr>`)
    .join('');

  const drills = [s.drills.immediate, s.drills.feel, s.drills.technical, s.drills.constraint]
    .map((d) => `<li><b>${esc(d.name)}</b> (${esc(d.kind)}, ${d.estimatedMinutes}m) — ${esc(d.problemItSolves)}. <i>${esc(d.successCue)}</i></li>`)
    .join('');

  const limitations = s.report.limitations.map((l) => `<li>${esc(l)}</li>`).join('');
  const notNote = s.report.whatNotToChange.map((w) => `<li>${esc(w)}</li>`).join('');
  const notes = s.coachNotes ? `<div class="box"><h3>Coach notes</h3><p>${esc(s.coachNotes)}</p></div>` : '';

  // Kinetic chain (firing order + power leaks), printed when we could read it.
  const kc = s.kineticChain && s.kineticChain.comparableLinks > 0
    ? (() => {
        const c = s.kineticChain!;
        const flags = c.powerLeakFlags.length
          ? `<ul>${c.powerLeakFlags
              .map((f) => `<li><b>${esc(f.label)}</b> (${esc(f.severity)}). ${esc(f.detail)}</li>`)
              .join('')}</ul>`
          : `<p>No power leaks detected — your energy fires in the right order.</p>`;
        return `
  <h2>Kinetic chain — energy transfer</h2>
  <p><b>Sequence ${c.sequenceQuality}/100</b> (overall ${c.overall}/100). ${esc(c.coachingSummary)}</p>
  ${flags}
  <p class="muted"><b>Focus:</b> ${esc(c.recommendedFocus)}</p>`;
      })()
    : '';

  // Temporal intelligence (durations + timing flags), when timeable.
  const temporal = s.temporal && s.temporal.confidence > 0
    ? (() => {
        const t = s.temporal!;
        const secs = (ms: number | null) => (ms != null ? `${(ms / 1000).toFixed(2)}s` : '—');
        const flags = t.flags.length
          ? `<ul>${t.flags.map((f) => `<li><b>${esc(f.label)}</b> (${esc(f.severity)}). ${esc(f.detail)}</li>`).join('')}</ul>`
          : '';
        return `
  <h2>Timing</h2>
  <p>Tempo ${t.tempoRatio != null ? `${t.tempoRatio}:1` : '—'} (back:through) · load ${secs(t.loadDurationMs)} · transition ${secs(
    t.transitionDurationMs,
  )} · acceleration ${secs(t.accelerationDurationMs)} · contact stability ${
    t.contactWindowStability != null ? `${t.contactWindowStability}/100` : '—'
  } · deceleration ${t.decelerationControl != null ? `${t.decelerationControl}/100` : '—'}.</p>
  <p>${esc(t.summary)}</p>
  ${flags}`;
      })()
    : '';

  // Estimated implement path (clearly labeled as inferred from arm motion).
  const implement = s.objectTracking?.available
    ? (() => {
        const o = s.objectTracking!;
        const deg = o.swingPath.verticalApproachDeg;
        const appr = o.swingPath.approach.replace(/_/g, ' ');
        return `<p class="muted"><b>Estimated ${esc(o.implement)} path:</b> ${esc(appr)}${
          deg != null ? ` (${deg > 0 ? '+' : ''}${deg}°)` : ''
        } through contact · confidence ${Math.round(o.confidence * 100)}% — estimated from arm motion, not object detection.</p>`;
      })()
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><title>SwingVantage Motion Lab Report</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; margin: 0; padding: 32px; }
  h1 { font-size: 20px; margin: 0; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .04em; color: #475569; margin: 22px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 0 0 4px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-weight: 800; color: #16a34a; }
  .muted { color: #64748b; font-size: 12px; }
  .hero { display: flex; gap: 24px; align-items: center; margin-top: 12px; }
  .score { font-size: 44px; font-weight: 900; line-height: 1; }
  .comps { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; flex: 1; }
  .comp-head { display: flex; justify-content: space-between; font-size: 12px; }
  .bar { height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 2px; }
  .bar > div { height: 100%; }
  p { font-size: 13px; line-height: 1.5; }
  ul { font-size: 13px; line-height: 1.5; padding-left: 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #eef2f7; vertical-align: top; }
  th { color: #475569; font-size: 11px; text-transform: uppercase; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 10px; }
  .disc { margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  @media print { body { padding: 0; } @page { margin: 16mm; } }
</style></head><body>
  <div class="head">
    <div>
      <h1>${esc(s.emoji)} ${esc(s.sportLabel)} · ${esc(s.motionLabel)}</h1>
      <div class="muted">${esc(date)} · ${esc(skill)} · ${esc(s.keyFault)}</div>
    </div>
    <div class="brand">SwingVantage · Motion Lab</div>
  </div>

  <div class="hero">
    <div>
      <div class="score" style="color:${scoreColor(s.scoreboard.overall)}">${s.scoreboard.overall}</div>
      <div class="muted">/ 100 · confidence ${Math.round(s.scoreboard.confidence * 100)}%</div>
    </div>
    <div class="comps">${components}</div>
  </div>

  <h2>Executive summary</h2>
  <p>${esc(s.report.executiveSummary)}</p>
  <p><b>Diagnosis.</b> ${esc(s.report.diagnosis)}</p>
  <p><b>Root cause.</b> ${esc(s.report.rootCause)}</p>

  <h2>Top fixes</h2>
  <ol style="font-size:13px;line-height:1.5">${fixes}</ol>

  <h2>What NOT to change</h2>
  <ul>${notNote}</ul>

  ${kc}

  ${temporal}

  <h2>Metrics</h2>
  <table><thead><tr><th>Metric</th><th class="num">Value</th><th class="num">Score</th><th>Target</th><th class="num">Conf.</th></tr></thead>
  <tbody>${metricsRows}</tbody></table>

  <h2>Phase breakdown</h2>
  <table><thead><tr><th>Phase</th><th>Read</th><th class="num">Conf.</th></tr></thead><tbody>${phases}</tbody></table>
  ${implement}

  <h2>Prescribed drills</h2>
  <ul>${drills}</ul>

  ${notes}

  <h2>Confidence &amp; limitations</h2>
  <ul>${limitations}</ul>

  <div class="disc">
    Estimated 3D motion analysis from a single-camera video — directional, not a lab measurement.
    Reference ranges are starter heuristics, not validated norms. No medical, injury-risk, or
    guaranteed-improvement claims. Model: ${esc(s.modelVersion)} · engine ${esc(s.analysisVersion)}.
  </div>
</body></html>`;
}

/** Open a print-ready report in a new window for "Save as PDF". */
export function printSessionReport(session: MotionSession): boolean {
  if (typeof window === 'undefined') return false;
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100');
  if (!win) return false; // pop-up blocked
  win.document.open();
  win.document.write(buildHtml(session));
  win.document.close();
  // Give the new document a tick to lay out before invoking print.
  win.setTimeout(() => {
    try { win.focus(); win.print(); } catch { /* user can print manually */ }
  }, 350);
  return true;
}
