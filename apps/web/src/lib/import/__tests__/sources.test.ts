import {
  DATA_SOURCES,
  getSource,
  listSources,
  detectSource,
} from '../sources';

describe('data source registry', () => {
  it('has unique ids and the brief-listed sources', () => {
    const ids = DATA_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of [
      'flightscope', 'trackman', 'foresight', 'skytrak', 'uneekor', 'garmin',
      'rapsodo', 'full_swing', 'gspro', 'e6', 'awesome_golf', 'generic_csv',
      'generic_json', 'manual',
    ]) {
      expect(getSource(id)).toBeDefined();
    }
  });

  it('every source declares ingestion metadata', () => {
    for (const s of DATA_SOURCES) {
      expect(s.supportedMethods.length).toBeGreaterThan(0);
      expect(s.supportedFileTypes.length).toBeGreaterThan(0);
      expect(s.availableMetrics).toContain('club');
      expect(s.availableMetrics).toContain('carry_distance');
      expect(s.exportInstructions.length).toBeGreaterThan(0);
      expect(['none', 'oauth', 'api_key']).toContain(s.authType);
    }
  });

  it('filters by category', () => {
    expect(listSources('simulator').map((s) => s.id)).toEqual(
      expect.arrayContaining(['gspro', 'e6']),
    );
    expect(listSources('launch_monitor').every((s) => s.category === 'launch_monitor')).toBe(true);
  });
});

describe('detectSource', () => {
  it('detects TrackMan from its signature headers', () => {
    const headers = ['Club', 'Carry', 'Swing Direction', 'Spin Loft', 'Dynamic Loft', 'Attack Angle'];
    const d = detectSource(headers, 'session.csv');
    expect(d?.sourceId).toBe('trackman');
    expect(d?.brand).toBe('trackman');
  });

  it('detects FlightScope from its signature headers', () => {
    const headers = ['Club', 'Carry (yds)', 'Vertical Swing Plane', 'Horizontal Swing Plane', 'Closure Rate'];
    const d = detectSource(headers);
    expect(d?.sourceId).toBe('flightscope');
  });

  it('uses the filename as a softer signal', () => {
    const headers = ['Club', 'Carry', 'Ball Speed'];
    const d = detectSource(headers, 'My_Garmin_R10_range.csv');
    expect(d?.sourceId).toBe('garmin');
  });

  it('returns null for a generic file with no signal', () => {
    expect(detectSource(['Club', 'Carry', 'Ball Speed'], 'data.csv')).toBeNull();
  });

  it('confidence reflects strength of match', () => {
    const strong = detectSource(['Swing Direction', 'Spin Loft', 'Dynamic Loft', 'Attack Angle', 'Face To Path', 'Low Point'], 'trackman.csv');
    expect(strong?.confidence).toBe('high');
  });
});
