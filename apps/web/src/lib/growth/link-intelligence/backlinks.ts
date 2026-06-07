// ============================================================
// Link Intelligence Agent — backlink opportunity engine
// ------------------------------------------------------------
// Produces white-hat backlink OPPORTUNITIES as GrowthOS AuthorityOpportunity
// records (kind `authority`) — so they flow straight into the existing
// Digital PR module. Until a real SEO data provider (Ahrefs/Semrush/…) is
// connected, opportunities come from a curated, deterministic catalog and are
// labeled `placeholder` (never faked as live). Every opportunity is validated
// white-hat before it is emitted.
// ============================================================

import type { AuthorityOpportunity, Scale } from '../types';
import { scoreBacklinkOpportunity, type BacklinkSignals } from './scoring';
import { validateWhiteHat } from './guardrails';
import { anyProviderConfigured } from './adapters';
import { AGENT_OWNER } from './constants';
import { id } from './id';

interface OppSeed {
  key: string;
  opportunityType: string;
  targetOutlet: string;
  pitchAngle: string;
  /** SwingVantage page best suited to pitch. */
  relevantPage: string;
  requiredAssets: string[];
  signals: BacklinkSignals;
}

const s = (relevance: number, authority: number, traffic: number, editorial: number, likelihood: number, gap: number, spam = 0): BacklinkSignals =>
  ({ relevance, authorityProxy: authority, trafficProxy: traffic, editorialQuality: editorial, linkLikelihood: likelihood, competitorGap: gap, spamRisk: spam });

// Curated, realistic, WHITE-HAT opportunity archetypes across SwingVantage's
// sports and the spec's allowed categories. Generic by design — contacts are
// "research needed" rather than invented, so nothing here is misleading.
const CATALOG: OppSeed[] = [
  { key: 'golf-resource-pages', opportunityType: 'Resource page', targetOutlet: 'Junior golf academies & "golf practice resources" pages', pitchAngle: 'Offer the free Golf Slice Fixer tool + slice guide as a genuinely useful resource for their members.', relevantPage: '/tools/golf-slice-fixer', requiredAssets: ['Tool one-pager', 'Short description'], signals: s(0.9, 0.55, 0.5, 0.8, 0.6, 0.6) },
  { key: 'golf-broken-link', opportunityType: 'Broken-link replacement', targetOutlet: 'Golf instruction blogs with dead "swing analysis tool" links', pitchAngle: 'Point out the broken link and suggest the free golf swing analysis page as a working replacement.', relevantPage: '/golf-swing-analysis', requiredAssets: ['List of broken targets'], signals: s(0.85, 0.5, 0.45, 0.75, 0.55, 0.7) },
  { key: 'tennis-coach-resources', opportunityType: 'Coach / academy resource', targetOutlet: 'Tennis coaching sites & USTA/UTR community resource pages', pitchAngle: 'Share the tennis swing analysis + serve guide as a free aid for developing players.', relevantPage: '/tennis-swing-analysis', requiredAssets: ['Coach blurb'], signals: s(0.85, 0.5, 0.45, 0.75, 0.5, 0.55) },
  { key: 'pickleball-blogs', opportunityType: 'Editorial / guest contribution', targetOutlet: 'Pickleball blogs & newsletters covering technique', pitchAngle: 'Contribute a third-shot-drop breakdown that cites the pickleball analysis feature.', relevantPage: '/blog/pickleball-third-shot-drop-guide', requiredAssets: ['Draft outline'], signals: s(0.8, 0.45, 0.4, 0.7, 0.6, 0.65) },
  { key: 'padel-blogs', opportunityType: 'Editorial / guest contribution', targetOutlet: 'Padel community sites (fast-growing, low competition)', pitchAngle: 'Offer a bandeja technique explainer referencing the padel analysis feature.', relevantPage: '/blog/padel-bandeja-explained', requiredAssets: ['Draft outline'], signals: s(0.8, 0.4, 0.35, 0.7, 0.65, 0.7) },
  { key: 'baseball-youth-orgs', opportunityType: 'Youth sports resource', targetOutlet: 'Youth baseball orgs & travel-ball parent resources', pitchAngle: 'Provide the exit-velocity guide + recruiting-video tool as a parent resource.', relevantPage: '/blog/baseball-exit-velocity-guide', requiredAssets: ['Parent-facing blurb'], signals: s(0.85, 0.5, 0.5, 0.75, 0.5, 0.55) },
  { key: 'softball-recruiting', opportunityType: 'Recruiting resource', targetOutlet: 'Fast-pitch recruiting & showcase sites', pitchAngle: 'Offer the bat-path/launch-angle guide + recruiting film tips as a free resource.', relevantPage: '/blog/softball-bat-path-and-launch-angle', requiredAssets: ['Recruiting checklist'], signals: s(0.8, 0.45, 0.4, 0.72, 0.5, 0.6) },
  { key: 'ai-tool-directories', opportunityType: 'AI tool directory', targetOutlet: 'Reputable AI-tool & sports-tech directories', pitchAngle: 'Submit SwingVantage to relevant, non-spammy AI/sports-tech directories.', relevantPage: '/', requiredAssets: ['Logo', 'Boilerplate', 'Screenshots'], signals: s(0.7, 0.55, 0.5, 0.65, 0.8, 0.5) },
  { key: 'product-launch', opportunityType: 'Launch platform', targetOutlet: 'Product Hunt-style launch communities', pitchAngle: 'Launch the free AI swing analysis tool to an audience that loves new tools.', relevantPage: '/how-it-works', requiredAssets: ['Launch assets', 'Demo GIF'], signals: s(0.65, 0.6, 0.55, 0.6, 0.7, 0.45) },
  { key: 'sports-tech-press', opportunityType: 'Digital PR', targetOutlet: 'Sports-technology newsletters & blogs', pitchAngle: 'Pitch a data-led story (e.g. most common faults by handicap) with original SwingVantage data.', relevantPage: '/benchmarks', requiredAssets: ['Original data story'], signals: s(0.7, 0.65, 0.6, 0.7, 0.4, 0.55) },
  { key: 'biomechanics-blogs', opportunityType: 'Expert roundup', targetOutlet: 'Sports biomechanics & coaching blogs', pitchAngle: 'Offer an expert quote on AI swing analysis for a roundup, with a natural link.', relevantPage: '/methodology', requiredAssets: ['Expert quote'], signals: s(0.75, 0.55, 0.45, 0.75, 0.5, 0.5) },
  { key: 'podcasts', opportunityType: 'Podcast guesting', targetOutlet: 'Golf/tennis/softball coaching podcasts with show-notes links', pitchAngle: 'Guest on a coaching podcast; earn a contextual show-notes link.', relevantPage: '/coaches', requiredAssets: ['Guest bio', 'Talking points'], signals: s(0.7, 0.5, 0.4, 0.7, 0.45, 0.5) },
  { key: 'comparison-inclusion', opportunityType: 'Comparison inclusion', targetOutlet: '"Best swing analysis apps" comparison articles', pitchAngle: 'Request inclusion in relevant comparison roundups (free tier is a strong differentiator).', relevantPage: '/features', requiredAssets: ['Fact sheet'], signals: s(0.8, 0.55, 0.6, 0.65, 0.45, 0.7) },
  { key: 'parent-guides', opportunityType: 'Parent resource', targetOutlet: 'Youth-sports parent blogs & communities', pitchAngle: 'Offer the parents guide as a genuinely helpful, non-promotional resource.', relevantPage: '/parents', requiredAssets: ['Parent guide summary'], signals: s(0.75, 0.45, 0.4, 0.72, 0.55, 0.5) },
];

