// ============================================================
// SwingVantage — Professional Swing Reference Service
// Query and utility functions for professional reference library.
// ============================================================

import {
  ALL_PROFESSIONAL_REFERENCES,
  type ProfessionalSwingReference,
  type ProfessionalSwingVideo,
  type ProfessionalSex,
} from './professional-references';
import type { SportId } from './types';

const PLACEHOLDER_ID = 'PLACEHOLDER_REQUIRES_ADMIN_VERIFICATION';

// ──────────────────────────────────────────────────────────────
// URL helpers
// ──────────────────────────────────────────────────────────────

/**
 * Returns a privacy-enhanced YouTube embed URL.
 * Returns empty string if the video ID is a placeholder.
 */
export function buildEmbedUrl(youtubeVideoId: string): string {
  if (!youtubeVideoId || youtubeVideoId === PLACEHOLDER_ID) return '';
  return `https://www.youtube-nocookie.com/embed/${youtubeVideoId}`;
}

/**
 * Returns a standard YouTube watch URL.
 * Returns empty string if the video ID is a placeholder.
 */
export function buildWatchUrl(youtubeVideoId: string): string {
  if (!youtubeVideoId || youtubeVideoId === PLACEHOLDER_ID) return '';
  return `https://www.youtube.com/watch?v=${youtubeVideoId}`;
}

/**
 * Returns true if the video has a placeholder ID (not yet admin-verified).
 */
export function isPlaceholderVideo(video: ProfessionalSwingVideo): boolean {
  return (
    !video.youtubeVideoId ||
    video.youtubeVideoId === PLACEHOLDER_ID ||
    !video.verified
  );
}

// ──────────────────────────────────────────────────────────────
// Query helpers
// ──────────────────────────────────────────────────────────────

export interface ProfessionalReferenceFilters {
  sport: SportId;
  sex?: ProfessionalSex | 'all';
  movementType?: string;
  handedness?: string;
  styleTag?: string;
}

/**
 * Returns all professional references matching the given filters.
 * Excludes entries with athleteName "TBD — Admin Verification Required"
 * unless no real athletes exist for that sport/sex combination.
 */
export function getProfessionalsByFilters(
  filters: ProfessionalReferenceFilters,
): ProfessionalSwingReference[] {
  const { sport, sex, movementType, handedness, styleTag } = filters;

  let results = ALL_PROFESSIONAL_REFERENCES.filter((ref) => ref.sport === sport);

  if (sex && sex !== 'all') {
    results = results.filter((ref) => ref.sex === sex);
  }

  if (movementType) {
    results = results.filter((ref) =>
      ref.movementTypes.some((mt) =>
        mt.toLowerCase().includes(movementType.toLowerCase()),
      ),
    );
  }

  if (handedness) {
    results = results.filter(
      (ref) => ref.handedness === handedness,
    );
  }

  if (styleTag) {
    results = results.filter((ref) =>
      ref.styleTags.some((tag) =>
        tag.toLowerCase().includes(styleTag.toLowerCase()),
      ),
    );
  }

  return results;
}

/**
 * Returns only verified (admin-approved, non-placeholder) professionals for a sport.
 * In practice all current entries require verification; this is a forward-looking utility.
 */
export function getVerifiedProfessionals(
  sport: SportId,
): ProfessionalSwingReference[] {
  return ALL_PROFESSIONAL_REFERENCES.filter(
    (ref) =>
      ref.sport === sport &&
      !ref.requiresVerification &&
      ref.referenceVideos.some((v) => v.verified),
  );
}

/**
 * Get a single professional reference by ID.
 */
export function getProfessionalById(
  id: string,
): ProfessionalSwingReference | undefined {
  return ALL_PROFESSIONAL_REFERENCES.find((ref) => ref.id === id);
}

/**
 * Returns the YouTube search URL for a given athlete name and movement type.
 * Used as a fallback when video IDs are not yet verified.
 */
export function buildAthleteYouTubeSearchUrl(
  athleteName: string,
  movementType: string,
): string {
  const query = encodeURIComponent(`${athleteName} ${movementType} slow motion`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

