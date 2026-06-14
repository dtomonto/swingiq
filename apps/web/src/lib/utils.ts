import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(decimals);
}

export function formatYards(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${Math.round(n)} yds`;
}

export function formatMPH(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(1)} mph`;
}

export function formatRPM(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${Math.round(n)} rpm`;
}

export function formatDegrees(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(decimals)}°`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function scoreToColor(score: number): string {
  // Theme-safe score TEXT color. Uses the `*-text` accents (tuned per theme to
  // clear WCAG AA as a foreground on background/card in every theme), collapsed
  // to good/ok/bad — mirroring `scoreToBgColor` so a raw Tailwind green/amber/red
  // can't turn muddy or low-contrast on the dark or club palettes.
  if (score >= 70) return 'text-success-text';
  if (score >= 40) return 'text-warning-text';
  return 'text-error-text';
}

export function scoreToColorVar(score: number): string {
  // Theme-safe score color as a resolvable CSS color VALUE (not a class), for
  // SVG / inline styles a Tailwind class can't reach (ScoreRing stroke,
  // ProgressTimeline dots). Same good/ok/bad bands as `scoreToColor`, using the
  // per-theme AA-tuned `*-text` accents instead of fixed hex. IMPORTANT: apply
  // via a CSS property (e.g. `style={{ stroke }}`), never an SVG presentation
  // attribute — `var()` only resolves in CSS, not in attribute values.
  if (score >= 70) return 'hsl(var(--success-text))';
  if (score >= 40) return 'hsl(var(--warning-text))';
  return 'hsl(var(--error-text))';
}

export function scoreToBgColor(score: number): string {
  // Theme-aware tints (collapse 5 grade tiers to good/ok/bad so they stay
  // legible across every theme, including Dark Performance).
  if (score >= 70) return 'bg-success/15 text-success';
  if (score >= 40) return 'bg-warning/15 text-warning';
  return 'bg-error/15 text-error';
}

export function priorityToColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-error/12 text-error border-error/30';
    case 'high': return 'bg-warning/15 text-warning border-warning/35';
    case 'medium': return 'bg-warning/10 text-warning border-warning/25';
    case 'monitor': return 'bg-accent-secondary/12 text-accent-secondary border-accent-secondary/30';
    default: return 'bg-muted text-foreground border-border';
  }
}

export function clubCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    driver: 'Driver',
    fairway_wood: 'Fairway Wood',
    hybrid: 'Hybrid',
    long_iron: 'Long Iron',
    mid_iron: 'Mid Iron',
    short_iron: 'Short Iron',
    wedge: 'Wedge',
    putter: 'Putter',
  };
  return labels[category] ?? category;
}
