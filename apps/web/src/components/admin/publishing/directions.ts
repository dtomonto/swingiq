// ============================================================
// PublishingOS — design directions (skins)
// ------------------------------------------------------------
// Three comparable visual directions for the command center, switchable live so
// the same REAL data can be evaluated under each treatment before one is
// chosen. All three live in the light Coach Mode admin chrome (so they stay
// coherent with the rest of /admin) but differ in surface tint, accent, density
// and rhythm. Add a direction here and it appears in the switcher automatically.
// ============================================================

export type DirectionId = 'mission-control' | 'calm-enterprise' | 'sport-tech';

export interface DirectionSkin {
  id: DirectionId;
  name: string;
  blurb: string;
  /** Page surface (background + base text). */
  page: string;
  /** Panel/card surface. */
  card: string;
  /** Stat tile surface. */
  stat: string;
  /** Stat value typography. */
  statValue: string;
  /** Accent (links, active states, key numbers). */
  accentText: string;
  /** Active tab pill. */
  tabActive: string;
  tabIdle: string;
  /** List row surface. */
  row: string;
  /** Section heading typography. */
  heading: string;
  /** Corner radius scale. */
  radius: string;
  density: 'comfortable' | 'compact';
}

export const DIRECTIONS: DirectionSkin[] = [
  {
    id: 'mission-control',
    name: 'A · Mission Control',
    blurb:
      'Dense, status-led command deck. Monochrome chrome — colour is reserved entirely for status, so live / risk / critical pop off the page. Tight rhythm, monospaced metadata, maximum information per screen.',
    page: 'bg-background text-foreground',
    card: 'rounded-lg border border-border bg-card',
    stat: 'rounded-lg border border-border bg-card/80',
    statValue: 'text-2xl font-bold tabular-nums text-foreground',
    // Neutral accent: reserving all chroma for status is the purest expression
    // of a status-led ops deck — and removes any adjacency clash.
    accentText: 'text-foreground',
    tabActive: 'bg-muted text-foreground border border-border',
    tabIdle: 'text-muted-foreground hover:text-foreground border border-transparent',
    row: 'rounded-md border border-border bg-card',
    heading: 'text-sm font-semibold uppercase tracking-wide text-foreground',
    radius: 'rounded-lg',
    density: 'compact',
  },
  {
    id: 'calm-enterprise',
    name: 'B · Calm Enterprise',
    blurb:
      'Spacious, editorial SaaS. Softer surfaces, generous whitespace, a calm blue accent, comfortable line-height. Trust through restraint — feels like a mature B2B console.',
    page: 'bg-background text-foreground',
    card: 'rounded-2xl border border-border/80 bg-card/60 shadow-sm',
    stat: 'rounded-2xl border border-border/80 bg-card/40',
    statValue: 'text-3xl font-semibold tracking-tight text-foreground',
    accentText: 'text-link',
    tabActive: 'bg-primary/10 text-link border border-primary/20 shadow-sm',
    tabIdle: 'text-muted-foreground hover:text-foreground border border-transparent',
    row: 'rounded-xl border border-border/70 bg-card/40',
    heading: 'text-base font-semibold text-foreground',
    radius: 'rounded-2xl',
    density: 'comfortable',
  },
  {
    id: 'sport-tech',
    name: 'C · Sport-Tech',
    blurb:
      'Performance-dashboard energy. Bold metrics, a teal performance accent and subtle gradients. The green / amber / red status colours are reserved for status, so "live" still reads at a glance.',
    page: 'bg-background text-foreground',
    // Teal accent (--accent-secondary) — deliberately OUTSIDE the status palette
    // (success=live, warning=high-risk, error=critical, link=info) so the brand
    // accent never reads as a status.
    card: 'rounded-xl border border-accent-secondary/30 bg-gradient-to-b from-card to-background',
    stat: 'rounded-xl border border-accent-secondary/30 bg-card/70',
    statValue: 'text-3xl font-black tabular-nums text-accent-secondary',
    accentText: 'text-accent-secondary',
    tabActive: 'bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/40',
    tabIdle: 'text-muted-foreground hover:text-accent-secondary border border-transparent',
    row: 'rounded-lg border border-border bg-card/80',
    heading: 'text-sm font-bold uppercase tracking-wider text-accent-secondary',
    radius: 'rounded-xl',
    density: 'comfortable',
  },
];

// Default to B · Calm Enterprise: its calm blue accent sits outside the status
// palette, so success=live / warning=risk / error=critical stay unambiguous.
export const DEFAULT_DIRECTION: DirectionId = 'calm-enterprise';

export function getDirection(id: string | null | undefined): DirectionSkin {
  return DIRECTIONS.find((d) => d.id === id) ?? DIRECTIONS[0];
}
