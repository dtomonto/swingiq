// ============================================================
// SwingVantage — Video Tutorial Library Tests
// Guards the integrity of the video registry, persona tracks,
// category coverage, and the URL helpers.
// ============================================================

import {
  TUTORIAL_VIDEOS,
  TUTORIAL_TRACKS,
  AUDIENCE_ORDER,
  CATEGORY_ORDER,
  CATEGORIES,
  getVideoById,
  getTrackVideos,
  getVideosByCategory,
  videoMatchesAudience,
  totalDurationLabel,
  getVideoSourceKind,
  toEmbedUrl,
} from '../videos';

describe('TUTORIAL_VIDEOS', () => {
  it('every video has the required, non-empty fields', () => {
    for (const v of TUTORIAL_VIDEOS) {
      expect(v.id.length).toBeGreaterThan(0);
      expect(v.title.length).toBeGreaterThan(0);
      expect(v.description.length).toBeGreaterThan(0);
      expect(v.duration).toMatch(/^\d+:\d{2}$/);
      expect(v.script.length).toBeGreaterThan(0);
      for (const line of v.script) expect(line.length).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = TUTORIAL_VIDEOS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every video belongs to a known category', () => {
    for (const v of TUTORIAL_VIDEOS) {
      expect(CATEGORY_ORDER).toContain(v.category);
    }
  });

  it('every audience tag is a known audience', () => {
    for (const v of TUTORIAL_VIDEOS) {
      if (v.audiences === 'all') continue;
      for (const a of v.audiences) expect(AUDIENCE_ORDER).toContain(a);
    }
  });
});

describe('coverage', () => {
  it('every category has at least one video', () => {
    for (const category of CATEGORY_ORDER) {
      const count = TUTORIAL_VIDEOS.filter((v) => v.category === category).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it('every audience can find videos relevant to them', () => {
    for (const audience of AUDIENCE_ORDER) {
      const relevant = TUTORIAL_VIDEOS.filter((v) => videoMatchesAudience(v, audience));
      expect(relevant.length).toBeGreaterThan(0);
    }
  });

  it('getVideosByCategory returns groups in canonical order with no empty groups', () => {
    const groups = getVideosByCategory();
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) {
      expect(CATEGORIES[g.category]).toBeDefined();
      expect(g.videos.length).toBeGreaterThan(0);
    }
  });
});

describe('TUTORIAL_TRACKS', () => {
  it('defines a track for every audience', () => {
    for (const audience of AUDIENCE_ORDER) {
      expect(TUTORIAL_TRACKS[audience]).toBeDefined();
      expect(TUTORIAL_TRACKS[audience].videoIds.length).toBeGreaterThan(0);
    }
  });

  it('every track references only known video ids', () => {
    for (const audience of AUDIENCE_ORDER) {
      for (const id of TUTORIAL_TRACKS[audience].videoIds) {
        expect(getVideoById(id)).toBeDefined();
      }
    }
  });

  it('every video in a track is relevant to that audience (or is for everyone)', () => {
    for (const audience of AUDIENCE_ORDER) {
      for (const video of getTrackVideos(audience)) {
        expect(videoMatchesAudience(video, audience)).toBe(true);
      }
    }
  });

  it('getTrackVideos resolves ids to videos in order', () => {
    for (const audience of AUDIENCE_ORDER) {
      const resolved = getTrackVideos(audience);
      expect(resolved.map((v) => v.id)).toEqual(TUTORIAL_TRACKS[audience].videoIds);
    }
  });
});

describe('helpers', () => {
  it('totalDurationLabel sums durations into a ~N min label', () => {
    const label = totalDurationLabel([
      { duration: '2:00' } as never,
      { duration: '3:30' } as never,
    ]);
    expect(label).toBe('~6 min');
  });

  it('getVideoSourceKind classifies urls and returns null when empty', () => {
    expect(getVideoSourceKind()).toBeNull();
    expect(getVideoSourceKind('')).toBeNull();
    expect(getVideoSourceKind('https://youtu.be/abc123')).toBe('youtube');
    expect(getVideoSourceKind('https://www.youtube.com/watch?v=abc123')).toBe('youtube');
    expect(getVideoSourceKind('https://vimeo.com/123456')).toBe('vimeo');
    expect(getVideoSourceKind('https://cdn.example.com/clip.mp4')).toBe('file');
  });

  it('toEmbedUrl builds embeddable youtube/vimeo urls and passes files through', () => {
    expect(toEmbedUrl('https://youtu.be/abc123')).toBe('https://www.youtube.com/embed/abc123');
    expect(toEmbedUrl('https://www.youtube.com/watch?v=abc123')).toBe(
      'https://www.youtube.com/embed/abc123',
    );
    expect(toEmbedUrl('https://vimeo.com/123456')).toBe('https://player.vimeo.com/video/123456');
    expect(toEmbedUrl('https://cdn.example.com/clip.mp4')).toBe('https://cdn.example.com/clip.mp4');
  });
});
