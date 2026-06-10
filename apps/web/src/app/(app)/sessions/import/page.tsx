'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2, Layers } from 'lucide-react';
import { ImportWizard } from './ImportWizard';
import { BulkImport } from './BulkImport';
import { useSport } from '@/contexts/SportContext';
import { cn } from '@/lib/utils';

type Mode = 'guided' | 'bulk';

export default function ImportPage() {
  const { isGolf } = useSport();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('guided');

  useEffect(() => {
    if (!isGolf) {
      router.replace('/sessions/log');
    }
  }, [isGolf, router]);

  if (!isGolf) return null;

  return (
    <div className="pt-6">
      {/* Mode switch: one guided session, or a whole history at once. */}
      <div className="mx-auto max-w-4xl px-6">
        <div className="inline-flex rounded-lg border border-border bg-card p-1" role="tablist" aria-label="Import mode">
          {([
            { id: 'guided', label: 'Guided (one file)', icon: Wand2 },
            { id: 'bulk', label: 'Bulk (many files)', icon: Layers },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                mode === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'guided' ? <ImportWizard /> : <BulkImport />}
    </div>
  );
}
