// ============================================================
// SwingVantage — 90-Day Research Workflow Orchestrator
//
// This is the main function called by the scheduled job.
// It runs without user interaction and produces:
//   • A ResearchRun log record
//   • EvidenceSource records for each reviewed source
//   • BenchmarkChangeProposal records for each potential update
//
// What it does NOT do:
//   • Automatically apply benchmark changes (requires review)
//   • Access private user data or videos
//   • Reproduce copyrighted content verbatim
//   • Invent benchmark values without source evidence
//
// INFRASTRUCTURE NOTE:
//   • Triggered by Vercel Cron → /api/research/run (POST)
//   • Or triggered manually by admin via the same endpoint
//   • LLM calls use the configured AI_PROVIDER (OpenAI/Anthropic)
//   • If no AI configured, the workflow completes with a
//     "manual review required" status and pre-structured data
// ============================================================

import type {
  ResearchRun,
  EvidenceSource,
  BenchmarkChangeProposal,
  ResearchScope,
} from './types';
import { scoreSource, inferSourceCategories } from './source-evaluator';
import { buildProposal } from './proposal-engine';
import {
  buildSourceSummaryPrompt,
  buildBenchmarkComparisonPrompt,
  buildRunSummaryPrompt,
  PROMPT_VERSION,
  type SourceSummaryOutput,
  type BenchmarkComparisonOutput,
} from './llm-prompts';
import { TARGET_WINDOWS } from '../diagnostic/rules';

// ──────────────────────────────────────────────────────────────
// Curated source seed list
// These are known-good, publicly accessible research sources
// for the initial research cycle. Each run starts with these
// and can be extended via admin config.
//
// Note: We retrieve ABSTRACTS or public summaries only.
// We never copy full copyrighted articles.
// ──────────────────────────────────────────────────────────────

export interface CuratedSource {
  title: string;
  url: string;
  publisher: string;
  source_type: EvidenceSource['source_type'];
  scope: ResearchScope[];
  description: string;
  expected_metrics: string[];
}

export const CURATED_SOURCES: CuratedSource[] = [
  {
    title: 'TrackMan University — Golf Ball Launch Parameters',
    url: 'https://www.trackman.com/golf/launch-monitor',
    publisher: 'TrackMan',
    source_type: 'launch_monitor_manufacturer',
    scope: ['launch_monitor_benchmarks'],
    description: 'TrackMan education on optimal launch conditions by club type',
    expected_metrics: ['launch_angle', 'spin_rate', 'ball_speed', 'smash_factor'],
  },
  {
    title: 'TrackMan University — Attack Angle and Driver Optimization',
    url: 'https://www.trackman.com/golf/attack-angle',
    publisher: 'TrackMan',
    source_type: 'launch_monitor_manufacturer',
    scope: ['launch_monitor_benchmarks'],
    description: 'Research on optimal attack angle for driver distance',
    expected_metrics: ['attack_angle', 'carry_distance', 'spin_rate'],
  },
  {
    title: 'USGA Equipment Testing and Conformance Standards',
    url: 'https://www.usga.org/content/usga/home-page/equipment-standards.html',
    publisher: 'USGA',
    source_type: 'governing_body',
    scope: ['launch_monitor_benchmarks', 'equipment_technology'],
    description: 'USGA standards for conforming equipment and ball performance',
    expected_metrics: ['ball_speed', 'carry_distance'],
  },
  {
    title: 'FlightScope Launch Monitor Science — Face-to-Path Explained',
    url: 'https://flightscope.com/resources/face-to-path',
    publisher: 'FlightScope',
    source_type: 'launch_monitor_manufacturer',
    scope: ['launch_monitor_benchmarks'],
    description: 'FlightScope education on face-to-path relationships',
    expected_metrics: ['face_to_path', 'club_path', 'spin_axis'],
  },
  {
    title: 'Biomechanics of the Golf Swing — Review of Key Concepts',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5386810/',
    publisher: 'Journal of Sports Sciences',
    source_type: 'sports_biomechanics_journal',
    scope: ['biomechanics'],
    description: 'Peer-reviewed review of golf swing biomechanics',
    expected_metrics: ['sequencing', 'weight_transfer', 'swing_plane'],
  },
  {
    title: 'Motor Learning and Golf Skill Acquisition',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
    publisher: 'Motor Learning Research',
    source_type: 'motor_learning_research',
    scope: ['practice_science'],
    description: 'Research on blocked vs random practice for golf skill development',
    expected_metrics: ['drill_effectiveness', 'practice_methodology'],
  },
  {
    title: 'Foresight Sports — Iron Launch Optimization',
    url: 'https://www.foresightsports.com/resources',
    publisher: 'Foresight Sports',
    source_type: 'launch_monitor_manufacturer',
    scope: ['launch_monitor_benchmarks'],
    description: 'Iron launch angle and spin rate optimization data',
    expected_metrics: ['launch_angle', 'spin_rate', 'dynamic_loft', 'attack_angle'],
  },
  {
    title: 'PGA of America Teaching Manual — Fundamentals of the Golf Swing',
    url: 'https://www.pga.com/education',
    publisher: 'PGA of America',
    source_type: 'coaching_organization',
    scope: ['biomechanics', 'drill_library'],
    description: 'PGA education on fundamental swing positions and drills',
    expected_metrics: ['biomechanics_general', 'sequencing'],
  },
];

