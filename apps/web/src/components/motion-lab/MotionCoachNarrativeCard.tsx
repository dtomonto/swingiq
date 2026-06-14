'use client';

// ============================================================
// SwingVantage — Motion Lab: AI Coach Narrative Card
// ------------------------------------------------------------
// Renders the conversational coach explanation of a session. The
// deterministic narrative shows INSTANTLY (no keys needed); if the LLM
// enhancer is enabled (NEXT_PUBLIC_AGENTS_LLM=1) it rephrases the same
// grounded text in the background and swaps it in. Honest about source.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { buildMotionCoachNarrative, narrateMotionSession } from '@/lib/motion-lab';
import type { MotionSession, MotionCoachNarrative } from '@/lib/motion-lab';
import { Card, CardBody } from '@/components/ui/Card';

const SECTIONS: Array<{ key: keyof MotionCoachNarrative; label: string }> = [
  { key: 'mainFinding', label: 'Main finding' },
  { key: 'whyItMatters', label: 'Why it matters' },
  { key: 'evidence', label: 'Evidence from your video' },
  { key: 'whatItMayCause', label: 'What it may cause' },
  { key: 'whatToFeel', label: 'What to feel' },
  { key: 'cue', label: 'One cue' },
  { key: 'drill', label: 'One drill' },
  { key: 'nextUpload', label: 'Next upload' },
];

export function MotionCoachNarrativeCard({ session }: { session: MotionSession }) {
  // Deterministic build is instant and never throws — render it immediately.
  const base = useMemo(() => buildMotionCoachNarrative(session), [session]);
  // Only the optional LLM-enhanced result is stored, tagged with its session id
  // so a stale enhancement from a previous session never shows.
  const [llm, setLlm] = useState<{ id: string; narrative: MotionCoachNarrative } | null>(null);

  useEffect(() => {
    let active = true;
    // Optionally rephrase via the flagged LLM (no-op when disabled).
    narrateMotionSession(session).then((n) => {
      if (active && n.source === 'llm') setLlm({ id: session.id, narrative: n });
    });
    return () => {
      active = false;
    };
  }, [session]);

  const narrative = llm && llm.id === session.id ? llm.narrative : base;
  const enhanced = narrative.source === 'llm';

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Your coach&rsquo;s read</p>
          <span className="ml-auto inline-flex items-center gap-1 text-3xs text-muted-foreground">
            {enhanced ? (
              <><Sparkles className="w-3 h-3 text-primary" /> AI-enhanced phrasing</>
            ) : (
              'grounded summary'
            )}
          </span>
        </div>

        {enhanced ? (
          // LLM output is free-form text — render it as paragraphs.
          <div className="space-y-2 text-sm text-foreground leading-relaxed whitespace-pre-line">{narrative.fullText}</div>
        ) : (
          <dl className="space-y-2.5">
            {SECTIONS.map(({ key, label }) => (
              <div key={key}>
                <dt className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="text-sm text-foreground leading-relaxed">{narrative[key] as string}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="text-3xs text-muted-foreground/80 border-t border-border pt-2">{narrative.disclaimer}</p>
      </CardBody>
    </Card>
  );
}
