// ============================================================
// SwingVantage — AGI: Shareable report builders (pure)
// ------------------------------------------------------------
// Turns an AthleteGIResult into (a) a coach-friendly plain-text summary for
// copy / email / web-share, and (b) a self-contained printable HTML document.
// Both are pure string builders — no React, no browser — so they unit-test and
// can run anywhere. Privacy: text only, never video or raw pose.
// ============================================================

import type { AthleteGIResult, CapabilityState, InsightKind } from './types';

const KIND_LABEL: Record<InsightKind, string> = {
  readiness: 'Today',
  keystone: 'Keystone',
  goal: 'Goal',
  progress: 'Progress',
  strength: 'Strength',
  transfer: 'Transfer',
  imbalance: 'Transfer gap',
  recurring: 'Recurring',
  plateau: 'Plateau',
  consistency: 'Consistency',
  coverage: 'Next data',
};

function trendStr(c: CapabilityState): string {
  const t = c.trajectory;
  if (!t || t.direction === 'flat' || t.deltaFromFirst === null) return '';
  return ` ${t.direction === 'up' ? '↑' : '↓'}${t.deltaFromFirst > 0 ? '+' : ''}${t.deltaFromFirst}`;
}

function capLine(c: CapabilityState): string {
  if (c.score === null) return `  ${c.name.padEnd(24)} not observed yet`;
  return `  ${c.name.padEnd(24)} ${String(c.score).padStart(3)}/100  ${(c.band ?? '').padEnd(11)}${trendStr(c)}`;
}

export interface ReportOptions {
  siteUrl?: string;
}

/** A coach-friendly plain-text report. */
export function buildAgiReportText(result: AthleteGIResult, opts: ReportOptions = {}): string {
  const { model, insights, plan, progress, trust, keystoneTranslations, provenDrills } = result;
  const url = opts.siteUrl ?? 'swingvantage.com';
  const date = new Date().toLocaleDateString();
  const L: string[] = [];

  L.push('SwingVantage — Athlete General Intelligence');
  L.push(`Generated ${date} · Trust grade ${trust.grade} (${trust.score}/100) — ${trust.headline}`);
  L.push('');

  L.push('ATHLETE');
  L.push(`Sports: ${model.sports.length ? model.sports.join(', ') : '—'} · Coverage ${Math.round(model.coverage * 100)}%`);
  if (model.identity?.primaryGoal) L.push(`Goal: "${model.identity.primaryGoal}"`);
  L.push('');

  const keystone = insights.find((i) => i.kind === 'keystone');
  if (keystone) {
    L.push('THE ONE THING TO TRAIN (KEYSTONE)');
    L.push(keystone.title.replace('Keystone: ', ''));
    L.push(keystone.summary);
    for (const t of keystoneTranslations) L.push(`  • ${t.sportLabel}: ${t.text}`);
    L.push('');
  }

  L.push('YOUR PROFILE (cross-sport capabilities)');
  for (const c of model.capabilities) L.push(capLine(c));
  L.push('');

  L.push('TOP INSIGHTS');
  insights.slice(0, 6).forEach((i, n) => {
    L.push(`${n + 1}. [${KIND_LABEL[i.kind]}] ${i.title}`);
    L.push(`   ${i.summary}`);
    L.push(`   → ${i.action}`);
  });
  L.push('');

  if (plan.keystone) {
    L.push('PLAN');
    if (plan.todayNote) L.push(`Today: ${plan.todayNote}`);
    L.push(`Keystone focus: ${plan.keystone.name} — ${plan.keystone.why}`);
    L.push('This week:');
    for (const d of plan.week) L.push(`  ${d.day}: ${d.focus}${d.minutes ? ` (${d.minutes}m)` : ''}`);
    L.push(`Retest: ${plan.retestReminder}`);
    L.push('');
  }

  if (provenDrills.length) {
    L.push("WHAT'S WORKED FOR YOU");
    for (const d of provenDrills.slice(0, 6)) L.push(`  • ${d.drillName} (helped ${d.helpedCount}×)`);
    L.push('');
  }

  if (progress) {
    L.push('PROGRESS');
    L.push(progress.summary);
    L.push('');
  }

  L.push('— — —');
  L.push(result.disclaimer);
  L.push(`Made with SwingVantage — ${url}`);
  return L.join('\n');
}

