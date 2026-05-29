// ============================================================
// SwingIQ — LLM Research Prompt Templates (Versioned)
//
// Prompt design principles:
//  • LLM is a summarizer and extractor, NOT an authority
//  • All prompts request structured JSON output
//  • Prompts explicitly prohibit inventing benchmarks
//  • Confidence is always requested alongside claims
//  • Prompts are versioned for reproducibility
// ============================================================

import type { ResearchScope } from './types';

export const PROMPT_VERSION = '1.0.0';

// ──────────────────────────────────────────────────────────────
// System prompt — applies to all research calls
// ──────────────────────────────────────────────────────────────

export const RESEARCH_SYSTEM_PROMPT = `You are a golf performance research assistant for SwingIQ.
Your role is to summarize evidence and extract benchmark-relevant claims from provided source text.

Rules you must follow without exception:
1. Never invent benchmarks. Only extract claims that appear in the provided source text.
2. If a source does not contain specific numbers, say so clearly.
3. Always express confidence — how certain are you based on THIS source alone?
4. Flag any claims that conflict with established standards (face-to-path for driver: ±3° ideal).
5. Do not make medical claims beyond general safe-movement guidance.
6. Do not reproduce copyrighted text verbatim. Summarize in your own words.
7. Respect that benchmark data varies by skill level, swing speed, age, and body type.
8. Output valid JSON only. Do not include any text outside the JSON structure.
9. If the source is unclear, ambiguous, or of low quality, say so in your confidence rating.
10. Do not treat a single source as definitive for changing any benchmark.`;

// ──────────────────────────────────────────────────────────────
// Source summarization prompt
// ──────────────────────────────────────────────────────────────

export interface SourceSummaryInput {
  source_title: string;
  source_publisher: string;
  source_url: string;
  source_text_excerpt: string;   // max 2000 chars — summary or abstract, not full text
  research_focus: string;
}

export interface SourceSummaryOutput {
  summary: string;
  key_claims: string[];
  benchmark_candidates: Array<{
    metric: string;
    club_type: string;
    skill_level: string;
    lower_bound: number | null;
    target_value: number | null;
    upper_bound: number | null;
    unit: string;
    confidence: number;          // 0–1
    direct_quote_paraphrase: string;
  }>;
  related_categories: string[];
  is_quantitative: boolean;
  source_quality_notes: string;
  conflicts_with_known_standards: boolean;
  conflict_description: string | null;
}

export function buildSourceSummaryPrompt(input: SourceSummaryInput): {
  system: string;
  user: string;
} {
  return {
    system: RESEARCH_SYSTEM_PROMPT,
    user: `Analyze this golf research source and extract benchmark-relevant claims.

SOURCE TITLE: ${input.source_title}
PUBLISHER: ${input.source_publisher}
URL: ${input.source_url}
RESEARCH FOCUS: ${input.research_focus}

SOURCE TEXT (excerpt — do not reproduce this verbatim in output):
---
${input.source_text_excerpt.slice(0, 2000)}
---

Return ONLY valid JSON matching this exact schema:
{
  "summary": "2-3 sentence plain-English summary",
  "key_claims": ["claim 1", "claim 2"],
  "benchmark_candidates": [
    {
      "metric": "face_to_path",
      "club_type": "driver",
      "skill_level": "all",
      "lower_bound": -3,
      "target_value": 0,
      "upper_bound": 3,
      "unit": "degrees",
      "confidence": 0.8,
      "direct_quote_paraphrase": "paraphrase of what the source says"
    }
  ],
  "related_categories": ["face_to_path", "club_path"],
  "is_quantitative": true,
  "source_quality_notes": "notes on source reliability",
  "conflicts_with_known_standards": false,
  "conflict_description": null
}`,
  };
}

// ──────────────────────────────────────────────────────────────
// Benchmark comparison prompt
// ──────────────────────────────────────────────────────────────

export interface BenchmarkComparisonInput {
  metric: string;
  club_type: string;
  current_lower: number;
  current_target: number;
  current_upper: number;
  unit: string;
  evidence_claims: Array<{
    claim: string;
    source: string;
    confidence: number;
  }>;
}

