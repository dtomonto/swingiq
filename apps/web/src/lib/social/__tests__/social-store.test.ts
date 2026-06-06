import { toPostRows, postKeyOf } from '../store';
import { generateSocialFallback } from '../generate';
import { DEFAULT_OPTIONS } from '../types';
import { BLOG_POSTS } from '@/data/blog-posts';

const post = BLOG_POSTS.find((p) => p.slug === 'how-to-fix-a-golf-slice')!;
const gen = generateSocialFallback(post, { ...DEFAULT_OPTIONS, platforms: ['linkedin'] });
const firstKey = postKeyOf(gen.posts[0]);

describe('toPostRows', () => {
  it('maps posts to snake_case rows tied to a generation id', () => {
    const rows = toPostRows(gen, {}, 'gen-123');
    expect(rows.length).toBe(gen.posts.length);
    expect(rows[0].generation_id).toBe('gen-123');
    expect(rows[0].blog_slug).toBe('how-to-fix-a-golf-slice');
    expect(rows[0].final_text).toBe(gen.posts[0].text);
    expect(rows[0].edited_text).toBeNull();
    expect(rows[0].status).toBe('draft');
    expect(rows[0].variation_type).toBe(gen.posts[0].variationType);
  });

  it('applies edit + status overrides into final/edited/status', () => {
    const rows = toPostRows(gen, {
      edits: { [firstKey]: 'My hand-edited copy' },
      statuses: { [firstKey]: 'approved' },
    });
    expect(rows[0].edited_text).toBe('My hand-edited copy');
    expect(rows[0].final_text).toBe('My hand-edited copy');
    expect(rows[0].status).toBe('approved');
  });
});
