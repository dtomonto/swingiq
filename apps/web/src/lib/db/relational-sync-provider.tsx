'use client';

// ============================================================
// SwingVantage — Relational cloud-sync provider
//
// Makes the signed-in Supabase account the source of truth for the whole
// app, while the Zustand store stays the instant working copy + offline
// cache. Lifecycle:
//
//   • Sign in  → pull every owned row, MERGE it with whatever is on the
//                device (never lose progress), then push the union back.
//                First sign-in migrates a guest's device data into the
//                new account automatically.
//   • Editing  → a debounced, minimal diff writes only what changed
//                (inserts / updates / deletes) to the relational tables.
//   • Offline  → edits stay in the local cache and re-sync on reconnect.
//   • Sign out → stop syncing; the device keeps its local cache.
//
// Degrades gracefully: if Supabase isn't configured, or the schema
// migration hasn't been applied yet, the app keeps working locally and
// simply reports status 'unavailable' / 'local'.
// ============================================================

import {
  createContext, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/useAuth';
import { useSwingVantageStore } from '@/store';
import type { SwingVantageState, SportEquipment } from '@/store';
import { exportUserData } from '@/lib/backup/export';
import { mergeRestore } from '@/lib/backup/restore';
import {
  loadAll, reconcile, fillDefaults, freshCaches, primeCaches, isSchemaMissing, type SyncCaches,
} from './cloud-repo';
import {
  pullAndMergeDocuments, pushChangedDocuments, freshDocSyncState, type DocSyncState,
} from './document-sync';
import {
  syncDrillFeedback, freshDrillFeedbackSync, type DrillFeedbackSyncState,
} from './drill-feedback-sync';
import {
  syncCommunityAnalytics, freshCommunityAnalyticsSync, type CommunityAnalyticsSyncState,
} from './community-analytics-sync';
import { loadBase, saveBase, computeBase } from './sync-base';
import { threeWayMerge } from './three-way-merge';

export type CloudSyncStatus =
  | 'unavailable' // Supabase not configured / schema not applied → local-only
  | 'local'       // not signed in → working from this device's cache
  | 'syncing'     // actively pulling or pushing
  | 'synced'      // account is up to date
  | 'offline';    // signed in but a write failed; will retry

export interface CloudSyncContextValue {
  status: CloudSyncStatus;
  lastSyncedAt: string | null;
  /** True when changes are being saved to the account (any signed-in state). */
  cloudActive: boolean;
}

const CloudSyncContext = createContext<CloudSyncContextValue>({
  status: 'local', lastSyncedAt: null, cloudActive: false,
});

export function useCloudSync(): CloudSyncContextValue {
  return useContext(CloudSyncContext);
}

const DEBOUNCE_MS = 2000;
/** How often to flush out-of-store feature mirrors (they change outside Zustand). */
const DOC_POLL_MS = 7000;

function mergeById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const seen = new Set(a.map((i) => i.id));
  return [...a, ...b.filter((i) => !seen.has(i.id))];
}

function mergeSportEquipment(a: SportEquipment, b: SportEquipment): SportEquipment {
  return {
    tennis: mergeById(a.tennis, b.tennis),
    pickleball: mergeById(a.pickleball, b.pickleball),
    padel: mergeById(a.padel, b.padel),
    baseball: mergeById(a.baseball, b.baseball),
    softball_slow: mergeById(a.softball_slow, b.softball_slow),
    softball_fast: mergeById(a.softball_fast, b.softball_fast),
  };
}

