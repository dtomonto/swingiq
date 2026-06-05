'use client';

import { useMemo, useState } from 'react';
import { Sprout, Copy, CheckCircle } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAgentContext } from '@/hooks/useAgentContext';
import { buildParentSummary } from '@/lib/agents';

// Parent-facing companion to CoachSummaryCard. Reframes the latest
// finding as a simple, encouraging, safety-first plan a parent can
// guide at home — including a couple of "homework" drills. Surfaces
// only when there is real data to summarize.

export function ParentSummaryCard() {
  const { ready, ctx } = useAgentContext();
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => (ctx ? buildParentSummary(ctx) : null), [ctx]);

  if (!ready || !ctx || !ctx.latestSession || !summary) return null;

  const asText = [
    'SwingVantage — For the Parent',
    '',
    summary.parentSummary,
    '',
    `This week's focus: ${summary.focusThisWeek}`,
    '',
    'Drills to try at home:',
    ...summary.homeworkDrills.map((d) => `  - ${d}`),
    '',
    summary.encouragement,
    '',
    `Safety: ${summary.safetyNote}`,
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
    <Card className="border-success/30 bg-success/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprout size={18} className="text-success" />
          <CardTitle className="text-foreground">For the parent</CardTitle>
        </div>
        <Button
          size="sm"
          className="bg-success text-success-foreground hover:bg-success/90"
          onClick={handleCopy}
        >
          {copied ? (<><CheckCircle size={14} /> Copied!</>) : (<><Copy size={14} /> Copy</>)}
        </Button>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-foreground leading-relaxed">{summary.parentSummary}</p>

        <div className="rounded-lg bg-success/10 border border-success/25 px-3 py-2">
          <p className="text-xs font-semibold text-success uppercase tracking-wide">This week&apos;s focus</p>
          <p className="text-sm text-foreground capitalize">{summary.focusThisWeek}</p>
        </div>

        {summary.homeworkDrills.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Drills to try at home
            </p>
            <ul className="space-y-1">
              {summary.homeworkDrills.map((d, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-success">•</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-foreground leading-relaxed">{summary.encouragement}</p>

        <p className="text-xs text-muted-foreground leading-relaxed">{summary.safetyNote}</p>
      </CardBody>
    </Card>
  );
}
