// ============================================================
// SignalRadar OS — client state hook (localStorage, owner-local)
// ------------------------------------------------------------
// Operator state lives in the browser so SignalRadar works in
// production's read-only filesystem (same model as securityOS /
// reliabilityOS). This hook owns: collected signals, config overrides,
// competitor list, AI-visibility tests and conversions — and exposes
// the actions that mutate them, delegating all classification/scoring
// to the PURE engine so behaviour matches jest exactly.
// ============================================================

'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  Signal,
  SignalRadarConfig,
  SignalStatus,
  RawSignalInput,
  CompetitorDef,
  AiVisibilityTest,
  SignalConversion,
  ConversionKind,
  SignalClassification,
} from './types';
import { DEFAULT_COMPETITORS, resolveConfig } from './config';
import { processRawInputs, reprocessSignal } from './engine';
import { computeScores } from './scoring';
import { buildConversion } from './conversions';
import { parseGoogleAlerts, parseRssFeed, parseCsv } from './importers';

const K = {
  signals: 'swingvantage:signal-radar:signals:v1',
  config: 'swingvantage:signal-radar:config:v1',
  competitors: 'swingvantage:signal-radar:competitors:v1',
  aiTests: 'swingvantage:signal-radar:ai-tests:v1',
  conversions: 'swingvantage:signal-radar:conversions:v1',
  dismissedAlerts: 'swingvantage:signal-radar:dismissed-alerts:v1',
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — degrade silently */
  }
}

