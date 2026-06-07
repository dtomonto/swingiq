import { generatePackage, generateAsset, suggestedUpdateTrailer } from '../generators';
import { warrantedAssetTypes } from '../coverage';
import { makeFeature, makeAdminFeature } from './_factories';

function textOf(asset: { sections: { body: string[] }[] }): string {
  return asset.sections.flatMap((s) => s.body).join(' ');
}

describe('generatePackage', () => {
  it('produces exactly the warranted asset types, all grounded drafts', () => {
    const f = makeFeature();
    const pkg = generatePackage(f);
    expect(pkg.map((a) => a.type).sort()).toEqual(warrantedAssetTypes(f).sort());
    for (const a of pkg) {
      expect(a.featureId).toBe(f.id);
      expect(a.status).toBe('draft');
      expect(a.groundedIn.length).toBeGreaterThan(0);
    }
  });

  it('an admin feature package includes an admin guide, not an SEO article', () => {
    const pkg = generatePackage(makeAdminFeature());
    const types = pkg.map((a) => a.type);
    expect(types).toContain('admin-guide');
    expect(types).not.toContain('seo-article');
  });
});

describe('grounding / anti-hallucination', () => {
  it('cites the real route, never an invented one', () => {
    const f = makeFeature({ routes: ['/motion-lab'], evidence: [{ kind: 'route', ref: '/motion-lab' }] });
    const tut = generateAsset(f, 'tutorial');
    expect(textOf(tut)).toContain('/motion-lab');
  });

  it('flags an ungrounded feature for human review', () => {
    const ungrounded = makeFeature({ routes: [], apiEndpoints: [], adminControls: [], components: [], evidence: [] });
    const tut = generateAsset(ungrounded, 'tutorial');
    expect(tut.needsHumanReview).toBe(true);
    expect(textOf(tut)).toMatch(/internal capability without a dedicated screen/i);
  });
});

describe('specific generators', () => {
  it('video-brief has a script + a brief id', () => {
    const vb = generateAsset(makeFeature(), 'video-brief');
    expect(vb.videoBriefId).toBeTruthy();
    const script = vb.sections.find((s) => s.heading === 'Script');
    expect(script && script.body.length).toBeGreaterThan(0);
  });

  it('release note includes a copy-paste Update: trailer', () => {
    const f = makeFeature();
    expect(suggestedUpdateTrailer(f)).toMatch(/^Update: /m);
    const note = generateAsset(f, 'release-note');
    expect(textOf(note)).toMatch(/Update:/);
  });

  it('faq produces structured Q&A', () => {
    const faq = generateAsset(makeFeature(), 'faq');
    expect(faq.faqs && faq.faqs.length).toBeGreaterThan(3);
  });
});
