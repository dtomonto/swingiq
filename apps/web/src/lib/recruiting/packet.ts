// ============================================================
// Player Recruiting Hub — recruiting packet (printable PDF)
// ------------------------------------------------------------
// Builds a clean, branded, self-contained HTML packet and opens it for
// the browser's native "Save as PDF" / print — no PDF library, no
// server round-trip, and the raw video is NEVER embedded (only titles
// + links/QR). Every metric prints its source label, and honest
// disclaimers print on every packet. Mirrors lib/motion-lab/printReport.
// ============================================================

import { SPORT_META } from './sports';
import {
  type PacketVariant,
  type RecruitingState,
  DATA_SOURCE_LABEL,
  PLAYER_TYPE_LABEL,
  VERIFIED_SOURCES,
} from './types';
import { getMetricDef } from './metrics';
import { buildSummary } from './summary';
import { isMinor, shareUrl } from './share';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const VARIANT_TITLE: Record<PacketVariant, string> = {
  coach: 'Coach Evaluation Packet',
  scout: 'Scouting Data Packet',
  parent: 'Family Summary',
};

export function buildPacketHtml(state: RecruitingState, variant: PacketVariant, profileLink?: string): string {
  const p = state.profile;
  const sport = p?.primarySport ?? 'golf';
  const sportName = SPORT_META[sport].name;
  const sp = p?.sportProfiles[sport];
  const name = p?.athleteName?.trim() || 'Athlete';
  const klass = p?.graduationYear ? `Class of ${p.graduationYear}` : '';
  const minor = isMinor(p?.dateOfBirth);

  const audience = variant === 'parent' ? 'parent' : variant === 'scout' ? 'scout' : 'coach';
  const summary = buildSummary(state, audience, sport);

  const metricRows = state.metrics
    .filter((m) => m.sport === sport && m.currentValue != null && m.visibility !== 'private')
    .map((m) => {
      const def = getMetricDef(m.metricKey);
      const verified = VERIFIED_SOURCES.has(m.source as never) || m.coachValidated;
      return `<tr>
        <td>${esc(def?.label ?? m.metricKey)}</td>
        <td class="num">${m.currentValue}${m.unit ? ' ' + esc(m.unit) : ''}</td>
        <td><span class="src ${verified ? 'ok' : ''}">${esc(DATA_SOURCE_LABEL[m.source])}</span></td>
      </tr>`;
    })
    .join('');

  const filmRows = state.film
    .filter((f) => !f.deletedAt && f.visibility !== 'private')
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 12)
    .map(
      (f) => `<li><b>${esc(f.title)}</b> — ${esc(f.category.replace(/_/g, ' '))}${f.opponentOrEvent ? ` · ${esc(f.opponentOrEvent)}` : ''}${f.featured ? ' <span class="pill">Featured</span>' : ''}</li>`,
    )
    .join('');

  const noteRows = state.coachNotes
    .filter((n) => n.visibility !== 'private')
    .map((n) => `<div class="note"><p>${esc(n.body)}</p><span class="by">— ${esc(n.authorName)}${n.authorRole ? `, ${esc(n.authorRole)}` : ''}${n.verified ? ' (verified)' : ''}</span></div>`)
    .join('');

  const claimRows = summary.claims
    .map((c) => `<li>${esc(c.text)} <span class="conf">[${esc(c.confidence)}]</span></li>`)
    .join('');

  const link = profileLink || (state.shareLinks.find((l) => l.active)?.slug ? shareUrl(state.shareLinks.find((l) => l.active)!.slug) : '');

  const contact: string[] = [];
  if (p?.maskAthleteContact || minor) {
    if (p?.guardianName || p?.guardianEmail) contact.push(`Guardian: ${esc([p?.guardianName, p?.guardianEmail].filter(Boolean).join(' · '))}`);
    if (p?.primaryCoachName || p?.primaryCoachContact) contact.push(`Coach: ${esc([p?.primaryCoachName, p?.primaryCoachContact].filter(Boolean).join(' · '))}`);
  } else {
    if (p?.contactEmail) contact.push(`Email: ${esc(p.contactEmail)}`);
    if (p?.contactPhone) contact.push(`Phone: ${esc(p.contactPhone)}`);
  }

  const academic =
    variant !== 'scout' && (p?.gpa || p?.intendedMajor || p?.testScores)
      ? `<div class="box"><h3>Academics</h3><p>${[p?.gpa ? `GPA ${p.gpa}` : '', p?.testScores ? esc(p.testScores) : '', p?.intendedMajor ? `Intended major: ${esc(p.intendedMajor)}` : ''].filter(Boolean).join(' · ')}</p></div>`
      : '';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(name)} — ${VARIANT_TITLE[variant]}</title>
