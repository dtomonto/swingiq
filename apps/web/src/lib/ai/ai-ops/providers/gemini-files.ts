// ============================================================
// SwingVantage — AI Operations: Gemini File API upload (§2.2)
// ------------------------------------------------------------
// Uploads a swing video to Gemini's File API (resumable protocol) and returns
// the `files/...` handle the intake provider consumes for LARGER clips (above
// the inline threshold). Server-only — the key never reaches the client.
// Fetch is injectable so the multi-step protocol is unit-testable offline.
// Honest: returns a structured result, never throws into the job.
// ============================================================

const UPLOAD_BASE = 'https://generativelanguage.googleapis.com/upload/v1beta/files';
const FILES_BASE = 'https://generativelanguage.googleapis.com/v1beta/files';

export interface UploadedFile {
  ok: boolean;
  /** `files/abc123` resource name. */
  name: string | null;
  /** Full resource URI passed to generateContent fileData.fileUri. */
  uri: string | null;
  /** PROCESSING | ACTIVE | FAILED (per the File API). */
  state: string | null;
  error: string | null;
}

/** Minimal response shape the upload needs — injectable for tests. */
export interface HttpLike {
  status: number;
  header: (name: string) => string | null;
  json: () => Promise<unknown>;
}
export type DoFetch = (url: string, init: { method: string; headers: Record<string, string>; body?: BodyInit }) => Promise<HttpLike>;

const realFetch: DoFetch = async (url, init) => {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(120_000) });
  return {
    status: res.status,
    header: (n) => res.headers.get(n),
    json: async () => {
      try {
        return await res.json();
      } catch {
        return null;
      }
    },
  };
};

export interface UploadVideoArgs {
  apiKey: string | undefined;
  /** Raw bytes of the video. */
  bytes: Uint8Array;
  mimeType: string;
  displayName?: string;
  doFetch?: DoFetch;
}

/**
 * Resumable upload: (1) start → get the upload URL, (2) upload+finalize the
 * bytes → get the file resource. The caller then polls waitForFileActive before
 * using the handle in generateContent.
 */
export async function uploadVideoToGemini(args: UploadVideoArgs): Promise<UploadedFile> {
  const fail = (error: string): UploadedFile => ({ ok: false, name: null, uri: null, state: null, error });
  if (!args.apiKey) return fail('No GOOGLE_AI_API_KEY configured.');
  const doFetch = args.doFetch ?? realFetch;
  const size = args.bytes.byteLength;

  // ── Step 1: start a resumable session ──
  let start: HttpLike;
  try {
    start = await doFetch(`${UPLOAD_BASE}?key=${encodeURIComponent(args.apiKey)}`, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(size),
        'X-Goog-Upload-Header-Content-Type': args.mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: args.displayName ?? 'swing-video' } }),
    });
  } catch (err) {
    return fail(`Upload start failed: ${err instanceof Error ? err.message : 'network error'}`);
  }
  if (start.status !== 200) return fail(`Upload start rejected (HTTP ${start.status}).`);
  const uploadUrl = start.header('X-Goog-Upload-URL') ?? start.header('x-goog-upload-url');
  if (!uploadUrl) return fail('Upload start returned no upload URL.');

  // ── Step 2: upload + finalize the bytes ──
  let up: HttpLike;
  try {
    up = await doFetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Command': 'upload, finalize',
        'X-Goog-Upload-Offset': '0',
        'Content-Length': String(size),
      },
      body: args.bytes as unknown as BodyInit,
    });
  } catch (err) {
    return fail(`Upload finalize failed: ${err instanceof Error ? err.message : 'network error'}`);
  }
  if (up.status !== 200) return fail(`Upload finalize rejected (HTTP ${up.status}).`);

  const data = (await up.json()) as { file?: { name?: string; uri?: string; state?: string } } | null;
  const file = data?.file;
  if (!file?.uri) return fail('Upload finalize returned no file resource.');
  return { ok: true, name: file.name ?? null, uri: file.uri, state: file.state ?? 'PROCESSING', error: null };
}

export interface WaitArgs {
  apiKey: string | undefined;
  /** `files/abc123` resource name. */
  fileName: string;
  doFetch?: DoFetch;
  /** Max wall time to wait for ACTIVE. */
  maxWaitMs?: number;
  /** Poll interval. */
  intervalMs?: number;
  /** Injectable clock for tests. */
  sleep?: (ms: number) => Promise<void>;
}

/** Poll the File API until the upload is ACTIVE (ready) or FAILED. */
export async function waitForFileActive(args: WaitArgs): Promise<{ active: boolean; state: string; error: string | null }> {
  if (!args.apiKey) return { active: false, state: 'UNKNOWN', error: 'No GOOGLE_AI_API_KEY configured.' };
  const doFetch = args.doFetch ?? realFetch;
  const sleep = args.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const deadline = (args.maxWaitMs ?? 60_000);
  const interval = args.intervalMs ?? 2_000;

  let waited = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let res: HttpLike;
    try {
      res = await doFetch(`${FILES_BASE}/${encodeURIComponent(args.fileName.replace(/^files\//, ''))}?key=${encodeURIComponent(args.apiKey)}`, {
        method: 'GET',
        headers: {},
      });
    } catch (err) {
      return { active: false, state: 'UNKNOWN', error: err instanceof Error ? err.message : 'network error' };
    }
    if (res.status !== 200) return { active: false, state: 'UNKNOWN', error: `File poll rejected (HTTP ${res.status}).` };
    const state = ((await res.json()) as { state?: string } | null)?.state ?? 'PROCESSING';
    if (state === 'ACTIVE') return { active: true, state, error: null };
    if (state === 'FAILED') return { active: false, state, error: 'Gemini reported the upload FAILED.' };
    if (waited >= deadline) return { active: false, state, error: 'Timed out waiting for the upload to become ACTIVE.' };
    await sleep(interval);
    waited += interval;
  }
}
