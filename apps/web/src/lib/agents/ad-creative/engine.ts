// ============================================================
// SwingVantage — Agent: Ad-Creative — Engine
// ------------------------------------------------------------
// Deterministic ad-variant generator. Builds a pool of on-brand,
// claim-free candidate lines, fits them to each platform's limits,
// attaches a tracked UTM link, and runs the whole set through the
// compliance check. Pure, SSR-safe, never throws. The optional LLM
// only re-words (validated) — the deterministic path is the
// guaranteed fallback, same shape either way.
// ============================================================

import type { SportId } from '@swingiq/core';
import { getSportAgentProfile } from '../sport-profiles';
import { getActiveProvider } from '../providers/llm-provider';
import { isAdCopyClean, validateAdRewrite } from './compliance';
import type {
  AdComplianceIssue,
  AdCreative,
  AdCreativeResult,
  AdGenerationOptions,
  AdObjective,
  AdPlatform,
  AdProof,
} from './types';

// ── Platform specs (char ceilings + how many of each field) ───

interface PlatformSpec {
  label: string;
  headlineMax: number;
  primaryMax: number;
  descMax: number;
  headlineCount: number;
  primaryCount: number;
  descCount: number;
}

const SPECS: Record<AdPlatform, PlatformSpec> = {
  meta: { label: 'Meta (Facebook/Instagram)', headlineMax: 40, primaryMax: 125, descMax: 30, headlineCount: 3, primaryCount: 2, descCount: 2 },
  google_search: { label: 'Google Search', headlineMax: 30, primaryMax: 90, descMax: 90, headlineCount: 5, primaryCount: 0, descCount: 2 },
  tiktok: { label: 'TikTok', headlineMax: 0, primaryMax: 100, descMax: 0, headlineCount: 0, primaryCount: 3, descCount: 0 },
  youtube: { label: 'YouTube', headlineMax: 40, primaryMax: 70, descMax: 35, headlineCount: 2, primaryCount: 1, descCount: 1 },
  reddit: { label: 'Reddit', headlineMax: 100, primaryMax: 0, descMax: 0, headlineCount: 2, primaryCount: 0, descCount: 0 },
};

const CTA_BY_OBJECTIVE: Record<AdObjective, string> = {
  traffic: 'Learn More',
  signups: 'Sign Up Free',
  awareness: 'See How',
};

// ── Helpers ───────────────────────────────────────────────────

function sportWord(sport?: SportId): string {
  if (!sport) return 'swing';
  return getSportAgentProfile(sport).motion; // "swing" / "stroke"
}

function fit(text: string, max: number): string {
  const t = text.trim();
  if (max <= 0 || t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

/** De-dupe, fit to length, drop blocking-non-compliant lines, take N. */
function selectClean(candidates: string[], max: number, count: number, warnings: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of candidates) {
    if (out.length >= count) break;
    const text = fit(raw, max);
    if (!text || seen.has(text)) continue;
    const { ok, findings } = isAdCopyClean(text);
    if (!ok) continue; // never ship blocking copy
    for (const f of findings) warnings.push(`${f.ruleId}: "${f.match}" — ${f.suggestion}`);
    seen.add(text);
    out.push(text);
  }
  return out;
}

/** A grounded, honest proof sentence — only when real numbers are supplied. */
export function buildProofLine(proof?: AdProof | null): string | null {
  if (!proof || typeof proof.before !== 'number' || typeof proof.after !== 'number') return null;
  const unit = proof.unit ? proof.unit : '';
  const tf = proof.timeframe ? ` ${proof.timeframe}` : '';
  const who = proof.descriptor ? ` ${proof.descriptor}` : '';
  return `${capitalize(proof.metricLabel)}: ${proof.before}${unit} → ${proof.after}${unit}${tf}${who}.`;
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// ── Candidate pools (claim-free by construction) ──────────────

function headlinePool(opts: AdGenerationOptions): string[] {
  const w = sportWord(opts.sport);
  const proof = buildProofLine(opts.proof);
  const pool = [
    `Fix your ${w}, one cue at a time`,
    `Know exactly what to work on`,
    `Your ${w}, analyzed for free`,
    `One clear fix for your ${w}`,
    `Stop guessing what's wrong`,
    `Free ${w} analysis`,
  ];
  if (proof) pool.unshift(`${capitalize(opts.proof!.metricLabel)} ${opts.proof!.before} → ${opts.proof!.after}`);
  if (opts.audience === 'beginners') pool.push(`New to it? Start here`);
  if (opts.audience === 'parents') pool.push(`Help them improve, the right way`);
  return pool;
}

function primaryPool(opts: AdGenerationOptions): string[] {
  const w = sportWord(opts.sport);
  const proof = buildProofLine(opts.proof);
  const pool = [
    `SwingVantage analyzes your ${w} and gives you one clear thing to work on — not a wall of numbers. Free to start.`,
    `Upload one ${w} and get a focused fix you can actually practice. No special equipment needed.`,
    `See what to work on in your ${w}, with the reasoning behind it. Honest, estimate-based coaching — free to start.`,
  ];
  if (proof) pool.unshift(`${proof} See what to work on in your ${w} — free to start.`);
  return pool;
}

function descriptionPool(_opts: AdGenerationOptions): string[] {
  return [
    `Free analysis. One clear fix.`,
    `One fix at a time. Start free.`,
    `Find your top priority fast.`,
  ];
}

// ── UTM ───────────────────────────────────────────────────────

export function adUtmUrl(opts: AdGenerationOptions, platform: AdPlatform): string {
  const base = `${(opts.origin ?? '').replace(/\/$/, '')}${opts.landingPath ?? '/start'}`;
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: 'paid',
    utm_campaign: opts.campaign ?? 'ads',
    utm_content: opts.objective,
  });
  return `${base}?${params.toString()}`;
}

