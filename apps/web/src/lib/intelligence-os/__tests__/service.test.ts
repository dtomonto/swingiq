import {
  createKnowledge, reviewKnowledge, recordKnowledgeOutcome, createCanonicalAnswer,
  canonicalizeKnowledge, reviewCanonical, createEvaluation, generateFixPacketFromPattern, exportKnowledge,
} from '../service';
import { recordPattern } from '../router';
import { getSettings, saveSettings, __resetIntelligenceStoreForTests } from '../store';
import { DEFAULT_SETTINGS } from '../config';

beforeEach(() => { __resetIntelligenceStoreForTests(); });

describe('intelligence-os/service', () => {
  it('creates manual knowledge as needs-review (never auto-approved)', async () => {
    const k = await createKnowledge({
      title: 'Slice fix', knowledgeType: 'coaching-answer', sport: 'golf', topic: 'driver',
      userIntent: 'fix slice', canonicalQuestion: 'how to fix slice', canonicalAnswer: 'strengthen grip',
    });
    expect(k.validationStatus).toBe('needs-review');
    expect(k.approvedByAdmin).toBeNull();
  });

  it('approval records the admin email; archive sets archived', async () => {
    const k = await createKnowledge({
      title: 't', knowledgeType: 'coaching-answer', sport: 'golf', topic: 'd',
      userIntent: 'i', canonicalQuestion: 'q', canonicalAnswer: 'a',
    });
    const approved = await reviewKnowledge(k.id, 'approved', 'admin@x.com');
    expect(approved?.validationStatus).toBe('approved');
    expect(approved?.approvedByAdmin).toBe('admin@x.com');
    const archived = await reviewKnowledge(k.id, 'archived', 'admin@x.com');
    expect(archived?.archived).toBe(true);
  });

  it('outcomes adjust confidence honestly (failure lowers more than success raises)', async () => {
    const k = await createKnowledge({
      title: 't', knowledgeType: 'coaching-answer', sport: 'golf', topic: 'd',
      userIntent: 'i', canonicalQuestion: 'q', canonicalAnswer: 'a', confidenceScore: 0.5,
    });
    const fail = await recordKnowledgeOutcome(k.id, 'failure');
    expect(fail?.confidenceScore).toBeLessThan(0.5);
    expect(fail?.failureCount).toBe(1);
  });

  it('canonicalizes a knowledge item into a review-pending canonical answer', async () => {
    const k = await createKnowledge({
      title: 't', knowledgeType: 'coaching-answer', sport: 'golf', topic: 'd',
      userIntent: 'i', canonicalQuestion: 'how to fix slice', canonicalAnswer: 'strengthen grip',
    });
    const c = await canonicalizeKnowledge(k.id);
    expect(c?.validationStatus).toBe('needs-review');
    expect(c?.allowedAutoServe).toBe(false);
    expect(c?.sourceKnowledgeIds).toContain(k.id);
  });

  it('approving a canonical answer enables auto-serve', async () => {
    const c = await createCanonicalAnswer({
      canonicalQuestion: 'q', canonicalAnswer: 'a', answerFormat: 'short-answer', topic: 't', sport: 'golf', audience: 'athlete',
    });
    const approved = await reviewCanonical(c.id, 'approved', 'admin@x.com');
    expect(approved?.allowedAutoServe).toBe(true);
    expect(approved?.approvedByAdmin).toBe('admin@x.com');
  });

  it('evaluation pass/fail derives from average score', async () => {
    const pass = await createEvaluation({
      evaluatedObjectType: 'knowledge-item', evaluatedObjectId: 'x', evaluatorType: 'admin-review',
      scores: { scoreAccuracy: 0.9, scoreUsefulness: 0.8 },
    });
    expect(pass.passFail).toBe('pass');
    const fail = await createEvaluation({
      evaluatedObjectType: 'knowledge-item', evaluatedObjectId: 'x', evaluatorType: 'admin-review',
      scores: { scoreAccuracy: 0.1, scoreUsefulness: 0.2, scoreSafety: 0.1, scoreClarity: 0.1, scoreCompleteness: 0.1, scoreReusePotential: 0.1, scoreCostEfficiency: 0.1 },
    });
    expect(fail.passFail).toBe('fail');
  });

  it('generates a fix packet from a recurring pattern', async () => {
    const p = await recordPattern({
      patternTitle: 'Upload stalls at 90%', patternType: 'recurring-upload-issue',
      summary: 'Large MOV files stall', affectedFeature: 'video-upload', affectedRoute: '/upload',
    });
    const packet = await generateFixPacketFromPattern(p.id);
    expect(packet?.markdownPrompt).toContain('Fix Packet');
    expect(packet?.acceptanceCriteria.length).toBeGreaterThan(0);
    expect(packet?.jsonContext.patternId).toBe(p.id);
  });

  it('exports knowledge as json and markdown', async () => {
    await createKnowledge({
      title: 'Exported', knowledgeType: 'coaching-answer', sport: 'golf', topic: 'd',
      userIntent: 'i', canonicalQuestion: 'q', canonicalAnswer: 'a',
    });
    const json = await exportKnowledge('json');
    expect(json.contentType).toBe('application/json');
    expect(JSON.parse(json.body)).toHaveLength(1);
    const md = await exportKnowledge('markdown');
    expect(md.body).toContain('## Exported');
  });

  it('settings round-trip with defaults', async () => {
    const before = await getSettings();
    expect(before.autoServeConfidenceThreshold).toBe(DEFAULT_SETTINGS.autoServeConfidenceThreshold);
    await saveSettings({ autoServeConfidenceThreshold: 0.99, cacheTtlHours: 12 }, 'admin@x.com');
    const after = await getSettings();
    expect(after.autoServeConfidenceThreshold).toBe(0.99);
    expect(after.cacheTtlHours).toBe(12);
    expect(after.updatedBy).toBe('admin@x.com');
  });
});
