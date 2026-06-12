// ============================================================
// SwingVantage — STRICT video SEO gate
// ------------------------------------------------------------
// Enforces the strictest video SEO requirements across EVERY public, recorded
// video — current and future. A new video (tutorial or training) that lands
// without a poster, captions, a real upload date, a transcript, or a buildable
// VideoObject fails here, so the bar applies automatically to anything
// generated later. No dev server required.
// ============================================================

import {
  validateVideoSeo,
  passesVideoSeo,
  videoObjectSchema,
  videoUploadDate,
  VIDEO_BASELINE_UPLOAD_DATE,
} from '../seo';
import { getLibraryItems, getLearnItems } from '../index';
import type { LibraryItem } from '../types';

const publicRecorded = (): LibraryItem[] =>
  getLearnItems(getLibraryItems()).filter((i) => i.hasRecording);

describe('strict video SEO gate', () => {
  it('has public recorded videos to check (guards against an empty pass)', () => {
    expect(publicRecorded().length).toBeGreaterThan(0);
  });

  it.each(publicRecorded().map((i) => [i.id, i] as const))(
    'video "%s" passes every strict SEO requirement',
    (_id, item) => {
      const issues = validateVideoSeo(item);
      // Surface the exact failures in the assertion message.
      expect(issues).toEqual([]);
      expect(passesVideoSeo(item)).toBe(true);
    },
  );

  it('every public recorded video emits a complete VideoObject', () => {
    for (const item of publicRecorded()) {
      const schema = videoObjectSchema(item) as Record<string, unknown> | null;
      expect(schema).not.toBeNull();
      // Google-required + strongly-recommended VideoObject fields.
      for (const key of [
        'name',
        'description',
        'thumbnailUrl',
        'uploadDate',
        'duration',
        'contentUrl',
        'embedUrl',
        'transcript',
        'inLanguage',
        'isFamilyFriendly',
        'isAccessibleForFree',
        'publisher',
      ]) {
        expect(schema![key]).toBeDefined();
      }
      // uploadDate is a real ISO date (never empty / never a fabricated future).
      expect(String(schema!.uploadDate)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('resolves a real upload date for every recorded video', () => {
    for (const item of publicRecorded()) {
      expect(videoUploadDate(item)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('exposes a sane baseline upload date', () => {
    expect(VIDEO_BASELINE_UPLOAD_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('exempts honest "coming soon" (unrecorded) items from the media bar', () => {
    const comingSoon: LibraryItem = {
      id: 'not-yet',
      title: 'Not yet recorded',
      description: 'A perfectly valid coming-soon entry with no media yet at all.',
      group: 'training',
      category: 'drills-technique',
      sport: 'golf',
      durationLabel: '2:30',
      script: ['one', 'two', 'three'],
      hasRecording: false,
      source: 'training',
      public: true,
      tags: [],
    };
    expect(validateVideoSeo(comingSoon)).toEqual([]);
  });

  it('flags a recorded video missing captions / poster / dates', () => {
    const broken: LibraryItem = {
      id: 'broken',
      title: 'Broken video entry',
      description: 'Short',
      group: 'training',
      category: 'drills-technique',
      sport: 'golf',
      durationLabel: '0:00',
      script: ['only one line'],
      hasRecording: true,
      mp4Src: undefined,
      poster: undefined,
      captionsSrc: undefined,
      durationSec: undefined,
      source: 'training',
      public: true,
      tags: [],
    };
    const issues = validateVideoSeo(broken);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('captions'),
        expect.stringContaining('poster'),
        expect.stringContaining('mp4'),
      ]),
    );
  });
});
