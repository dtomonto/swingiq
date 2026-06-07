import { AppShell } from '@/components/layout/AppShell';
import { FloatingCoach } from '@/components/ui/FloatingCoach';
import { UsageCategoryModal } from '@/components/ui/UsageCategoryModal';
import { BackgroundTasksProvider } from '@/lib/background-tasks/background-tasks-provider';
import { BackgroundTaskCenter } from '@/components/background-tasks/BackgroundTaskCenter';
import { GuideCompanion } from '@/components/guide/GuideCompanion';
import { AutoSyncProvider } from '@/lib/backup/autosync/auto-sync-provider';
import { ContinueProgressBanner } from '@/components/backup/ContinueProgressBanner';
import { RelationalSyncProvider } from '@/lib/db';
import { SaveProgressBanner } from '@/components/sync/SaveProgressBanner';

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
          <AppShell>{children}</AppShell>
          <FloatingCoach />
          <UsageCategoryModal />
          <BackgroundTaskCenter />
          <GuideCompanion />
          <ContinueProgressBanner />
          <SaveProgressBanner />
        </AutoSyncProvider>
      </RelationalSyncProvider>
    </BackgroundTasksProvider>
  );
}
