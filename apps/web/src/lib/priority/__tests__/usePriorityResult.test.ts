import { selectGolfSessions, type StoreSessionLike } from '../usePriorityResult';

const diag = (id: string) => ({
  rule: { id, name: id, priority: 'high' },
  confidence: 70,
  sample_size: 20,
});

describe('selectGolfSessions', () => {
  it('keeps golf and untagged sessions, drops other sports', () => {
    const sessions: StoreSessionLike[] = [
      { id: 'a', created_at: '2026-06-01', sport: 'golf', diagnoses: [diag('over_the_top')] },
      { id: 'b', created_at: '2026-06-02', sport: 'tennis', diagnoses: [diag('x')] },
      { id: 'c', created_at: '2026-06-03' }, // untagged → treated as golf
    ];
    const { prioritySessions } = selectGolfSessions(sessions);
    expect(prioritySessions.map((s) => s.id)).toEqual(['a', 'c']);
  });

  it('prefers session date, falling back to created_at, and passes diagnoses through', () => {
    const { prioritySessions } = selectGolfSessions([
      { id: 'a', date: '2026-05-01', created_at: '2026-06-01', sport: 'golf', diagnoses: [diag('casting')] },
      { id: 'b', created_at: '2026-06-02', sport: 'golf' },
    ]);
    expect(prioritySessions[0]).toMatchObject({ id: 'a', date: '2026-05-01' });
    expect(prioritySessions[0].diagnoses).toHaveLength(1);
    expect(prioritySessions[1]).toMatchObject({ id: 'b', date: '2026-06-02', diagnoses: [] });
  });

  it('detects club/face data from shots', () => {
    expect(
      selectGolfSessions([
        { id: 'a', created_at: '2026-06-01', sport: 'golf', shots: [{ club_data: { face_to_path: 2.1 } }] },
      ]).hasClubFaceData,
    ).toBe(true);

    expect(
      selectGolfSessions([
        { id: 'a', created_at: '2026-06-01', sport: 'golf', shots: [{ club_data: { face_to_path: null, club_path: null } }] },
      ]).hasClubFaceData,
    ).toBe(false);

    expect(selectGolfSessions([{ id: 'a', created_at: '2026-06-01', sport: 'golf' }]).hasClubFaceData).toBe(false);
  });

  it('returns nothing for an empty record', () => {
    const { prioritySessions, hasClubFaceData } = selectGolfSessions([]);
    expect(prioritySessions).toEqual([]);
    expect(hasClubFaceData).toBe(false);
  });
});
