// ============================================================
// Milestone Authority System — unit tests (pure engine + RBAC + publishing)
// ------------------------------------------------------------
// Covers the 100-milestone catalog integrity, honest metric resolution,
// trigger status + admin override, Authority Impact scoring, content generation
// (no fabricated numbers), internal-link recommendations, evaluation roll-ups,
// the published-registry → public-page gating, metadata/JSON-LD, sitemap
// include/exclude, and the milestones.manage access gate. All pure.
// ============================================================

import { MILESTONE_CATALOG, findMilestoneBySlug } from '../catalog';
import { resolveMetric } from '../metric-sources';
import { computeStatus } from '../triggers';
import { computeAuthorityScore, authorityBand } from '../authority-score';
import { generateMilestoneContent } from '../content';
import { recommendInternalLinks } from '../internal-links';
import { evaluateMilestones, summarizeMilestones, earnedMilestones } from '../evaluate';
import { getPublicMilestone, buildMilestoneMetadata, buildMilestoneJsonLd, buildMilestoneFaqs, nextMilestones } from '../page-detail';
import { PUBLISHED_MILESTONES, indexablePublishedMilestones, publishedMilestoneSlugs } from '@/content/milestones/published';
import type { MetricSnapshot, MilestoneDefinition } from '../types';
import { PERMISSIONS, ROLES, roleHasPermission } from '@/lib/admin/rbac';

const NOW = '2026-06-08T12:00:00.000Z';

function snap(over: Partial<MetricSnapshot> = {}): MetricSnapshot {
  return {
    now: NOW,
    live: { registeredUsers: null, swingAnalyses: null, sessions: null, community: null, activeSports: 0, sportSessions: {} },
    registry: {
      publishedGuides: 5, updateCount: 10, contentCount: 20, videoTutorials: 8, activeSports: 7,
      multilingualPages: 8, methodologyPages: 1, mechanicsPages: 0, faqClusters: 1,
      parentCoachPages: 2, teamFacilityPages: 1,
    },
    features: { privacy: true, milestoneSystemLive: true, top20Lang: false },
    ...over,
  };
}

const byId = (id: string): MilestoneDefinition => MILESTONE_CATALOG.find((d) => d.id === id)!;

describe('catalog integrity', () => {
  it('seeds exactly 100 milestones with unique ids and slugs', () => {
    expect(MILESTONE_CATALOG).toHaveLength(100);
    expect(new Set(MILESTONE_CATALOG.map((d) => d.id)).size).toBe(100);
    expect(new Set(MILESTONE_CATALOG.map((d) => d.slug)).size).toBe(100);
  });
  it('every milestone has a trigger, page angle and authority purpose', () => {
    for (const d of MILESTONE_CATALOG) {
      expect(d.trigger.value).toBeGreaterThanOrEqual(0);
      expect(d.pageAngle.length).toBeGreaterThan(0);
      expect(d.authorityPurpose.length).toBeGreaterThan(0);
    }
  });
});

describe('metric resolution (honest)', () => {
  it('marks unreadable metrics as needs_data_source', () => {
    expect(resolveMetric(byId('m002'), snap()).source).toBe('needs_data_source'); // total_visitors
    expect(resolveMetric(byId('m087'), snap()).source).toBe('needs_data_source'); // backlinks
  });
  it('reads live counts when connected, needs_data_source when not', () => {
    expect(resolveMetric(byId('m011'), snap()).source).toBe('needs_data_source'); // users, live null
    expect(resolveMetric(byId('m011'), snap({ live: { ...snap().live, registeredUsers: 250 } })).value).toBe(250);
  });
  it('reads registry + feature metrics', () => {
    expect(resolveMetric(byId('m046'), snap())).toEqual({ value: 7, source: 'registry' }); // active sports
    expect(resolveMetric(byId('m061'), snap())).toEqual({ value: 1, source: 'feature' }); // privacy flag
    expect(resolveMetric(byId('m094'), snap())).toEqual({ value: 0, source: 'feature' }); // top20Lang false
  });
  it('admin_manual has no automatic source', () => {
    expect(resolveMetric(byId('m001'), snap()).source).toBe('admin_manual');
  });
});

describe('trigger status', () => {
  it('earns when the metric meets the trigger', () => {
    const r = computeStatus(byId('m046'), resolveMetric(byId('m046'), snap()));
    expect(r.status).toBe('earned');
    expect(r.progressPct).toBe(100);
  });
  it('is in_progress below target with progress', () => {
    const def = byId('m012'); // 100 registered users
    const r = computeStatus(def, resolveMetric(def, snap({ live: { ...snap().live, registeredUsers: 40 } })));
    expect(r.status).toBe('in_progress');
    expect(r.progressPct).toBe(40);
  });
  it('needs_data_source when null and no override', () => {
    expect(computeStatus(byId('m002'), resolveMetric(byId('m002'), snap())).status).toBe('needs_data_source');
  });
  it('an admin override can earn a needs-data / admin_manual milestone', () => {
    const r = computeStatus(byId('m001'), resolveMetric(byId('m001'), snap()), 1);
    expect(r.status).toBe('earned');
    expect(r.rationale).toMatch(/admin-entered/);
  });
});

