// ============================================================
// Claude Handoff — per-source normalizers (isomorphic, pure)
// ------------------------------------------------------------
// Each admin surface speaks its own shape; these collapse them into the one
// ClaudeFixInput the prompt builder understands. Type-only imports keep this
// safe to use on the server, the client or in tests.
// ============================================================

import type { LinkFinding } from '@/lib/growth/types';
import type { SecurityFinding } from '@/lib/security-os/types';
import type { ClaudeFixInput, ClaudeFixField } from './types';

/** Minimal structural shape of a Command Center alert (avoids importing the
 *  full AdminAlert + its severity union here). */
interface AlertLike {
  title: string;
  detail?: string;
  severity?: string;
  href?: string;
  cta?: string;
}

/** Minimal structural shape of a Decision Center row. */
interface DecisionLike {
  title: string;
  type: string;
  read?: string;
  severity?: string;
  count?: number;
  meta?: string[];
  href?: string;
}

const LINK_FINDING_LABEL: Record<string, string> = {
  orphan: 'Orphan page (no inbound internal links)',
  'broken-internal': 'Broken internal link',
  'over-linked': 'Over-linked page',
  'deep-page': 'Page buried too deep in the crawl',
  'weak-inlinks': 'Too few inbound internal links',
  'anchor-over-optimized': 'Over-optimized anchor text',
  cannibalization: 'Keyword cannibalization between pages',
};

export function fromAlert(alert: AlertLike, source = 'Command Center'): ClaudeFixInput {
  return {
    title: alert.title,
    source,
    severity: alert.severity,
    problem: alert.detail,
    href: alert.href,
  };
}

export function fromDecision(d: DecisionLike): ClaudeFixInput {
  const fields: ClaudeFixField[] = [];
  if (typeof d.count === 'number') fields.push({ label: 'Underlying items', value: String(d.count) });
  return {
    title: d.title,
    source: `Decision Center · ${d.type}`,
    severity: d.severity,
    problem: d.read,
    fields,
    href: d.href,
  };
}

export function fromLinkFinding(f: LinkFinding): ClaudeFixInput {
  const fields: ClaudeFixField[] = [];
  if (f.pageUrl) fields.push({ label: 'Page', value: f.pageUrl });
  if (f.sport) fields.push({ label: 'Sport', value: f.sport });
  if (f.metric != null) fields.push({ label: 'Metric', value: String(f.metric) });
  if (f.status) fields.push({ label: 'Status', value: f.status });
  return {
    title: LINK_FINDING_LABEL[f.findingType] ?? f.findingType,
    source: 'Link Intelligence · link audit',
    severity: f.severity,
    problem: f.detail,
    recommendation: f.recommendedAction,
    affected: f.pageUrl ? [f.pageUrl] : undefined,
    fields,
    href: '/admin/growth/internal-links',
  };
}

export function fromSecurityFinding(f: SecurityFinding): ClaudeFixInput {
  const fields: ClaudeFixField[] = [];
  if (f.affectedArea) fields.push({ label: 'Affected area', value: f.affectedArea });
  if (f.riskDomain) fields.push({ label: 'Risk domain', value: String(f.riskDomain) });
  if (typeof f.riskScore === 'number') fields.push({ label: 'Risk score', value: `${f.riskScore}/100` });
  if (f.businessImpact) fields.push({ label: 'Business impact', value: f.businessImpact });
  if (f.technicalImpact) fields.push({ label: 'Technical impact', value: f.technicalImpact });
  if (typeof f.canClaudeFix === 'boolean') {
    fields.push({ label: 'Claude can fix directly', value: f.canClaudeFix ? 'yes' : 'needs human/credentials' });
  }
  return {
    title: f.title,
    source: 'Security OS · finding',
    severity: f.severity,
    problem: f.description,
    recommendation: f.recommendedFix,
    affected: f.evidence && f.evidence.length > 0 ? f.evidence : undefined,
    steps: f.stepByStepActions,
    fields,
    href: `/admin/security-os/findings/${encodeURIComponent(f.id)}`,
  };
}

/**
 * Generic normalizer for a GrowthOS RecordModule row. The detail fields are
 * already declared per-module (label + plain-text value); we map the
 * well-known keys (detail / recommendation / severity) onto the structured
 * slots and keep the rest as context lines.
 */
export function fromRecordFields(opts: {
  title: string;
  source: string;
  fields: ClaudeFixField[];
  href?: string;
}): ClaudeFixInput {
  const pick = (names: string[]): string | undefined => {
    const hit = opts.fields.find((f) => names.includes(f.label.toLowerCase().trim()));
    return hit?.value?.trim() || undefined;
  };
  const problem = pick(['detail', 'description', 'finding', 'issue', 'summary', 'context']);
  const recommendation = pick(['recommended action', 'recommendation', 'recommended fix', 'fix', 'action']);
  const severity = pick(['severity', 'priority']);
  const used = new Set(
    [problem, recommendation, severity].filter(Boolean).map((v) => v as string),
  );
  const rest = opts.fields.filter((f) => !used.has(f.value?.trim()));
  return {
    title: opts.title,
    source: opts.source,
    severity,
    problem,
    recommendation,
    fields: rest,
    href: opts.href,
  };
}