/**
 * Discover white-hat backlink opportunities as AuthorityOpportunity records.
 * Deterministic ids → idempotent across runs. `env` is read only to label
 * whether a live provider is connected (data stays curated until then).
 */
export function discoverBacklinkOpportunities(env: NodeJS.ProcessEnv = process.env): AuthorityOpportunity[] {
  const now = new Date().toISOString();
  const providerConnected = anyProviderConfigured(env);

  const out: AuthorityOpportunity[] = [];
  for (const seed of CATALOG) {
    const verdict = validateWhiteHat({ opportunityType: seed.opportunityType, targetOutlet: seed.targetOutlet, pitchAngle: seed.pitchAngle, spamRisk: seed.signals.spamRisk });
    if (!verdict.ok) continue; // never emit non-white-hat opportunities

    const { score, factors } = scoreBacklinkOpportunity(seed.signals);
    const relevance: Scale = seed.signals.relevance >= 0.8 ? 'high' : seed.signals.relevance >= 0.55 ? 'medium' : 'low';

    out.push({
      id: id('authority-li', seed.key),
      name: `${seed.opportunityType}: ${seed.targetOutlet}`,
      dataSource: providerConnected ? 'estimated' : 'placeholder',
      owner: AGENT_OWNER,
      notes: `Opportunity score ${score}/100. ${factors.join(' ')} Best page to pitch: ${seed.relevantPage}.`,
      createdAt: now,
      updatedAt: now,
      opportunityType: seed.opportunityType,
      targetOutlet: seed.targetOutlet,
      contact: 'Research needed — find the site\'s editor / resource-page owner.',
      pitchAngle: seed.pitchAngle,
      status: 'idea',
      audienceRelevance: relevance,
      deadline: null,
      requiredAssets: seed.requiredAssets,
      outreachMessage: '', // drafted on demand via the AI Strategist (link-outreach task)
      followUpDate: null,
      result: '',
      backlinkUrl: '',
    });
  }

  return out.sort((a, b) => relScore(b) - relScore(a));
}

/** Re-derive the numeric score from the notes for sorting (kept in notes for transparency). */
function relScore(o: AuthorityOpportunity): number {
  const m = o.notes?.match(/score (\d+)/i);
  return m ? Number(m[1]) : 0;
}
