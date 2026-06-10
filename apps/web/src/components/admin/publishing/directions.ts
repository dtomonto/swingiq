// ============================================================
// PublishingOS — design directions (skins)
// ------------------------------------------------------------
// Three comparable visual directions for the command center, switchable live so
// the same REAL data can be evaluated under each treatment before one is
// chosen. All three live in the existing dark admin chrome (so they stay
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
      'Dense, status-led command deck. Monochrome steel chrome — colour is reserved entirely for status, so live / risk / critical pop off the page. Tight rhythm, monospaced metadata, maximum information per screen.',
    page: 'bg-gray-950 text-gray-100',
    card: 'rounded-lg border border-gray-800 bg-gray-900',
    stat: 'rounded-lg border border-gray-800 bg-gray-900/80',
    statValue: 'text-2xl font-bold tabular-nums text-gray-50',
    // Steel/neutral accent (was cyan, which sat between sky=info and
    // emerald=live). Reserving all chroma for status is the purest expression
    // of a status-led ops deck — and removes any adjacency clash.
    accentText: 'text-slate-300',
    tabActive: 'bg-slate-500/20 text-white border border-slate-400/40',
    tabIdle: 'text-gray-500 hover:text-slate-200 border border-transparent',
    row: 'rounded-md border border-gray-800 bg-gray-900',
    heading: 'text-sm font-semibold uppercase tracking-wide text-gray-300',
    radius: 'rounded-lg',
    density: 'compact',
  },
  {
    id: 'calm-enterprise',
    name: 'B · Calm Enterprise',
    blurb:
      'Spacious, editorial SaaS. Softer surfaces, generous whitespace, indigo accent, comfortable line-height. Trust through restraint — feels like a mature B2B console.',
    page: 'bg-[#0b0d12] text-slate-100',
    card: 'rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-sm',
    stat: 'rounded-2xl border border-slate-800/80 bg-slate-900/40',
    statValue: 'text-3xl font-semibold tracking-tight text-white',
    accentText: 'text-indigo-300',
    tabActive: 'bg-white/10 text-white border border-white/10 shadow-sm',
    tabIdle: 'text-slate-400 hover:text-slate-100 border border-transparent',
    row: 'rounded-xl border border-slate-800/70 bg-slate-900/40',
    heading: 'text-base font-semibold text-white',
    radius: 'rounded-2xl',
    density: 'comfortable',
  },
  {
    id: 'sport-tech',
    name: 'C · Sport-Tech',
    blurb:
      'Performance-dashboard energy. Bold metrics, a magenta performance accent and subtle gradients. The green / amber / red status colours are reserved for status, so "live" still reads at a glance.',
    page: 'bg-gray-950 text-gray-50',
    // Magenta accent — deliberately OUTSIDE the status palette (emerald=live,
    // amber=high-risk, red=critical, sky=info, violet=deploy) so the brand
    // accent never reads as a status. (Was emerald, which collided with "live".)
    card: 'rounded-xl border border-fuchsia-900/40 bg-gradient-to-b from-gray-900 to-gray-950',
    stat: 'rounded-xl border border-fuchsia-900/40 bg-gray-900/70',
    statValue: 'text-3xl font-black tabular-nums text-fuchsia-300',
    accentText: 'text-fuchsia-400',
    tabActive: 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/40',
    tabIdle: 'text-gray-400 hover:text-fuchsia-200 border border-transparent',
    row: 'rounded-lg border border-gray-800 bg-gray-900/80',
    heading: 'text-sm font-bold uppercase tracking-wider text-fuchsia-300/90',
    radius: 'rounded-xl',
    density: 'comfortable',
  },
];

// Default to B · Calm Enterprise: its indigo accent sits outside the status
// palette, so emerald=live / amber=risk / red=critical stay unambiguous.
export const DEFAULT_DIRECTION: DirectionId = 'calm-enterprise';

export function getDirection(id: string | null | undefined): DirectionSkin {
  return DIRECTIONS.find((d) => d.id === id) ?? DIRECTIONS[0];
}
