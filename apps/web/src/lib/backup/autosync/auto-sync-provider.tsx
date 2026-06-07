'use client';

// ============================================================
// SwingVantage — Auto-Sync provider
//
// Owns the two device-sync features and exposes them via context:
//
//   1. Periodic auto-save  — keeps a chosen file on the device up to
//      date on an interval (+ when the tab is hidden, + a short debounce
//      after changes). Unchanged data is never re-written.
//
//   2. Auto "continue progress" — on load, scans the chosen folder
//      (e.g. Downloads) for the newest SwingVantage backup. If the device is
//      empty it continues automatically (safe, additive merge); if there
//      is already local data it raises a prompt instead of overwriting.
//
// Handles + config live in IndexedDB (handle-store). The store is never
// written during auto-save, so saving can't trigger more saving.
// ============================================================

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useSwingVantageStore } from '@/store';
import type { SwingVantageBackup, RestorePreview } from '@/lib/backup/schema';
import { mergeRestore, replaceRestore } from '@/lib/backup/restore';
import {
  isFileSystemAccessSupported, ensurePermission, pickSaveFile, pickDirectory,
  writeTextToFile, listBackupFiles, isAbortError,
  type FsFileHandle, type FsDirHandle,
} from './fs-access';
import {
  saveFileHandle, loadFileHandle, clearFileHandle,
  saveDirHandle, loadDirHandle, clearDirHandle,
  loadSaveConfig, persistSaveConfig, loadRestoreConfig, persistRestoreConfig,
} from './handle-store';
import { DEFAULT_AUTOSAVE_CONFIG, DEFAULT_AUTORESTORE_CONFIG } from './config';
import type { AutoSaveConfig, AutoRestoreConfig } from './config';
import { buildSnapshot } from './snapshot';
import { findLatestBackup, evaluateContinue } from './scan';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'permission';
type RestoreStatus = 'idle' | 'scanning' | 'found' | 'applied' | 'error' | 'permission';

export interface ContinuePrompt {
  backup: SwingVantageBackup;
  preview: RestorePreview;
  signature: string;
  fileName: string;
}

export interface AutoSyncContextValue {
  supported: boolean;
  autoSave: {
    enabled: boolean;
    intervalMinutes: number;
    fileLabel: string | null;
    lastSavedAt: string | null;
    status: SaveStatus;
    needsPermission: boolean;
  };
  autoRestore: {
    enabled: boolean;
    dirLabel: string | null;
    lastScanAt: string | null;
    status: RestoreStatus;
    needsPermission: boolean;
    encryptedSkipped: number;
  };
  continuePrompt: ContinuePrompt | null;
  enableAutoSave: () => Promise<void>;
  disableAutoSave: () => Promise<void>;
  setAutoSaveInterval: (minutes: number) => Promise<void>;
  saveNow: () => Promise<void>;
  resumeAutoSave: () => Promise<void>;
  enableAutoRestore: () => Promise<void>;
  disableAutoRestore: () => Promise<void>;
  resumeAutoRestore: () => Promise<void>;
  applyContinue: (mode: 'merge' | 'replace') => void;
  dismissContinue: () => void;
}

const AutoSyncContext = createContext<AutoSyncContextValue | null>(null);

export function useAutoSync(): AutoSyncContextValue {
  const ctx = useContext(AutoSyncContext);
  if (!ctx) throw new Error('useAutoSync must be used within <AutoSyncProvider>');
  return ctx;
}

const DEBOUNCE_MS = 20_000;

