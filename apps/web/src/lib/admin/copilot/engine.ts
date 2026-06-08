// ============================================================
// SwingVantage Admin — Copilot: deterministic answer engine (pure)
// ------------------------------------------------------------
// Turns a privacy-safe snapshot + a question into a grounded answer.
// Every number/claim is COMPUTED from the snapshot — nothing is
// invented, and when the data needed to answer well is missing the
// engine says so honestly (caveat) and points to the right tool.
//
// Pure + dependency-free → unit testable and keyless (no model calls,
// no AI spend). An optional model adapter (ai-seam.ts) can layer
// free-form answers on top; this engine is the always-on default.
// ============================================================

import type { CopilotAnswer, CopilotSnapshot, CopilotSource } from './types';
import { COPILOT_INTENTS, resolveIntent, type CopilotIntent } from './questions';

const SPORT_LABELS: Record<string, string> = {
  golf: 'Golf', tennis: 'Tennis', pickleball: 'Pickleball', padel: 'Padel',
  baseball: 'Baseball', softball_slow: 'Slow-pitch softball', softball_fast: 'Fast-pitch softball',
};
const sportLabel = (s: string) => SPORT_LABELS[s] ?? s;

// Core admin routes the engine links to are all stable, always-built
// sections (verified against the route tree), so actions are `built: true`.
const act = (label: string, href: string) => ({ label, href, built: true });
const src = (label: string, href?: string): CopilotSource => ({ label, href });

const SEVERITY_RANK: Record<string, number> = { critical: 0, warning: 1, info: 2, success: 3 };

