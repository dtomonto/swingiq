// ============================================================
// ConnectorOS — user-safe error messaging (trust-preserving)
// ------------------------------------------------------------
// Turns an internal failure into a calm, honest, retryable message for
// the user. NEVER expose stack traces. The pattern: say what failed,
// reassure (privacy), give a retry path. Pair with reportError()
// (lib/observability) to send the technical detail to the error sink.
// See docs/connector-os/privacy-and-data-retention.md.
// ============================================================

export type FailureKind =
  | 'analysis'
  | 'upload'
  | 'report'
  | 'import'
  | 'generic';

export interface UserSafeError {
  /** Short, plain-English headline. */
  title: string;
  /** What happened + reassurance, no jargon. */
  message: string;
  /** Whether the user can retry the same action. */
  retryable: boolean;
}

const MESSAGES: Record<FailureKind, UserSafeError> = {
  analysis: {
    title: 'Analysis could not be completed',
    message:
      'We could not complete this swing analysis. Your video was not published publicly. Please retry, or use a shorter clip.',
    retryable: true,
  },
  upload: {
    title: 'Upload did not finish',
    message:
      'Your upload did not finish. Nothing was published. Please check your connection and try again — a shorter clip uploads faster.',
    retryable: true,
  },
  report: {
    title: 'Report could not be generated',
    message:
      'We hit a snag building your report. Your data is safe and private. Please try again in a moment.',
    retryable: true,
  },
  import: {
    title: 'Import could not be read',
    message:
      'We could not read that file. Nothing was saved. Check the format and try again, or enter the values manually.',
    retryable: true,
  },
  generic: {
    title: 'Something went wrong',
    message:
      'Something went wrong on our end. Your data is safe. Please try again.',
    retryable: true,
  },
};

/** A trust-preserving, stack-trace-free message for a given failure kind. */
export function userSafeError(kind: FailureKind = 'generic'): UserSafeError {
  return MESSAGES[kind];
}
