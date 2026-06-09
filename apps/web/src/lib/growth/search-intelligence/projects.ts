// ============================================================
// SearchIntelligenceOS — Project / Site registry (§1)
// ------------------------------------------------------------
// SwingVantage is the only ACTIVE project today (data comes from its owned
// registries). The other connected businesses are listed as `planned`
// placeholders so the multi-project model is visible and ready — they have
// no page data wired yet and are clearly labeled. Pure data + lookups.
// ============================================================

import { TARGET_DOMAIN } from '../link-intelligence/constants';
import type { Project } from './types';

export const PROJECTS: Project[] = [
  {
    id: 'swingvantage',
    name: 'SwingVantage',
    domain: TARGET_DOMAIN,
    canonicalBaseUrl: `https://${TARGET_DOMAIN}`,
    projectType: 'AI sports-swing analysis SaaS',
    connectedBusiness: 'SwingVantage',
    status: 'active',
    crawlEnabled: true,
    gscConnected: false,
    analyticsConnected: false,
    sitemapUrl: `https://${TARGET_DOMAIN}/sitemap.xml`,
    robotsUrl: `https://${TARGET_DOMAIN}/robots.txt`,
    dataSource: 'real',
  },
  // ── Connected businesses (model-ready placeholders, no data wired) ──
  placeholder('projectward', 'Projectward', 'projectward.com', 'Project intelligence'),
  placeholder('profitpour', 'ProfitPour', 'profitpour.com', 'Hospitality / beverage'),
  placeholder('utilityforge', 'UtilityForge', 'utilityforge.com', 'Developer utilities'),
  placeholder('tavryngo', 'TavrynGo', 'tavryngo.com', 'Travel / logistics'),
  placeholder('sunshine-home-health', 'Sunshine Home Health', 'sunshinehomehealth.com', 'Home health services'),
];

function placeholder(id: string, name: string, domain: string, projectType: string): Project {
  return {
    id, name, domain,
    canonicalBaseUrl: `https://${domain}`,
    projectType,
    connectedBusiness: name,
    status: 'planned',
    crawlEnabled: false,
    gscConnected: false,
    analyticsConnected: false,
    sitemapUrl: `https://${domain}/sitemap.xml`,
    robotsUrl: `https://${domain}/robots.txt`,
    dataSource: 'placeholder',
  };
}

const BY_ID = new Map(PROJECTS.map((p) => [p.id, p]));

/** The active project SearchIntelligenceOS analyzes today. */
export function activeProject(): Project {
  return PROJECTS.find((p) => p.status === 'active') ?? PROJECTS[0];
}

export function listProjects(): Project[] {
  return PROJECTS;
}

export function projectById(id: string): Project | undefined {
  return BY_ID.get(id);
}
