// ErrorState — standard error panel for admin sections. Server-safe.

import { AlertOctagon } from 'lucide-react';
import type { ReactNode } from 'react';

export function ErrorState({
  title = 'Something went wrong',
  detail,
  children,
}: {
  title?: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-error/30 bg-error/[0.06] p-6 text-center">
      <AlertOctagon className="mx-auto h-8 w-8 text-error-text" />
      <h3 className="mt-2 text-sm font-semibold text-foreground">{title}</h3>
      {detail && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{detail}</p>}
      {children}
    </div>
  );
}
