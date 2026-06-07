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

/** Seconds → ISO-8601 duration (e.g. 90 → "PT1M30S"). */
export function isoDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `PT${Math.floor(s / 60)}M${s % 60}S`;
}

function durationSeconds(item: LibraryItem): number {
  if (item.durationSec) return item.durationSec;
  const m = item.durationLabel.match(/^(\d+):(\d{1,2})$/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 60;
}

/** The canonical public path for a video. */
export function learnPath(item: LibraryItem): string {
  return `/learn/${item.id}`;
}

/**
 * schema.org VideoObject for a recorded library video. Returns null when
 * there's no real recording (no thumbnail/content to honestly point at).
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
    uploadDate: opts.uploadDate ?? '2026-06-06',
    duration: isoDuration(durationSeconds(item)),
    contentUrl: absoluteUrl(item.mp4Src),
    embedUrl: absoluteUrl(path),
    transcript: item.script.join('\n'),
    inLanguage: 'en',
    isFamilyFriendly: true,
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
