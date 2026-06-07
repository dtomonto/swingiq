// ============================================================
// SwingVantage — Video Library SEO/AEO/GEO builder tests
// Verifies the structured-data + answer-content helpers deterministically,
// with no dev server required.
// ============================================================

import {
  isoDuration,
  learnPath,
  videoObjectSchema,
  faqPageSchema,
  videoFaqs,
  learnItemListSchema,
  breadcrumbSchema,
  answerSummary,
} from '../seo';
import { getLibraryItems } from '../index';
import type { LibraryItem } from '../types';

const recorded = (): LibraryItem => {
  const item = getLibraryItems().find((i) => i.id === 'swing-path');
  if (!item) throw new Error('swing-path item missing');
  return item;
};

const comingSoon: LibraryItem = {
  id: 'future-drill',
  title: 'Future drill',
  description: 'Not recorded yet',
  group: 'training',
  category: 'drills-technique',
  sport: 'golf',
  durationLabel: '2:00',
  script: ['Line one.', 'Line two.'],
  hasRecording: false,
  source: 'training',
  tags: ['drill'],
};

describe('isoDuration', () => {
  it('formats seconds to ISO-8601', () => {
    expect(isoDuration(60)).toBe('PT1M0S');
    expect(isoDuration(150)).toBe('PT2M30S');
  });
});

describe('learnPath', () => {
  it('builds the public path', () => {
    expect(learnPath(recorded())).toBe('/learn/swing-path');
  });
});

describe('videoObjectSchema', () => {
  it('emits a complete VideoObject for a recorded video', () => {
    const v = videoObjectSchema(recorded());
    expect(v).not.toBeNull();
    expect(v!['@type']).toBe('VideoObject');
    expect(v!.name).toBe('Understanding swing path');
    expect(String(v!.duration)).toMatch(/^PT\d+M\d+S$/);
    expect(String(v!.contentUrl)).toMatch(/^https?:\/\/.+swing-path\.mp4$/);
    expect(Array.isArray(v!.thumbnailUrl)).toBe(true);
    expect(String(v!.transcript).length).toBeGreaterThan(20);
    expect(v!.embedUrl).toBeDefined();
  });

  it('returns null for a video with no recording (honest: no fake VideoObject)', () => {
    expect(videoObjectSchema(comingSoon)).toBeNull();
  });
});

describe('faqPageSchema + videoFaqs', () => {
  it('produces a valid FAQPage with answers', () => {
    const faq = faqPageSchema(recorded());
    expect(faq['@type']).toBe('FAQPage');
    const entities = faq.mainEntity as Array<{ acceptedAnswer: { text: string } }>;
    expect(entities.length).toBeGreaterThan(0);
    expect(entities[0].acceptedAnswer.text.length).toBeGreaterThan(0);
  });

  it('derives FAQs even for an unrecorded item', () => {
    expect(videoFaqs(comingSoon).length).toBeGreaterThan(0);
  });
});

describe('learnItemListSchema', () => {
  it('lists items with absolute urls', () => {
    const list = learnItemListSchema([recorded()]);
    expect(list['@type']).toBe('ItemList');
    expect(list.numberOfItems).toBe(1);
    const el = (list.itemListElement as Array<{ url: string }>)[0];
    expect(el.url).toMatch(/^https?:\/\//);
  });
});

describe('breadcrumbSchema', () => {
  it('builds positioned breadcrumbs', () => {
    const bc = breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Video Library', path: '/learn' },
    ]);
    expect(bc['@type']).toBe('BreadcrumbList');
    expect((bc.itemListElement as unknown[]).length).toBe(2);
  });
});

describe('answerSummary', () => {
  it('leads with a direct answer', () => {
    expect(answerSummary(recorded()).length).toBeGreaterThan(10);
  });
});
