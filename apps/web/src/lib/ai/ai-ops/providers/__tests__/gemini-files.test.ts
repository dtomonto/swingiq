import { describe, it, expect } from '@jest/globals';
import { uploadVideoToGemini, waitForFileActive, type DoFetch, type HttpLike } from '../gemini-files';

const http = (status: number, headers: Record<string, string>, body: unknown): HttpLike => ({
  status,
  header: (n) => headers[n] ?? headers[n.toLowerCase()] ?? null,
  json: async () => body,
});

const bytes = new Uint8Array([1, 2, 3, 4]);

describe('uploadVideoToGemini (resumable)', () => {
  it('starts a session then uploads + finalizes, returning the file handle', async () => {
    const calls: string[] = [];
    const doFetch: DoFetch = async (url, init) => {
      calls.push(`${init.headers['X-Goog-Upload-Command'] ?? 'GET'}`);
      if (url.includes('/upload/v1beta/files')) {
        return http(200, { 'X-Goog-Upload-URL': 'https://upload.example/session/123' }, {});
      }
      // finalize
      return http(200, {}, { file: { name: 'files/abc', uri: 'https://.../files/abc', state: 'PROCESSING' } });
    };
    const r = await uploadVideoToGemini({ apiKey: 'k', bytes, mimeType: 'video/mp4', doFetch });
    expect(r.ok).toBe(true);
    expect(r.uri).toBe('https://.../files/abc');
    expect(r.name).toBe('files/abc');
    expect(calls).toEqual(['start', 'upload, finalize']);
  });

  it('fails honestly with no key (no network)', async () => {
    const r = await uploadVideoToGemini({ apiKey: undefined, bytes, mimeType: 'video/mp4' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/GOOGLE_AI_API_KEY/);
  });

  it('fails when the start step returns no upload URL', async () => {
    const doFetch: DoFetch = async () => http(200, {}, {});
    const r = await uploadVideoToGemini({ apiKey: 'k', bytes, mimeType: 'video/mp4', doFetch });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no upload URL/i);
  });
});

describe('waitForFileActive', () => {
  it('polls until ACTIVE', async () => {
    const states = ['PROCESSING', 'PROCESSING', 'ACTIVE'];
    let i = 0;
    const doFetch: DoFetch = async () => http(200, {}, { state: states[Math.min(i++, states.length - 1)] });
    const r = await waitForFileActive({ apiKey: 'k', fileName: 'files/abc', doFetch, intervalMs: 1, sleep: async () => {} });
    expect(r.active).toBe(true);
    expect(r.state).toBe('ACTIVE');
  });

  it('returns failed when the provider reports FAILED', async () => {
    const doFetch: DoFetch = async () => http(200, {}, { state: 'FAILED' });
    const r = await waitForFileActive({ apiKey: 'k', fileName: 'files/abc', doFetch, sleep: async () => {} });
    expect(r.active).toBe(false);
    expect(r.error).toMatch(/FAILED/);
  });

  it('times out without hanging', async () => {
    const doFetch: DoFetch = async () => http(200, {}, { state: 'PROCESSING' });
    const r = await waitForFileActive({ apiKey: 'k', fileName: 'files/abc', doFetch, maxWaitMs: 5, intervalMs: 5, sleep: async () => {} });
    expect(r.active).toBe(false);
    expect(r.error).toMatch(/timed out/i);
  });
});
