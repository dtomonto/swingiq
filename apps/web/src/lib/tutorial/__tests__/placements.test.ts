// ============================================================
// SwingVantage — Tutorial Placement + inline-source tests
// Guards the placement registry (the "tutorial video map") and the
// inline-player helpers added to the manifest.
// ============================================================

import {
  TUTORIAL_PLACEMENTS,
  getPlacement,
  resolvePlacement,
  type PlacementDisplay,
  type PlacementTrigger,
} from '../placements';
import {
  TUTORIAL_VIDEOS,
  JOURNEY_STAGE_ORDER,
  getVideoById,
  getInlineSources,
  hasRecording,
  type TutorialVideo,
} from '../videos';

const DISPLAYS: PlacementDisplay[] = ['inline', 'card'];
const TRIGGERS: PlacementTrigger[] = ['click-to-play', 'muted-autoplay'];

describe('TUTORIAL_PLACEMENTS', () => {
  it('every placement has the required, non-empty fields', () => {
    for (const p of TUTORIAL_PLACEMENTS) {
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.videoId.length).toBeGreaterThan(0);
      expect(p.cta.length).toBeGreaterThan(0);
      expect(p.page.length).toBeGreaterThan(0);
      expect(p.location.length).toBeGreaterThan(0);
      expect(DISPLAYS).toContain(p.display);
      expect(TRIGGERS).toContain(p.trigger);
      expect(JOURNEY_STAGE_ORDER).toContain(p.journeyStage);
      expect(typeof p.captionsRequired).toBe('boolean');
    }
  });

  it('has unique placement ids', () => {
    const ids = TUTORIAL_PLACEMENTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every placement references a known video id', () => {
    for (const p of TUTORIAL_PLACEMENTS) {
      expect(getVideoById(p.videoId)).toBeDefined();
    }
  });

  it('getPlacement resolves by id and returns undefined for unknown ids', () => {
    expect(getPlacement('home-hero')).toBeDefined();
    expect(getPlacement('does-not-exist')).toBeUndefined();
  });

  it('resolvePlacement returns the placement and its video together', () => {
    const resolved = resolvePlacement('home-hero');
    expect(resolved).toBeDefined();
    expect(resolved?.placement.id).toBe('home-hero');
    expect(resolved?.video.id).toBe(resolved?.placement.videoId);
    expect(resolvePlacement('nope')).toBeUndefined();
  });
});

describe('journeyStage tagging', () => {
  it('any video that declares a journeyStage uses a known stage', () => {
    for (const v of TUTORIAL_VIDEOS) {
      if (v.journeyStage) expect(JOURNEY_STAGE_ORDER).toContain(v.journeyStage);
    }
  });
});

describe('getInlineSources', () => {
  const base: TutorialVideo = {
    id: 't',
    title: 'T',
    description: 'd',
    audiences: 'all',
    category: 'getting-started',
    duration: '1:00',
    script: ['a'],
  };

  it('returns [] when there is no recording', () => {
    expect(getInlineSources(base)).toEqual([]);
  });

  it('orders mobile (with media query) before webm before mp4', () => {
    const sources = getInlineSources({
      ...base,
      mobileSrc: '/m.mp4',
      webmSrc: '/d.webm',
      mp4Src: '/d.mp4',
    });
    expect(sources.map((s) => s.src)).toEqual(['/m.mp4', '/d.webm', '/d.mp4']);
    expect(sources[0].media).toBe('(max-width: 640px)');
    expect(sources[0].type).toBe('video/mp4');
    expect(sources[1].type).toBe('video/webm');
  });

  it('falls back to a direct-file videoUrl when no explicit sources are set', () => {
    expect(getInlineSources({ ...base, videoUrl: 'https://cdn.x/clip.mp4' })).toEqual([
      { src: 'https://cdn.x/clip.mp4', type: 'video/mp4' },
    ]);
    expect(getInlineSources({ ...base, videoUrl: 'https://cdn.x/clip.webm' })[0].type).toBe('video/webm');
  });

  it('does NOT treat a YouTube/Vimeo url as an inline file source', () => {
    expect(getInlineSources({ ...base, videoUrl: 'https://youtu.be/abc' })).toEqual([]);
    expect(getInlineSources({ ...base, videoUrl: 'https://vimeo.com/123' })).toEqual([]);
  });
});

describe('hasRecording', () => {
  const base: TutorialVideo = {
    id: 't',
    title: 'T',
    description: 'd',
    audiences: 'all',
    category: 'getting-started',
    duration: '1:00',
    script: ['a'],
  };

  it('is false with no recording', () => {
    expect(hasRecording(base)).toBe(false);
  });

  it('is true with inline file sources', () => {
    expect(hasRecording({ ...base, mp4Src: '/d.mp4' })).toBe(true);
  });

  it('is true with a YouTube/Vimeo link (playable via embed)', () => {
    expect(hasRecording({ ...base, videoUrl: 'https://youtu.be/abc' })).toBe(true);
  });
});
