// ============================================================
// Link Intelligence Agent — AI search (AEO/GEO) citation readiness
// ------------------------------------------------------------
// Scores how likely each page is to be CITED by answer/generative engines
// (Google AI Overviews, Perplexity, ChatGPT, Gemini). Reads the REAL on-page
// signals already in the SEO catalog (direct answer, FAQs, schema, depth,
// drills) plus the page's internal authority from the graph. Returns ordered,
// concrete recommendations to raise citation likelihood.
// ============================================================

import { PUBLISHED_SEO_PAGES } from '@/content/seoPages';
import type { LinkGraph, LinkSport, AiSearchOpportunity } from './types';
import { scoreCitation } from './scoring';
import { normalizeUrl } from './inventory';

const norm = (n: number, max: number) => Math.max(0, Math.min(1, n / max));

export function analyzeAiSearch(graph: LinkGraph): AiSearchOpportunity[] {
  const out: AiSearchOpportunity[] = [];

  for (const p of PUBLISHED_SEO_PAGES) {
    const url = normalizeUrl(p.slug);
    const node = graph.byUrl.get(url);

    const directAnswer = (p.directAnswer ?? '').trim();
    const faqCount = p.faqs?.length ?? 0;
    const stepsCount = p.diagnosisSteps?.length ?? 0;
    const drillCount = p.drills?.length ?? 0;
    const explainParas = p.problemExplanation?.length ?? 0;
    const measures = p.whatSwingVantageLooksFor?.length ?? 0;

    const signals = {
      answerClarity: directAnswer.length >= 120 ? 1 : directAnswer.length >= 40 ? 0.6 : 0,
      factualDepth: norm(explainParas + measures + drillCount, 8),
      schemaQuality: p.schemaType === 'FAQPage' || p.schemaType === 'HowTo' ? 1 : p.schemaType ? 0.7 : 0,
      structure: norm(faqCount + (stepsCount > 0 ? 2 : 0), 5),
      internalAuthority: node ? norm(node.inboundCount, 6) : 0,
      sportSpecificity: (p.sport as LinkSport) !== 'multi' ? 0.9 : 0.6,
    };

    const { score, factors } = scoreCitation(signals);

    const recommendations: string[] = [];
    if (signals.answerClarity < 1) recommendations.push('Lead with a 2–3 sentence direct answer (40–120+ chars) at the very top.');
    if (faqCount < 3) recommendations.push(`Add an FAQ block (3–5 Q&As) — currently ${faqCount}. Answer engines quote these directly.`);
    if (signals.schemaQuality < 1) recommendations.push('Add FAQPage or HowTo schema so engines parse the structure.');
    if (signals.internalAuthority < 0.5) recommendations.push(`Strengthen internal links to this page (currently ${node?.inboundCount ?? 0} inbound).`);
    if (signals.factualDepth < 0.6) recommendations.push('Add original detail: a comparison table, data point, or step-by-step that\'s genuinely citable.');
    if (recommendations.length === 0) recommendations.push('Citation-ready — keep it fresh and well-linked.');

    out.push({ url, title: p.title, sport: p.sport as LinkSport, score, factors, recommendations });
  }

  return out.sort((a, b) => a.score - b.score); // weakest first = biggest opportunity
}
