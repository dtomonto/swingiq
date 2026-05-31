// ============================================================
// SwingIQ — Tutorial System Unit Tests
// Tests for the tutorial content registry and route lookup.
// ============================================================

import { TUTORIAL_REGISTRY, getTutorialForRoute } from '../content';

describe('TUTORIAL_REGISTRY', () => {
  it('contains a tutorial for every major route', () => {
    const requiredRoutes = [
      '/',
      '/dashboard',
      '/profile',
      '/bag',
      '/sessions',
      '/diagnose',
      '/training',
      '/data',
      '/settings',
      '/community',
      '/community/badges',
      '/community/challenges',
      '/community/leaderboard',
    ];

    for (const route of requiredRoutes) {
      expect(TUTORIAL_REGISTRY[route]).toBeDefined();
    }
  });

  it('every tutorial has a non-empty id, pageTitle, intro, and at least one step', () => {
    for (const [id, tutorial] of Object.entries(TUTORIAL_REGISTRY)) {
      expect(tutorial.id).toBe(id);
      expect(tutorial.pageTitle.length).toBeGreaterThan(0);
      expect(tutorial.intro.length).toBeGreaterThan(0);
      expect(tutorial.steps.length).toBeGreaterThan(0);
      for (const step of tutorial.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.body.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('getTutorialForRoute', () => {
  it('returns the exact tutorial for a known route', () => {
    const tutorial = getTutorialForRoute('/dashboard');
    expect(tutorial?.id).toBe('/dashboard');
  });

  it('falls back to parent route for unknown child paths', () => {
    const tutorial = getTutorialForRoute('/dashboard/unknown-sub-path');
    expect(tutorial?.id).toBe('/dashboard');
  });

  it('falls back to homepage for completely unknown routes', () => {
    const tutorial = getTutorialForRoute('/nonexistent-route-xyz');
    expect(tutorial).not.toBeNull();
  });

  it('returns community tutorial for community route', () => {
    const tutorial = getTutorialForRoute('/community');
    expect(tutorial?.id).toBe('/community');
  });

  it('returns badges tutorial for badges sub-route', () => {
    const tutorial = getTutorialForRoute('/community/badges');
    expect(tutorial?.id).toBe('/community/badges');
  });

  it('falls back to community tutorial for unknown community sub-route', () => {
    const tutorial = getTutorialForRoute('/community/unknown-page');
    expect(tutorial?.id).toBe('/community');
  });
});