export function AutoSyncProvider({ children }: { children: React.ReactNode }) {
  const [supported] = useState(isFileSystemAccessSupported);

  const [saveCfg, setSaveCfg] = useState<AutoSaveConfig>(DEFAULT_AUTOSAVE_CONFIG);
  const [restoreCfg, setRestoreCfg] = useState<AutoRestoreConfig>(DEFAULT_AUTORESTORE_CONFIG);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus>('idle');
  const [continuePrompt, setContinuePrompt] = useState<ContinuePrompt | null>(null);
  const [encryptedSkipped, setEncryptedSkipped] = useState(0);

  // Non-reactive refs (handles aren't serializable; configs read inside timers).
  const fileHandleRef = useRef<FsFileHandle | null>(null);
  const dirHandleRef = useRef<FsDirHandle | null>(null);
  const saveCfgRef = useRef<AutoSaveConfig>(saveCfg);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writingRef = useRef(false);

  const updateSaveCfg = useCallback((patch: Partial<AutoSaveConfig>) => {
    setSaveCfg((prev) => {
      const next = { ...prev, ...patch };
      saveCfgRef.current = next;
      void persistSaveConfig(next);
      return next;
    });
  }, []);

  const updateRestoreCfg = useCallback((patch: Partial<AutoRestoreConfig>) => {
    setRestoreCfg((prev) => {
      const next = { ...prev, ...patch };
      void persistRestoreConfig(next);
      return next;
    });
  }, []);

  // ── Core write ──────────────────────────────────────────────
  // Writes only when the data block actually changed since last save.
  const doSave = useCallback(async (force = false): Promise<void> => {
    const handle = fileHandleRef.current;
    if (!handle || writingRef.current) return;
    const snap = buildSnapshot(useSwingVantageStore.getState());
    if (!force && snap.hash === saveCfgRef.current.lastSavedHash) return;

    writingRef.current = true;
    setSaveStatus('saving');
    try {
      const ok = await ensurePermission(handle, 'readwrite', false);
      if (!ok) {
        setSaveStatus('permission');
        return;
      }
      await writeTextToFile(handle, snap.contents);
      updateSaveCfg({ lastSavedAt: new Date().toISOString(), lastSavedHash: snap.hash });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    } finally {
      writingRef.current = false;
    }
  }, [updateSaveCfg]);

  // ── Periodic timer management ───────────────────────────────
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback((minutes: number) => {
    stopTimer();
    const ms = Math.max(1, minutes) * 60_000;
    intervalRef.current = setInterval(() => { void doSave(); }, ms);
  }, [doSave, stopTimer]);

  // ── Scan a folder + decide whether to continue ──────────────
  const runScan = useCallback(async (dir: FsDirHandle, cfg: AutoRestoreConfig) => {
    setRestoreStatus('scanning');
    try {
      const files = await listBackupFiles(dir);
      const { latest, encryptedSkipped: enc } = await findLatestBackup(files);
      setEncryptedSkipped(enc);
      updateRestoreCfg({ lastScanAt: new Date().toISOString() });

      if (!latest) { setRestoreStatus('idle'); return; }
      // Already handled this exact file (applied or dismissed)? Don't nag.
      if (latest.signature === cfg.appliedSignature) { setRestoreStatus('idle'); return; }

      const { preview, hasNewData, currentIsEmpty } = evaluateContinue(
        latest.backup, useSwingVantageStore.getState(),
      );
      if (!hasNewData) { setRestoreStatus('idle'); return; }

      if (currentIsEmpty) {
        // Safe to continue automatically — merge is purely additive here.
        const delta = mergeRestore(latest.backup, useSwingVantageStore.getState());
        useSwingVantageStore.setState(delta);
        useSwingVantageStore.getState().computeSetupStep();
        updateRestoreCfg({ appliedSignature: latest.signature });
        setRestoreStatus('applied');
      } else {
        // Local data exists → never overwrite silently; ask.
        setContinuePrompt({
          backup: latest.backup, preview, signature: latest.signature, fileName: latest.fileName,
        });
        setRestoreStatus('found');
      }
    } catch {
      setRestoreStatus('error');
    }
  }, [updateRestoreCfg]);

  // ── Hydrate from IndexedDB on mount ─────────────────────────
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;

    (async () => {
      const [sCfg, rCfg, fHandle, dHandle] = await Promise.all([
        loadSaveConfig(), loadRestoreConfig(), loadFileHandle(), loadDirHandle(),
      ]);
      if (cancelled) return;

      setSaveCfg(sCfg);
      saveCfgRef.current = sCfg;
      setRestoreCfg(rCfg);
      fileHandleRef.current = fHandle;
      dirHandleRef.current = dHandle;

      // Resume auto-save if it was on and we still hold (granted) permission.
      if (sCfg.enabled && fHandle) {
        const granted = await ensurePermission(fHandle, 'readwrite', false);
        if (cancelled) return;
        if (granted) {
          startTimer(sCfg.intervalMinutes);
          setSaveStatus('idle');
          void doSave();
        } else {
          setSaveStatus('permission');
        }
      }

      // Resume auto "continue progress" if it was on and access is granted.
      if (rCfg.enabled && dHandle) {
        const granted = await ensurePermission(dHandle, 'read', false);
        if (cancelled) return;
        if (granted) {
          void runScan(dHandle, rCfg);
        } else {
          setRestoreStatus('permission');
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  // ── Save on tab-hide + debounce on store change ─────────────
  useEffect(() => {
    if (!supported) return;

    const onHidden = () => {
      if (document.visibilityState === 'hidden') void doSave();
    };
    document.addEventListener('visibilitychange', onHidden);

    const unsub = useSwingVantageStore.subscribe(() => {
      if (!saveCfgRef.current.enabled || !fileHandleRef.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => { void doSave(); }, DEBOUNCE_MS);
    });

    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [supported, doSave]);

  // Tear down the interval on unmount.
  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Public actions: auto-save ───────────────────────────────
  const enableAutoSave = useCallback(async () => {
    if (!supported) return;
    try {
      const snap = buildSnapshot(useSwingVantageStore.getState());
      const handle = await pickSaveFile(snap.filename);
      if (!handle) return; // user cancelled
      fileHandleRef.current = handle;
      await saveFileHandle(handle);
      updateSaveCfg({ enabled: true, fileLabel: handle.name, lastSavedHash: null });
      startTimer(saveCfgRef.current.intervalMinutes);
      await doSave(true);
    } catch (err) {
      if (!isAbortError(err)) setSaveStatus('error');
    }
  }, [supported, updateSaveCfg, startTimer, doSave]);

  const disableAutoSave = useCallback(async () => {
    stopTimer();
    fileHandleRef.current = null;
    await clearFileHandle();
    updateSaveCfg({ enabled: false, fileLabel: null, lastSavedAt: null, lastSavedHash: null });
    setSaveStatus('idle');
  }, [stopTimer, updateSaveCfg]);

  const setAutoSaveInterval = useCallback(async (minutes: number) => {
    updateSaveCfg({ intervalMinutes: minutes });
    if (saveCfgRef.current.enabled && fileHandleRef.current) startTimer(minutes);
  }, [updateSaveCfg, startTimer]);

  const saveNow = useCallback(async () => { await doSave(true); }, [doSave]);

  const resumeAutoSave = useCallback(async () => {
    const handle = fileHandleRef.current;
    if (!handle) return;
    const granted = await ensurePermission(handle, 'readwrite', true);
    if (granted) {
      startTimer(saveCfgRef.current.intervalMinutes);
      setSaveStatus('idle');
      await doSave(true);
    } else {
      setSaveStatus('permission');
    }
  }, [startTimer, doSave]);

  // ── Public actions: auto-restore ────────────────────────────
  const enableAutoRestore = useCallback(async () => {
    if (!supported) return;
    try {
      const dir = await pickDirectory();
      if (!dir) return;
      dirHandleRef.current = dir;
      await saveDirHandle(dir);
      const nextCfg: AutoRestoreConfig = {
        ...restoreCfg, enabled: true, dirLabel: dir.name,
      };
      updateRestoreCfg({ enabled: true, dirLabel: dir.name });
      await runScan(dir, nextCfg);
    } catch (err) {
      if (!isAbortError(err)) setRestoreStatus('error');
    }
  }, [supported, restoreCfg, updateRestoreCfg, runScan]);

  const disableAutoRestore = useCallback(async () => {
    dirHandleRef.current = null;
    await clearDirHandle();
    updateRestoreCfg({ enabled: false, dirLabel: null });
    setContinuePrompt(null);
    setRestoreStatus('idle');
  }, [updateRestoreCfg]);

  const resumeAutoRestore = useCallback(async () => {
    const dir = dirHandleRef.current;
    if (!dir) return;
    const granted = await ensurePermission(dir, 'read', true);
    if (granted) await runScan(dir, restoreCfg);
    else setRestoreStatus('permission');
  }, [runScan, restoreCfg]);

  const applyContinue = useCallback((mode: 'merge' | 'replace') => {
    setContinuePrompt((prompt) => {
      if (!prompt) return null;
      const state = useSwingVantageStore.getState();
      const delta = mode === 'replace'
        ? replaceRestore(prompt.backup, state.settings)
        : mergeRestore(prompt.backup, state);
      useSwingVantageStore.setState(delta);
      useSwingVantageStore.getState().computeSetupStep();
      updateRestoreCfg({ appliedSignature: prompt.signature });
      setRestoreStatus('applied');
      return null;
    });
  }, [updateRestoreCfg]);

  const dismissContinue = useCallback(() => {
    setContinuePrompt((prompt) => {
      // Remember the signature so the same file won't prompt again.
      if (prompt) updateRestoreCfg({ appliedSignature: prompt.signature });
      return null;
    });
    setRestoreStatus('idle');
  }, [updateRestoreCfg]);

  const value = useMemo<AutoSyncContextValue>(() => ({
    supported,
    autoSave: {
      enabled: saveCfg.enabled,
      intervalMinutes: saveCfg.intervalMinutes,
      fileLabel: saveCfg.fileLabel,
      lastSavedAt: saveCfg.lastSavedAt,
      status: saveStatus,
      needsPermission: saveStatus === 'permission',
    },
    autoRestore: {
      enabled: restoreCfg.enabled,
      dirLabel: restoreCfg.dirLabel,
      lastScanAt: restoreCfg.lastScanAt,
      status: restoreStatus,
      needsPermission: restoreStatus === 'permission',
      encryptedSkipped,
    },
    continuePrompt,
    enableAutoSave, disableAutoSave, setAutoSaveInterval, saveNow, resumeAutoSave,
    enableAutoRestore, disableAutoRestore, resumeAutoRestore, applyContinue, dismissContinue,
  }), [
    supported, saveCfg, restoreCfg, saveStatus, restoreStatus, encryptedSkipped, continuePrompt,
    enableAutoSave, disableAutoSave, setAutoSaveInterval, saveNow, resumeAutoSave,
    enableAutoRestore, disableAutoRestore, resumeAutoRestore, applyContinue, dismissContinue,
  ]);

  return <AutoSyncContext.Provider value={value}>{children}</AutoSyncContext.Provider>;
}