// ── Generate ──────────────────────────────────────────────────

function buildCreative(opts: AdGenerationOptions, platform: AdPlatform): AdCreative {
  const spec = SPECS[platform];
  const warnings: string[] = [];
  return {
    platform,
    label: spec.label,
    headlines: selectClean(headlinePool(opts), spec.headlineMax, spec.headlineCount, warnings),
    primaryTexts: selectClean(primaryPool(opts), spec.primaryMax, spec.primaryCount, warnings),
    descriptions: selectClean(descriptionPool(opts), spec.descMax, spec.descCount, warnings),
    cta: CTA_BY_OBJECTIVE[opts.objective],
    utmUrl: adUtmUrl(opts, platform),
    warnings: Array.from(new Set(warnings)),
  };
}

function buildCompliance(creatives: AdCreative[]): AdCreativeResult['compliance'] {
  const issues: AdComplianceIssue[] = [];
  for (const c of creatives) {
    const scan = (field: AdComplianceIssue['field'], texts: string[]) => {
      for (const text of texts) {
        const { ok, findings } = isAdCopyClean(text);
        if (!ok) issues.push({ platform: c.platform, field, text, findings });
      }
    };
    scan('headline', c.headlines);
    scan('primary', c.primaryTexts);
    scan('description', c.descriptions);
  }
  return { clean: issues.length === 0, issues };
}

/**
 * The agent's main entry point. Deterministic, claim-free, compliance-checked.
 * `source` is always 'fallback' here; `narrateAdCreatives` adds the optional
 * AI layer on top with the same shape.
 */
export function generateAdCreatives(opts: AdGenerationOptions): AdCreativeResult {
  const platforms = opts.platforms.length ? opts.platforms : (['meta'] as AdPlatform[]);
  const creatives = platforms.map((p) => buildCreative(opts, p));
  const warnings: string[] = [];
  if (!opts.proof) warnings.push('No proof supplied — generated benefit-led (claim-free) variants only.');

  return {
    source: 'fallback',
    generatedAt: new Date().toISOString(),
    options: opts,
    creatives,
    compliance: buildCompliance(creatives),
    warnings,
  };
}

/**
 * Optional AI layer: re-words the first primary text of each creative for
 * punch, then VALIDATES the rewrite (lint-clean + no invented numbers). Any
 * failure keeps the deterministic copy. Never throws; same shape as fallback.
 */
export async function narrateAdCreatives(opts: AdGenerationOptions): Promise<AdCreativeResult> {
  const base = generateAdCreatives(opts);
  let usedAi = false;
  try {
    const provider = getActiveProvider();
    if (provider.id !== 'llm' || !provider.isAvailable()) return base;

    for (const creative of base.creatives) {
      const original = creative.primaryTexts[0];
      if (!original) continue;
      const reworded = (await provider.enhanceSummary({
        text: original,
        sport: opts.sport ?? 'golf',
        tone: 'concise',
      }))?.trim();
      if (reworded && reworded !== original && validateAdRewrite(reworded, opts.proof).ok) {
        creative.primaryTexts[0] = reworded;
        usedAi = true;
      }
    }
  } catch {
    return base; // honest fallback
  }
  return usedAi ? { ...base, source: 'ai' } : base;
}
