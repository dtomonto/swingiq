// Regression tests for the upload-metadata reader. The bug these lock in:
// a file the browser can neither decode nor error on (classically an iPhone
// HEVC .mov on desktop) used to hang `extractVideoMetadata` forever, leaving
// the upload UI stuck on its spinner — "I upload and nothing happens".
//
// The repo runs jest under the `node` environment (no jsdom), so we stub the
// tiny surface the reader touches: document.createElement('video') and the
// object-URL helpers.
import {
  validateVideoFile,
  extractVideoMetadata,
  METADATA_READ_TIMEOUT_MS,
  MAX_VIDEO_SIZE_BYTES,
} from '../video-metadata';
import type { SwingVideoMetadata } from '@swingiq/core';

/** validateVideoFile only reads name/type/size — a plain object suffices. */
function fakeFile(name: string, type: string, size = 1024): File {
  return { name, type, size } as unknown as File;
}

describe('validateVideoFile', () => {
  test('accepts a normal mp4', () => {
    expect(validateVideoFile(fakeFile('swing.mp4', 'video/mp4')).valid).toBe(true);
  });

  test('accepts a blank MIME type when the extension is a video one (Android case)', () => {
    expect(validateVideoFile(fakeFile('swing.mov', '')).valid).toBe(true);
  });

  test('rejects a blank MIME type with a non-video extension', () => {
    const res = validateVideoFile(fakeFile('notes.txt', ''));
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toMatch(/Unrecognized video format/i);
  });

  test('rejects an oversized file', () => {
    const res = validateVideoFile(fakeFile('huge.mp4', 'video/mp4', MAX_VIDEO_SIZE_BYTES + 1));
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toMatch(/too large/i);
  });
});

describe('extractVideoMetadata', () => {
  interface FakeVideo {
    preload: string;
    muted: boolean;
    src: string;
    onloadedmetadata: (() => void) | null;
    onerror: (() => void) | null;
    duration: number;
    videoWidth: number;
    videoHeight: number;
    load: () => void;
  }
  let video: FakeVideo;
  const originalDocument = (globalThis as { document?: unknown }).document;

  beforeEach(() => {
    video = {
      preload: '',
      muted: false,
      src: '',
      onloadedmetadata: null,
      onerror: null,
      duration: 3,
      videoWidth: 1920,
      videoHeight: 1080,
      load: () => {},
    };
    (globalThis as { document?: unknown }).document = { createElement: () => video };
    (URL as unknown as { createObjectURL: () => string }).createObjectURL = () => 'blob:mock';
    (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => {};
  });

  afterEach(() => {
    (globalThis as { document?: unknown }).document = originalDocument;
  });

  test('resolves with the element metadata when loadedmetadata fires', async () => {
    const promise = extractVideoMetadata(fakeFile('swing.mp4', 'video/mp4', 2048));
    video.onloadedmetadata?.();
    const meta = (await promise) as SwingVideoMetadata & { objectUrl: string };
    expect(meta.duration_seconds).toBe(3);
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
    expect(meta.objectUrl).toBe('blob:mock');
  });

  test('rejects (instead of hanging) when neither loadedmetadata nor error fires', async () => {
    jest.useFakeTimers();
    try {
      const promise = extractVideoMetadata(fakeFile('iphone.mov', 'video/quicktime'));
      const assertion = expect(promise).rejects.toThrow(/this browser can't open|HEVC|MP4/i);
      jest.advanceTimersByTime(METADATA_READ_TIMEOUT_MS + 1);
      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });

  test('a late loadedmetadata after timeout does not resolve (no double-settle)', async () => {
    jest.useFakeTimers();
    try {
      const promise = extractVideoMetadata(fakeFile('iphone.mov', 'video/quicktime'));
      const assertion = expect(promise).rejects.toThrow();
      jest.advanceTimersByTime(METADATA_READ_TIMEOUT_MS + 1);
      // Element fires late — must be ignored because the promise already settled.
      video.onloadedmetadata?.();
      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });
});
