import { buildMetadata } from '@/lib/seo/metadata';
import { LocalizedFaq } from '@/components/marketing/LocalizedFaq';

// Single source of truth: the English page renders from the marketing
// dictionary via the same component as /es and /fr, so the English copy and
// its translations can never drift. Edit the copy in
// content/marketing/i18n/en.json (then `npm run i18n:bless`).
export const metadata = buildMetadata({
  title: 'Frequently Asked Questions | SwingVantage',
  description:
    'Answers to common questions about SwingVantage — how AI swing analysis works, which sports are supported, how your data is protected, and what it can and cannot do.',
  path: '/faq',
});

export default function FAQPage() {
  return <LocalizedFaq locale="en" />;
}
