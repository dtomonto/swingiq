// ============================================================
// GrowthOS — Record module page wrapper (server)
// ------------------------------------------------------------
// Renders a standard module page (header + generic RecordModule) from a
// nav key + definition id + records. Keeps each route file tiny and
// guarantees a consistent header/description sourced from the nav map.
// ============================================================

import type { ReactNode } from 'react';
import { GROWTH_NAV_FLAT } from '@/lib/growth/nav';
import { ModuleHeader } from './ui';
import { RecordModule } from './RecordModule';

export async function RecordModulePage({
  navKey,
  definitionId,
  records,
  intro,
}: {
  navKey: string;
  definitionId: string;
  // Accepts the repository promise directly so route files stay one-liners.
  records: Promise<ReadonlyArray<{ id: string }>> | ReadonlyArray<{ id: string }>;
  intro?: ReactNode;
}) {
  const nav = GROWTH_NAV_FLAT.find((n) => n.key === navKey);
  const data = await records;
  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={nav?.icon}
        title={nav?.label ?? definitionId}
        description={nav?.description ?? ''}
      />
      {intro}
      <RecordModule definitionId={definitionId} records={data} />
    </div>
  );
}