// ──────────────────────────────────────────────────────────────
// LLM call helper (works with OpenAI or Anthropic)
// ──────────────────────────────────────────────────────────────

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'none';
  api_key: string;
  model: string;
}

export async function callLLM(
  config: LLMConfig,
  system: string,
  user: string,
  max_tokens = 1200,
): Promise<{ text: string; input_tokens: number; output_tokens: number; latency_ms: number }> {
  const start = Date.now();

  if (config.provider === 'none') {
    return {
      text: JSON.stringify({ error: 'No AI provider configured — manual review required' }),
      input_tokens: 0,
      output_tokens: 0,
      latency_ms: 0,
    };
  }

  if (config.provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens,
        temperature: 0.1,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json() as Record<string, unknown>;
    const choices = data['choices'] as Array<Record<string, unknown>> | undefined;
    const usage = data['usage'] as Record<string, number> | undefined;
    return {
      text: (choices?.[0]?.['message'] as Record<string, unknown> | undefined)?.['content'] as string ?? '',
      input_tokens: usage?.['prompt_tokens'] ?? 0,
      output_tokens: usage?.['completion_tokens'] ?? 0,
      latency_ms: Date.now() - start,
    };
  }

  if (config.provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.api_key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
    const data = await res.json() as Record<string, unknown>;
    const content = data['content'] as Array<Record<string, unknown>> | undefined;
    const usage = data['usage'] as Record<string, number> | undefined;
    return {
      text: content?.[0]?.['text'] as string ?? '',
      input_tokens: usage?.['input_tokens'] ?? 0,
      output_tokens: usage?.['output_tokens'] ?? 0,
      latency_ms: Date.now() - start,
    };
  }

  throw new Error(`Unknown provider: ${config.provider}`);
}

// ──────────────────────────────────────────────────────────────
// Parse LLM JSON output safely
// ──────────────────────────────────────────────────────────────

function parseLLMJson<T>(text: string, fallback: T): T {
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(clean) as T;
  } catch {
    return fallback;
  }
}

// ──────────────────────────────────────────────────────────────
// Research run context
// ──────────────────────────────────────────────────────────────

export interface WorkflowContext {
  run_id: string;
  triggered_by: 'cron' | 'admin' | 'manual';
  scope: ResearchScope[];
  llm: LLMConfig;
  dry_run: boolean;  // if true, generate proposals but don't persist
}

export interface WorkflowResult {
  run: ResearchRun;
  sources: EvidenceSource[];
  proposals: BenchmarkChangeProposal[];
  errors: string[];
}

// ──────────────────────────────────────────────────────────────
// Main workflow function
// ──────────────────────────────────────────────────────────────

