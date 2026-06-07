'use client';

// RecheckButton — re-runs the server component (re-reads env / capability
// state). An honest "test connection": it refreshes what the server sees.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function RecheckButton({ label = 'Re-check' }: { label?: string }) {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);
  return (
    <button
      onClick={() => {
        setSpinning(true);
        router.refresh();
        setTimeout(() => setSpinning(false), 700);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${spinning ? 'animate-spin' : ''}`} />
      {label}
    </button>
  );
}
