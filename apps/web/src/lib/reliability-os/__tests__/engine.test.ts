// ReliabilityOS — engine + fingerprint + sanitization unit tests.
import {
  generateErrorFingerprint,
  normalizeMessage,
  sanitizeOperationalEvent,
  type RawOperationalEvent,
} from '../fingerprint';
import {
  applyOverrides,
  buildIssues,
  computeSystemStatus,
  deriveReliabilityAlerts,
  buildDebugContext,
  maxSeverity,
  suggestedAction,
  summarize,
} from '../engine';
import { DEFAULT_SETTINGS, type IssueOverrideMap, type OperationalEvent } from '../types';

const T0 = Date.parse('2026-06-11T12:00:00.000Z');
const iso = (offsetMs: number) => new Date(T0 + offsetMs).toISOString();

function ev(partial: Partial<OperationalEvent> & Pick<OperationalEvent, 'type'>): OperationalEvent {
  const raw: RawOperationalEvent = {
    type: partial.type,
    category: partial.category,
    severity: partial.severity,
    route: partial.route,
    toolName: partial.toolName,
    uploadStage: partial.uploadStage,
    httpStatus: partial.httpStatus,
    errorMessage: partial.errorMessageSafe,
    sessionId: partial.sessionId,
    at: partial.at,
  };
  return { ...sanitizeOperationalEvent(raw, T0), ...partial } as OperationalEvent;
}

describe('fingerprint', () => {
  it('is stable across volatile numbers/uuids in the message', () => {
    const a = generateErrorFingerprint({ category: 'video_upload', route: '/upload', uploadStage: 'storage_upload', errorMessageSafe: 'Upload timed out after 1234ms' });
    const b = generateErrorFingerprint({ category: 'video_upload', route: '/upload', uploadStage: 'storage_upload', errorMessageSafe: 'Upload timed out after 9876ms' });
    expect(a).toBe(b);
  });

  it('differs when the route or stage differs', () => {
    const a = generateErrorFingerprint({ category: 'video_upload', route: '/upload', uploadStage: 'storage_upload' });
    const b = generateErrorFingerprint({ category: 'video_upload', route: '/upload', uploadStage: 'analysis_start' });
    expect(a).not.toBe(b);
  });

  it('ignores query string + hash on the route', () => {
    const a = generateErrorFingerprint({ category: 'page', route: '/dashboard?tab=1#x' });
    const b = generateErrorFingerprint({ category: 'page', route: '/dashboard' });
    expect(a).toBe(b);
  });

  it('normalizeMessage redacts and placeholders volatile parts', () => {
    expect(normalizeMessage('Failed at 0xABCD with id 12345')).toBe('failed at <hex> with id <n>');
  });
});

describe('sanitizeOperationalEvent', () => {
  it('never persists secrets from message or metadata', () => {
    const e = sanitizeOperationalEvent(
      {
        type: 'api_request_failed',
        route: '/api/x',
        errorMessage: 'Bearer sk-ABCDEFGHIJKLMNOP1234 failed for user@example.com',
        metadata: { authorization: 'Bearer sk-SECRETSECRETSECRET12345', token: 'xoxb-123456789012', note: 'ok' },
      },
      T0,
    );
    const blob = JSON.stringify(e);
    expect(blob).not.toContain('sk-ABCDEFGHIJKLMNOP1234');
    expect(blob).not.toContain('user@example.com');
    expect(blob).not.toContain('xoxb-123456789012');
    expect((e.metadata as Record<string, unknown>).authorization).toBe('[redacted]');
    expect((e.metadata as Record<string, unknown>).token).toBe('[redacted]');
    expect((e.metadata as Record<string, unknown>).note).toBe('ok');
  });

  it('derives category + severity from type when omitted', () => {
    const e = sanitizeOperationalEvent({ type: 'video_upload_failed' }, T0);
    expect(e.category).toBe('video_upload');
    expect(e.severity).toBe('high');
    expect(e.fingerprint).toMatch(/^ri_/);
  });

  it('truncates long messages for display', () => {
    const e = sanitizeOperationalEvent({ type: 'client_crash', errorMessage: 'x'.repeat(500) }, T0);
    expect((e.errorMessageSafe ?? '').length).toBeLessThanOrEqual(200);
  });
});

