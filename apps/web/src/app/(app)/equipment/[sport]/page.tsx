import { notFound } from 'next/navigation';
import { EquipmentDispatcher } from './EquipmentDispatcher';

// Unified equipment routing (audit finding IA-5): one dynamic [sport] segment
// instead of hardcoded per-sport folders, mirroring /benchmarks/[sport].
const SPORTS = ['golf', 'tennis', 'baseball', 'softball-slow', 'softball-fast'] as const;
type EquipmentSport = (typeof SPORTS)[number];

export function generateStaticParams() {
  return SPORTS.map((sport) => ({ sport }));
}

export default async function EquipmentSportPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  if (!SPORTS.includes(sport as EquipmentSport)) notFound();
  return <EquipmentDispatcher sport={sport} />;
}