describe('authority impact score', () => {
  it('produces a 0–100 score with a band', () => {
    for (const d of MILESTONE_CATALOG) {
      const s = computeAuthorityScore(d);
      expect(s.value).toBeGreaterThanOrEqual(0);
      expect(s.value).toBeLessThanOrEqual(100);
      expect(s.band).toBe(authorityBand(s.value));
    }
  });
  it('rates a sport-specific analysis milestone above an admin milestone', () => {
    expect(computeAuthorityScore(byId('m036')).value).toBeGreaterThan(computeAuthorityScore(byId('m068')).value);
  });
});

describe('content generation (no fabricated numbers)', () => {
  it('injects no verified metric when none is provided (only the milestone name + angle)', () => {
    const def = byId('m037'); // "1,000 Golf Analyses Completed" — number is the NAME, not a claim
    const c = generateMilestoneContent(def);
    // Summary is exactly title + angle: nothing fabricated is appended.
    expect(c.summary).toBe(`${def.title}. ${def.pageAngle}`);
    expect(c.educationalContext.length).toBeGreaterThan(40);
    expect(c.faqs.length).toBeGreaterThan(0);
  });
  it('includes a verified metric only when provided', () => {
    const c = generateMilestoneContent(byId('m046'), { verifiedMetric: '7 sports live' });
    expect(c.summary).toMatch(/7 sports live/);
  });
});

describe('internal-link recommender', () => {
  it('recommends ≥5 links for a sport milestone and never empty', () => {
    const links = recommendInternalLinks(byId('m036'));
    expect(links.length).toBeGreaterThanOrEqual(5);
    expect(links.every((l) => l.href.startsWith('/'))).toBe(true);
    expect(new Set(links.map((l) => l.href)).size).toBe(links.length); // deduped
  });
});

describe('evaluation roll-up', () => {
  it('evaluates all 100 and counts add up', () => {
    const evald = evaluateMilestones(snap());
    expect(evald).toHaveLength(100);
    const c = summarizeMilestones(evald);
    expect(c.byStatus.earned + c.byStatus.in_progress + c.byStatus.needs_data_source + c.byStatus.not_started).toBe(100);
    expect(c.byStatus.earned).toBeGreaterThan(0); // sports/features/registry milestones earn
  });
  it('earnedMilestones are sorted by authority desc', () => {
    const earned = earnedMilestones(evaluateMilestones(snap()));
    for (let i = 1; i < earned.length; i++) {
      expect(earned[i - 1].authority.value).toBeGreaterThanOrEqual(earned[i].authority.value);
    }
  });
});

describe('publishing → public pages', () => {
  it('every published milestone maps to a catalog definition', () => {
    for (const p of PUBLISHED_MILESTONES) {
      const def = findMilestoneBySlug(p.slug);
      expect(def).toBeDefined();
      expect(def!.id).toBe(p.definitionId);
    }
  });
  it('getPublicMilestone returns content + metadata + JSON-LD', () => {
    const slug = PUBLISHED_MILESTONES[0].slug;
    const p = getPublicMilestone(slug)!;
    expect(p).toBeDefined();
    const meta = buildMilestoneMetadata(p);
    expect(meta.alternates?.canonical).toBe(`/updates/milestones/${slug}`);
    const jsonLd = buildMilestoneJsonLd(p, buildMilestoneFaqs(p));
    expect(JSON.stringify(jsonLd)).toMatch(/BreadcrumbList/);
    expect(JSON.stringify(jsonLd)).toMatch(/Article/);
  });
  it('an unknown/unpublished slug has no public page', () => {
    expect(getPublicMilestone('1000-total-visitors')).toBeUndefined(); // earned-able but not published
    expect(getPublicMilestone('does-not-exist')).toBeUndefined();
  });
  it('noindex published milestones are excluded from the sitemap set', () => {
    const indexable = indexablePublishedMilestones();
    expect(indexable.every((p) => !p.noindex)).toBe(true);
    expect(publishedMilestoneSlugs().length).toBeGreaterThanOrEqual(indexable.length);
  });
  it('nextMilestones suggests higher targets in the same category', () => {
    const next = nextMilestones(byId('m002')); // 100 visitors
    expect(next.every((d) => d.trigger.value > 100)).toBe(true);
  });
});

describe('RBAC gating', () => {
  it('defines milestones.manage and grants it to admins only', () => {
    expect(PERMISSIONS).toContain('milestones.manage');
    expect(roleHasPermission('super_admin', 'milestones.manage')).toBe(true);
    expect(roleHasPermission('admin', 'milestones.manage')).toBe(true);
    expect(roleHasPermission('read_only', 'milestones.manage')).toBe(false);
    expect(ROLES.read_only.permissions).not.toContain('milestones.manage');
  });
});
