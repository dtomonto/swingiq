// ============================================================
// GrowthOS — Navigation map (28 sections, grouped for usability)
// ------------------------------------------------------------
// Single source of truth for the GrowthOS sidebar/command menu. The
// shell renders straight from this, so adding a module = one entry.
// ============================================================

import {
  Gauge, Compass, Megaphone, Layers, CalendarDays,
  DollarSign, Search, FileText, Share2,
  Mail, Route,
  Users, Gift, MessagesSquare, Newspaper, Star,
  MousePointerClick, FlaskConical, Tag,
  BarChart3, GitBranch, Telescope,
  Palette, FolderOpen,
  ShieldCheck,
  Sparkles, Lightbulb, ClipboardList,
  Network, Link2,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** One-line description shown in the command menu + page header. */
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const BASE = '/admin/growth';

export const GROWTH_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { key: 'overview', label: 'Executive Overview', href: BASE, icon: Gauge, description: 'Leadership KPI snapshot + AI strategic recommendations.' },
    ],
  },
  {
    label: 'Plan',
    items: [
      { key: 'strategy', label: 'Strategy Hub', href: `${BASE}/strategy`, icon: Compass, description: 'Strategic objectives scored by impact, confidence, effort.' },
      { key: 'campaigns', label: 'Campaigns', href: `${BASE}/campaigns`, icon: Megaphone, description: 'Plan, schedule, and track multi-channel campaigns.' },
      { key: 'channels', label: 'Channel Portfolio', href: `${BASE}/channels`, icon: Layers, description: 'Every channel: maturity, budget, expected CAC/ROI.' },
      { key: 'calendar', label: 'Marketing Calendar', href: `${BASE}/calendar`, icon: CalendarDays, description: 'Unified launch + publishing calendar across channels.' },
    ],
  },
  {
    label: 'Acquire',
    items: [
      { key: 'paid-media', label: 'Paid Media', href: `${BASE}/paid-media`, icon: DollarSign, description: 'Paid platform planning + creative testing matrix.' },
      { key: 'seo', label: 'SEO / AEO / GEO', href: `${BASE}/seo`, icon: Search, description: 'Organic + answer-engine + generative-search visibility.' },
      { key: 'content', label: 'Content Studio', href: `${BASE}/content`, icon: FileText, description: 'Central content pipeline with a repurposing engine.' },
      { key: 'social', label: 'Organic Social', href: `${BASE}/social`, icon: Share2, description: 'Social calendar, pillars, hooks, and post drafts.' },
    ],
  },
  {
    label: 'Authority & Links',
    items: [
      { key: 'link-intelligence', label: 'Link Intelligence', href: `${BASE}/link-intelligence`, icon: Network, description: 'The links brain: internal-link health, backlink opportunities, competitor gaps, AEO readiness.' },
      { key: 'internal-links', label: 'Internal Links', href: `${BASE}/internal-links`, icon: Link2, description: 'Internal-link recommendations + site audit (orphans, broken, anchors).' },
    ],
  },
  {
    label: 'Engage',
    items: [
      { key: 'crm', label: 'Email / CRM', href: `${BASE}/crm`, icon: Mail, description: 'Lifecycle messaging — draft-first, never auto-sends.' },
      { key: 'lifecycle', label: 'Lifecycle Journeys', href: `${BASE}/lifecycle`, icon: Route, description: 'Stage-by-stage user journey + next-best-action.' },
    ],
  },
  {
    label: 'Expand',
    items: [
      { key: 'creators', label: 'Creators / Affiliates', href: `${BASE}/creators`, icon: Users, description: 'Creator + affiliate partnerships and disclosures.' },
      { key: 'referral', label: 'Referral Engine', href: `${BASE}/referral`, icon: Gift, description: 'Ethical referral loops + K-factor planning.' },
      { key: 'community', label: 'Community Growth', href: `${BASE}/community`, icon: MessagesSquare, description: 'Community initiatives, prompts, and engagement.' },
      { key: 'pr', label: 'Digital PR', href: `${BASE}/pr`, icon: Newspaper, description: 'Authority-building, outreach, and backlinks.' },
      { key: 'reputation', label: 'Reputation', href: `${BASE}/reputation`, icon: Star, description: 'Permissioned social proof + trust assets.' },
    ],
  },
  {
    label: 'Optimize',
    items: [
      { key: 'cro', label: 'CRO Lab', href: `${BASE}/cro`, icon: MousePointerClick, description: 'Conversion opportunities scored and prioritized.' },
      { key: 'experiments', label: 'Experiments', href: `${BASE}/experiments`, icon: FlaskConical, description: 'Growth experiment backlog with ICE scoring.' },
      { key: 'offers', label: 'Offers / Monetization', href: `${BASE}/offers`, icon: Tag, description: 'Offer + pricing tests with margin awareness.' },
    ],
  },
  {
    label: 'Measure',
    items: [
      { key: 'analytics', label: 'Analytics', href: `${BASE}/analytics`, icon: BarChart3, description: 'KPI dictionary, UTM builder, channel performance.' },
      { key: 'attribution', label: 'Attribution', href: `${BASE}/attribution`, icon: GitBranch, description: 'Privacy-aware first/last-touch attribution model.' },
      { key: 'market-intel', label: 'Market Intelligence', href: `${BASE}/market-intel`, icon: Telescope, description: 'Competitor + voice-of-customer insights.' },
    ],
  },
  {
    label: 'Brand & Assets',
    items: [
      { key: 'brand', label: 'Brand Voice', href: `${BASE}/brand`, icon: Palette, description: 'Positioning, claims, tone — the brand OS.' },
      { key: 'assets', label: 'Asset Library', href: `${BASE}/assets`, icon: FolderOpen, description: 'Centralized marketing asset inventory.' },
    ],
  },
  {
    label: 'Govern',
    items: [
      { key: 'privacy', label: 'Privacy / Consent', href: `${BASE}/privacy`, icon: ShieldCheck, description: 'Consent records, pixel inventory, risk register.' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { key: 'ai-strategist', label: 'AI Strategist', href: `${BASE}/ai-strategist`, icon: Sparkles, description: 'Generate draft-first marketing assets from context.' },
      { key: 'recommendations', label: 'Recommendations', href: `${BASE}/recommendations`, icon: Lightbulb, description: 'Prioritized growth actions across every lever.' },
      { key: 'operations', label: 'Operations', href: `${BASE}/operations`, icon: ClipboardList, description: 'Tasks, approvals, and launch checklists.' },
    ],
  },
];

/** Flattened list — handy for the command menu and lookups. */
export const GROWTH_NAV_FLAT: NavItem[] = GROWTH_NAV.flatMap((g) => g.items);

/** Find the active nav item for a pathname (longest matching href wins). */
export function activeNavItem(pathname: string): NavItem | undefined {
  return [...GROWTH_NAV_FLAT]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