// ── Printable HTML ────────────────────────────────────────────

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A self-contained printable HTML document (open in a window and print → PDF). */
export function buildAgiReportHtml(result: AthleteGIResult, opts: ReportOptions = {}): string {
  const { model, insights, plan, trust, keystoneTranslations, provenDrills } = result;
  const url = opts.siteUrl ?? 'swingvantage.com';
  const date = new Date().toLocaleDateString();
  const keystone = insights.find((i) => i.kind === 'keystone');

  const capRows = model.capabilities
    .map((c) => {
      const score = c.score === null ? '—' : `${c.score}/100`;
      const band = c.band ?? '';
      const trend = trendStr(c).trim();
      return `<tr><td>${esc(c.name)}</td><td class="num">${score}</td><td>${esc(band)}</td><td class="num">${esc(trend)}</td></tr>`;
    })
    .join('');

  const insightItems = insights
    .slice(0, 6)
    .map(
      (i) =>
        `<li><span class="tag">${esc(KIND_LABEL[i.kind])}</span> <strong>${esc(i.title)}</strong><br>${esc(i.summary)}<br><em>→ ${esc(i.action)}</em></li>`,
    )
    .join('');

  const weekRows = plan.keystone
    ? plan.week
        .map((d) => `<tr><td>${esc(d.day)}</td><td>${esc(d.focus)}</td><td class="num">${d.minutes ? `${d.minutes}m` : '—'}</td></tr>`)
        .join('')
    : '';

  const translations = keystoneTranslations.length
    ? `<ul class="trans">${keystoneTranslations.map((t) => `<li><strong>${esc(t.sportLabel)}:</strong> ${esc(t.text)}</li>`).join('')}</ul>`
    : '';

  const proven = provenDrills.length
    ? `<h2>What's worked for you</h2><ul>${provenDrills
        .slice(0, 6)
        .map((d) => `<li>${esc(d.drillName)} <span class="muted">(helped ${d.helpedCount}×)</span></li>`)
        .join('')}</ul>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><title>SwingVantage — Athlete General Intelligence</title>
<style>
  :root { color-scheme: light; }
  body { font: 13px/1.5 -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1a1a1a; max-width: 720px; margin: 28px auto; padding: 0 20px; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 22px 0 8px; }
  .sub { color: #666; margin: 0 0 4px; }
  .grade { display: inline-block; border: 1px solid #bbb; border-radius: 999px; padding: 1px 8px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  td, th { text-align: left; padding: 3px 6px; border-bottom: 1px solid #eee; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .key { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 12px; }
  .tag { display: inline-block; background: #eef; border-radius: 4px; padding: 0 5px; font-size: 11px; }
  ul { margin: 6px 0; padding-left: 18px; } li { margin: 4px 0; }
  .trans li { margin: 2px 0; } .muted { color: #888; }
  .foot { color: #888; font-size: 11px; margin-top: 22px; border-top: 1px solid #ddd; padding-top: 8px; }
  @media print { body { margin: 0; } }
</style></head><body>
  <h1>Athlete General Intelligence</h1>
  <p class="sub">Generated ${esc(date)} · <span class="grade">Trust ${esc(trust.grade)}</span> ${trust.score}/100 — ${esc(trust.headline)}</p>
  <p class="sub">Sports: ${esc(model.sports.join(', ') || '—')} · Coverage ${Math.round(model.coverage * 100)}%${model.identity?.primaryGoal ? ` · Goal: &ldquo;${esc(model.identity.primaryGoal)}&rdquo;` : ''}</p>

  ${keystone ? `<h2>The one thing to train (keystone)</h2><div class="key"><strong>${esc(keystone.title.replace('Keystone: ', ''))}</strong><br>${esc(keystone.summary)}</div>${translations}` : ''}

  <h2>Your profile (cross-sport capabilities)</h2>
  <table><thead><tr><th>Capability</th><th class="num">Score</th><th>Band</th><th class="num">Trend</th></tr></thead><tbody>${capRows}</tbody></table>

  <h2>Top insights</h2>
  <ul>${insightItems}</ul>

  ${plan.keystone ? `<h2>Plan${plan.todayNote ? '' : ''}</h2>${plan.todayNote ? `<p class="sub">Today: ${esc(plan.todayNote)}</p>` : ''}<p><strong>Focus:</strong> ${esc(plan.keystone.name)} — ${esc(plan.keystone.why)}</p><table><thead><tr><th>Day</th><th>Focus</th><th class="num">Mins</th></tr></thead><tbody>${weekRows}</tbody></table>` : ''}

  ${proven}

  <p class="foot">${esc(result.disclaimer)}<br>Made with SwingVantage — ${esc(url)}</p>
</body></html>`;
}
