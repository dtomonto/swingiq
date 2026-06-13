// ============================================================
// Player Experience Overhaul — row-builder + shared-enum tests (WS-08)
// Verifies the new STATE → ROW projections are pure, apply safe defaults,
// and that shared enums stay in lockstep with the SQL CHECK constraints.
// ============================================================

import {
  playerProfileRow,
  skillTreeNodeRow,
  friendshipRow,
  uploadAuditRow,
} from '../projection';
import {
  FRIENDSHIP_STATUSES,
  SKILL_NODE_STATUSES,
  UPLOAD_CONTEXTS,
} from '../shared-enums';

describe('playerProfileRow', () => {
  it('stamps user_id and applies safe empty defaults', () => {
    const row = playerProfileRow({}, 'user-1');
    expect(row.user_id).toBe('user-1');
    expect(row.sports).toEqual([]);
    expect(row.goals).toEqual([]);
    expect(row.preferences).toEqual({});
    expect(row.skill_tree_state).toEqual({});
  });

  it('passes through provided fields', () => {
    const row = playerProfileRow(
      { display_name: 'Sam', primary_sport: 'golf', sports: ['golf', 'tennis'], player_type: 'Power Developer' },
      'user-2',
    );
    expect(row.display_name).toBe('Sam');
    expect(row.primary_sport).toBe('golf');
    expect(row.sports).toEqual(['golf', 'tennis']);
    expect(row.player_type).toBe('Power Developer');
  });
});

describe('skillTreeNodeRow', () => {
  it('defaults status to locked and arrays to empty, coerces scores', () => {
    const row = skillTreeNodeRow(
      { player_profile_id: 'pp-1', sport: 'golf', name: 'Swing path' },
      'user-1',
    );
    expect(row.status).toBe('locked');
    expect(row.user_id).toBe('user-1');
    expect(row.level).toBe(0);
    expect(row.source_session_ids).toEqual([]);
    expect(row.progress_score).toBeNull();
    expect(typeof row.last_updated_at).toBe('string');
  });

  it('keeps provided evidence + sources', () => {
    const row = skillTreeNodeRow(
      {
        player_profile_id: 'pp-1',
        sport: 'baseball',
        name: 'Barrel path',
        status: 'improving',
        progress_score: 72,
        confidence_score: 0.6,
        source_session_ids: ['s1', 's2'],
      },
      'user-9',
    );
    expect(row.status).toBe('improving');
    expect(row.progress_score).toBe(72);
    expect(row.confidence_score).toBe(0.6);
    expect(row.source_session_ids).toEqual(['s1', 's2']);
  });
});

describe('friendshipRow', () => {
  it('defaults to pending with least-access permissions', () => {
    const row = friendshipRow({ requester_user_id: 'a', receiver_user_id: 'b' });
    expect(row.status).toBe('pending');
    expect(row.permissions).toEqual({
      view_profile: true,
      view_reports: false,
      allow_upload_for_me: false,
    });
  });
});

describe('uploadAuditRow', () => {
  it('records actor + athlete and defaults context to self', () => {
    const row = uploadAuditRow(
      { athlete_user_id: 'athlete-1', action: 'self_upload', session_id: 'sess-1' },
      'actor-1',
    );
    expect(row.actor_user_id).toBe('actor-1');
    expect(row.athlete_user_id).toBe('athlete-1');
    expect(row.action).toBe('self_upload');
    expect(row.context).toBe('self');
    expect(row.video_analysis_id).toBeNull();
  });
});

describe('shared enums match SQL CHECK constraint domains', () => {
  it('friendship statuses', () => {
    expect([...FRIENDSHIP_STATUSES]).toEqual(['pending', 'accepted', 'declined', 'blocked']);
  });
  it('skill node statuses', () => {
    expect([...SKILL_NODE_STATUSES]).toEqual([
      'locked', 'available', 'active', 'improving', 'mastered', 'needs_attention', 'regressed',
    ]);
  });
  it('upload contexts', () => {
    expect([...UPLOAD_CONTEXTS]).toEqual(['self', 'friend', 'coach', 'parent']);
  });
});