export interface BenchmarkComparisonOutput {
  should_update: boolean;
  proposed_lower: number | null;
  proposed_target: number | null;
  proposed_upper: number | null;
  confidence: number;
  rationale: string;
  risk_level: 'low' | 'medium' | 'high';
  conflicting_evidence: string[];
  caveat: string | null;
}

export function buildBenchmarkComparisonPrompt(input: BenchmarkComparisonInput): {
  system: string;
  user: string;
} {
  const claimsText = input.evidence_claims
    .map((c, i) => `${i + 1}. [${c.source}] (confidence: ${c.confidence}): ${c.claim}`)
    .join('\n');

  return {
    system: RESEARCH_SYSTEM_PROMPT,
    user: `Review evidence for a potential benchmark update.

CURRENT BENCHMARK:
Metric: ${input.metric}
Club type: ${input.club_type}
Current range: ${input.current_lower} to ${input.current_upper} ${input.unit} (target: ${input.current_target})

EVIDENCE FROM RESEARCH SOURCES:
${claimsText}

Based ONLY on the evidence above, determine if this benchmark should be updated.
If evidence is weak, mixed, or insufficient, recommend no change.
Do NOT invent values not supported by the evidence.

Return ONLY valid JSON:
{
  "should_update": false,
  "proposed_lower": null,
  "proposed_target": null,
  "proposed_upper": null,
  "confidence": 0.0,
  "rationale": "reason for recommendation",
  "risk_level": "low",
  "conflicting_evidence": [],
  "caveat": null
}`,
  };
}

// ──────────────────────────────────────────────────────────────
// Drill library refresh prompt
// ──────────────────────────────────────────────────────────────

export interface DrillRefreshInput {
  swing_issue: string;
  swing_phase: string;
  current_drill_names: string[];
  evidence_context: string;
}

export interface DrillRefreshOutput {
  recommended_drill_updates: Array<{
    action: 'keep' | 'update_description' | 'add_new' | 'deprecate';
    drill_name: string;
    updated_description: string | null;
    updated_steps: string[] | null;
    updated_youtube_search_query: string | null;
    rationale: string;
  }>;
  general_notes: string;
}

export function buildDrillRefreshPrompt(input: DrillRefreshInput): {
  system: string;
  user: string;
} {
  return {
    system: RESEARCH_SYSTEM_PROMPT,
    user: `Review and suggest updates to the SwingIQ drill library for this swing issue.

SWING ISSUE: ${input.swing_issue}
SWING PHASE: ${input.swing_phase}
CURRENT DRILLS: ${input.current_drill_names.join(', ')}

RECENT RESEARCH CONTEXT:
${input.evidence_context.slice(0, 1500)}

Suggest updates to improve, add, or deprecate drills based on the evidence.
For YouTube search queries, provide descriptive search terms only — no URLs.

Return ONLY valid JSON:
{
  "recommended_drill_updates": [
    {
      "action": "keep",
      "drill_name": "Wall Drill",
      "updated_description": null,
      "updated_steps": null,
      "updated_youtube_search_query": null,
      "rationale": "Remains well-supported by evidence"
    }
  ],
  "general_notes": "overall notes"
}`,
  };
}

// ──────────────────────────────────────────────────────────────
// Research run summary prompt
// ──────────────────────────────────────────────────────────────

export interface RunSummaryInput {
  scope: string[];
  sources_reviewed: number;
  sources_accepted: number;
  proposals_created: number;
  top_findings: string[];
}

export function buildRunSummaryPrompt(input: RunSummaryInput): {
  system: string;
  user: string;
} {
  return {
    system: RESEARCH_SYSTEM_PROMPT,
    user: `Write a concise research run summary for SwingIQ administrators.

RESEARCH SCOPE: ${input.scope.join(', ')}
SOURCES REVIEWED: ${input.sources_reviewed}
SOURCES ACCEPTED: ${input.sources_accepted}
PROPOSALS CREATED: ${input.proposals_created}
TOP FINDINGS:
${input.top_findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Write a 2-3 paragraph summary suitable for an admin dashboard.
Be honest about confidence levels. Avoid overclaiming.
Return a plain string (not JSON).`,
  };
}
