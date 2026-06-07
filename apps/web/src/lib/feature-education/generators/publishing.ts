// ============================================================
// SwingVantage — Feature Education Engine: Publishing generators
// ------------------------------------------------------------
// Deterministic generators for outward-facing assets: the release note
// (polished product voice; also emits an Update: trailer for the existing
// /updates pipeline) and the public SEO/AEO/GEO help article.
// ============================================================

import { type FeatureRecord, type EducationAsset, type AssetSeo, CATEGORY_LABELS } from '../types';
import { PROMPTS } from '../prompts';
import {
  type GenContext,
  baseAsset,
  whereToFind,
  primaryRoute,
  sectionsFrom,
} from './helpers';

/** A copy-paste commit trailer that feeds the existing /updates pipeline. */
export function suggestedUpdateTrailer(feature: FeatureRecord): string {
  const where = primaryRoute(feature) ?? feature.adminControls[0] ?? '';
  const lines = [
    `Update: ${feature.name}`,
    `Update-Summary: ${truncate(feature.description, 140)}`,
  ];
  if (where) lines.push(`Update-Where: ${where}`);
  return lines.join('\n');
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export function generateReleaseNote(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const removed = feature.status === 'removed';
  const sections = sectionsFrom(PROMPTS['release-note'].sections, {
    'What changed': [
      removed
        ? `${feature.name} has been removed.`
        : feature.status === 'beta'
          ? `${feature.name} is now available in beta.`
          : `${feature.name} is now available.`,
      feature.description,
    ],
    'Why it matters': [
      removed
        ? 'We’re streamlining the product so the features you rely on stay fast and focused.'
        : 'It gives you a clearer, faster path to the outcome this feature provides.',
    ],
    'Who it affects': [`${feature.audiences.join(', ')}.`],
    'How to use it': removed
      ? ['No action needed.']
      : ['Open it and follow the on-screen steps. See the full tutorial for details.'],
    'Where to find it': [whereToFind(feature)],
    'Known limitations': removed
      ? []
      : ['Outputs based on visual analysis are a smart starting point, not a measurement.'],
    'Admin actions': feature.audiences.includes('admin')
      ? ['Review the admin guide for setup and monitoring.']
      : ['None required.'],
  });
  // Append the integration helper as an extra section.
  if (!removed) {
    sections.push({
      heading: 'Suggested commit trailer (auto-publishes to /updates)',
      body: [suggestedUpdateTrailer(feature)],
    });
  }
  return baseAsset(
    feature,
    'release-note',
    'all',
    {
      title: removed ? `Removed: ${feature.name}` : `New: ${feature.name}`,
      summary: truncate(feature.description, 160),
      sections,
    },
    ctx,
  );
}

export function generateSeoArticle(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const route = primaryRoute(feature);
  const sportWord = feature.sport ? `${feature.sport.replace('_', '-')} ` : '';
  const seo: AssetSeo = {
    title: `${feature.name} — how it works | SwingVantage`,
    description: truncate(`${feature.description} Learn what ${feature.name} does and how to use it.`, 155),
    slug: `help/${feature.slug}`,
    keywords: [
      feature.name.toLowerCase(),
      `${sportWord}swing analysis`,
      'how to',
      'SwingVantage help',
      CATEGORY_LABELS[feature.category].toLowerCase(),
    ],
    schema: ['HowTo', 'FAQPage'],
    aeoAnswer: `${feature.name} lets you ${truncate(decap(feature.description), 120)} ${whereToFind(feature)}`,
  };
  const sections = sectionsFrom(PROMPTS['seo-article'].sections, {
    'Answer (summary)': [seo.aeoAnswer],
    'What it is': [feature.description],
    'How to do it': [
      route ? `1. Open ${route}.` : '1. Open the feature from the navigation.',
      '2. Take the main action the screen guides you through.',
      '3. Review and save your result.',
    ],
    FAQ: [
      `Where do I find ${feature.name}? ${whereToFind(feature)}`,
      `Is ${feature.name} free? Core swing analysis is free.`,
    ],
    Related: ['SwingVantage Tutorial Center', 'How SwingVantage works'],
  });
  return baseAsset(
    feature,
    'seo-article',
    'all',
    {
      title: seo.title,
      summary: seo.description,
      sections,
      seo,
    },
    ctx,
  );
}

function decap(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
