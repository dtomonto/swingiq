// ============================================================
// SwingVantage — <SportHero>
// ------------------------------------------------------------
// A reusable, on-brand hero for any sport surface. One component,
// three switchable layouts (`spotlight` · `split` · `minimal`) so the
// owner can preview and pick the look per page without bespoke markup.
//
// Brand discipline: the sport accent is used ONLY as a *fill* paired
// with its tuned `--sport-accent-foreground` (eyebrow pill, primary
// CTA, accent panel) — never as text on the page background — so every
// variant inherits the AA contrast guarantee baked into the tokens.
// Motion uses the existing `--animate-*` language; respects
// reduced-motion globally.
// ============================================================

'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { cn } from '@/lib/utils';
import { getSportBrand } from '@/lib/sport-brand/registry';
import { SportShell } from './SportShell';

export type SportHeroVariant = 'spotlight' | 'split' | 'minimal';

interface HeroCta {
  label: string;
  href: string;
}

interface HeroStat {
  label: string;
  value: string;
}

interface SportHeroProps {
  sport: SportId;
  variant?: SportHeroVariant;
  /** Defaults to the sport's brand name. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  stats?: HeroStat[];
  /** Paint the sport's subtle background motif (default on). */
  motif?: boolean;
  className?: string;
}

const accentFill = 'bg-[var(--sport-accent)] text-[var(--sport-accent-foreground)]';
const accentRing = 'ring-1 ring-inset ring-[color-mix(in_srgb,var(--sport-accent)_35%,transparent)]';

function EyebrowPill({ sport, label }: { sport: SportId; label: string }) {
  const brand = getSportBrand(sport);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        accentFill,
      )}
    >
      <span aria-hidden="true">{brand.emoji}</span>
      {label}
    </span>
  );
}

function PrimaryCta({ cta }: { cta: HeroCta }) {
  return (
    <Link
      href={cta.href}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold shadow-sm',
        'transition-[filter,box-shadow,transform] duration-150 hover:brightness-[1.08] hover:shadow-md active:translate-y-px',
        'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--sport-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        accentFill,
      )}
    >
      {cta.label}
      <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SecondaryCta({ cta }: { cta: HeroCta }) {
  return (
    <Link
      href={cta.href}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-base font-medium text-foreground',
        'transition-colors hover:bg-muted hover:border-border/80 active:translate-y-px',
        'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      {cta.label}
    </Link>
  );
}

function StatList({ stats, className }: { stats: HeroStat[]; className?: string }) {
  return (
    <dl className={cn('flex flex-wrap gap-x-8 gap-y-3', className)}>
      {stats.map((s) => (
        <div key={s.label}>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</dt>
          <dd className="text-2xl font-bold text-foreground">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SportHero({
  sport,
  variant = 'spotlight',
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  stats,
  motif = true,
  className,
}: SportHeroProps) {
  const brand = getSportBrand(sport);
  const eyebrowLabel = eyebrow ?? brand.name;

  const ctas = (primaryCta || secondaryCta) && (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {primaryCta && <PrimaryCta cta={primaryCta} />}
      {secondaryCta && <SecondaryCta cta={secondaryCta} />}
    </div>
  );

  // ── Spotlight: centered, emoji halo, premium and high-impact ──
  if (variant === 'spotlight') {
    return (
      <SportShell sport={sport} motif={motif} as="section" className={cn('overflow-hidden', className)}>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <div
            className={cn(
              'mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-5xl',
              'motion-safe:animate-[var(--animate-fade-in)]',
              accentRing,
            )}
            style={{ background: 'color-mix(in srgb, var(--sport-accent) 12%, transparent)' }}
            aria-hidden="true"
          >
            {brand.emoji}
          </div>
          <div className="mb-4 flex justify-center">
            <EyebrowPill sport={sport} label={eyebrowLabel} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
          )}
          {ctas && <div className="flex justify-center">{ctas}</div>}
          {stats && stats.length > 0 && (
            <StatList stats={stats} className="mt-12 justify-center" />
          )}
        </div>
      </SportShell>
    );
  }

  // ── Split: text + accent panel, editorial and informative ──
  if (variant === 'split') {
    return (
      <SportShell sport={sport} motif={motif} as="section" className={cn('overflow-hidden', className)}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <EyebrowPill sport={sport} label={eyebrowLabel} />
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
            {subtitle && <p className="mt-4 max-w-xl text-lg text-muted-foreground">{subtitle}</p>}
            {ctas}
          </div>
          <div
            className={cn(
              'relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-3xl',
              accentRing,
            )}
            style={{
              background:
                'linear-gradient(140deg, color-mix(in srgb, var(--sport-accent) 22%, transparent), color-mix(in srgb, var(--sport-accent) 6%, transparent))',
            }}
          >
            <span className="text-[7rem] leading-none motion-safe:animate-[var(--animate-fade-in)]" aria-hidden="true">
              {brand.emoji}
            </span>
            {stats && stats.length > 0 && (
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-border bg-card/85 p-4 backdrop-blur-sm">
                <StatList stats={stats} />
              </div>
            )}
          </div>
        </div>
      </SportShell>
    );
  }

  // ── Minimal: compact left band with an accent rule, dense pages ──
  return (
    <SportShell sport={sport} motif={motif} as="section" className={className}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div
          className="border-l-4 pl-5"
          style={{ borderColor: 'var(--sport-accent)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{brand.emoji}</span>
            <EyebrowPill sport={sport} label={eyebrowLabel} />
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {ctas}
            {stats && stats.length > 0 && <StatList stats={stats} className="mt-8" />}
          </div>
        </div>
      </div>
    </SportShell>
  );
}