export async function runResearchWorkflow(
  ctx: WorkflowContext,
): Promise<WorkflowResult> {
  const errors: string[] = [];
  const sources: EvidenceSource[] = [];
  const proposals: BenchmarkChangeProposal[] = [];
  const now = new Date().toISOString();

  // Initialize run record
  const run: ResearchRun = {
    id: ctx.run_id,
    scheduled_at: now,
    started_at: now,
    completed_at: null,
    status: 'running',
    scope: ctx.scope,
    sources_reviewed: 0,
    sources_accepted: 0,
    sources_rejected: 0,
    proposals_created: 0,
    proposals_approved: 0,
    proposals_rejected: 0,
    model_used: ctx.llm.provider !== 'none' ? ctx.llm.model : null,
    prompt_version: PROMPT_VERSION,
    errors: [],
    summary: null,
    triggered_by: ctx.triggered_by,
    next_scheduled_at: computeNextScheduled(),
  };

  try {
    // Step 1: Filter sources by scope
    const scopedSources = CURATED_SOURCES.filter((s) =>
      ctx.scope.includes('full') || s.scope.some((ss) => ctx.scope.includes(ss)),
    );

    run.sources_reviewed = scopedSources.length;

    // Step 2: Score each source and build evidence records
    const evidenceMap = new Map<string, EvidenceSource>();

    for (const source of scopedSources) {
      const scoreResult = scoreSource({
        source_type: source.source_type,
        publisher: source.publisher,
        publication_date: null,
        has_author: false,
        url: source.url,
        key_claims_count: 3,
        is_quantitative: true,
      });

      const evidence: EvidenceSource = {
        id: `src_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        research_run_id: ctx.run_id,
        title: source.title,
        url: source.url,
        publisher: source.publisher,
        author: null,
        publication_date: null,
        retrieval_date: now,
        source_type: source.source_type,
        credibility: scoreResult.credibility,
        credibility_score: scoreResult.score,
        summary: source.description,
        key_claims: [],
        related_categories: inferSourceCategories(source.title, source.description),
        confidence_level: scoreResult.score / 100,
        citation_text: `${source.publisher}. "${source.title}". Retrieved ${now.slice(0, 10)} from ${source.url}`,
        copyright_note: 'Summary only — original content not reproduced',
        is_usable: scoreResult.recommendation !== 'reject' && scoreResult.url_safety.is_likely_usable,
        rejection_reason: scoreResult.recommendation === 'reject' ? scoreResult.url_safety.notes : null,
        created_at: now,
      };

      sources.push(evidence);
      if (evidence.is_usable) {
        run.sources_accepted++;
        evidenceMap.set(source.title, evidence);
      } else {
        run.sources_rejected++;
      }
    }

    // Step 3: Use LLM to summarize accepted sources (if AI available)
    if (ctx.llm.provider !== 'none') {
      for (const evidence of sources.filter((s) => s.is_usable)) {
        const source = scopedSources.find((s) => s.title === evidence.title);
        if (!source) continue;

        try {
          const { system, user } = buildSourceSummaryPrompt({
            source_title: evidence.title,
            source_publisher: evidence.publisher,
            source_url: evidence.url,
            source_text_excerpt: source.description,
            research_focus: source.expected_metrics.join(', '),
          });

          const llmResult = await callLLM(ctx.llm, system, user, 800);
          const parsed = parseLLMJson<SourceSummaryOutput>(llmResult.text, {
            summary: source.description,
            key_claims: [],
            benchmark_candidates: [],
            related_categories: [],
            is_quantitative: true,
            source_quality_notes: '',
            conflicts_with_known_standards: false,
            conflict_description: null,
          });

          evidence.summary = parsed.summary;
          evidence.key_claims = parsed.key_claims;
          evidence.related_categories = inferSourceCategories(
            evidence.title,
            parsed.summary,
          );
        } catch (err) {
          errors.push(`LLM summarization failed for "${evidence.title}": ${err instanceof Error ? err.message : 'unknown error'}`);
        }
      }
    }

    // Step 4: Generate benchmark comparison proposals
    // Group evidence by metric
    const acceptedSources = sources.filter((s) => s.is_usable);

    if (ctx.scope.includes('full') || ctx.scope.includes('launch_monitor_benchmarks')) {
      for (const [clubType, windows] of Object.entries(TARGET_WINDOWS)) {
        for (const [metricName] of Object.entries(windows)) {
          const relevantSources = acceptedSources.filter((s) =>
            s.related_categories.includes(metricName as never),
          );

          if (relevantSources.length === 0) continue;

          const currentWindow = (windows as Record<string, { min: number; ideal: number; max: number; unit: string }>)[metricName];
          if (!currentWindow) continue;

          const evidenceClaims = relevantSources.map((s) => ({
            claim: s.key_claims[0] ?? s.summary,
            source: s.publisher,
            confidence: s.confidence_level,
          }));

          let llmOutput: BenchmarkComparisonOutput = {
            should_update: false,
            proposed_lower: null,
            proposed_target: null,
            proposed_upper: null,
            confidence: 0,
            rationale: 'Insufficient evidence to recommend change',
            risk_level: 'high',
            conflicting_evidence: [],
            caveat: null,
          };

          if (ctx.llm.provider !== 'none' && evidenceClaims.length > 0) {
            try {
              const { system, user } = buildBenchmarkComparisonPrompt({
                metric: metricName,
                club_type: clubType,
                current_lower: currentWindow.min,
                current_target: currentWindow.ideal,
                current_upper: currentWindow.max,
                unit: currentWindow.unit,
                evidence_claims: evidenceClaims,
              });
              const result = await callLLM(ctx.llm, system, user, 400);
              llmOutput = parseLLMJson(result.text, llmOutput);
            } catch (err) {
              errors.push(`Comparison failed for ${metricName}/${clubType}: ${err instanceof Error ? err.message : 'error'}`);
            }
          }

          const proposal = buildProposal({
            research_run_id: ctx.run_id,
            existing_metric: null,  // would be fetched from DB in production
            metric_name: metricName,
            club_type: clubType as never,
            llm_output: llmOutput,
            evidence_sources: relevantSources,
            accepted_source_ids: relevantSources.map((s) => s.id),
          });

          if (proposal) proposals.push(proposal);
        }
      }
    }

    run.proposals_created = proposals.length;

    // Step 5: Generate run summary
    const topFindings = proposals.slice(0, 5).map(
      (p) => `${p.metric_name} (${p.club_type}): ${p.rationale.slice(0, 100)}`,
    );

    if (ctx.llm.provider !== 'none') {
      try {
        const { system, user } = buildRunSummaryPrompt({
          scope: ctx.scope,
          sources_reviewed: run.sources_reviewed,
          sources_accepted: run.sources_accepted,
          proposals_created: run.proposals_created,
          top_findings: topFindings,
        });
        const result = await callLLM(ctx.llm, system, user, 400);
        run.summary = result.text.slice(0, 1000);
      } catch (err) {
        run.summary = `Research completed. ${proposals.length} proposals generated from ${run.sources_accepted} accepted sources. Manual review required.`;
        errors.push(`Summary generation failed: ${err instanceof Error ? err.message : 'error'}`);
      }
    } else {
      run.summary =
        `Research workflow completed without AI. ` +
        `${run.sources_reviewed} sources evaluated, ${run.sources_accepted} accepted. ` +
        `${proposals.length} proposals staged for admin review. ` +
        `Configure AI_PROVIDER for automated summarization and benchmark comparison.`;
    }

    run.completed_at = new Date().toISOString();
    run.status = 'completed';
    run.errors = errors;
  } catch (err) {
    run.status = 'failed';
    run.completed_at = new Date().toISOString();
    run.errors = [...errors, err instanceof Error ? err.message : 'Unknown error'];
  }

  return { run, sources, proposals, errors };
}

// ──────────────────────────────────────────────────────────────
// Compute next scheduled run (90 days from now)
// ──────────────────────────────────────────────────────────────

export function computeNextScheduled(): string {
  const next = new Date();
  next.setDate(next.getDate() + 90);
  return next.toISOString();
}

// ──────────────────────────────────────────────────────────────
// Build LLM config from environment variables
// ──────────────────────────────────────────────────────────────

export function buildLLMConfig(): LLMConfig {
  const provider = process.env.AI_PROVIDER ?? 'none';
  if (provider === 'openai') {
    return {
      provider: 'openai',
      api_key: process.env.OPENAI_API_KEY ?? '',
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    };
  }
  if (provider === 'anthropic') {
    return {
      provider: 'anthropic',
      api_key: process.env.ANTHROPIC_API_KEY ?? '',
      model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
    };
  }
  return { provider: 'none', api_key: '', model: '' };
}
