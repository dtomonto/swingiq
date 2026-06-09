// Digital Asset Library aggregator — registry-derived, so we assert structure
// and internal consistency rather than exact counts (which grow with content).
import { buildAssetLibrary } from '../asset-library';
import { getLibraryItems } from '@/lib/library';

describe('buildAssetLibrary', () => {
  it('catalogs every library item that has real media', async () => {
    const { records } = await buildAssetLibrary();
    const recordedLibrary = getLibraryItems().filter((i) => i.hasRecording);
    expect(recordedLibrary.length).toBeGreaterThan(0);
    for (const item of recordedLibrary) {
      expect(records.some((r) => r.id === item.id)).toBe(true);
    }
  });

  it('every record has at least one concrete file and a known source', async () => {
    const { records } = await buildAssetLibrary();
    const sources = new Set(['training-video', 'feature-walkthrough', 'video-studio']);
    for (const r of records) {
      expect(r.files.length).toBeGreaterThan(0);
      expect(sources.has(r.source)).toBe(true);
      // A recorded video asset always exposes a playable mp4.
      if (r.recorded) expect(r.files.some((f) => f.kind === 'mp4')).toBe(true);
    }
  });

  it('stats are internally consistent', async () => {
    const { records, stats } = await buildAssetLibrary();
    expect(stats.total).toBe(records.length);
    const sumBySource = stats.bySource['training-video'] + stats.bySource['feature-walkthrough'] + stats.bySource['video-studio'];
    expect(sumBySource).toBe(stats.total);
    expect(stats.fileCount).toBe(records.reduce((n, r) => n + r.files.length, 0));
    expect(stats.publicCount).toBe(records.filter((r) => r.public).length);
    expect(stats.recorded).toBeLessThanOrEqual(stats.total);
  });

  it('records are deduped by source+id', async () => {
    const { records } = await buildAssetLibrary();
    const keys = records.map((r) => `${r.source}:${r.id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