function n(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

/** The honest "we read but never act" footer shared by every answer. */
function base(intent: CopilotIntent, partial: Omit<CopilotAnswer, 'intent' | 'generatedBy' | 'needsApproval'>): CopilotAnswer {
  return { intent, generatedBy: 'computed', needsApproval: false, ...partial };
}

// ── Per-intent builders ───────────────────────────────────────

function systemOverview(s: CopilotSnapshot): CopilotAnswer {
  const top = s.sportUsage[0];
  if (!s.connected) {
    return base('system-overview', {
      title: 'Platform overview',
      summary:
        'Live cross-user numbers are off right now, so I can only show you what is configured — not real totals. Connect the Supabase service role to unlock accounts, sessions and analyses counts.',
      bullets: [
        `${s.integrations.filter((i) => i.connected).length}/${s.integrations.length} integrations connected`,
        `${s.sections.built}/${s.sections.total} admin sections built`,
        `${s.featureEducation.features} shipped features tracked for learning content`,
      ],
      sources: [src('System health', '/admin/system-health'), src('Setup', '/admin/setup')],
      actions: [act('Connect live data', '/admin/integrations'), act('Open Command Center', '/admin')],
      confidence: 'low',
      caveat: s.connectReason ?? 'Service-role data source not connected.',
    });
  }
  return base('system-overview', {
    title: 'Platform overview',
    summary: `You have ${n(s.counts.authUsers)}${s.authUsersCapped ? '+' : ''} accounts, ${n(
      s.counts.sessions,
    )} practice sessions logged and ${n(s.counts.analyses)} swing analyses across all sports.${
      top ? ` ${sportLabel(top.sport)} is the most active sport.` : ''
    }`,
    bullets: [
      `Accounts: ${n(s.counts.authUsers)}${s.authUsersCapped ? '+ (page-capped floor)' : ''}`,
      `Golf profiles: ${n(s.counts.golfProfiles)} · other sport profiles: ${n(s.counts.sportProfiles)}`,
      `Sessions: ${n(s.counts.sessions)} · swing analyses: ${n(s.counts.analyses)}`,
      `${s.integrations.filter((i) => i.connected).length}/${s.integrations.length} integrations connected`,
    ],
    sources: [src('Command Center metrics', '/admin'), src('System health', '/admin/system-health')],
    actions: [act('Open Command Center', '/admin'), act('See analytics', '/admin/analytics')],
    confidence: 'high',
  });
}

function nextBestAction(s: CopilotSnapshot): CopilotAnswer {
  // Rank every signal by severity; alerts and inbox items share one queue.
  const ranked = [
    ...s.alerts
      .filter((a) => a.severity !== 'success')
      .map((a) => ({ severity: a.severity, title: a.title, detail: a.detail, href: a.href, count: 1 })),
    ...s.actions.map((a) => ({ severity: a.severity, title: a.title, detail: a.detail, href: a.href, count: a.count })),
  ].sort((a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) || b.count - a.count);

  if (ranked.length === 0) {
    const top = s.sportUsage[0];
    return base('next-best-action', {
      title: 'Your next best action',
      summary:
        'Nothing is on fire — no open alerts or review items. The highest-leverage move now is offensive: deepen what already works and close content gaps.',
      bullets: [
        top ? `Double down on ${sportLabel(top.sport)} — your most active sport.` : 'Drive first sessions in your priority sports.',
        s.featureEducation.gaps > 0
          ? `Close ${s.featureEducation.gaps} feature learning gap(s) to lift activation.`
          : 'Pick a growth experiment in GrowthOS.',
      ],
      sources: [src('Derived alerts', '/admin'), src('Action Center', '/admin/approvals')],
      actions: [act('Tune sport content', '/admin/sports'), act('Plan growth', '/admin/growth')],
      confidence: 'medium',
    });
  }

  const topItem = ranked[0];
  return base('next-best-action', {
    title: 'Your next best action',
    summary: `Start here: ${topItem.title}.${topItem.detail ? ` ${topItem.detail}` : ''}`,
    bullets: ranked.slice(0, 4).map((r) => `${r.severity.toUpperCase()} — ${r.title}`),
    sources: [src('Derived alerts', '/admin'), src('Action Center', '/admin/approvals')],
    actions: [
      topItem.href ? act('Handle it', topItem.href) : act('Open Action Center', '/admin/approvals'),
      act('See all items', '/admin/approvals'),
    ],
    confidence: ranked.some((r) => r.severity === 'critical') ? 'high' : 'medium',
  });
}

function fastestSport(s: CopilotSnapshot): CopilotAnswer {
  if (s.sportUsage.length === 0) {
    return base('fastest-sport', {
      title: 'Most active sport',
      summary: s.connected
        ? 'No practice sessions are logged yet, so there is no sport activity to rank. This populates as athletes log practice.'
        : 'I cannot rank sports until the live data source is connected.',
      bullets: [],
      sources: [src('Command Center metrics', '/admin')],
      actions: s.connected ? [act('Tune sports', '/admin/sports')] : [act('Connect live data', '/admin/integrations')],
      confidence: 'low',
      caveat: s.connected ? 'No session data yet.' : s.connectReason ?? 'Live data source not connected.',
    });
  }
  const total = s.sportUsage.reduce((sum, x) => sum + x.sessions, 0) || 1;
  const top = s.sportUsage[0];
  const share = Math.round((top.sessions / total) * 100);
  return base('fastest-sport', {
    title: 'Most active sport',
    summary: `${sportLabel(top.sport)} leads with ${n(top.sessions)} logged session(s) — about ${share}% of all practice activity.`,
    bullets: s.sportUsage.slice(0, 5).map((x) => `${sportLabel(x.sport)}: ${n(x.sessions)} session(s)`),
    sources: [src('Session counts', '/admin')],
    actions: [act('Tune sport content', '/admin/sports'), act('See trends in Analytics', '/admin/analytics')],
    confidence: 'high',
    caveat:
      'Ranked by total logged sessions, not week-over-week growth. For trend over time, use Analytics OS.',
  });
}

function urgentTasks(s: CopilotSnapshot): CopilotAnswer {
  const items = [...s.actions].sort(
    (a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) || b.count - a.count,
  );
  const total = items.reduce((sum, i) => sum + Math.max(0, i.count), 0);
  if (items.length === 0) {
    return base('urgent-tasks', {
      title: 'Urgent admin tasks',
      summary: 'Your Action Center inbox is clear — nothing needs your review right now.',
      bullets: [],
      sources: [src('Action Center', '/admin/approvals')],
      actions: [act('Open Action Center', '/admin/approvals')],
      confidence: 'high',
    });
  }
  return base('urgent-tasks', {
    title: 'Urgent admin tasks',
    summary: `${total} item(s) across ${items.length} source(s) need your review. Most severe first:`,
    bullets: items.slice(0, 6).map((i) => `${i.count}× ${i.title} (${i.sourceLabel})`),
    sources: [src('Action Center', '/admin/approvals')],
    actions: [act('Open Action Center', '/admin/approvals')],
    confidence: items.some((i) => i.severity === 'critical') ? 'high' : 'medium',
  });
}

function aiReviewQueue(s: CopilotSnapshot): CopilotAnswer {
  const fe = s.featureEducation;
  const hasDrafts = fe.needsReview > 0;
  return base('ai-review-queue', {
    title: 'AI outputs to review',
    summary: hasDrafts
      ? `${fe.needsReview} AI-drafted learning item(s) await review before they can go live. Swing-analysis outputs are reviewed separately in AI Analyses.`
      : 'No AI-drafted learning items are waiting. Review live swing-analysis quality in AI Analyses, where confidence and quality queues surface as users analyze swings.',
    bullets: [
      `Feature-education drafts awaiting review: ${fe.needsReview}`,
      `Coverage gaps that may need new AI content: ${fe.gaps}`,
      `Swing analyses recorded: ${n(s.counts.analyses)}`,
    ],
    sources: [src('AI Analyses', '/admin/ai-analyses'), src('Feature Education', '/admin/feature-education')],
    actions: [act('Review AI analyses', '/admin/ai-analyses'), act('Review learning drafts', '/admin/feature-education')],
    confidence: hasDrafts ? 'high' : 'medium',
    caveat: hasDrafts ? undefined : 'Per-analysis quality scoring depends on AI vision being connected.',
  });
}

function recentErrors(s: CopilotSnapshot): CopilotAnswer {
  const down = s.integrations.filter((i) => !i.connected);
  if (down.length === 0) {
    return base('recent-errors', {
      title: 'Errors & outages',
      summary: `All ${s.integrations.length} integrations are connected and no incidents are surfaced. I report configuration and health signals, not raw exception logs — those live in System Health and Audit Reports.`,
      bullets: [],
      sources: [src('System health', '/admin/system-health'), src('Audit Reports', '/admin/audits')],
      actions: [act('Open system health', '/admin/system-health'), act('Open audit reports', '/admin/audits')],
      confidence: 'high',
    });
  }
  return base('recent-errors', {
    title: 'Errors & outages',
    summary: `${down.length} integration(s) are not connected, which can degrade features. I surface health/config signals — for raw exceptions and build health, open System Health and Audit Reports.`,
    bullets: down.map((i) => `${i.name}: not connected`),
    sources: [src('System health', '/admin/system-health'), src('Audit Reports', '/admin/audits')],
    actions: [act('Open system health', '/admin/system-health'), act('Open integrations', '/admin/integrations')],
    confidence: 'medium',
    caveat: 'These are configuration/health signals, not a runtime error log.',
  });
}

function pagesToOptimize(s: CopilotSnapshot): CopilotAnswer {
  return base('pages-to-optimize', {
    title: 'Pages to optimize',
    summary:
      'I can point you at where the page-quality signals live. Top-page traffic and engagement come from Analytics OS; on-page SEO/AEO opportunities and duplicate/cannibalization warnings come from SEO and the Audit Reports.',
    bullets: [
      'Analytics OS → top pages by traffic and engagement.',
      'SEO / AEO / GEO → metadata, schema and intent coverage.',
      'Audit Reports → SEO audit findings, ranked.',
      s.featureEducation.gaps > 0 ? `${s.featureEducation.gaps} feature page(s) lack learning content.` : 'Feature learning coverage looks complete.',
    ],
    sources: [src('SEO', '/admin/seo'), src('Analytics OS', '/admin/analytics'), src('Audit Reports', '/admin/audits')],
    actions: [act('Open SEO', '/admin/seo'), act('Open audit reports', '/admin/audits'), act('See top pages', '/admin/analytics')],
    confidence: 'medium',
    caveat: 'Exact page ranking needs the Analytics OS read key; I surface where to look, not a live ranking.',
  });
}

function contentGaps(s: CopilotSnapshot): CopilotAnswer {
  const fe = s.featureEducation;
  return base('content-gaps', {
    title: 'Content gaps',
    summary:
      fe.gaps > 0 || fe.drift > 0
        ? `${fe.gaps} shipped feature(s) still need learning content and there are ${fe.drift} drift finding(s) where docs may be stale. New features are auto-detected as you ship.`
        : 'No open feature-education gaps — every tracked feature has learning content. For SEO/topic gaps, use GrowthOS and the SEO section.',
    bullets: [
      `Features needing learning content: ${fe.gaps}`,
      `Drift findings (possibly stale docs): ${fe.drift}`,
      `Drafts awaiting review: ${fe.needsReview}`,
    ],
    sources: [src('Feature Education', '/admin/feature-education'), src('SEO', '/admin/seo')],
    actions: [act('Open Feature Education', '/admin/feature-education'), act('Open SEO', '/admin/seo'), act('Open content', '/admin/content')],
    confidence: fe.gaps > 0 || fe.drift > 0 ? 'high' : 'medium',
  });
}

function usersStuck(_s: CopilotSnapshot): CopilotAnswer {
  return base('users-stuck', {
    title: 'Users stuck or dropping off',
    summary:
      'For privacy, I work from aggregates and never expose individual users here. Funnel drop-off (signup → profile → upload → analysis) lives in Analytics OS, and profile/upload completion trends live in Central Intelligence. Use Users for one-to-one support context.',
    bullets: [
      'Analytics OS → activation & retention funnels, drop-off points.',
      'Central Intelligence → profile-completion and upload-completion trends.',
      'Users → per-account journey for support (gated by permission).',
    ],
    sources: [src('Analytics OS', '/admin/analytics'), src('Central Intelligence', '/admin/central-intelligence')],
    actions: [act('Open analytics funnels', '/admin/analytics'), act('Open Central Intelligence', '/admin/central-intelligence'), act('Open Users', '/admin/users')],
    confidence: 'medium',
    caveat: 'The Copilot intentionally does not surface individual users — open the funnel tools for cohort-level drop-off.',
  });
}

function growthPriority(s: CopilotSnapshot): CopilotAnswer {
  const top = s.sportUsage[0];
  const bullets: string[] = [];
  if (top) bullets.push(`Double down on ${sportLabel(top.sport)} (most active) with targeted content + SEO.`);
  if (s.featureEducation.gaps > 0) bullets.push(`Close ${s.featureEducation.gaps} feature learning gap(s) to lift activation.`);
  if (!s.capabilities.email) bullets.push('Connect transactional email to unlock lifecycle re-engagement.');
  if (!s.capabilities.ads) bullets.push('Ads are house-only — fine for a clean free experience per the GTM plan.');
  if (bullets.length === 0) bullets.push('Pick one growth experiment in GrowthOS and instrument it in Analytics OS.');
  return base('growth-priority', {
    title: 'Growth priority this week',
    summary:
      'Per the go-to-market plan, the goal is free-user growth first. The highest-leverage moves I can see from your data:',
    bullets,
    sources: [src('GrowthOS', '/admin/growth'), src('Session counts', '/admin'), src('Feature Education', '/admin/feature-education')],
    actions: [act('Open GrowthOS', '/admin/growth'), act('Open SEO', '/admin/seo'), act('Instrument in Analytics', '/admin/analytics')],
    confidence: 'medium',
  });
}

function centralIntelligence(_s: CopilotSnapshot): CopilotAnswer {
  return base('central-intelligence', {
    title: 'What Central Intelligence is learning',
    summary:
      'Central Intelligence is the ethical, aggregate product-improvement brain: it learns from anonymized usage patterns — common problems, goals and sport issues — to improve recommendations. It is product-improvement intelligence, never user surveillance, and user data is never sold. The live, panel-by-panel view lives in its console.',
    bullets: [
      'Most common user problems, goals and sport issues (aggregated).',
      'Feature-usage trends, drop-off points and content gaps.',
      'Privacy/anonymization controls and the data-governance review queue.',
    ],
    sources: [src('Central Intelligence', '/admin/central-intelligence'), src('Coach Mix', '/admin/coach-mix')],
    actions: [act('Open Central Intelligence', '/admin/central-intelligence'), act('Open Coach Mix', '/admin/coach-mix')],
    confidence: 'medium',
    caveat: 'The detailed, live "what it learned" panels live in the Central Intelligence console.',
  });
}

function featuresInDevelopment(s: CopilotSnapshot): CopilotAnswer {
  return base('features-in-development', {
    title: 'Features in development',
    summary: `The Development Roadmap shows what is live, in development and planned in plain product language. ${s.sections.built}/${s.sections.total} admin sections are built; ${s.featureEducation.features} shipped features are tracked for learning content.`,
    bullets: [
      `Admin sections built: ${s.sections.built}/${s.sections.total}`,
      s.sections.soon.length > 0 ? `Coming soon: ${s.sections.soon.slice(0, 5).join(', ')}` : 'No admin sections are pending.',
      `Shipped features tracked: ${s.featureEducation.features}`,
    ],
    sources: [src('Development Roadmap', '/admin/development'), src('Feature Education', '/admin/feature-education')],
    actions: [act('Open roadmap', '/admin/development'), act('Open Feature Education', '/admin/feature-education')],
    confidence: 'high',
  });
}

function help(): CopilotAnswer {
  return base('help', {
    title: 'I can help with',
    summary:
      'Ask me about the platform and I will answer from your live admin data — no guessing. I only read; I never publish, email or delete. Try one of these:',
    bullets: COPILOT_INTENTS.filter((i) => i.id !== 'help').map((i) => i.question),
    sources: [src('Command Center', '/admin')],
    actions: [act('Open Command Center', '/admin')],
    confidence: 'high',
  });
}

const BUILDERS: Record<CopilotIntent, (s: CopilotSnapshot) => CopilotAnswer> = {
  'system-overview': systemOverview,
  'next-best-action': nextBestAction,
  'fastest-sport': fastestSport,
  'urgent-tasks': urgentTasks,
  'ai-review-queue': aiReviewQueue,
  'recent-errors': recentErrors,
  'pages-to-optimize': pagesToOptimize,
  'content-gaps': contentGaps,
  'users-stuck': usersStuck,
  'growth-priority': growthPriority,
  'central-intelligence': centralIntelligence,
  'features-in-development': featuresInDevelopment,
  help: () => help(),
};

/**
 * Answer a free-text founder question deterministically from the snapshot.
 * Resolves the intent, then builds a grounded answer. Never throws.
 */
export function answerCopilotQuestion(snapshot: CopilotSnapshot, query: string): CopilotAnswer {
  const intent = resolveIntent(query);
  const builder = BUILDERS[intent] ?? BUILDERS.help;
  return builder(snapshot);
}

/** Answer a known intent directly (used by the suggested-question chips). */
export function answerCopilotIntent(snapshot: CopilotSnapshot, intent: CopilotIntent): CopilotAnswer {
  const builder = BUILDERS[intent] ?? BUILDERS.help;
  return builder(snapshot);
}
