import {
  buildCampaigns,
  analyzeStrategy,
  campaignPayloads,
  exportStrategyJson,
  DRIP_STAGES,
  DEFAULT_STRATEGY_SETTINGS,
  type StrategyOverrides,
} from '../analysis';
import { TRIGGERS } from '../triggers';

describe('reengage drip analysis', () => {
  describe('buildCampaigns', () => {
    it('builds one campaign per trigger with cohort + condition metadata', () => {
      const c = buildCampaigns();
      expect(c).toHaveLength(TRIGGERS.length);
      for (const camp of c) {
        expect(camp.label).toBeTruthy();
        expect(camp.condition).toBeTruthy();
        expect(camp.message.title).toBeTruthy();
        expect(camp.enabled).toBe(true);
        expect(camp.customized).toBe(false);
      }
    });

    it('places day-based campaigns on the timeline and behaviour ones as events', () => {
      const byId = Object.fromEntries(buildCampaigns().map((c) => [c.triggerId, c]));
      expect(byId.comeback_3.kind).toBe('timeline');
      expect(byId.comeback_3.dayThreshold).toBe(3);
      expect(byId.comeback_14.stage).toBe('dormant');
      expect(byId.streak_at_risk.kind).toBe('event');
      expect(byId.streak_at_risk.dayThreshold).toBeNull();
    });

    it('applies operator overrides (priority/cooldown/channels/copy) and flags customized', () => {
      const overrides: StrategyOverrides = {
        comeback_7: { priority: 5, cooldownDays: 9, channels: ['in_app'], title: 'Custom title' },
      };
      const c = buildCampaigns(overrides).find((x) => x.triggerId === 'comeback_7')!;
      expect(c.priority).toBe(5);
      expect(c.cooldownDays).toBe(9);
      expect(c.channels).toEqual(['in_app']);
      expect(c.message.title).toBe('Custom title');
      expect(c.customized).toBe(true);
    });

    it('respects an enabled:false override', () => {
      const c = buildCampaigns({ activation: { enabled: false } }).find(
        (x) => x.triggerId === 'activation',
      )!;
      expect(c.enabled).toBe(false);
    });
  });

  describe('campaignPayloads', () => {
    it('produces in-app, push, and email drafts with an absolute CTA url', () => {
      const c = buildCampaigns().find((x) => x.triggerId === 'comeback_14')!;
      const p = campaignPayloads(c, 'https://example.com');
      expect(p.email.subject).toBeTruthy();
      expect(p.push.url).toBe('https://example.com' + c.message.cta.href);
      expect(p.in_app.title).toBe(c.message.title);
    });
  });

  describe('analyzeStrategy', () => {
    it('sorts timeline campaigns by day and orders priority desc', () => {
      const a = analyzeStrategy(buildCampaigns());
      const days = a.timelineCampaigns.map((c) => c.dayThreshold);
      expect(days).toEqual([...days].sort((x, y) => (x ?? 0) - (y ?? 0)));
      const pr = a.priorityOrder.map((p) => p.priority);
      expect(pr).toEqual([...pr].sort((x, y) => y - x));
      expect(a.priorityOrder[0].suppresses.length).toBeGreaterThan(0);
    });

    it('flags email deliverability when no provider is configured', () => {
      const a = analyzeStrategy(buildCampaigns(), DEFAULT_STRATEGY_SETTINGS, { emailConfigured: false });
      const email = a.deliverability.find((d) => d.channel === 'email')!;
      expect(email.ready).toBe(false);
      expect(a.warnings.some((w) => /email/i.test(w))).toBe(true);
    });

    it('marks email ready and scores deliverability full when configured', () => {
      const off = analyzeStrategy(buildCampaigns(), DEFAULT_STRATEGY_SETTINGS, { emailConfigured: false });
      const on = analyzeStrategy(buildCampaigns(), DEFAULT_STRATEGY_SETTINGS, { emailConfigured: true });
      expect(on.deliverability.find((d) => d.channel === 'email')!.ready).toBe(true);
      expect(on.health.score).toBeGreaterThan(off.health.score);
    });

    it('reports coverage gaps when a lifecycle stage is disabled', () => {
      const overrides: StrategyOverrides = { comeback_3: { enabled: false } };
      const a = analyzeStrategy(buildCampaigns(overrides));
      expect(a.coverageGaps.some((g) => /cooling/i.test(g))).toBe(true);
    });

    it('warns about a missing cooldown and an over-high daily cap', () => {
      const a = analyzeStrategy(buildCampaigns({ comeback_7: { cooldownDays: 0 } }), {
        globalDailyCap: 5,
      });
      expect(a.warnings.some((w) => /cooldown/i.test(w))).toBe(true);
      expect(a.warnings.some((w) => /cap/i.test(w))).toBe(true);
    });

    it('produces a 0–100 health score with all four factors', () => {
      const a = analyzeStrategy(buildCampaigns(), DEFAULT_STRATEGY_SETTINGS, { emailConfigured: true });
      expect(a.health.score).toBeGreaterThanOrEqual(0);
      expect(a.health.score).toBeLessThanOrEqual(100);
      expect(a.health.factors).toHaveLength(4);
      expect(['excellent', 'good', 'fair', 'needs-work']).toContain(a.health.band);
    });

    it('warns when everything is disabled', () => {
      const overrides: StrategyOverrides = Object.fromEntries(
        TRIGGERS.map((t) => [t.id, { enabled: false }]),
      );
      const a = analyzeStrategy(buildCampaigns(overrides));
      expect(a.enabledCampaigns).toBe(0);
      expect(a.warnings.some((w) => /disabled/i.test(w))).toBe(true);
    });
  });

  describe('DRIP_STAGES', () => {
    it('covers each timeline campaign stage', () => {
      const stageIds = DRIP_STAGES.map((s) => s.id);
      for (const c of buildCampaigns()) expect(stageIds).toContain(c.stage);
    });
  });

  describe('exportStrategyJson', () => {
    it('round-trips settings + overrides as JSON', () => {
      const overrides: StrategyOverrides = { comeback_3: { priority: 99 } };
      const json = exportStrategyJson(overrides, { globalDailyCap: 2 });
      const parsed = JSON.parse(json);
      expect(parsed.settings.globalDailyCap).toBe(2);
      expect(parsed.overrides.comeback_3.priority).toBe(99);
    });
  });
});
