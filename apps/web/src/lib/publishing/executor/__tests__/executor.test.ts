import { buildOverridePromotionPlan, parseManifest, overrideKey, COMMITTED_OVERRIDES_PATH } from '../plan';
import { upsertJob, listJobs, getJob, __resetJobStore } from '../jobs.server';
import { resolveGithubConfig, isExecutorConfigured } from '../config.server';
import { runOverridePromotion } from '../run.server';
import type { PublishJob } from '../../types';

describe('executor/plan (pure)', () => {
  it('builds a deterministic override-promotion plan, merging the existing manifest', () => {
    const plan = buildOverridePromotionPlan({
      entityType: 'milestone', entityId: 'first-1000', published: true, title: 'First 1,000',
      existingManifest: { 'blog-post:hello': true }, now: '2026-06-10T00:00:00Z', branchSuffix: 'abc',
    });
    expect(plan.branch).toBe('publish/milestone-first-1000-abc');
    expect(plan.files).toHaveLength(1);
    expect(plan.files[0].path).toBe(COMMITTED_OVERRIDES_PATH);
    const manifest = JSON.parse(plan.files[0].content);
    expect(manifest).toEqual({ 'blog-post:hello': true, 'milestone:first-1000': true });
    expect(plan.commitMessage).toContain('publish milestone:first-1000');
    expect(plan.prTitle).toContain('First 1,000');
  });

  it('unpublish flips the decision', () => {
    const plan = buildOverridePromotionPlan({ entityType: 'seo-page', entityId: 'golf/fix-slice', published: false });
    expect(JSON.parse(plan.files[0].content)['seo-page:golf/fix-slice']).toBe(false);
    expect(plan.commitMessage).toContain('unpublish');
  });

  it('parseManifest tolerates junk and keeps only booleans', () => {
    expect(parseManifest(null)).toEqual({});
    expect(parseManifest('not json')).toEqual({});
    expect(parseManifest('{"a":true,"b":"x","c":false}')).toEqual({ a: true, c: false });
  });

  it('overrideKey composes type:id', () => {
    expect(overrideKey('milestone', 'm1')).toBe('milestone:m1');
  });
});

describe('executor/jobs (persistence, memory fallback)', () => {
  beforeEach(() => __resetJobStore());

  it('upserts, lists newest-first, and gets by id', async () => {
    const base: PublishJob = {
      id: 'j1', publishableEntityId: 'milestone:m1', jobType: 'git_pr', publishMode: 'deploy_backed',
      status: 'running', startedAt: '2026-06-10T00:00:00Z', retryCount: 0,
    };
    await upsertJob(base);
    await upsertJob({ ...base, id: 'j2', startedAt: '2026-06-10T01:00:00Z' });
    const jobs = await listJobs('milestone:m1');
    expect(jobs.map((j) => j.id)).toEqual(['j2', 'j1']);
    expect((await getJob('j1'))?.status).toBe('running');
  });
});

describe('executor/config', () => {
  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_REPO;
    delete process.env.GITHUB_DEFAULT_BRANCH;
  });

  it('resolves from env (owner/repo + default base)', async () => {
    process.env.GITHUB_TOKEN = 'ghp_tokenvalue';
    process.env.GITHUB_REPO = 'dtomonto/swingiq';
    const cfg = await resolveGithubConfig();
    expect(cfg).toEqual({ token: 'ghp_tokenvalue', owner: 'dtomonto', repo: 'swingiq', base: 'master' });
    expect(await isExecutorConfigured()).toBe(true);
  });

  it('is null when unconfigured', async () => {
    expect(await resolveGithubConfig()).toBeNull();
    expect(await isExecutorConfigured()).toBe(false);
  });
});

describe('executor/run', () => {
  beforeEach(() => {
    __resetJobStore();
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_REPO;
  });
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_REPO;
  });

  it('keyless: returns configured:false and attempts no write', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const r = await runOverridePromotion({ entityType: 'milestone', entityId: 'm1', published: true });
    expect(r.configured).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('configured: opens a PR (mocked GitHub) and records a succeeded job', async () => {
    process.env.GITHUB_TOKEN = 'ghp_tokenvalue';
    process.env.GITHUB_REPO = 'owner/repo';
    mockGithub();
    const r = await runOverridePromotion({ entityType: 'milestone', entityId: 'm1', published: true });
    expect(r.configured).toBe(true);
    if (r.configured && r.ok) {
      expect(r.prUrl).toContain('/pull/7');
      expect(r.job.status).toBe('succeeded');
      expect(r.job.pullRequestUrl).toContain('/pull/7');
      expect(r.job.commitSha).toBe('newcommit');
    } else {
      throw new Error('expected a configured success');
    }
    expect((await listJobs('milestone:m1'))[0].status).toBe('succeeded');
  });

  it('configured but the PR step fails: records a failed job', async () => {
    process.env.GITHUB_TOKEN = 'ghp_tokenvalue';
    process.env.GITHUB_REPO = 'owner/repo';
    mockGithub({ failPulls: true });
    const r = await runOverridePromotion({ entityType: 'milestone', entityId: 'm1', published: true });
    expect(r.configured).toBe(true);
    if (r.configured && !r.ok) {
      expect(r.job.status).toBe('failed');
      expect(r.error).toContain('create_pr');
    } else {
      throw new Error('expected a configured failure');
    }
  });
});

// ── Minimal GitHub REST mock covering the executor's call sequence ──
function mockGithub(opts: { failPulls?: boolean } = {}): void {
  const json = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

  jest.spyOn(global, 'fetch').mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (url.includes('/contents/')) return new Response('', { status: 404 }); // no existing manifest
      if (method === 'GET' && url.includes('/git/ref/heads/')) return json({ object: { sha: 'basesha' } });
      if (method === 'GET' && url.includes('/git/commits/')) return json({ tree: { sha: 'basetree' } });
      if (method === 'POST' && url.endsWith('/git/blobs')) return json({ sha: 'blobsha' });
      if (method === 'POST' && url.endsWith('/git/trees')) return json({ sha: 'newtree' });
      if (method === 'POST' && url.endsWith('/git/commits')) return json({ sha: 'newcommit' });
      if (method === 'POST' && url.endsWith('/git/refs')) return json({ ref: 'refs/heads/x' }, 201);
      if (method === 'POST' && url.endsWith('/pulls')) {
        return opts.failPulls
          ? json({ message: 'Validation Failed' }, 422)
          : json({ html_url: 'https://github.com/owner/repo/pull/7', number: 7 }, 201);
      }
      return new Response('not mocked', { status: 500 });
    },
  );
}
