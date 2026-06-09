// Read-only checks for the Video Library publishing store. We don't exercise
// the write path here (it mutates a versioned data file); the API route + the
// pure resolution in training-videos cover behavior.
import { readLibraryPublishSnapshot } from '../library-publish-store';
import { getLibraryItems } from '@/lib/library';
import { isTrainingPublic, trainingPublishDefault } from '@/lib/library/training-videos';

describe('readLibraryPublishSnapshot', () => {
  const snap = readLibraryPublishSnapshot();
  const trainingCount = getLibraryItems().filter((i) => i.source === 'training').length;

  it('returns a row for every training video', () => {
    expect(snap.rows.length).toBe(trainingCount);
    expect(snap.rows.length).toBeGreaterThan(0);
  });

  it('reports published state matching the /learn gate resolution', () => {
    for (const row of snap.rows) {
      expect(row.published).toBe(isTrainingPublic(row.id));
    }
  });

  it('flags a row as overridden exactly when its state deviates from the seed default', () => {
    for (const row of snap.rows) {
      expect(row.overridden).toBe(row.published !== trainingPublishDefault(row.id));
    }
  });

  it('exposes a writable flag (false on a production read-only FS)', () => {
    expect(typeof snap.writable).toBe('boolean');
  });
});
