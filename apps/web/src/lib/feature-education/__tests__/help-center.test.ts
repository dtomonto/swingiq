// ============================================================
// Help Center reader — the `/help/<slug>` destination pages.
// Locks the contract that made these pages 404 before: every in-app
// "Learn more →" link resolves to a real, content-bearing help topic.
// ============================================================

import { SEEDED_ASSETS } from '../server/seed-help';
import {
  getHelpTopic,
  getHelpTopics,
  getHelpGroups,
  getPublicHelpTopics,
  helpPath,
} from '../help-center';
import { CURATED_HELP, PUBLIC_HELP_SLUGS, isPublicHelpSlug } from '../help-content';

describe('help-center', () => {
  it('resolves every in-app "Learn more → /help/<slug>" link to a topic', () => {
    const links = SEEDED_ASSETS.filter(
      (a) => a.type === 'in-app-help' && a.inAppHelp?.learnMoreHref?.startsWith('/help/'),
    ).map((a) => a.inAppHelp!.learnMoreHref!.replace(/^\/help\//, ''));

    expect(links.length).toBeGreaterThan(100);
    const missing = links.filter((slug) => getHelpTopic(slug) === null);
    expect(missing).toEqual([]);
  });

  it('builds a content-bearing topic for every slug (no empty pages)', () => {
    const topics = getHelpTopics();
    expect(topics.length).toBeGreaterThan(100);
    for (const t of topics) {
      expect(t.title.trim()).not.toBe('');
      expect(t.lead.trim()).not.toBe('');
      // Each topic has at least a walkthrough, narrative, or FAQ to render.
      expect(t.steps.length + t.sections.length + t.faqs.length).toBeGreaterThan(0);
    }
  });

  it('never surfaces admin/internal-only asset bodies on a public page', () => {
    // The dashboard topic is a known public feature with rich content.
    const dash = getHelpTopic('dashboard');
    expect(dash).not.toBeNull();
    expect(dash!.steps.length).toBeGreaterThan(0);
    expect(dash!.faqs.length).toBeGreaterThan(0);
    expect(dash!.isAdmin).toBe(false);
  });

  it('flags admin topics so the page can noindex them', () => {
    const { admin, user } = getHelpGroups();
    expect(user.length).toBeGreaterThan(0);
    // Admin topics, when present, are all marked isAdmin.
    expect(admin.every((t) => t.isAdmin)).toBe(true);
    expect(user.every((t) => !t.isAdmin)).toBe(true);
  });

  it('returns null for an unknown slug', () => {
    expect(getHelpTopic('totally-not-a-feature')).toBeNull();
  });

  it('helpPath is /help/<slug>', () => {
    expect(helpPath('dashboard')).toBe('/help/dashboard');
  });

  // ── Pruning: only real features are public/indexable ──────────

  it('the public index is pruned to the real-feature allowlist', () => {
    const pub = getPublicHelpTopics();
    expect(pub.length).toBeGreaterThan(20);
    // Far fewer than the full topic set — the noise is excluded.
    expect(pub.length).toBeLessThan(getHelpTopics().length);
    // Every public topic is allowlisted, indexable, and not an admin guide.
    for (const t of pub) {
      expect(isPublicHelpSlug(t.slug)).toBe(true);
      expect(t.indexable).toBe(true);
      expect(t.isAdmin).toBe(false);
    }
  });

  it('excludes internal / auth / noise routes from the public index', () => {
    const pub = new Set(getPublicHelpTopics().map((t) => t.slug));
    for (const noise of ['login', 'signup', 'privacy', 'terms', 'sitemap', 'agi', 'arc', 'lang', 'data-model']) {
      expect(pub.has(noise)).toBe(false);
    }
    // …but the page still resolves, so live in-app "Learn more" links never 404.
    expect(getHelpTopic('login')).not.toBeNull();
    expect(getHelpTopic('login')!.indexable).toBe(false);
  });

  // ── Curated content overrides the generated baseline ──────────

  it('serves hand-authored content for every curated flagship topic', () => {
    for (const slug of Object.keys(CURATED_HELP)) {
      const t = getHelpTopic(slug);
      expect(t).not.toBeNull();
      expect(t!.curated).toBe(true);
      expect(isPublicHelpSlug(slug)).toBe(true);
      // Comprehensive: substantial steps, sections, and FAQs, plus an answer.
      expect(t!.steps.length).toBeGreaterThanOrEqual(4);
      expect(t!.sections.length).toBeGreaterThanOrEqual(4);
      expect(t!.faqs.length).toBeGreaterThanOrEqual(4);
      expect((t!.answer ?? '').length).toBeGreaterThan(40);
      // No auto-generated artifacts leaked into curated copy.
      expect(t!.lead).not.toMatch(/detected from/i);
    }
  });

  it('strips generated artifacts from the public help surface', () => {
    for (const t of getPublicHelpTopics()) {
      const blob = [
        t.lead,
        t.answer ?? '',
        ...t.steps.flatMap((s) => [s.title, s.detail]),
        ...t.sections.flatMap((s) => s.body),
        ...t.faqs.flatMap((f) => [f.q, f.a]),
      ].join(' ');
      expect(blob).not.toMatch(/detected from/i);
      expect(blob).not.toMatch(/\baI\b/);
      expect(blob).not.toMatch(/Confidence:\s*\d+\/100/);
    }
  });

  it('related links point only to existing, indexable guides', () => {
    for (const t of getPublicHelpTopics()) {
      for (const rel of t.related) {
        const r = getHelpTopic(rel);
        expect(r).not.toBeNull();
        expect(PUBLIC_HELP_SLUGS.has(rel)).toBe(true);
      }
    }
  });
});
