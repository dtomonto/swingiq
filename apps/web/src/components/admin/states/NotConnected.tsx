// NotConnected — the standard honest empty state for sections whose
// live data depends on an unconfigured integration (usually the
// Supabase service role). Never fakes data. Server-safe.

import Link from 'next/link';
import { PlugZap, ArrowRight } from 'lucide-react';

export interface NotConnectedProps {
  title?: string;
  detail: string;
  /** Env var names the operator would set (names only, never values). */
  envVars?: string[];
}

export function NotConnected({ title = 'Not connected', detail, envVars }: NotConnectedProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-link">
        <PlugZap className="h-6 w-6" />
      </span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{detail}</p>
      {envVars && envVars.length > 0 && (
        <div className="mx-auto mt-3 flex max-w-md flex-wrap justify-center gap-1.5">
          {envVars.map((v) => (
            <code
              key={v}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-2xs text-foreground"
            >
              {v}
            </code>
          ))}
        </div>
      )}
      <Link
        href="/admin/integrations"
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-link hover:underline"
      >
        Open Integrations <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