let _seq = 0;
function uid(prefix: string): string {
  _seq += 1;
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${t}${_seq.toString(36)}${r}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export type ImportKind = 'google_alerts' | 'rss' | 'csv';

export interface SignalRadarState {
  ready: boolean;
  actor: string;
  setActor: (email: string) => void;
  signals: Signal[];
  config: SignalRadarConfig;
  configOverrides: Partial<SignalRadarConfig>;
  competitors: CompetitorDef[];
  aiTests: AiVisibilityTest[];
  conversions: SignalConversion[];
  dismissedAlertIds: string[];

  addManualSignal: (input: Omit<RawSignalInput, 'collectionMethod'>) => Signal | null;
  importSignals: (kind: ImportKind, text: string) => { added: number; duplicates: number };
  setStatus: (id: string, status: SignalStatus, opts?: { reason?: string }) => void;
  addNote: (id: string, body: string) => void;
  overrideClassification: (id: string, patch: Partial<SignalClassification>) => void;
  convertSignal: (id: string, kind: ConversionKind) => SignalConversion | null;
  removeSignal: (id: string) => void;
  adoptSignal: (signal: Signal) => void;
  reprocessAll: () => void;

  updateConfig: (patch: Partial<SignalRadarConfig>) => void;
  resetConfig: () => void;
  setCompetitors: (list: CompetitorDef[]) => void;

  upsertAiTest: (test: AiVisibilityTest) => void;
  removeAiTest: (id: string) => void;

  updateConversion: (id: string, patch: Partial<SignalConversion>) => void;

  dismissAlert: (id: string) => void;
  clearDismissedAlerts: () => void;
}

export function useSignalRadar(initialActor = 'admin'): SignalRadarState {
  const [ready, setReady] = useState(false);
  const [actor, setActorState] = useState(initialActor);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [configOverrides, setConfigOverrides] = useState<Partial<SignalRadarConfig>>({});
  const [competitors, setCompetitorsState] = useState<CompetitorDef[]>(DEFAULT_COMPETITORS);
  const [aiTests, setAiTests] = useState<AiVisibilityTest[]>([]);
  const [conversions, setConversions] = useState<SignalConversion[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  // Hydrate once on mount.
  useEffect(() => {
    setSignals(readJson<Signal[]>(K.signals, []));
    setConfigOverrides(readJson<Partial<SignalRadarConfig>>(K.config, {}));
    setCompetitorsState(readJson<CompetitorDef[]>(K.competitors, DEFAULT_COMPETITORS));
    setAiTests(readJson<AiVisibilityTest[]>(K.aiTests, []));
    setConversions(readJson<SignalConversion[]>(K.conversions, []));
    setDismissedAlertIds(readJson<string[]>(K.dismissedAlerts, []));
    setReady(true);
  }, []);

  // Persist each slice when it changes (after hydration).
  useEffect(() => { if (ready) writeJson(K.signals, signals); }, [ready, signals]);
  useEffect(() => { if (ready) writeJson(K.config, configOverrides); }, [ready, configOverrides]);
  useEffect(() => { if (ready) writeJson(K.competitors, competitors); }, [ready, competitors]);
  useEffect(() => { if (ready) writeJson(K.aiTests, aiTests); }, [ready, aiTests]);
  useEffect(() => { if (ready) writeJson(K.conversions, conversions); }, [ready, conversions]);
  useEffect(() => { if (ready) writeJson(K.dismissedAlerts, dismissedAlertIds); }, [ready, dismissedAlertIds]);

  const config = resolveConfig(configOverrides);

  const setActor = useCallback((email: string) => setActorState(email || 'admin'), []);

  const addManualSignal = useCallback(
    (input: Omit<RawSignalInput, 'collectionMethod'>): Signal | null => {
      const now = nowIso();
      const raw: RawSignalInput = { ...input, collectionMethod: 'manual' };
      let created: Signal | null = null;
      setSignals((prev) => {
        const { signals: built } = processRawInputs([raw], config, competitors, {
          now,
          makeId: () => uid('sig'),
          knownFingerprints: prev.map((s) => s.fingerprint),
        });
        if (!built.length) return prev; // duplicate
        created = built[0];
        return [...built, ...prev];
      });
      return created;
    },
    [config, competitors],
  );

  const importSignals = useCallback(
    (kind: ImportKind, text: string): { added: number; duplicates: number } => {
      const now = nowIso();
      const inputs =
        kind === 'google_alerts' ? parseGoogleAlerts(text)
        : kind === 'rss' ? parseRssFeed(text)
        : parseCsv(text);
      let result = { added: 0, duplicates: 0 };
      setSignals((prev) => {
        const { signals: built, duplicateCount } = processRawInputs(inputs, config, competitors, {
          now,
          makeId: () => uid('sig'),
          knownFingerprints: prev.map((s) => s.fingerprint),
        });
        result = { added: built.length, duplicates: duplicateCount };
        return [...built, ...prev];
      });
      return result;
    },
    [config, competitors],
  );

  const patchSignal = useCallback((id: string, fn: (s: Signal) => Signal) => {
    setSignals((prev) => prev.map((s) => (s.id === id ? fn(s) : s)));
  }, []);

  const setStatus = useCallback(
    (id: string, status: SignalStatus, opts?: { reason?: string }) => {
      const now = nowIso();
      patchSignal(id, (s) => ({
        ...s,
        status,
        reviewedAt: status === 'reviewed' ? now : s.reviewedAt,
        archivedAt: status === 'archived' ? now : s.archivedAt,
        ignoredReason: status === 'ignored' ? (opts?.reason ?? s.ignoredReason) : s.ignoredReason,
        updatedAt: now,
      }));
    },
    [patchSignal],
  );

  const addNote = useCallback(
    (id: string, body: string) => {
      if (!body.trim()) return;
      const now = nowIso();
      patchSignal(id, (s) => ({
        ...s,
        notes: [...s.notes, { id: uid('note'), at: now, author: actor, body: body.trim() }],
        updatedAt: now,
      }));
    },
    [patchSignal, actor],
  );

  const overrideClassification = useCallback(
    (id: string, patch: Partial<SignalClassification>) => {
      const now = nowIso();
      patchSignal(id, (s) => {
        const classification: SignalClassification = {
          ...s.classification,
          ...patch,
          method: 'manual_override',
          rationale: [...s.classification.rationale, `Operator override by ${actor}`],
        };
        const scores = computeScores(s, classification, config.weights, now);
        return { ...s, classification, scores, updatedAt: now };
      });
    },
    [patchSignal, config.weights, actor],
  );

  const convertSignal = useCallback(
    (id: string, kind: ConversionKind): SignalConversion | null => {
      const signal = signals.find((s) => s.id === id);
      if (!signal) return null;
      const now = nowIso();
      const conversion = buildConversion(kind, signal, { id: uid('conv'), now, createdBy: actor });
      setConversions((prev) => [conversion, ...prev]);
      const statusMap: Record<ConversionKind, SignalStatus> = {
        content_idea: 'converted_content',
        product_feedback: 'converted_product',
        partnership_lead: 'converted_partnership',
        support_response: 'responded',
        reputation_risk: 'converted_reputation',
      };
      setStatus(id, statusMap[kind]);
      return conversion;
    },
    [signals, actor, setStatus],
  );

  const removeSignal = useCallback((id: string) => {
    setSignals((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Copy a durable webhook-ingested signal into local state so it can be
  // triaged/converted like any other. Idempotent (by fingerprint).
  const adoptSignal = useCallback((signal: Signal) => {
    setSignals((prev) => {
      if (prev.some((s) => s.fingerprint === signal.fingerprint)) return prev;
      const { ingested: _ingested, ...rest } = signal;
      return [{ ...rest, updatedAt: nowIso() }, ...prev];
    });
  }, []);

  const reprocessAll = useCallback(() => {
    const now = nowIso();
    setSignals((prev) =>
      prev.map((s) =>
        s.classification.method === 'manual_override' ? s : reprocessSignal(s, config, competitors, now),
      ),
    );
  }, [config, competitors]);

  const updateConfig = useCallback((patch: Partial<SignalRadarConfig>) => {
    setConfigOverrides((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetConfig = useCallback(() => setConfigOverrides({}), []);

  const setCompetitors = useCallback((list: CompetitorDef[]) => setCompetitorsState(list), []);

  const upsertAiTest = useCallback((test: AiVisibilityTest) => {
    setAiTests((prev) => {
      const i = prev.findIndex((t) => t.id === test.id);
      if (i === -1) return [test, ...prev];
      const next = [...prev];
      next[i] = test;
      return next;
    });
  }, []);

  const removeAiTest = useCallback((id: string) => {
    setAiTests((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateConversion = useCallback((id: string, patch: Partial<SignalConversion>) => {
    setConversions((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setDismissedAlertIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const clearDismissedAlerts = useCallback(() => setDismissedAlertIds([]), []);

  return {
    ready, actor, setActor,
    signals, config, configOverrides, competitors, aiTests, conversions, dismissedAlertIds,
    addManualSignal, importSignals, setStatus, addNote, overrideClassification,
    convertSignal, removeSignal, adoptSignal, reprocessAll,
    updateConfig, resetConfig, setCompetitors,
    upsertAiTest, removeAiTest, updateConversion,
    dismissAlert, clearDismissedAlerts,
  };
}
