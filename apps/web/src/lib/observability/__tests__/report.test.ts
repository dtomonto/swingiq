import { reportError, reportMessage, isObservabilityConfigured } from '../report';

describe('observability reporter (A2)', () => {
  const g = globalThis as unknown as { __svCaptureException?: unknown };

  afterEach(() => {
    delete g.__svCaptureException;
    jest.restoreAllMocks();
  });

  it('forwards to a configured server sink', () => {
    const sink = jest.fn();
    g.__svCaptureException = sink;
    const err = new Error('boom');
    reportError(err, { route: '/api/x' });
    expect(sink).toHaveBeenCalledWith(err, { route: '/api/x' });
  });

  it('never throws when no sink is configured', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => reportError(new Error('x'))).not.toThrow();
    expect(() => reportMessage('degraded')).not.toThrow();
  });

  it('never throws even if the sink itself throws', () => {
    g.__svCaptureException = () => {
      throw new Error('sink failure');
    };
    expect(() => reportError(new Error('x'))).not.toThrow();
  });

  it('reports configured state from env', () => {
    expect(isObservabilityConfigured({})).toBe(false);
    expect(isObservabilityConfigured({ SENTRY_DSN: 'https://k@o.ingest.sentry.io/1' })).toBe(true);
    expect(isObservabilityConfigured({ NEXT_PUBLIC_SENTRY_DSN: 'https://k@o.ingest.sentry.io/1' })).toBe(true);
  });
});
