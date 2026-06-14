// ============================================================
// /admin/accessibility — Theme & Accessibility
// ------------------------------------------------------------
// Read-only WCAG contrast audit over the real theme registry. Scores the
// readability-critical foreground/background pairs of every theme and
// flags any that fall below WCAG AA — the operator-facing guard against
// the classic "white-on-white" unreadable-theme defect.
// ============================================================

import type { Metadata } from 'next';
import { Contrast, AlertTriangle, CheckCircle2, Palette } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { THEMES } from '@/lib/theme/themes';
import { auditThemes, type ContrastGrade, type ThemeLike } from '@/lib/admin/accessibility/contrast';

export const metadata: Metadata = { title: 'Theme & Accessibility | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const GRADE_TONE: Record<ContrastGrade, BadgeTone> = {
  AAA: 'success',
  AA: 'success',
  'AA-large': 'warning',
  fail: 'danger',
};

// Admin chrome themes. Coach Mode is already a product theme (in THEMES), but
// Coach Night is admin-only (not in the user-facing switcher) — it still has to
// clear the same AA bar, so the auditor audits its own house too (audit F9).
// Values mirror the [data-theme='coach-night'] block in globals.css; the CI
// contrast test parses globals.css directly and is the authoritative guard.
const ADMIN_THEMES: ThemeLike[] = [
  {
    id: 'coach-night',
    name: 'Coach Night (admin dark)',
    category: 'dark',
    swatches: {
      bg: 'hsl(218 28% 9%)',
      surface: 'hsl(218 24% 12%)',
      text: 'hsl(214 30% 92%)',
      primary: 'hsl(217 80% 52%)',
      accent: 'hsl(173 52% 46%)',
    },
  },
];

export default function AdminAccessibilityPage() {
  const report = auditThemes([
    ...THEMES.map((t) => ({ id: t.id, name: t.name, category: t.category, swatches: t.swatches })),
    ...ADMIN_THEMES,
  ]);
  const { stats } = report;
  const healthy = stats.failingPairs === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Theme & Accessibility"
        icon={Contrast}
        description="A live WCAG contrast audit of every theme. It scores the readability-critical text/background pairs and flags anything below WCAG AA — so an unreadable theme (white-on-white, dark-on-dark) is caught here, not by a user. Read-only."
        actions={
          <StatusBadge tone={healthy ? 'success' : 'danger'}>
            {healthy ? 'All themes pass AA' : `${stats.failingPairs} failing pair${stats.failingPairs === 1 ? '' : 's'}`}
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Themes" icon={Palette} value={String(stats.themes)} hint="audited" />
        <MetricStat label="Pairs checked" icon={Contrast} value={String(stats.pairsChecked)} hint="WCAG ratios" />
        <MetricStat label="Failing themes" icon={AlertTriangle} tone={stats.failingThemes ? 'default' : 'muted'} value={String(stats.failingThemes)} hint="below AA" />
        <MetricStat label="Failing pairs" icon={AlertTriangle} tone={stats.failingPairs ? 'default' : 'muted'} value={String(stats.failingPairs)} hint="to fix" />
      </div>

      {report.themes.map((t) => (
        <SectionCard
          key={t.id}
          title={
            <span className="flex items-center gap-2">
              {t.name}
              <StatusBadge tone={t.category === 'dark' ? 'neutral' : 'info'}>{t.category}</StatusBadge>
              {t.fails > 0
                ? <StatusBadge tone="danger">{t.fails} failing</StatusBadge>
                : <StatusBadge tone="success">passes AA</StatusBadge>}
            </span>
          }
          description={`Worst pair ratio: ${t.worstRatio.toFixed(2)}:1`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-2xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-3">Pair</th>
                  <th className="pb-2 pr-3">Preview</th>
                  <th className="pb-2 pr-3">Ratio</th>
                  <th className="pb-2 pr-3">Needs</th>
                  <th className="pb-2">Grade</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {t.pairs.map((p) => (
                  <tr key={p.label} className="border-t border-border">
                    <td className="py-2 pr-3">{p.label}</td>
                    <td className="py-2 pr-3">
                      <span
                        className="inline-flex items-center justify-center rounded px-2 py-1 text-xs font-semibold ring-1 ring-border"
                        style={{ backgroundColor: p.bg, color: p.fg }}
                      >
                        Aa
                      </span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{p.ratio.toFixed(2)}:1</td>
                    <td className="py-2 pr-3 text-muted-foreground">{p.minNeeded.toFixed(1)}:1</td>
                    <td className="py-2">
                      <StatusBadge tone={GRADE_TONE[p.grade]}>
                        {p.passes
                          ? <><CheckCircle2 className="h-3 w-3" /> {p.grade}</>
                          : <><AlertTriangle className="h-3 w-3" /> {p.grade}</>}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ))}

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> A contrast auditor that reads the real
          theme palette and computes WCAG 2.1 ratios for the pairs that decide readability — body text on the
          page, text on cards, and accents. AA needs 4.5:1 for body text (3:1 for large/UI); AAA is 7:1.
        </p>
        <p>
          <strong className="text-foreground">Why it matters.</strong> It is the guard against the worst theme
          bug: text that disappears into its background. If a theme edit pushes a pair below AA, it shows up
          here in red with the exact ratio — fix the token in <code>globals.css</code> /
          <code>lib/theme/themes.ts</code> until it passes.
        </p>
        <p>
          <strong className="text-foreground">Also enforced in CI.</strong> The same minimums are guarded by
          <code>lib/theme/__tests__/theme-contrast.test.ts</code>, which parses <code>globals.css</code> and
          fails the build if any theme regresses — this board is the in-app, human-readable view of that.
        </p>
      </HelpPanel>
    </div>
  );
}
