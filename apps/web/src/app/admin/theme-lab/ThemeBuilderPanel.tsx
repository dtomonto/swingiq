'use client';

// Theme Lab — token builder + cross-journey preview (#3 step 3 / governance #8).
// A token editor over the EXISTING globals.css CSS vars: seed from a base theme,
// tweak the core tokens with a color picker, see a live mini-app preview, and
// EXPORT a `[data-theme]` block to paste + commit. Nothing auto-publishes — the
// operator commits the CSS, exactly like the other curated themes.

import { useEffect, useRef, useState } from 'react';
import { Copy, RotateCcw, Wand2, ExternalLink } from 'lucide-react';
import { THEMES, DEFAULT_THEME_ID, type ThemeId } from '@/lib/theme/themes';
import { tripleToHex, hexToTriple } from '@/lib/theme-lab';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import { writeThemeLabControl } from '@/lib/theme-lab/control';

// The curated tokens that define a theme's look (a subset of the full palette).
const TOKENS: { cssVar: string; label: string }[] = [
  { cssVar: '--background', label: 'Background' },
  { cssVar: '--foreground', label: 'Text' },
  { cssVar: '--card', label: 'Card' },
  { cssVar: '--card-foreground', label: 'Card text' },
  { cssVar: '--primary', label: 'Primary' },
  { cssVar: '--primary-foreground', label: 'On primary' },
  { cssVar: '--accent-secondary', label: 'Accent' },
  { cssVar: '--ring', label: 'Focus ring' },
];

// The seeded journeys already render real components without a login.
const JOURNEYS = [
  { href: '/', label: 'Homepage' },
  { href: '/design-lab/dashboard', label: 'Dashboard' },
  { href: '/design-lab/diagnose', label: 'Diagnose' },
];

const slug = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'custom';

export function ThemeBuilderPanel({ actor }: { actor: string }) {
  const [mounted, setMounted] = useState(false);
  const [base, setBase] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [name, setName] = useState('Custom Theme');
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const seedRef = useRef<HTMLDivElement | null>(null);

  // Seed (and re-seed) the editable tokens from the base theme's COMPUTED values
  // via a hidden element scoped to that theme — the honest current palette.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = seedRef.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const next: Record<string, string> = {};
    for (const t of TOKENS) next[t.cssVar] = cs.getPropertyValue(t.cssVar).trim() || '0 0% 50%';
    setEdited(next);
  }, [base]);

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading builder…</p>;

  const previewStyle = Object.fromEntries(
    TOKENS.map((t) => [t.cssVar, edited[t.cssVar] ?? '']),
  ) as React.CSSProperties;

  function setToken(cssVar: string, hex: string) {
    const triple = hexToTriple(hex);
    if (triple) setEdited((e) => ({ ...e, [cssVar]: triple }));
  }

  function exportCss(): string {
    const lines = TOKENS.map((t) => `  ${t.cssVar}: ${edited[t.cssVar]};`).join('\n');
    return `[data-theme="${slug(name)}"] {\n${lines}\n}`;
  }

  async function copyCss() {
    try {
      await navigator.clipboard.writeText(exportCss());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      recordAudit({
        actor,
        action: 'theme.builder.export',
        entityType: 'theme',
        entityId: slug(name),
        summary: `Exported token block for "${name}" (from ${base})`,
      });
    } catch {
      /* clipboard unavailable */
    }
  }

  function previewJourney(href: string) {
    // Pin the base theme on this device, then open the journey to preview it.
    writeThemeLabControl({ forcedThemeId: base });
    window.open(href, '_blank', 'noopener');
  }

  return (
    <div className="space-y-5">
      {/* Hidden seed element scoped to the base theme. */}
      <div ref={seedRef} data-theme={base} aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden" />

      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-link" />
        <h3 className="text-sm font-semibold text-foreground">Token builder</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Tweak a theme&apos;s core tokens and export a <code className="text-muted-foreground">[data-theme]</code>{' '}
        block. Paste it into <code className="text-muted-foreground">globals.css</code> and commit — nothing
        is published automatically.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Seed from
          <select
            value={base}
            onChange={(e) => setBase(e.target.value as ThemeId)}
            className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          New theme name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Token editors */}
        <div className="space-y-2">
          {TOKENS.map((t) => {
            const hex = tripleToHex(edited[t.cssVar] ?? '') ?? '#808080';
            return (
              <div key={t.cssVar} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{t.label}</p>
                  <p className="font-mono text-3xs text-muted-foreground/70">
                    {t.cssVar}: {edited[t.cssVar]}
                  </p>
                </div>
                <input
                  type="color"
                  value={hex}
                  aria-label={`${t.label} color`}
                  onChange={(e) => setToken(t.cssVar, e.target.value)}
                  className="h-7 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent"
                />
              </div>
            );
          })}
        </div>

        {/* Live preview (mini app in the edited palette) */}
        <div>
          <div
            style={previewStyle}
            className="rounded-xl border border-border p-4"
          >
            <div
              className="rounded-lg p-3"
              style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
            >
              <div
                className="rounded-md p-3 shadow"
                style={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
              >
                <p className="text-xs font-semibold">Swing analysis</p>
                <p className="mt-0.5 text-2xs opacity-70">Top fault · Early extension</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="rounded px-2 py-1 text-2xs font-bold"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  >
                    Analyze
                  </span>
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: 'hsl(var(--accent-secondary))' }}
                  />
                  <span
                    className="h-3 flex-1 rounded-full"
                    style={{ background: 'hsl(var(--ring))', opacity: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={copyCss}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary"
            >
              <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy CSS'}
            </button>
            <button
              onClick={() => {
                const el = seedRef.current;
                if (!el) return;
                const cs = getComputedStyle(el);
                const next: Record<string, string> = {};
                for (const t of TOKENS) next[t.cssVar] = cs.getPropertyValue(t.cssVar).trim();
                setEdited(next);
              }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Reset to base
            </button>
          </div>
        </div>
      </div>

      {/* Export block */}
      <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-2xs text-foreground">
        {exportCss()}
      </pre>

      {/* Preview across journeys */}
      <div className="space-y-2 border-t border-border pt-4">
        <h4 className="text-sm font-semibold text-foreground">Preview across journeys</h4>
        <p className="text-xs text-muted-foreground">
          Pin the seed theme ({THEMES.find((t) => t.id === base)?.name}) on this device and open a
          real journey in a new tab. Clear the pin from the kill-switch above when done.
        </p>
        <div className="flex flex-wrap gap-2">
          {JOURNEYS.map((j) => (
            <button
              key={j.href}
              onClick={() => previewJourney(j.href)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:border-border"
            >
              <ExternalLink className="h-3 w-3" /> {j.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
