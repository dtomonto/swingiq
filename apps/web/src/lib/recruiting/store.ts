'use client';

// ============================================================
// Player Recruiting Hub — local-first store
// ------------------------------------------------------------
// Recruiting data lives in its OWN persisted store (localStorage key
// `swingvantage-recruiting`), separate from the athlete-facing
// `swingiq-store`, mirroring the Academy / Motion-Lab secondary
// stores. Sensitive actions (publish, share, revoke, delete, consent)
// append to an in-store audit log. When an account is connected the
// same shapes upsert to Supabase (supabase-recruiting-schema.sql).
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SportId } from '@swingiq/core';
import {
  type RecruitingState,
  type RecruitingProfile,
  type SportProfile,
  type FilmAsset,
  type Clip,
  type HighlightReel,
  type PlayerMetric,
  type MetricSample,
  type CoachNote,
  type AIPlayerSummary,
  type SummaryAudience,
  type ShareLink,
  type ShareLinkKind,
  type ShareLinkPermissions,
  type OutreachContact,
  type OutreachMessage,
  type OutreachKind,
  type EngagementEvent,
  type EngagementType,
  type GuardianConsent,
  type VerificationRequest,
  type RecruiterContactSubmission,
  type DataSource,
  type Visibility,
  DEFAULT_RECRUITING_STATE,
} from './types';
import { buildSummary } from './summary';
import { scoreFilmQuality } from './filmQuality';
import {
  generateSlug,
  permissionPresetFor,
  buildCoachSnapshot,
  publishSnapshot,
  unpublishSnapshot,
} from './share';