<style>
  :root { --ink:#0b1220; --muted:#64748b; --accent:${SPORT_META[sport].accentColor}; --line:#e2e8f0; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: var(--ink); margin: 0; padding: 32px; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 3px solid var(--accent); padding-bottom: 14px; }
  h1 { margin: 0; font-size: 26px; }
  .sub { color: var(--muted); margin-top: 4px; font-size: 14px; }
  .brand { text-align:right; font-weight:800; color: var(--accent); }
  .brand small { display:block; color: var(--muted); font-weight:500; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin: 22px 0 8px; }
  h3 { margin: 0 0 6px; font-size: 14px; }
  table { width:100%; border-collapse: collapse; font-size: 13px; }
  td { padding: 6px 8px; border-bottom: 1px solid var(--line); }
  .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  .src { font-size: 11px; color: var(--muted); }
  .src.ok { color: #15803d; font-weight: 600; }
  ul { margin: 0; padding-left: 18px; font-size: 13px; }
  li { margin: 4px 0; }
  .pill { background: var(--accent); color:#fff; border-radius: 999px; padding: 1px 7px; font-size: 10px; }
  .conf { color: var(--muted); font-size: 11px; }
  .box { background:#f8fafc; border:1px solid var(--line); border-radius:10px; padding:12px 14px; margin-top:8px; }
  .note { border-left: 3px solid var(--accent); padding: 4px 10px; margin: 8px 0; }
  .note .by { color: var(--muted); font-size: 12px; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .foot { margin-top: 26px; border-top:1px solid var(--line); padding-top: 12px; color: var(--muted); font-size: 11px; }
  @media print { body { padding: 0; } a { color: inherit; text-decoration: none; } }
</style></head>
<body>
  <div class="head">
    <div>
      <h1>${esc(name)}</h1>
      <div class="sub">${[klass, sportName, sp?.position ? esc(sp.position) : '', PLAYER_TYPE_LABEL[p?.playerType ?? 'high_school']].filter(Boolean).join(' · ')}</div>
      <div class="sub">${[p?.schoolOrClub ? esc(p.schoolOrClub) : '', p?.hometownRegion ? esc(p.hometownRegion) : ''].filter(Boolean).join(' · ')}</div>
    </div>
    <div class="brand">SwingVantage<small>${esc(VARIANT_TITLE[variant])}</small></div>
  </div>

  <h2>Player summary</h2>
  <p style="font-size:14px; line-height:1.5">${esc(summary.body)}</p>
  ${claimRows ? `<h2>What the evidence shows</h2><ul>${claimRows}</ul>` : ''}
  ${summary.caveats.length ? `<div class="box"><h3>Honest caveats</h3><ul>${summary.caveats.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}

  <div class="grid">
    <div>
      <h2>Key metrics</h2>
      ${metricRows ? `<table><tbody>${metricRows}</tbody></table>` : '<p class="sub">No data added yet.</p>'}
    </div>
    <div>
      <h2>Film</h2>
      ${filmRows ? `<ul>${filmRows}</ul>` : '<p class="sub">No film added yet.</p>'}
      ${link ? `<p class="sub" style="margin-top:8px">Full film + live data: ${esc(link)}</p>` : ''}
    </div>
  </div>

  ${noteRows ? `<h2>Coach / trainer notes</h2>${noteRows}` : ''}
  ${academic}

  <h2>Contact</h2>
  <p style="font-size:13px">${contact.length ? contact.join('<br/>') : 'Contact available on the live recruiting profile.'}</p>

  <div class="foot">
    Generated by SwingVantage. Data points are labeled by source; self-reported figures are not independently verified.
    This packet describes evidence and does not project recruiting outcomes. ${minor ? 'This athlete is a minor — please route contact through the guardian or coach. ' : ''}
    Follow your school, league, and association (NCAA/NAIA/NJCAA/club/international) recruiting rules; verify current rules with the relevant compliance office.
  </div>
</body></html>`;
}

/** Open the packet in a new tab and trigger the print dialog. Returns false if popups are blocked. */
export function openPacketForPrint(state: RecruitingState, variant: PacketVariant, profileLink?: string): boolean {
  if (typeof window === 'undefined') return false;
  const html = buildPacketHtml(state, variant, profileLink);
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    try {
      win.print();
    } catch {
      /* user can still print manually */
    }
  }, 350);
  return true;
}
