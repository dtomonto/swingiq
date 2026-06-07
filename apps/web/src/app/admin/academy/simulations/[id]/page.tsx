'use client';

import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { getSimulation } from '@/lib/academy/simulations';
import { SimRunner } from '@/components/academy/SimRunner';

export default function SimulationPage() {
  const { id } = useParams<{ id: string }>();
  const sim = getSimulation(id);
  if (!sim) return notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/academy/simulations" className="text-sm text-primary hover:underline">← Simulation Lab</Link>
      <SimRunner sim={sim} />
    </div>
  );
}
