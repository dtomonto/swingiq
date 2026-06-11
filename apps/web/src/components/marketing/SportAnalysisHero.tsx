import Link from 'next/link';
import { ArrowRight, Lock, UserX, Zap, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { designV2EnabledFromEnv } from '@/lib/design-v2';

type Cta = { label: string; href: string };
type Chip = { icon: LucideIcon; label: string };

/**
 * The "Dark Performance" (B) hero for the per-sport SEO landing pages
 * (golf / tennis / baseball / softball …). Mirrors the homepage hero
 * (`LocalizedHome`): near-black `bg-theme-hero` wash, a live-ping eyebrow pill,
 * a big uppercase Space-Grotesk headline with a green `text-link` accent phrase,
 * dual CTAs, and trust chips — so every sport page reads as the same brand
 * instead of the old flat full-green `bg-primary` header.
 *
 * Per-sport identity comes ONLY from `accentVar` (a `--sport-<slug>` token),
 * used purely as a decorative border + ping tint. Text accents stay on the
 * theme-validated `text-link`/`text-foreground`, so the page never depends on a
 * sport color clearing contrast as TEXT on the dark background.
 */

const DEFAULT_CHIPS: Chip[] = [
  { icon: UserX, label: 'No account required' },
  { icon: Zap, label: '100% free' },
  { icon: Lock, label: 'Private by default' },
];

export function SportAnalysisHero({
  accentVar,
  eyebrow,
  title,
  titleAccent,
  subtitle,
  primaryCta,
  secondaryCta,
  chips = DEFAULT_CHIPS,
}: {
  /** A `--sport-<slug>` CSS variable, e.g. `--sport-golf`. Decorative only. */
  accentVar: string;
  eyebrow: string;
  title: string;
  /** The phrase rendered in the green accent color. */
  titleAccent: string;
  subtitle: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  /** Trust chips under the CTAs. Pass `[]` to hide. */
  chips?: Chip[];
}) {
  const accent = `hsl(var(${accentVar}))`;

  // Design V2: light up the FULL sport identity (wash + pattern) on the hero.
  // Env-gated (not the cookie) so this stays a server component — no client JS
  // on SEO landing pages. `data-sport` is derived from the accent token
  // (`--sport-golf` → `golf`, `--sport-softball-slow` → `softball_slow`) and set
  // LOCALLY on the hero so it shows THIS page's sport regardless of the
  // visitor's active sport. The wash/pattern are inline `var()` styles (they
  // resolve down the cascade on a nested `data-sport` wrapper — unlike the
  // root-computed `@theme` bg-sport-* utilities).
  const v2 = designV2EnabledFromEnv();
  const sportSlug = accentVar.replace('--sport-', '').replace(/-/g, '_');

  return (
    <header
      className="relative overflow-hidden bg-theme-hero"
      {...(v2 ? { 'data-sport': sportSlug } : {})}
    >
      {v2 && (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'var(--sport-wash)' }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-repeat"
            style={{ backgroundImage: 'var(--sport-pattern)' }}
            aria-hidden="true"
          />
        </>
      )}
      <div className={cn('mx-auto max-w-4xl px-4 py-16 text-center sm:py-24', v2 && 'relative z-10')}>
        <span
          className="inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-link"
          style={{ borderColor: `hsl(var(${accentVar}) / 0.45)` }}
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: accent }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: accent }}
            />
          </span>
          {eyebrow}
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl font-heading text-4xl font-bold uppercase leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          {title} <span className="text-link">{titleAccent}</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-bold text-primary-foreground shadow-theme transition-colors hover:bg-primary/90"
          >
            {primaryCta.label}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link
            href={secondaryCta.href}
            className="inline-flex items-center justify-center rounded-xl border border-border px-7 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            {secondaryCta.label}
          </Link>
        </div>

        {chips.length > 0 && (
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {chips.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon size={16} className="shrink-0 text-link" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
