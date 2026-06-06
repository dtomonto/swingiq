// ============================================================
// Player Recruiting Hub — sharing engine
// ------------------------------------------------------------
// Share-link slugs, per-kind permission presets, expiry/revocation
// checks, and the filtered "coach view" snapshot. The snapshot is the
// ONLY thing a coach ever sees: it applies the link's permissions,
// each item's visibility, contact masking, and the guardian-consent
// gate, then strips anything private. Raw video URLs are only included
// when the link allows video AND the asset is shared.
//
// Publishing: in local (keyless) mode a published snapshot is cached in
// localStorage so the coach view renders without a backend; when an
// account/Supabase is connected the same snapshot upserts server-side
// (schema-ready in supabase-recruiting-schema.sql).
// ============================================================

import type { SportId } from '@swingiq/core';
import {
  type FilmAsset,
  type HighlightReel,
  type PlayerMetric,
  type CoachNote,
  type AIPlayerSummary,
  type RecruitingState,
  type ShareLink,
  type ShareLinkKind,
  type ShareLinkPermissions,
  type Visibility,
  DEFAULT_SHARE_PERMISSIONS,
} from './types';

const PUBLISH_KEY = 'swingvantage-recruiting-public';

// ── Slugs ────────────────────────────────────────────────────

const SLUG_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // no ambiguous chars

export function generateSlug(len = 10): string {
  let out = '';
  const cryptoObj = typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(len);
    cryptoObj.getRandomValues(buf);
    for (let i = 0; i < len; i++) out += SLUG_ALPHABET[buf[i] % SLUG_ALPHABET.length];
  } else {
    for (let i = 0; i < len; i++) out += SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)];
  }
  return out;
}

export function shareUrl(slug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://swingvantage.com';
  return `${origin}/player/${slug}`;
}

/**
 * Lightweight, non-reversible hash for the password "soft gate" on the public
 * coach view. This is a deterrent against casual access on a shared link — NOT
 * a security boundary (a determined viewer with the snapshot could bypass it).
 * A real access control belongs server-side; the cloud schema is ready for it.
 */