function uid(prefix: string): string {
  const rnd =
    typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rnd}`;
}

const now = () => new Date().toISOString();

export interface RecruitingStore extends RecruitingState {
  // Profile
  saveProfile: (patch: Partial<RecruitingProfile>) => void;
  upsertSportProfile: (sport: SportId, patch: Partial<SportProfile>) => void;
  // Film
  addFilm: (input: Partial<FilmAsset> & { title: string; sport: SportId; category: FilmAsset['category'] }) => string;
  updateFilm: (id: string, patch: Partial<FilmAsset>) => void;
  removeFilm: (id: string) => void;
  toggleFilmFeatured: (id: string) => void;
  // Clips
  addClip: (input: Omit<Clip, 'id' | 'createdAt'>) => string;
  removeClip: (id: string) => void;
  // Reels
  addReel: (input: Partial<HighlightReel> & { title: string; sport: SportId; style: string }) => string;
  updateReel: (id: string, patch: Partial<HighlightReel>) => void;
  removeReel: (id: string) => void;
  setFeaturedReel: (id: string) => void;
  // Metrics
  addMetric: (input: { metricKey: string; sport: SportId; value: number; unit: string; source: DataSource; note?: string }) => string;
  addMetricSample: (id: string, sample: MetricSample) => void;
  updateMetric: (id: string, patch: Partial<PlayerMetric>) => void;
  setMetricVisibility: (id: string, visibility: Visibility) => void;
  coachValidateMetric: (id: string, validated: boolean) => void;
  removeMetric: (id: string) => void;
  // Coach notes
  addCoachNote: (input: Omit<CoachNote, 'id' | 'createdAt'>) => string;
  removeCoachNote: (id: string) => void;
  // Summaries
  generateSummary: (audience: SummaryAudience, sport?: SportId) => string;
  saveSummary: (summary: AIPlayerSummary) => void;
  removeSummary: (id: string) => void;
  // Share links
  createShareLink: (kind: ShareLinkKind, label: string, opts?: { recipientName?: string; password?: string; expiresAt?: string | null; watermark?: boolean; permissions?: Partial<ShareLinkPermissions> }) => string;
  updateShareLink: (id: string, patch: Partial<ShareLink>) => void;
  publishShareLink: (id: string) => void;
  revokeShareLink: (id: string) => void;
  deleteShareLink: (id: string) => void;
  // Outreach
  addContact: (input: Omit<OutreachContact, 'id' | 'createdAt'>) => string;
  removeContact: (id: string) => void;
  saveMessage: (input: Omit<OutreachMessage, 'id' | 'createdAt' | 'status'> & { status?: OutreachMessage['status'] }) => string;
  approveMessage: (id: string) => void;
  markMessageSent: (id: string) => void;
  removeMessage: (id: string) => void;
  // Engagement
  recordEngagement: (input: Omit<EngagementEvent, 'id' | 'at'>) => void;
  // Safety / compliance
  setGuardianConsent: (patch: Partial<GuardianConsent>) => void;
  requestVerification: (input: Omit<VerificationRequest, 'id' | 'createdAt' | 'status'>) => string;
  resolveVerification: (id: string, status: VerificationRequest['status']) => void;
  addContactSubmission: (input: Omit<RecruiterContactSubmission, 'id' | 'createdAt' | 'read'>) => void;
  markSubmissionRead: (id: string) => void;
  reportAbuse: (input: { reason: string; details?: string; targetType: 'profile' | 'film' | 'message' | 'other'; targetId?: string }) => void;
  // Misc
  setOnboarded: (v: boolean) => void;
  reset: () => void;
}

/** Append an audit-log entry (kept to the last 200). */
function withAudit(state: RecruitingState, action: string, detail?: string): Pick<RecruitingState, 'auditLog'> {
  const entry = { id: uid('aud'), action, detail, at: now() };
  return { auditLog: [entry, ...state.auditLog].slice(0, 200) };
}

export const useRecruitingStore = create<RecruitingStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_RECRUITING_STATE,

      // ── Profile ──
      saveProfile: (patch) =>
        set((s) => {
          const base: RecruitingProfile =
            s.profile ?? {
              id: uid('prof'),
              athleteName: '',
              playerType: 'high_school',
              primarySport: 'golf',
              maskAthleteContact: true,
              recruitingStatus: 'exploring',
              verifiedLinks: [],
              sportProfiles: {},
              visibility: 'private',
              createdAt: now(),
              updatedAt: now(),
            };
          return { profile: { ...base, ...patch, updatedAt: now() } };
        }),

      upsertSportProfile: (sport, patch) =>
        set((s) => {
          if (!s.profile) return s;
          const existing: SportProfile =
            s.profile.sportProfiles[sport] ?? {
              sport,
              position: '',
              secondaryPositions: [],
              source: 'self_reported',
            };
          return {
            profile: {
              ...s.profile,
              sportProfiles: { ...s.profile.sportProfiles, [sport]: { ...existing, ...patch, sport } },
              updatedAt: now(),
            },
          };
        }),

      // ── Film ──
      addFilm: (input) => {
        const id = uid('film');
        set((s) => {
          const asset: FilmAsset = {
            id,
            title: input.title,
            sport: input.sport,
            category: input.category,
            url: input.url,
            thumbnailUrl: input.thumbnailUrl,
            durationSeconds: input.durationSeconds ?? null,
            date: input.date,
            location: input.location,
            opponentOrEvent: input.opponentOrEvent,
            cameraAngle: input.cameraAngle,
            skillType: input.skillType,
            resultOutcome: input.resultOutcome,
            notes: input.notes,
            tags: input.tags ?? [],
            featured: input.featured ?? false,
            visibility: input.visibility ?? 'link_only',
            source: input.source ?? 'self_reported',
            qualityScore: null,
            createdAt: now(),
            updatedAt: now(),
            deletedAt: null,
          };
          asset.qualityScore = scoreFilmQuality(asset);
          return { film: [asset, ...s.film] };
        });
        return id;
      },

      updateFilm: (id, patch) =>
        set((s) => ({
          film: s.film.map((f) => {
            if (f.id !== id) return f;
            const next = { ...f, ...patch, updatedAt: now() };
            next.qualityScore = scoreFilmQuality(next);
            return next;
          }),
        })),

      removeFilm: (id) =>
        set((s) => ({
          film: s.film.map((f) => (f.id === id ? { ...f, deletedAt: now(), featured: false, updatedAt: now() } : f)),
          ...withAudit(s, 'film.delete', id),
        })),

      toggleFilmFeatured: (id) =>
        set((s) => ({ film: s.film.map((f) => (f.id === id ? { ...f, featured: !f.featured, updatedAt: now() } : f)) })),

      // ── Clips ──
      addClip: (input) => {
        const id = uid('clip');
        set((s) => ({ clips: [...s.clips, { ...input, id, createdAt: now() }] }));
        return id;
      },
      removeClip: (id) =>
        set((s) => ({
          clips: s.clips.filter((c) => c.id !== id),
          reels: s.reels.map((r) => ({ ...r, clipIds: r.clipIds.filter((cid) => cid !== id) })),
        })),

      // ── Reels ──
      addReel: (input) => {
        const id = uid('reel');
        set((s) => ({
          reels: [
            ...s.reels,
            {
              id,
              title: input.title,
              sport: input.sport,
              style: input.style,
              clipIds: input.clipIds ?? [],
              featured: input.featured ?? false,
              visibility: input.visibility ?? 'link_only',
              createdAt: now(),
              updatedAt: now(),
            },
          ],
        }));
        return id;
      },
      updateReel: (id, patch) =>
        set((s) => ({ reels: s.reels.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: now() } : r)) })),
      removeReel: (id) => set((s) => ({ reels: s.reels.filter((r) => r.id !== id) })),
      setFeaturedReel: (id) =>
        set((s) => ({ reels: s.reels.map((r) => ({ ...r, featured: r.id === id, updatedAt: now() })) })),

      // ── Metrics ──
      addMetric: (input) => {
        const id = uid('metric');
        set((s) => {
          const sample: MetricSample = { value: input.value, date: now(), source: input.source, note: input.note };
          const metric: PlayerMetric = {
            id,
            metricKey: input.metricKey,
            sport: input.sport,
            currentValue: input.value,
            unit: input.unit,
            history: [sample],
            source: input.source,
            coachValidated: false,
            visibility: 'link_only',
            notes: input.note,
            updatedAt: now(),
          };
          return { metrics: [...s.metrics, metric] };
        });
        return id;
      },
      addMetricSample: (id, sample) =>
        set((s) => ({
          metrics: s.metrics.map((m) => {
            if (m.id !== id) return m;
            const history = [...m.history, sample].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            return { ...m, history, currentValue: history[history.length - 1].value, source: sample.source, updatedAt: now() };
          }),
        })),
      updateMetric: (id, patch) => set((s) => ({ metrics: s.metrics.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: now() } : m)) })),
      setMetricVisibility: (id, visibility) => set((s) => ({ metrics: s.metrics.map((m) => (m.id === id ? { ...m, visibility, updatedAt: now() } : m)) })),
      coachValidateMetric: (id, validated) =>
        set((s) => ({
          metrics: s.metrics.map((m) => (m.id === id ? { ...m, coachValidated: validated, source: validated ? 'coach_verified' : m.source, updatedAt: now() } : m)),
          ...withAudit(s, 'metric.coach_validate', `${id}:${validated}`),
        })),
      removeMetric: (id) => set((s) => ({ metrics: s.metrics.filter((m) => m.id !== id) })),

      // ── Coach notes ──
      addCoachNote: (input) => {
        const id = uid('note');
        set((s) => ({ coachNotes: [{ ...input, id, createdAt: now() }, ...s.coachNotes] }));
        return id;
      },
      removeCoachNote: (id) => set((s) => ({ coachNotes: s.coachNotes.filter((n) => n.id !== id) })),

      // ── Summaries ──
      generateSummary: (audience, sport) => {
        const id = uid('sum');
        set((s) => {
          const draft = buildSummary(s, audience, sport);
          const summary: AIPlayerSummary = {
            id,
            audience,
            body: draft.body,
            claims: draft.claims,
            caveats: draft.caveats,
            generator: 'deterministic',
            createdAt: now(),
          };
          // Replace any prior summary for the same audience.
          return { summaries: [summary, ...s.summaries.filter((x) => x.audience !== audience)] };
        });
        return id;
      },
      saveSummary: (summary) => set((s) => ({ summaries: [summary, ...s.summaries.filter((x) => x.id !== summary.id && x.audience !== summary.audience)] })),
      removeSummary: (id) => set((s) => ({ summaries: s.summaries.filter((x) => x.id !== id) })),

      // ── Share links ──
      createShareLink: (kind, label, opts) => {
        const id = uid('link');
        set((s) => {
          const link: ShareLink = {
            id,
            slug: generateSlug(),
            kind,
            label,
            recipientName: opts?.recipientName,
            permissions: { ...permissionPresetFor(kind), ...opts?.permissions },
            password: opts?.password ?? null,
            expiresAt: opts?.expiresAt ?? null,
            watermark: opts?.watermark ?? false,
            active: true,
            createdAt: now(),
            revokedAt: null,
          };
          return { shareLinks: [link, ...s.shareLinks], ...withAudit(s, 'share_link.create', `${kind}:${link.slug}`) };
        });
        // Publish a fresh snapshot immediately so the link works.
        get().publishShareLink(id);
        return id;
      },
      updateShareLink: (id, patch) => {
        set((s) => ({ shareLinks: s.shareLinks.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
        get().publishShareLink(id);
      },
      publishShareLink: (id) =>
        set((s) => {
          const link = s.shareLinks.find((l) => l.id === id);
          if (!link) return s;
          const snapshot = buildCoachSnapshot(s, link);
          publishSnapshot(link.slug, snapshot);
          return { ...withAudit(s, 'profile.publish', link.slug) };
        }),
      revokeShareLink: (id) =>
        set((s) => {
          const link = s.shareLinks.find((l) => l.id === id);
          if (link) unpublishSnapshot(link.slug);
          return {
            shareLinks: s.shareLinks.map((l) => (l.id === id ? { ...l, active: false, revokedAt: now() } : l)),
            ...withAudit(s, 'share_link.revoke', link?.slug),
          };
        }),
      deleteShareLink: (id) =>
        set((s) => {
          const link = s.shareLinks.find((l) => l.id === id);
          if (link) unpublishSnapshot(link.slug);
          return { shareLinks: s.shareLinks.filter((l) => l.id !== id), ...withAudit(s, 'share_link.delete', link?.slug) };
        }),

      // ── Outreach ──
      addContact: (input) => {
        const id = uid('contact');
        set((s) => ({ contacts: [{ ...input, id, createdAt: now() }, ...s.contacts] }));
        return id;
      },
      removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      saveMessage: (input) => {
        const id = uid('msg');
        set((s) => ({
          messages: [
            { ...input, id, status: input.status ?? 'draft', createdAt: now(), approvedAt: null, sentAt: null },
            ...s.messages,
          ],
        }));
        return id;
      },
      approveMessage: (id) => set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, status: 'approved', approvedAt: now() } : m)), ...withAudit(s, 'outreach.approve', id) })),
      markMessageSent: (id) => set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, status: 'sent', sentAt: now() } : m)) })),
      removeMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

      // ── Engagement ──
      recordEngagement: (input) =>
        set((s) => ({ engagement: [{ ...input, id: uid('ev'), at: now() }, ...s.engagement].slice(0, 1000) })),

      // ── Safety / compliance ──
      setGuardianConsent: (patch) =>
        set((s) => ({
          guardianConsent: { ...s.guardianConsent, ...patch, grantedAt: patch.granted ? now() : s.guardianConsent.grantedAt },
          ...withAudit(s, 'guardian.consent', JSON.stringify(patch)),
        })),
      requestVerification: (input) => {
        const id = uid('ver');
        set((s) => ({ verifications: [{ ...input, id, status: 'pending', createdAt: now(), resolvedAt: null }, ...s.verifications] }));
        return id;
      },
      resolveVerification: (id, status) =>
        set((s) => ({ verifications: s.verifications.map((v) => (v.id === id ? { ...v, status, resolvedAt: now() } : v)) })),
      addContactSubmission: (input) =>
        set((s) => ({ contactSubmissions: [{ ...input, id: uid('sub'), createdAt: now(), read: false }, ...s.contactSubmissions] })),
      markSubmissionRead: (id) => set((s) => ({ contactSubmissions: s.contactSubmissions.map((c) => (c.id === id ? { ...c, read: true } : c)) })),
      reportAbuse: (input) =>
        set((s) => ({ abuseReports: [{ ...input, id: uid('abuse'), createdAt: now() }, ...s.abuseReports], ...withAudit(s, 'abuse.report', input.targetType) })),

      // ── Misc ──
      setOnboarded: (v) => set({ onboarded: v }),
      reset: () => set({ ...DEFAULT_RECRUITING_STATE }),
    }),
    {
      name: 'swingvantage-recruiting',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
        }
        return localStorage;
      }),
    },
  ),
);