export function RelationalSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, status: authStatus, mode } = useAuth();
  const [status, setStatus] = useState<CloudSyncStatus>('local');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const cachesRef = useRef<SyncCaches>(freshCaches());
  const docSyncRef = useRef<DocSyncState>(freshDocSyncState());
  const drillFbRef = useRef<DrillFeedbackSyncState>(freshDrillFeedbackSync());
  const commAnalyticsRef = useRef<CommunityAnalyticsSyncState>(freshCommunityAnalyticsSync());
  const userIdRef = useRef<string | null>(null);
  const runningRef = useRef(false);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const docsAvailableRef = useRef(true);
  const docsPrimedRef = useRef(false);

  useEffect(() => {
    // Cloud sync only applies when real accounts are on and someone is signed in.
    if (mode !== 'cloud' || !supabase) {
      setStatus('unavailable');
      return;
    }
    if (authStatus !== 'authenticated' || !user) {
      userIdRef.current = null;
      setStatus(authStatus === 'loading' ? 'local' : 'local');
      return;
    }

    const client = supabase;
    const uid = user.id;
    userIdRef.current = uid;
    let active = true;
    let unsubStore: (() => void) | null = null;

    // Reset secondary-store mirror state for this account.
    docsAvailableRef.current = true;
    docsPrimedRef.current = false;
    docSyncRef.current = freshDocSyncState();
    drillFbRef.current = freshDrillFeedbackSync();
    commAnalyticsRef.current = freshCommunityAnalyticsSync();

    const store = useSwingVantageStore;

    // Sync the secondary (non-store) document mirror. First call pulls + merges
    // (never lose); later calls push changes. Tolerates a missing
    // user_documents table on its own, so the main sync is never affected.
    const syncDocs = async (): Promise<boolean> => {
      if (!docsAvailableRef.current || !active) return false;
      try {
        if (!docsPrimedRef.current) {
          docSyncRef.current = freshDocSyncState();
          await pullAndMergeDocuments(client, uid, docSyncRef.current);
          docsPrimedRef.current = true;
          return true;
        }
        return await pushChangedDocuments(client, uid, docSyncRef.current);
      } catch (err) {
        if (isSchemaMissing(err)) { docsAvailableRef.current = false; return false; }
        throw err; // transient (network) — let the caller decide
      }
    };

    // All out-of-store mirrors (feature documents + the columned drill_feedback
    // table). Each tolerates its own table being absent.
    const syncExternal = async (): Promise<boolean> => {
      const docs = await syncDocs();
      const drills = await syncDrillFeedback(client, uid, drillFbRef.current);
      const community = await syncCommunityAnalytics(
        client, uid, store.getState().community, commAnalyticsRef.current,
      );
      return docs || drills || community;
    };

    const runReconcile = async () => {
      if (!active || !userIdRef.current) return;
      if (runningRef.current) { pendingRef.current = true; return; }
      runningRef.current = true;
      setStatus('syncing');
      try {
        const mainChanged = await reconcile(client, uid, store.getState(), cachesRef.current);
        const docsChanged = await syncExternal();
        if (!active) return;
        // Cloud now matches the store → record it as the new agreed base.
        saveBase(uid, computeBase(store.getState()));
        setStatus('synced');
        if (mainChanged || docsChanged) setLastSyncedAt(new Date().toISOString());
      } catch (err) {
        if (!active) return;
        if (isSchemaMissing(err)) {
          // Migration not applied yet — stop trying, stay local-only.
          setStatus('unavailable');
          unsubStore?.();
          return;
        }
        setStatus('offline'); // transient (network) — retried below
      } finally {
        runningRef.current = false;
        if (pendingRef.current) { pendingRef.current = false; scheduleReconcile(); }
      }
    };

    const scheduleReconcile = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { void runReconcile(); }, DEBOUNCE_MS);
    };

    const onOnline = () => { void runReconcile(); };
    const onHidden = () => { if (document.visibilityState === 'hidden') void runReconcile(); };

    (async () => {
      setStatus('syncing');
      try {
        const local = store.getState();
        const { state: cloud, isEmpty, presence } = await loadAll(client, uid);
        if (!active) return;

        cachesRef.current = freshCaches();

        if (isEmpty) {
          // Brand-new account: keep this device's data and push it all up
          // (migrates a guest's trial data in). Empty caches → reconcile
          // inserts everything and deletes nothing.
        } else {
          const cloudFull = fillDefaults(cloud);
          const base = loadBase(uid);
          if (base) {
            // 3-way merge against the last agreed base → cross-device deletes
            // propagate (no resurrection) while new items on either side stay.
            store.setState(threeWayMerge(base, local, cloudFull, presence));
          } else {
            // First sign-in on this device with no base → non-destructive union
            // so nothing is lost; a base is saved after this sync.
            const cloudBackup = exportUserData({ ...local, ...cloud } as SwingVantageState);
            const merged = mergeRestore(cloudBackup, local);
            store.setState({
              ...merged,
              sportEquipment: mergeSportEquipment(local.sportEquipment, cloudFull.sportEquipment),
            });
          }
          store.getState().computeSetupStep();
          // Seed caches with what the cloud CURRENTLY holds so this reconcile
          // deletes the rows the merge dropped (propagating deletes upward) and
          // upserts the rest.
          primeCaches(cloudFull, uid, cachesRef.current);
        }

        await reconcile(client, uid, store.getState(), cachesRef.current);
        if (!active) return;

        // Pull + merge the out-of-store mirrors too (feature documents +
        // drill_feedback; each tolerates its own table being absent).
        try { await syncExternal(); } catch { /* transient — the poll will retry */ }
        if (!active) return;

        // Record the now-agreed state as the base for future delete-sync.
        saveBase(uid, computeBase(store.getState()));
        setStatus('synced');
        setLastSyncedAt(new Date().toISOString());

        // Now watch for subsequent edits: the Zustand store via subscribe, and
        // the out-of-store feature mirrors via a quiet periodic flush.
        unsubStore = store.subscribe(() => { scheduleReconcile(); });
        window.addEventListener('online', onOnline);
        document.addEventListener('visibilitychange', onHidden);
        docPollRef.current = setInterval(() => {
          if (runningRef.current) return;
          void (async () => {
            try {
              const wrote = await syncExternal();
              if (wrote && active) setLastSyncedAt(new Date().toISOString());
            } catch {
              /* transient — a later poll or edit retries; don't disturb status */
            }
          })();
        }, DOC_POLL_MS);
      } catch (err) {
        if (!active) return;
        setStatus(isSchemaMissing(err) ? 'unavailable' : 'offline');
      }
    })();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (docPollRef.current) clearInterval(docPollRef.current);
      unsubStore?.();
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onHidden);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, authStatus, user?.id]);

  const value = useMemo<CloudSyncContextValue>(
    () => ({
      status,
      lastSyncedAt,
      cloudActive: status === 'syncing' || status === 'synced' || status === 'offline',
    }),
    [status, lastSyncedAt],
  );

  return <CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider>;
}
