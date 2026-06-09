import { __setInMemoryRepoForTests } from '../repo';
import { publishedInAppHelpForRoute } from '../server/data';
import { SEEDED_IN_APP_HELP } from '../server/seed-help';

describe('seeded in-app help', () => {
  it('every seed card is a published in-app-help asset grounded in its route', () => {
    expect(SEEDED_IN_APP_HELP.length).toBeGreaterThan(0);
    for (const a of SEEDED_IN_APP_HELP) {
      expect(a.type).toBe('in-app-help');
      expect(a.status).toBe('published');
      expect(a.inAppHelp?.route).toBeTruthy();
      // Grounded: the help route is among the asset's evidence refs.
      expect(a.groundedIn.some((e) => e.ref === a.inAppHelp?.route)).toBe(true);
    }
  });

  it('surfaces the committed seed for /diagnose even with an empty repo', async () => {
    __setInMemoryRepoForTests(); // fresh, no snapshot seed, no stored assets
    const help = await publishedInAppHelpForRoute('/diagnose');
    expect(help.map((a) => a.id)).toContain('feehelp_diagnose_read_results');
    expect(help.every((a) => a.status === 'published' && a.type === 'in-app-help')).toBe(true);
  });

  it('returns nothing for a route with no published help', async () => {
    __setInMemoryRepoForTests();
    expect(await publishedInAppHelpForRoute('/no-such-route')).toEqual([]);
  });
});
