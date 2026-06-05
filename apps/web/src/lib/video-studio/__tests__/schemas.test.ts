import { VideoEventSchema, PlacementUpsertSchema, OpportunityDecisionSchema } from '../types';

describe('VideoEventSchema', () => {
  it('accepts a valid event', () => {
    const ok = VideoEventSchema.safeParse({ event: 'play', placementId: 'home-hero', completion: 0.5 });
    expect(ok.success).toBe(true);
  });
  it('rejects an unknown event and out-of-range completion', () => {
    expect(VideoEventSchema.safeParse({ event: 'explode', placementId: 'x' }).success).toBe(false);
    expect(VideoEventSchema.safeParse({ event: 'play', placementId: 'x', completion: 5 }).success).toBe(false);
  });
});

describe('PlacementUpsertSchema', () => {
  it('applies sensible defaults', () => {
    const parsed = PlacementUpsertSchema.parse({
      surfaceId: 'home-hero',
      display: 'inline',
      trigger: 'click-to-play',
      cta: 'See it',
    });
    expect(parsed.audience).toBe('all');
    expect(parsed.sport).toBe('all');
    expect(parsed.device).toBe('all');
    expect(parsed.enabled).toBe(true);
    expect(parsed.priority).toBe(50);
  });
  it('rejects an invalid display', () => {
    expect(PlacementUpsertSchema.safeParse({ surfaceId: 'x', display: 'nope', trigger: 'click-to-play', cta: 'c' }).success).toBe(false);
  });
});

describe('OpportunityDecisionSchema', () => {
  it('only allows approve/reject', () => {
    expect(OpportunityDecisionSchema.safeParse({ opportunityId: 'o', decision: 'approve' }).success).toBe(true);
    expect(OpportunityDecisionSchema.safeParse({ opportunityId: 'o', decision: 'maybe' }).success).toBe(false);
  });
});
