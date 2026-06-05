'use client';

import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
import { FoundationsBoard } from '@/components/foundations';

export default function LabsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <FlaskConical size={20} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">SwingVantage Labs</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          The foundations we&apos;re building the future on — your readiness scores, a private
          player model, cross-sport skill transfer, your performance graph, and benchmark
          mirrors. Some are early v1s; each is honest about what it does and doesn&apos;t know.
        </p>
      </div>

      <FoundationsBoard />

      <p className="text-xs text-muted-foreground text-center">
        These build on your{' '}
        <Link href="/arc" className="text-primary hover:underline">Player Arc</Link> and{' '}
        <Link href="/fix" className="text-primary hover:underline">Fix Stack</Link>. The more you
        practise and retest, the sharper they get.
      </p>
    </div>
  );
}
