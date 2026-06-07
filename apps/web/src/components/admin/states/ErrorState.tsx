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
    <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-6 text-center">
      <AlertOctagon className="mx-auto h-8 w-8 text-red-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-100">{title}</h3>
      {detail && <p className="mx-auto mt-1 max-w-md text-sm text-gray-400">{detail}</p>}
      {children}
    </div>
  );
}
