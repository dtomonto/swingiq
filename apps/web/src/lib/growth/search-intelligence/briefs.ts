// ============================================================
// SearchIntelligenceOS — Content Brief generator (§2.13)
// ------------------------------------------------------------
// Deterministic, production-ready brief from a topic/keyword. Keyless — it
// never auto-publishes and never fabricates facts (it asks the writer to fill
// evidence). An optional AI-rewrite pass can polish the prose later (seam in
// engine/adapters), but the keyless brief is complete on its own.
// Pure + deterministic.
// ============================================================

import { slug as toSlug } from '../link-intelligence/id';
import type { BriefInput, ContentBrief, LinkIntent, LinkSport } from './types';

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generateBrief(input: BriefInput): ContentBrief {
  const keyword = (input.targetKeyword || input.topic).trim();
  const topic = input.topic.trim();
  const sport: LinkSport = input.sport ?? 'multi';
  const intent: LinkIntent = input.intent ?? (/\b(best|review|vs|app|software|analyzer)\b/i.test(keyword) ? 'commercial' : 'informational');
  const audience = input.audience ?? 'players';
  const isHowTo = /\b(how to|fix|stop|drill|plan)\b/i.test(keyword);

  return {
    objective: `Rank for "${keyword}" and convert ${audience} into a free SwingVantage analysis while fully answering the query.`,
    audience,
    searchIntent: intent,
    primaryKeyword: keyword,
    secondaryKeywords: [
      `${keyword} drills`,
      `${keyword} tips`,
      `${sport === 'multi' ? '' : sport + ' '}${topic}`.trim(),
    ].filter(Boolean),
    proposedSlug: sport === 'multi' ? toSlug(keyword) : `${sport}/${toSlug(keyword)}`,
    titleOptions: [
      `${titleCase(keyword)}: A Beginner-Safe Guide`,
      `How to ${titleCase(topic)} (Step-by-Step)`,
      `${titleCase(keyword)} — What Actually Works`,
    ],
    metaDescriptionOptions: [
      `Learn ${keyword.toLowerCase()} with a clear diagnosis, drills, and a practice plan. Get a free AI swing analysis from SwingVantage.`,
      `The honest guide to ${keyword.toLowerCase()}: causes, fixes, and how to measure progress. Try a free swing analysis.`,
    ],
    h1: `${titleCase(keyword)}`,
    outline: [
      { heading: 'Direct answer', subpoints: ['2–3 sentence answer up top (AEO-ready)'] },
      { heading: `What causes ${topic}`, subpoints: ['Root mechanism', 'Common contributing factors'] },
      { heading: 'Diagnose it yourself', subpoints: ['Self-check checklist', 'What SwingVantage measures'] },
      { heading: 'Drills that fix it', subpoints: ['2–3 beginner-safe drills with how-to'] },
      { heading: 'A simple practice plan', subpoints: ['7-day or 3-step plan', 'How to retest'] },
      { heading: 'Mistakes to avoid', subpoints: ['Anti-patterns', 'When to see a coach'] },
      { heading: 'FAQ', subpoints: ['3–5 question/answer pairs'] },
    ],
    directAnswerBlock: `Write a concise, factual 2–3 sentence answer to "${keyword}" here. State the cause first, then the single most effective fix. No hype, no unsupported claims.`,
    faqs: [
      { question: `What is the fastest way to ${topic}?`, answer: 'Answer with the one highest-leverage change, then how to verify it.' },
      { question: `How long does it take to fix ${topic}?`, answer: 'Give an honest range and what it depends on.' },
      { question: `Can SwingVantage help with ${topic}?`, answer: 'Explain exactly what it measures and the one-fix/one-plan/one-retest loop.' },
    ],
    howToSteps: isHowTo
      ? ['Set up correctly', 'Make the key change', 'Drill it', 'Retest and measure']
      : [],
    schemaRecommendations: isHowTo ? ['HowTo', 'FAQPage', 'BreadcrumbList'] : ['Article', 'FAQPage', 'BreadcrumbList'],
    internalLinksToAdd: [
      `Link to the ${sport === 'multi' ? 'main' : sport} hub page`,
      'Link to 1–2 supporting guides in the same cluster',
      'Link to the relevant free tool or sample report',
    ],
    externalCitationNeeds: ['Cite a credible biomechanics/coaching source for any technical claim'],
    cta: 'Analyze your swing free with SwingVantage',
    trustElements: ['Methodology link (measured vs estimated)', 'Honest "what we can/can\'t see" note', 'Real example diagnosis'],
    differentiationAngle: 'One fix, one plan, one retest — measurable, beginner-safe, and honest about uncertainty.',
    qualityChecklist: [
      'Answers the query in the first 100 words',
      '900+ words of genuinely useful content',
      'Original drill how-tos (not generic filler)',
      'Internal links to hub + cluster + tool',
      'Unique title + meta description',
    ],
    aeoGeoChecklist: [
      'Direct-answer block at the top',
      'FAQ block with schema',
      'Clear entity + definition early',
      'Concise, citable sentences',
      'No unsupported superlatives',
    ],
    noFabricationWarning: 'Do NOT invent stats, rankings, study results, or testimonials. Mark any estimate as an estimate. Every factual claim needs a real source or it gets cut.',
  };
}
