import {
  effectiveBlogStatus,
  isPublishedBlogPost,
  getPublishedBlogPosts,
  BLOG_POSTS,
  type BlogPost,
} from '../blog-posts';
import {
  effectiveSeoStatus,
  PUBLISHED_SEO_PAGES,
  SEO_PAGES,
  type SeoPage,
} from '@/content/seoPages';

const blog = (over: Partial<BlogPost>): BlogPost => ({
  slug: 't',
  title: 't',
  metaTitle: 't',
  metaDescription: 't',
  publishDate: '2026-01-01',
  displayDate: 'Jan 1, 2026',
  sport: 'golf',
  category: 'c',
  readingTime: '1 min',
  excerpt: 'e',
  content: 'c',
  tags: [],
  ...over,
});

describe('blog publish status', () => {
  it('treats a missing status as published', () => {
    expect(effectiveBlogStatus(blog({}))).toBe('published');
  });
  it('honors an explicit draft', () => {
    expect(effectiveBlogStatus(blog({ status: 'draft' }))).toBe('draft');
  });
  it('isPublishedBlogPost reflects status', () => {
    expect(isPublishedBlogPost(blog({}))).toBe(true);
    expect(isPublishedBlogPost(blog({ status: 'draft' }))).toBe(false);
  });
  it('getPublishedBlogPosts excludes drafts and is a subset', () => {
    const pub = getPublishedBlogPosts();
    expect(pub.every(isPublishedBlogPost)).toBe(true);
    expect(pub.length).toBeLessThanOrEqual(BLOG_POSTS.length);
  });
});

describe('seo publish status', () => {
  const seo = (over: Partial<SeoPage>): SeoPage => ({ ...SEO_PAGES[0], ...over });

  it('reflects publishStatus when no override is set', () => {
    // '__nonexistent__' has no override, so effective === base.
    expect(effectiveSeoStatus(seo({ slug: '__nonexistent__', publishStatus: 'draft' }))).toBe('draft');
    expect(effectiveSeoStatus(seo({ slug: '__nonexistent__', publishStatus: 'published' }))).toBe('published');
  });
  it('PUBLISHED_SEO_PAGES contains only effectively-published pages', () => {
    expect(PUBLISHED_SEO_PAGES.every((p) => effectiveSeoStatus(p) === 'published')).toBe(true);
  });
});
