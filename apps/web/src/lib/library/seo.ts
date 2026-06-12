// ============================================================
// SwingVantage — Video Library: SEO / AEO / GEO builders
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Structured data + helpers that make the library's videos
//   discoverable by search engines (SEO), answer engines (AEO), and
//   generative engines (GEO). The public /learn pages render these:
//     - VideoObject  → Google Video rich results + indexing
//     - FAQPage      → answer-engine Q&A surfaces
//     - ItemList     → the index understood as a collection
//     - BreadcrumbList
//   Plus an on-page transcript + a plain "answer" summary, which is what
//   AEO/GEO engines actually read and cite.
//
//   HONEST rule (same as lib/seo/jsonLd.ts): only emit fields we can
//   truthfully fill. A video with no real recording emits NO VideoObject
//   (you can't have a VideoObject without a thumbnail + content), but its
//   transcript page is still valuable text.
// ============================================================

import { siteConfig, absoluteUrl } from '@/config/site';
import type { LibraryItem } from './types';

type Json = Record<string, unknown>;

const ORG = {
  '@type': 'Organization',
  name: siteConfig.siteName,
  logo: absoluteUrl('/icon-512.png'),
};

/**
 * Fallback publication date for recordings produced before per-video dates were
 * tracked (the first batch of library + tutorial recordings). The recorder now
 * stamps a real `seoUploadDate` per video, so this only applies to that initial
 * backfill — it is an honest "these were published on/around this date", never a
 * fabricated freshness signal. Newer videos always carry their own real date.
 */
export const VIDEO_BASELINE_UPLOAD_DATE = '2026-06-11';

/** Seconds → ISO-8601 duration (e.g. 90 → "PT1M30S"). */
export function isoDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `PT${Math.floor(s / 60)}M${s % 60}S`;
}

export function durationSeconds(item: LibraryItem): number {
  if (item.durationSec) return item.durationSec;
  const m = item.durationLabel.match(/^(\d+):(\d{1,2})$/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 60;
}

/** The real publication date for a video (falls back to the baseline). */
export function videoUploadDate(item: LibraryItem): string {
  return item.seoUploadDate ?? VIDEO_BASELINE_UPLOAD_DATE;
}

/** The canonical public path for a video. */
export function learnPath(item: LibraryItem): string {
  return `/learn/${item.id}`;
}

/**
 * schema.org VideoObject for a recorded library video. Returns null when
 * there's no real recording (no thumbnail/content to honestly point at).
 *
 * Emits every Google-recognised field we can truthfully fill: name,
 * description, thumbnailUrl, uploadDate (real), dateModified (when re-recorded),
 * duration, contentUrl, embedUrl, transcript, inLanguage, isFamilyFriendly,
 * isAccessibleForFree, and publisher.
 */
export function videoObjectSchema(item: LibraryItem, opts: { uploadDate?: string } = {}): Json | null {
  if (!item.hasRecording || !item.poster || !item.mp4Src) return null;
  const path = learnPath(item);
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: item.title,
    description: item.description,
    thumbnailUrl: [absoluteUrl(item.poster)],
    uploadDate: opts.uploadDate ?? videoUploadDate(item),
    ...(item.seoModifiedDate ? { dateModified: item.seoModifiedDate } : {}),
    duration: isoDuration(durationSeconds(item)),
    contentUrl: absoluteUrl(item.mp4Src),
    embedUrl: absoluteUrl(path),
    transcript: item.script.join('\n'),
    inLanguage: 'en',
    isFamilyFriendly: true,
    isAccessibleForFree: true,
    publisher: ORG,
    ...(item.route ? { potentialAction: { '@type': 'WatchAction', target: absoluteUrl(path) } } : {}),
  };
}

/**
 * Up to three honest, answer-style FAQs derived from the video. Powers the
 * on-page FAQ + FAQPage schema (AEO). Kept generic but accurate.
 */
export function videoFaqs(item: LibraryItem): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [
    { question: `What does the "${item.title}" video cover?`, answer: item.description },
  ];
  if (item.script[0]) {
    faqs.push({ question: `How do I get started?`, answer: item.script[0] });
  }
  if (item.script.length > 1) {
    faqs.push({
      question: `What's the key thing to remember?`,
      answer: item.script[item.script.length - 1],
    });
  }
  return faqs;
}

