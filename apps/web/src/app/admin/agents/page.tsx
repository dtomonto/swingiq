// ============================================================
// /admin/agents — AI Agent Registry
// ------------------------------------------------------------
// One honest inventory of every agent/automation in the product across
// families, with operational metadata and a deep-link to inspect each on
// its native surface. Read-only: this catalogs the real agents — it does
// not run or reconfigure them (use each agent's surface for that).
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Bot, ArrowUpRight, ShieldCheck, Cpu, Database, Workflow, Sparkles, Lightbulb,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { getSystemStatus } from '@/lib/admin/data/system';
import {
  groupAgentsByFamily, agentRegistryStats, type AgentRuntime, type RegisteredAgent,
} from '@/lib/admin/agent-registry';

export const metadata: Metadata = { title: 'AI Agent Registry | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const RUNTIME_BADGE: Record<AgentRuntime, { tone: BadgeTone; label: string }> = {
  deterministic: { tone: 'success', label: 'Keyless' },
  'deterministic+llm': { tone: 'info', label: 'Keyless + optional AI' },
  llm: { tone: 'accent', label: 'AI' },
};

export default function AdminAgentRegistryPage() {
  const system = getSystemStatus();
  const llmConnected = system.capabilities.aiCoach || system.capabilities.aiVision;
  const groups = groupAgentsByFamily();
  const stats = agentRegistryStats();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="AI Agent Registry"
        icon={Bot}
        description="Every agent and automation in SwingVantage, in one inventory: what each does, what it reads and produces, whether it runs keyless or with optional AI, how it's turned on/off, its safety guardrails, and where to inspect it. Read-only — this catalogs the agents; manage each on its own surface."
        actions={
          <StatusBadge tone={llmConnected ? 'success' : 'neutral'}>
            {llmConnected ? 'AI provider connected' : 'Keyless mode'}
          </StatusBadge>
        }
      />

      {/* Roll-up */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricStat label="Agents" icon={Bot} value={String(stats.total)} hint="across all families" />
        <MetricStat label="Keyless" icon={Database} value={String(stats.keyless)} hint="no AI spend" />
        <MetricStat label="AI-capable" icon={Cpu} value={String(stats.llmCapable)} hint="optional LLM" />
        <MetricStat label="With guardrails" icon={ShieldCheck} value={String(stats.withSafety)} hint="safety notes" />
        <MetricStat label="Families" icon={Workflow} value={String(groups.length)} hint="insight · growth · AI · safety" />
      </div>

      {groups.map((group) => (
        <SectionCard
          key={group.family.id}
          title={
            <span className="flex items-center gap-2">
              <FamilyIcon family={group.family.id} />
              {group.family.label}
              <span className="text-xs font-normal text-gray-500">({group.agents.length})</span>
            </span>
          }
          description={group.family.blurb}
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {group.agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} llmConnected={llmConnected} />
            ))}
          </div>
        </SectionCard>
      ))}

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A single, honest inventory of every
          deterministic workflow and AI-flavored tool in the product. It exists so you always know what is
          running, what data it touches, and where to go to inspect or change it — without hunting through
          the codebase.
        </p>
        <p>
          <strong className="text-gray-300">Keyless-first.</strong> Most agents are deterministic and run
          with no model calls (no AI spend). Agents marked <em>Keyless + optional AI</em> use a model only
          when a provider is configured and otherwise fall back to deterministic output. AI-generated
          content is always review-gated or clearly labeled.
        </p>
        <p>
          <strong className="text-gray-300">Safety.</strong> Guardrails (youth/medical safety, the trust
          linter) are always on and cannot be disabled. Outbound messaging is draft-first and never sends
          without review. User data is used ethically to improve the product and is <em>never sold</em>.
        </p>
      </HelpPanel>
    </div>
  );
}

function FamilyIcon({ family }: { family: string }) {
  const cls = 'h-4 w-4 text-amber-400';
  if (family === 'growth') return <Sparkles className={cls} />;
  if (family === 'content-ai') return <Cpu className={cls} />;
  if (family === 'safety') return <ShieldCheck className={cls} />;
  return <Lightbulb className={cls} />;
}

function AgentCard({ agent, llmConnected }: { agent: RegisteredAgent; llmConnected: boolean }) {
  const runtime = RUNTIME_BADGE[agent.runtime];
  const llmCapable = agent.runtime !== 'deterministic';
  return (
    <div className="flex flex-col rounded-xl border border-gray-800 bg-gray-950/40 p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-100">{agent.name}</h3>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <StatusBadge tone={runtime.tone}>{runtime.label}</StatusBadge>
          {llmCapable && (
            <StatusBadge tone={llmConnected ? 'success' : 'neutral'}>
              {llmConnected ? 'AI active' : 'Keyless now'}
            </StatusBadge>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-400">{agent.purpose}</p>

      <dl className="mt-3 space-y-1 text-xs text-gray-500">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-gray-600">Reads</dt>
          <dd className="text-gray-400">{agent.inputs.join(', ')}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-gray-600">Produces</dt>
          <dd className="text-gray-400">{agent.outputs.join(', ')}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-gray-600">Control</dt>
          <dd className="text-gray-400">{agent.control}</dd>
        </div>
      </dl>

      {agent.safety && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-emerald-500/5 px-2.5 py-1.5 text-[11px] text-emerald-300/90 ring-1 ring-emerald-500/20">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{agent.safety}</span>
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-800/70 pt-3">
        <code className="truncate text-[11px] text-gray-600" title={agent.module}>{agent.module}</code>
        <Link
          href={agent.surface.href}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-200 transition hover:border-amber-500/50 hover:text-amber-300"
        >
          Inspect: {agent.surface.label}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
