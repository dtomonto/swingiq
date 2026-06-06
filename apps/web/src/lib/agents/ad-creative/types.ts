// ============================================================
// SwingVantage — Agent: Ad-Creative — Types
// ------------------------------------------------------------
// Generates paid-ad variants (headlines / primary text /
// descriptions) grounded in REAL before→after proof, per ad
// platform, with UTM tracking and built-in compliance (it reuses
// the Trust/Honesty Linter). Mirrors the Blog-to-Social engine:
// deterministic by default, optional LLM on top, same output shape
// either way. Pure data shapes; no React, DOM, or vendor SDK.
//
// Built for the ADS phase of the roadmap (first revenue). Spend is
// not its concern — this only produces copy + tracked links.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { LintFinding } from '../trust-linter';

export type AdPlatform = 'meta' | 'google_search' | 'tiktok' | 'youtube' | 'reddit';
export type AdObjective = 'traffic' | 'signups' | 'awareness';
export type AdAudience = 'beginners' | 'improvers' | 'competitive' | 'parents' | 'all';

/** Caller-supplied, REAL improvement evidence. Never fabricated by the agent. */
export interface AdProof {
  /** e.g. "swing score", "carry distance". */
  metricLabel: string;
  before: number;
  after: number;
  /** e.g. "yds", "mph", "". */
  unit?: string;
  /** e.g. "in 3 weeks". */
  timeframe?: string;
  /** Honesty scope, e.g. "for one member". Keeps aggregate claims truthful. */
  descriptor?: string;
}

export interface AdGenerationOptions {
  platforms: AdPlatform[];
  objective: AdObjective;
  sport?: SportId;
  audience?: AdAudience;
  /** Real before→after evidence. Omit for a benefit-led (claim-free) ad. */
  proof?: AdProof | null;
  /** Landing path the ad points to (e.g. "/start"). */
  landingPath?: string;
  /** Public origin for absolute UTM links (e.g. https://swingvantage.com). */
  origin?: string;
  /** utm_campaign override. */
  campaign?: string;
}

/** One platform's full creative set. */
export interface AdCreative {
  platform: AdPlatform;
  label: string;
  headlines: string[];
  primaryTexts: string[];
  descriptions: string[];
  cta: string;
  utmUrl: string;
  /** Non-blocking copy warnings (from the linter) worth a human glance. */
  warnings: string[];
}

export interface AdComplianceIssue {
  platform: AdPlatform;
  field: 'headline' | 'primary' | 'description';
  text: string;
  findings: LintFinding[];
}

export interface AdCreativeResult {
  source: 'fallback' | 'ai';
  generatedAt: string;
  options: AdGenerationOptions;
  creatives: AdCreative[];
  /** Aggregate compliance read across every generated string. */
  compliance: { clean: boolean; issues: AdComplianceIssue[] };
  warnings: string[];
}