describe('buildIssues', () => {
  it('groups like events by fingerprint and counts sessions', () => {
    const events = [
      ev({ type: 'video_upload_failed', route: '/upload', uploadStage: 'storage_upload', sessionId: 's1', at: iso(0) }),
      ev({ type: 'video_upload_failed', route: '/upload', uploadStage: 'storage_upload', sessionId: 's2', at: iso(1000) }),
      ev({ type: 'video_upload_failed', route: '/upload', uploadStage: 'storage_upload', sessionId: 's2', at: iso(2000) }),
      ev({ type: 'auth_login_failed', route: '/login', sessionId: 's3', at: iso(500) }),
    ];
    const issues = buildIssues(events);
    expect(issues).toHaveLength(2);
    const upload = issues.find((i) => i.category === 'video_upload')!;
    expect(upload.occurrenceCount).toBe(3);
    expect(upload.affectedSessionCount).toBe(2);
    expect(upload.primaryUploadStage).toBe('storage_upload');
    // Higher severity (high) sorts before nothing-lower; both high here → recency.
    expect(issues[0].lastSeenAt >= issues[1].lastSeenAt).toBe(true);
  });
});

describe('computeSystemStatus', () => {
  const overrides: IssueOverrideMap = {};
  it('is critical when an open critical issue is fresh (<30m)', () => {
    const issues = buildIssues([ev({ type: 'video_upload_failed', severity: 'critical', at: iso(-5 * 60_000) })]);
    const views = applyOverrides(issues, overrides, T0);
    expect(computeSystemStatus(views, undefined, T0)).toBe('critical');
  });

  it('is degraded with two open high issues in 24h', () => {
    const issues = buildIssues([
      ev({ type: 'video_upload_failed', severity: 'high', route: '/upload', at: iso(-2 * 3_600_000) }),
      ev({ type: 'tool_execution_failed', severity: 'high', toolName: 'swing-analysis', at: iso(-3 * 3_600_000) }),
    ]);
    const views = applyOverrides(issues, overrides, T0);
    expect(computeSystemStatus(views, undefined, T0)).toBe('degraded');
  });

  it('is healthy when issues are resolved/ignored', () => {
    const issues = buildIssues([ev({ type: 'video_upload_failed', severity: 'critical', at: iso(-5 * 60_000) })]);
    const ov: IssueOverrideMap = { [issues[0].id]: { status: 'resolved', updatedAt: iso(0), resolvedAt: iso(0) } };
    const views = applyOverrides(issues, ov, T0);
    expect(views[0].closed).toBe(true);
    expect(computeSystemStatus(views, undefined, T0)).toBe('healthy');
  });
});

describe('summarize + alerts + debug', () => {
  it('counts failures by area and finds the most affected route', () => {
    const events = [
      ev({ type: 'video_upload_failed', route: '/upload', at: iso(-10 * 60_000) }),
      ev({ type: 'video_upload_failed', route: '/upload', at: iso(-9 * 60_000) }),
      ev({ type: 'auth_login_failed', route: '/login', at: iso(-8 * 60_000) }),
      ev({ type: 'page_load_failed', route: '/upload', at: iso(-7 * 60_000) }),
    ];
    const views = applyOverrides(buildIssues(events), {}, T0);
    const s = summarize(events, views, undefined, T0);
    expect(s.failedUploads24h).toBe(2);
    expect(s.failedLogins24h).toBe(1);
    expect(s.pageFailures24h).toBe(1);
    expect(s.mostAffectedRoute).toBe('/upload');
    expect(s.totalEvents).toBe(4);
  });

  it('raises an upload-spike alert past the threshold', () => {
    const events = Array.from({ length: 6 }, (_, i) => ev({ type: 'video_upload_failed', route: '/upload', at: iso(-i * 60_000) }));
    const views = applyOverrides(buildIssues(events), {}, T0);
    const s = summarize(events, views, undefined, T0);
    const alerts = deriveReliabilityAlerts(events, s, DEFAULT_SETTINGS, T0);
    expect(alerts.some((a) => a.id === 'upload-spike')).toBe(true);
  });

  it('builds a paste-ready debug context block', () => {
    const views = applyOverrides(buildIssues([ev({ type: 'video_upload_failed', route: '/upload', uploadStage: 'storage_upload', errorMessageSafe: 'Upload request timed out', correlationId: 'abc123', at: iso(0) })]), {}, T0);
    const ctx = buildDebugContext(views[0]);
    expect(ctx).toContain('Issue:');
    expect(ctx).toContain('Category: video_upload');
    expect(ctx).toContain('Upload stage: storage_upload');
    expect(ctx).toContain('abc123');
  });
});

describe('helpers', () => {
  it('maxSeverity ranks correctly', () => {
    expect(maxSeverity('low', 'critical')).toBe('critical');
    expect(maxSeverity('high', 'medium')).toBe('high');
  });
  it('suggestedAction returns a non-empty checklist per category', () => {
    expect(suggestedAction('video_upload').length).toBeGreaterThan(0);
    expect(suggestedAction('auth').length).toBeGreaterThan(0);
  });
});