export function hashPassword(pw: string): string {
  let h = 2166136261;
  for (let i = 0; i < pw.length; i++) {
    h ^= pw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

// ── Permission presets ───────────────────────────────────────

export function permissionPresetFor(kind: ShareLinkKind): ShareLinkPermissions {
  switch (kind) {
    case 'public':
      return { ...DEFAULT_SHARE_PERMISSIONS, showContactInfo: false };
    case 'coach':
    case 'scout':
      return { canView: true, canDownloadPacket: true, canContact: true, showVideo: true, showData: true, showContactInfo: true };
    case 'team':
      return { canView: true, canDownloadPacket: true, canContact: true, showVideo: true, showData: true, showContactInfo: false };
    case 'password':
    case 'expiring':
    case 'private':
      return { ...DEFAULT_SHARE_PERMISSIONS };
    case 'analytics_anon':
      return { canView: true, canDownloadPacket: false, canContact: false, showVideo: true, showData: true, showContactInfo: false };
    default:
      return { ...DEFAULT_SHARE_PERMISSIONS };
  }
}

export const SHARE_LINK_KIND_LABEL: Record<ShareLinkKind, string> = {
  public: 'Public link',
  private: 'Private link',
  password: 'Password-protected',
  expiring: 'Expiring link',
  coach: 'Coach-specific',
  scout: 'Scout-specific',
  team: 'Team-specific',
  analytics_anon: 'Anonymous analytics',
};

// ── Link state ───────────────────────────────────────────────

export function isLinkExpired(link: ShareLink, now = Date.now()): boolean {
  return !!link.expiresAt && new Date(link.expiresAt).getTime() < now;
}

export function isLinkActive(link: ShareLink, now = Date.now()): boolean {
  return link.active && !link.revokedAt && !isLinkExpired(link, now);
}

// ── Coach-view snapshot ──────────────────────────────────────

export interface CoachViewSnapshot {
  slug: string;
  generatedAt: string;
  watermark: boolean;
  passwordProtected: boolean;
  /** Soft-gate hash of the link password (see hashPassword). Never the plaintext. */
  passwordHash?: string;
  permissions: ShareLinkPermissions;
  sport: SportId;
  athlete: {
    name: string;
    graduationYear?: number | null;
    playerType: string;
    primarySport: SportId;
    position?: string;
    schoolOrClub?: string;
    hometownRegion?: string;
    heightInches?: number | null;
    weightLbs?: number | null;
    bio?: string;
    personalStatement?: string;
    recruitingStatus: string;
  };
  contact?: { label: string; value: string }[];
  featuredReel?: HighlightReel | null;
  film: FilmAsset[];
  metrics: PlayerMetric[];
  coachNotes: CoachNote[];
  summary?: AIPlayerSummary | null;
  /** Honest disclosure shown on the coach view. */
  disclosures: string[];
}

function isShared(v: Visibility): boolean {
  return v === 'public' || v === 'link_only';
}

/**
 * Build exactly what a coach sees through `link`. Applies link permissions,
 * per-item visibility, contact masking, and guardian consent. Private items
 * never leave the device.
 */
export function buildCoachSnapshot(state: RecruitingState, link: ShareLink): CoachViewSnapshot {
  const p = state.profile;
  const sport = p?.primarySport ?? 'golf';
  const sp = p?.sportProfiles[sport];
  const perms = link.permissions;

  const film = perms.showVideo
    ? state.film.filter((f) => !f.deletedAt && isShared(f.visibility))
    : [];
  const metrics = perms.showData
    ? state.metrics.filter((m) => isShared(m.visibility))
    : [];
  const coachNotes = state.coachNotes.filter((n) => isShared(n.visibility));
  const featuredReel = perms.showVideo ? state.reels.find((r) => r.featured && isShared(r.visibility)) ?? null : null;
  const summary = state.summaries.find((s) => s.audience === 'coach') ?? state.summaries[0] ?? null;

  // Contact masking: requires permission AND (not masked) AND (consent if minor).
  const consent = state.guardianConsent;
  const minorBlocksContact = isMinor(p?.dateOfBirth) && !consent.allowContactDisplay;
  const showContact = perms.showContactInfo && !(p?.maskAthleteContact ?? true) && !minorBlocksContact;

  const contact: { label: string; value: string }[] = [];
  if (perms.canContact || showContact) {
    if (showContact && p?.contactEmail) contact.push({ label: 'Athlete email', value: p.contactEmail });
    if (showContact && p?.contactPhone) contact.push({ label: 'Athlete phone', value: p.contactPhone });
    // Guardian / coach contact is the safe default path, always allowed if present.
    if (p?.guardianName || p?.guardianEmail) {
      contact.push({ label: 'Guardian', value: [p?.guardianName, p?.guardianEmail].filter(Boolean).join(' · ') });
    }
    if (p?.primaryCoachName || p?.primaryCoachContact) {
      contact.push({ label: 'Coach', value: [p?.primaryCoachName, p?.primaryCoachContact].filter(Boolean).join(' · ') });
    }
  }

  const disclosures = [
    'Every number and claim on this profile is labeled by where it came from. Self-reported figures are not independently verified.',
    'Basic engagement (views, watch time) on this shared link may be collected so the athlete can improve their profile.',
  ];
  if (isMinor(p?.dateOfBirth)) {
    disclosures.push('This athlete is a minor. Please route contact through the guardian or coach listed.');
  }

  return {
    slug: link.slug,
    generatedAt: new Date().toISOString(),
    watermark: link.watermark,
    passwordProtected: link.kind === 'password' && !!link.password,
    passwordHash: link.kind === 'password' && link.password ? hashPassword(link.password) : undefined,
    permissions: perms,
    sport,
    athlete: {
      name: p?.athleteName ?? 'Athlete',
      graduationYear: p?.graduationYear,
      playerType: p?.playerType ?? 'high_school',
      primarySport: sport,
      position: sp?.position,
      schoolOrClub: p?.schoolOrClub,
      hometownRegion: p?.hometownRegion,
      heightInches: p?.heightInches,
      weightLbs: p?.weightLbs,
      bio: p?.bio,
      personalStatement: p?.personalStatement,
      recruitingStatus: p?.recruitingStatus ?? 'exploring',
    },
    contact: contact.length ? contact : undefined,
    featuredReel,
    film,
    metrics,
    coachNotes,
    summary,
    disclosures,
  };
}

/** Under-18 check from a DOB. Missing DOB → treated as adult (no false gating). */
export function isMinor(dob?: string | null, now = Date.now()): boolean {
  if (!dob) return false;
  const born = new Date(dob).getTime();
  if (Number.isNaN(born)) return false;
  const age = (now - born) / (365.25 * 24 * 3600 * 1000);
  return age < 18;
}

// ── Local publish cache (keyless coach view) ─────────────────

type PublishMap = Record<string, CoachViewSnapshot>;

function readMap(): PublishMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(PUBLISH_KEY) ?? '{}') as PublishMap;
  } catch {
    return {};
  }
}

function writeMap(map: PublishMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PUBLISH_KEY, JSON.stringify(map));
  } catch {
    /* storage full / unavailable — coach view will show the honest fallback */
  }
}

export function publishSnapshot(slug: string, snapshot: CoachViewSnapshot): void {
  const map = readMap();
  map[slug] = snapshot;
  writeMap(map);
}

export function readPublishedSnapshot(slug: string): CoachViewSnapshot | null {
  return readMap()[slug] ?? null;
}

export function unpublishSnapshot(slug: string): void {
  const map = readMap();
  delete map[slug];
  writeMap(map);
}
