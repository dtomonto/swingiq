// Regression: AI-vision analysis failures used to be silent (console.error only),
// so an admin could never see when analysis was breaking. logAnalysisFailure now
// records them into the ReliabilityOS ring buffer like any other operational event.
//
// The repo's Jest runs in the node environment, so we provide the minimal browser
// globals the localStorage-backed capture path reads.

import { logAnalysisFailure, logSyncFailure, readBufferedEvents } from '../capture';

class MemStorage {
  private store = new Map<string, string>();
  getItem(k: string) {
    return this.store.has(k) ? this.store.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.store.set(k, String(v));
  }
  removeItem(k: string) {
    this.store.delete(k);
  }
  clear() {
    this.store.clear();
  }
}

beforeEach(() => {
  const win = {
    localStorage: new MemStorage(),
    sessionStorage: new MemStorage(),
    location: { pathname: '/video' },
  };
  (globalThis as unknown as { window: unknown }).window = win;
});

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe('ReliabilityOS — swing-analysis failure capture', () => {
  it('records a failed AI-vision analysis as a buffered operational event', () => {
    logAnalysisFailure({
      error: new Error('Analysis failed (server returned 502).'),
      actionName: 'analyze:golf',
      route: '/video',
      metadata: { sport: 'golf' },
    });

    const events = readBufferedEvents();
    expect(events.length).toBe(1);
    const e = events[0];
    expect(e.type).toBe('video_processing_failed');
    expect(e.category).toBe('video_upload');
    expect(e.uploadStage).toBe('ai_vision_analysis'); // sensible default stage
    expect(e.errorMessageSafe).toContain('502'); // sanitized, but diagnosable
    expect(e.fingerprint).toBeTruthy(); // groups like failures in the admin inbox
  });

  it('lets the caller name the failing stage', () => {
    logAnalysisFailure({ error: new Error('frames malformed'), uploadStage: 'frame_extraction' });
    const e = readBufferedEvents()[0];
    expect(e.uploadStage).toBe('frame_extraction');
  });
});

describe('ReliabilityOS — cloud data-sync failure capture', () => {
  it('records a failed Supabase sync as a database operational event', () => {
    logSyncFailure({ error: new Error('relation "sessions" does not exist'), uploadStage: 'schema_missing' });
    const events = readBufferedEvents();
    expect(events.length).toBe(1);
    const e = events[0];
    expect(e.category).toBe('database'); // drives the "Failed data syncs 24h" tile
    expect(e.actionName).toBe('cloud-sync');
    expect(e.uploadStage).toBe('schema_missing');
    expect(e.fingerprint).toBeTruthy();
  });
});
