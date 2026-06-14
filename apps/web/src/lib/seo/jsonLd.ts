// ============================================================
// SwingVantage — JSON-LD Schema Builders
// Type-safe helpers that produce schema.org structured data.
//
// RULES:
//  - No fake ratings, reviews, awards, credentials, or medical claims.
//  - Only include fields we can truthfully populate.
//
// Render with the <JsonLd> component (see components/seo/JsonLd.tsx)
// or inline:  <script type="application/ld+json"
//               dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
// ============================================================

import { siteConfig, absoluteUrl } from '@/config/site';

type Json = Record<string, unknown>;

const ORG_ID = `${siteConfig.liveSiteUrl}/#organization`;
const SITE_ID = `${siteConfig.liveSiteUrl}/#website`;

/** Organization node. Social `sameAs` links are only included when set. */
export function organizationSchema(): Json {
  const sameAs = Object.values(siteConfig.social).filter(Boolean);
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: siteConfig.siteName,
    url: siteConfig.liveSiteUrl,
    logo: absoluteUrl('/icon-512.png'),
    email: siteConfig.contactEmail,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** WebSite node, linked to the Organization as publisher. */
export function websiteSchema(): Json {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: siteConfig.liveSiteUrl,
    name: siteConfig.siteName,
    description: siteConfig.defaultMetaDescription,
    publisher: { '@id': ORG_ID },
  };
}

/** SoftwareApplication node. Free product — price is truthfully 0. */
export function softwareApplicationSchema(): Json {
  return {
    '@type': 'SoftwareApplication',
    name: siteConfig.siteName,
    description: siteConfig.defaultMetaDescription,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web browser',
    url: siteConfig.liveSiteUrl,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}

export interface ArticleInput {
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  /**
   * CSS selectors for the page regions an answer engine / voice assistant may
   * read aloud (schema.org SpeakableSpecification). Point these at the H1 and
   * the on-page direct-answer lead — the AEO/GEO "citable" block. Only emitted
   * when provided, and only ever reference content that is actually on the page.
   */
  speakableSelectors?: string[];
}

export function articleSchema(input: ArticleInput): Json {
  return {
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.speakableSelectors && input.speakableSelectors.length
      ? {
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: input.speakableSelectors,
          },
        }
      : {}),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageSchema(faqs: FaqItem[]): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export interface HowToStep {
  name: string;
  text: string;
}

export function howToSchema(name: string, steps: HowToStep[], description?: string): Json {
  return {
    '@type': 'HowTo',
    name,
    ...(description ? { description } : {}),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export interface Breadcrumb {
  name: string;
  /** Site-relative path. */
  path: string;
}

export function breadcrumbListSchema(crumbs: Breadcrumb[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export interface ServiceInput {
  name: string;
  description: string;
  serviceType?: string;
}

export function serviceSchema(input: ServiceInput): Json {
  return {
    '@type': 'Service',
    name: input.name,
    description: input.description,
    ...(input.serviceType ? { serviceType: input.serviceType } : {}),
    provider: { '@id': ORG_ID },
    areaServed: 'Worldwide',
  };
}

/** Wrap one or more schema nodes into a single @graph document. */
export function buildGraph(...nodes: Json[]): Json {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}
