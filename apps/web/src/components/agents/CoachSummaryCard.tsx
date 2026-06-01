'use client';

import { useMemo, useState } from 'react';
import { MessageSquareQuote, Copy, CheckCircle } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAgentContext } from '@/hooks/useAgentContext';
import { buildCoachShareSummary } from '@/lib/agents';

// Surfaces the Coach Sharing workflow: a plain-English narrative plus the
// most useful thing — good questions to bring to a human coach. Complements
// the raw data report already on the page.

export function CoachSummaryCard() {
  const { ready, ctx } = useAgentContext();
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => (ctx ? buildCoachShareSummary(ctx) : null), [ctx]);

  if (!ready || !ctx || !ctx.latestSession || !summary) return null;

  const asText = [
    'SwingIQ — Coach Prep',
    '',
    summary.coachSummary,
    '',
    'Key evidence:',
    ...summary.keyEvidence.map((e) => `  - ${e}`),
    '',
    `Recent trend: ${summary.recentTrend}`,
    `Next practice focus: ${summary.nextPracticeFocus}`,
    '',
    'Questions for my coach:',
    ...summary.suggestedCoachQuestions.map((q) => `  - ${q}`),
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(asText);
    } catch {
      const el = document.createElement('textarea');
      el.value = asText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Card className="border-warning/30 bg-warning/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareQuote size={18} className="text-warning" />
          <CardTitle className="text-foreground">Prep for your coach</CardTitle>
        </div>
        <Button
          size="sm"
          className="bg-warning text-warning-foreground hover:bg-warning/90"
          onClick={handleCopy}
        >
          {copied ? (<><CheckCircle size={14} /> Copied!</>) : (<><Copy size={14} /> Copy</>)}
        </Button>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-foreground leading-relaxed">{summary.coachSummary}</p>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Questions to ask your coach
          </p>
          <ul className="space-y-1">
            {summary.suggestedCoachQuestions.map((q, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-warning">?</span>
                {q}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          SwingIQ helps you prepare — it doesn&apos;t replace a qualified coach.
        </p>
      </CardBody>
    </Card>
  );
}