export function faqPageSchema(item: LibraryItem): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: videoFaqs(item).map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbSchema(crumbs: Crumb[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** ItemList for the /learn index so the collection is machine-readable. */
export function learnItemListSchema(items: LibraryItem[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'SwingVantage Video Library',
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(learnPath(item)),
      name: item.title,
    })),
  };
}

/**
 * A concise, answer-engine-friendly summary line for a video (AEO/GEO). Leads
 * with the direct answer (the first script line) framed around the title.
 */
export function answerSummary(item: LibraryItem): string {
  return item.script[0] ?? item.description;
}

// ============================================================
// STRICT VIDEO SEO CONTRACT
// ------------------------------------------------------------
// The single source of truth for "what every PUBLIC, RECORDED video must
// satisfy to pass the strictest SEO requirements". The enforcement test
// (lib/library/__tests__/seo-requirements.test.ts) runs validateVideoSeo over
// every public recorded video, so a NEW video that lands without (say) a
// poster, captions, a real upload date, or a transcript fails CI — making the
// bar apply to all future-generated videos automatically.
//
// Mirrors Google's video indexing requirements: the page must offer a real
// VideoObject (name, thumbnail, uploadDate) + a crawlable transcript + a
// captions track, and the video sitemap must carry duration + publication date.
// ============================================================

/** Minimum lengths that keep titles/descriptions useful in search results. */
export const SEO_LIMITS = {
  titleMin: 8,
  titleMax: 100,
  descriptionMin: 50,
  descriptionMax: 320,
  transcriptMinLines: 3,
} as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a single video against the strict SEO contract. Only PUBLIC, RECORDED
 * videos are held to the full bar — an honest "coming soon" item (no recording)
 * emits no VideoObject and is intentionally exempt. Returns the list of failures
 * (empty === passes).
 */
export function validateVideoSeo(item: LibraryItem): string[] {
  const issues: string[] = [];

  // Unrecorded items are exempt (they emit no VideoObject and carry no media).
  if (!item.hasRecording) return issues;

  const need = (cond: boolean, msg: string) => {
    if (!cond) issues.push(msg);
  };

  need(item.title.trim().length >= SEO_LIMITS.titleMin, `title too short (min ${SEO_LIMITS.titleMin})`);
  need(item.title.trim().length <= SEO_LIMITS.titleMax, `title too long (max ${SEO_LIMITS.titleMax})`);
  need(
    item.description.trim().length >= SEO_LIMITS.descriptionMin,
    `description too short (min ${SEO_LIMITS.descriptionMin})`,
  );
  need(
    item.description.trim().length <= SEO_LIMITS.descriptionMax,
    `description too long (max ${SEO_LIMITS.descriptionMax})`,
  );

  // Media the VideoObject + sitemap must honestly point at.
  need(Boolean(item.mp4Src), 'missing mp4 source (contentUrl)');
  need(Boolean(item.poster), 'missing poster (thumbnailUrl)');
  need(Boolean(item.captionsSrc), 'missing WebVTT captions track (accessibility + CC signal)');

  // Real, structured signals.
  need(typeof item.durationSec === 'number' && item.durationSec > 0, 'missing/invalid durationSec');
  need(ISO_DATE.test(videoUploadDate(item)), 'missing/invalid upload date (YYYY-MM-DD)');
  need(
    item.seoModifiedDate === undefined || ISO_DATE.test(item.seoModifiedDate),
    'invalid modified date (must be YYYY-MM-DD)',
  );

  // Crawlable transcript — the AEO/GEO payload + accessibility.
  need(
    item.script.filter((l) => l.trim().length > 0).length >= SEO_LIMITS.transcriptMinLines,
    `transcript too thin (min ${SEO_LIMITS.transcriptMinLines} lines)`,
  );

  // The VideoObject itself must build (belt-and-braces against future drift).
  need(videoObjectSchema(item) !== null, 'VideoObject failed to build');

  return issues;
}

/** True when a video passes the full strict SEO contract. */
export function passesVideoSeo(item: LibraryItem): boolean {
  return validateVideoSeo(item).length === 0;
}
