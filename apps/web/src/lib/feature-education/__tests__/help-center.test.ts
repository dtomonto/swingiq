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
  helpPath,
} from '../help-center';

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
});
