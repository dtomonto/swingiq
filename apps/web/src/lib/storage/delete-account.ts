// ============================================================
// SwingVantage — Account deletion helpers (client)
// ------------------------------------------------------------
// Small, testable helpers behind the "Delete account & cloud data" action.
// The pure confirm-gate logic is unit-tested; the network call is a thin
// wrapper over POST /api/user/delete (see that route for the server side).
// ============================================================

/** The exact word a user must type to arm the irreversible cloud deletion. */
export const DELETE_CONFIRM_PHRASE = 'DELETE';

/**
 * Pure: is the typed confirmation an exact (case-insensitive, trimmed) match
 * for the required phrase? Used to enable the destructive button only once the
 * user has deliberately typed it.
 */
export function canConfirmDeletion(typed: string): boolean {
  return typed.trim().toUpperCase() === DELETE_CONFIRM_PHRASE;
}

export interface DeletionResult {
  ok: boolean;
  /** HTTP status (0 on a network failure). */
  status: number;
  /** Server message when not ok. */
  message?: string;
  /** Server-reported mode, e.g. 'local-only' | 'no-service-role'. */
  mode?: string;
}

/**
 * Request server-side account + cloud-data deletion. Returns a structured
 * result the UI can branch on; never throws (network errors come back as
 * { ok:false, status:0 }).
 */
export async function requestAccountDeletion(): Promise<DeletionResult> {
  try {
    const res = await fetch('/api/user/delete', { method: 'POST' });
    let body: { error?: string; mode?: string; deleted?: boolean } = {};
    try {
      body = await res.json();
    } catch {
      /* non-JSON body — leave body empty */
    }
    return {
      ok: res.ok && body.deleted === true,
      status: res.status,
      message: body.error,
      mode: body.mode,
    };
  } catch {
    return { ok: false, status: 0, message: 'Network error — please try again.' };
  }
}
