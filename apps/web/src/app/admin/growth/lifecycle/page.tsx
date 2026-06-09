import type { Metadata } from 'next';
import { Route, ArrowRight, Sparkles } from 'lucide-react';
import { ModuleHeader, MockDataNote } from '../_components/ui';
import { GROWTH_NAV_FLAT } from '@/lib/growth/nav';
import { lifecycleStagesRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Lifecycle Journeys | GrowthOS', robots: 'noindex, nofollow' };

export default async function LifecyclePage() {
  const nav = GROWTH_NAV_FLAT.find((n) => n.key === 'lifecycle');
  const stages = await lifecycleStagesRepo.list();

  return (
    <div className="space-y-6">
      <ModuleHeader icon={nav?.icon} title={nav?.label ?? 'Lifecycle Journeys'} description={nav?.description ?? ''} />

      <div className="rounded-lg bg-gray-900 border border-gray-800 p-3 text-xs text-gray-400">
        The user journey from anonymous visitor to advocate. Each stage pairs the user&apos;s mindset with a business objective,
        a recommended message + channel, and an AI next-best-action. These are <strong className="text-gray-300">templates</strong> — wire the
        triggers in Email / CRM once a provider is connected.
      </div>

      <div className="space-y-3">
        {stages.map((s, i) => (
          <div key={s.id} className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-800/40">
              <div className="rounded-lg bg-green-400/10 border border-green-400/20 w-7 h-7 flex items-center justify-center shrink-0">
                <Route className="w-3.5 h-3.5 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-200">{s.name}</p>
                <p className="text-xs text-gray-500 truncate">{s.userDefinition}</p>
              </div>
              <span className="ml-auto text-[10px] text-gray-600 shrink-0">Stage {i + 1} / {stages.length}</span>
            </div>
            <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <Field label="User mindset" value={s.userMindset} />
              <Field label="Primary need" value={s.primaryNeed} />
              <Field label="Business objective" value={s.businessObjective} />
              <Field label="Recommended message" value={s.recommendedMessage} />
              <Field label="Recommended channel" value={s.recommendedChannel} />
              <Field label="Recommended CTA" value={s.recommendedCta} />
              <Field label="Automation idea" value={s.automationIdea} />
              <Field label="Success metric" value={s.successMetric} />
              <div>
                <div className="flex items-center gap-1 text-green-400/80 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wide font-semibold">AI next best action</span>
                </div>
                <p className="text-gray-300">{s.aiNextBestAction}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-gray-600">
        Anonymous <ArrowRight className="w-3 h-3" /> New user <ArrowRight className="w-3 h-3" /> Activated
        <ArrowRight className="w-3 h-3" /> Engaged <ArrowRight className="w-3 h-3" /> Advocate
      </div>

      <MockDataNote />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-600 mb-1">{label}</p>
      <p className="text-gray-300">{value}</p>
    </div>
  );
}
