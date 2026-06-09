// ============================================================
// SwingVantage Milestones — internal-link recommender (PURE)
// ------------------------------------------------------------
// Recommends internal links for a milestone page by category / sport / feature
// / persona, drawn from the curated URL registry so links never 404. Enforces
// the quality rule (aim for ≥5 relevant links) by topping up with safe,
// trust-positive general pages. PURE + deterministic.
// ============================================================

import { CURATED_URLS } from '@/lib/seo/site-sections';
import type { MilestoneDefinition } from './types';

export interface InternalLink {
  href: string;
  label: string;
}

const LABELS: Record<string, string> = Object.fromEntries(CURATED_URLS.map((u) => [u.path, u.label]));
LABELS['/updates/milestones'] = LABELS['/updates/milestones'] ?? 'SwingVantage milestones';
LABELS['/agi'] = 'Athlete General Intelligence';
LABELS['/library'] = 'Video Library';
LABELS['/journey'] = 'Athletic Journey';

const SPORT_HUB: Record<string, string> = {
  golf: '/golf-swing-analysis',
  tennis: '/tennis-swing-analysis',
  baseball: '/baseball-swing-analysis',
  softball: '/softball-swing-analysis',
  pickleball: '/pickleball',
  padel: '/padel',
};

const SPORT_SAMPLE: Record<string, string> = {
  golf: '/sample-report/golf',
  baseball: '/sample-report/baseball',
  softball: '/sample-report/softball',
};

function labelFor(href: string): string {
  if (LABELS[href]) return LABELS[href];
  const last = href.replace(/\/$/, '').split('/').pop() || href;
  return last.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Ranked internal-link recommendations for a milestone (deduped, ≥5 when possible). */
export function recommendInternalLinks(def: MilestoneDefinition, limit = 8): InternalLink[] {
  const ordered: string[] = [];
  const add = (href?: string | null) => { if (href && !ordered.includes(href)) ordered.push(href); };

  // 1. Author-seeded related pages (highest intent).
  for (const p of def.relatedPages ?? []) add(p);

  // 2. Sport-specific hub + sample report.
  if (def.relatedSport) {
    add(SPORT_HUB[def.relatedSport]);
    add(SPORT_SAMPLE[def.relatedSport]);
  }

  // 3. Category-driven clusters.
  switch (def.category) {
    case 'Trust and Privacy':
      add('/methodology'); add('/privacy'); add('/trust'); break;
    case 'Education and Guides':
      add('/resources'); add('/glossary'); add('/faq'); add('/sample-report'); break;
    case 'Search and Authority':
      add('/faq'); add('/methodology'); add('/resources'); break;
    case 'Coaching Intelligence':
      add('/agi'); add('/features'); break;
    case 'Swing Analysis':
      add('/how-it-works'); add('/sample-report'); add('/methodology'); break;
    case 'Sport Coverage':
      add('/features'); add('/sample-report'); break;
    case 'Practice Plans':
      add('/tools/practice-plan-generator'); add('/tools'); break;
    case 'Retesting and Improvement':
      add('/methodology'); add('/how-it-works'); break;
    case 'Global Access':
      add('/about'); add('/features'); break;
    case 'Community Signals':
      add('/parents'); add('/coaches'); add('/teams'); break;
    case 'Product Development':
      add('/features'); add('/updates'); break;
    default:
      add('/features');
  }

  // 4. Always-relevant anchors (home, milestones hub, updates, start CTA).
  add('/'); add('/updates/milestones'); add('/updates'); add('/features'); add('/how-it-works'); add('/start');

  return ordered.slice(0, limit).map((href) => ({ href, label: labelFor(href) }));
}
