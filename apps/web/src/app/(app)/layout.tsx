import { AppShell } from '@/components/layout/AppShell';
import { FloatingDock } from '@/components/layout/FloatingDock';
import { FloatingCoach } from '@/components/ui/FloatingCoach';
import { UsageCategoryModal } from '@/components/ui/UsageCategoryModal';
import { BackgroundTasksProvider } from '@/lib/background-tasks/background-tasks-provider';
import { BackgroundTaskCenter } from '@/components/background-tasks/BackgroundTaskCenter';
import { GuideCompanion } from '@/components/guide/GuideCompanion';
import { AutoSyncProvider } from '@/lib/backup/autosync/auto-sync-provider';
import { ContinueProgressBanner } from '@/components/backup/ContinueProgressBanner';
import { RelationalSyncProvider } from '@/lib/db';
import { SaveProgressBanner } from '@/components/sync/SaveProgressBanner';
import { NudgeProvider } from '@/lib/floating/nudge-manager';
import { StoreCrossTabSync } from '@/store/CrossTabSync';

/**
 * Shared shell for the authenticated product surface.
 *
 * Renders the sidebar / app chrome (AppShell) exactly once for every route in
 * the (app) group, plus the app-only floating widgets. Previously AppShell was
 * imported and wrapped manually in ~35 individual pages (audit finding AA-1) and
 * the floating widgets lived in the global Providers and leaked onto marketing
 * pages (AA-3). Both now live here, scoped to the product surface only.
 *
 * BackgroundTasksProvider wraps the whole surface so a long upload / analysis
 * started on one page keeps running (and stays viewable) as the user navigates
 * — this layout does not remount between app routes. BackgroundTaskCenter is
 * its always-visible indicator + completion toasts.
 */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundTasksProvider>
      <RelationalSyncProvider>
        <AutoSyncProvider>
          {/* NudgeProvider coordinates the bottom-EDGE banners (Continue /
              Save / Tutorial-Welcome) so only the single highest-priority one
              shows at a time and the dock floats above it. The FloatingDock
              (below) owns the bottom-RIGHT corner. Together they guarantee no
              floating element overlaps another. See nudge-manager.tsx. */}
          <NudgeProvider>
            <AppShell>{children}</AppShell>
            {/* All persistent bottom-right help tools live in ONE dock that owns
                their layout (offset, spacing, z-index, safe-area) and guarantees
                only one panel opens at a time — so they can never overlap. Order
                here is top→bottom: Guide stacks above the AI Coach launcher.
                Do not add new `fixed bottom-… right-…` widgets outside this dock;
                see docs/FLOATING_UTILITY_DOCK.md. */}
            <FloatingDock>
              <GuideCompanion />
              <FloatingCoach />
            </FloatingDock>
            <UsageCategoryModal />
            <BackgroundTaskCenter />
            {/* Live-update open surfaces when data changes in another tab. */}
            <StoreCrossTabSync />
            <ContinueProgressBanner />
            <SaveProgressBanner />
          </NudgeProvider>
        </AutoSyncProvider>
      </RelationalSyncProvider>
    </BackgroundTasksProvider>
  );
}
