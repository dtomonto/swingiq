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

export function RecordModulePage({
  navKey,
  definitionId,
  records,
  intro,
}: {
  navKey: string;
  definitionId: string;
  records: ReadonlyArray<{ id: string }>;
  intro?: ReactNode;
}) {
  const nav = GROWTH_NAV_FLAT.find((n) => n.key === navKey);
  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={nav?.icon}
        title={nav?.label ?? definitionId}
        description={nav?.description ?? ''}
      />
      {intro}
      <RecordModule definitionId={definitionId} records={records} />
    </div>
  );
}
